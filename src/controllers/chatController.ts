import { Request, Response } from 'express'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { juristPrompt } from '../prompts/juristPrompt.js'
import { getMemoryContext } from './memoryController.js'
import Memory from '../models/Memory.js'
import mongoose from 'mongoose'

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

const buildSystemPrompt = async (): Promise<string> => {
    const memoryContext = await getMemoryContext()
    return juristPrompt + memoryContext
}

const chatWithOpenAI = async (history: ChatMessage[], systemPrompt: string): Promise<string> => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({ role: m.role, content: m.content }))
    ]
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 8000
    })
    return completion.choices[0]?.message?.content || ''
}

const chatWithGemini = async (history: ChatMessage[], systemPrompt: string, retries = 3): Promise<string> => {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
    const model = client.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 8000 }
    })

    const chat = model.startChat({
        history: history.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))
    })

    const lastMessage = history[history.length - 1]?.content || ''

    for (let i = 0; i < retries; i++) {
        try {
            const result = await chat.sendMessage(lastMessage)
            return result.response.text()
        } catch (err: any) {
            if (err?.status === 503 && i < retries - 1) {
                console.log(`Gemini 503 — retry ${i + 1}/${retries}, waiting ${(i + 1) * 2}s...`)
                await new Promise(r => setTimeout(r, (i + 1) * 2000))
                continue
            }
            throw err
        }
    }
    throw new Error('Gemini retries exhausted')
}

// Extract important info from conversation and save to memory
const extractAndSaveMemories = async (message: string, reply: string, sessionId?: string) => {
    if (mongoose.connection.readyState !== 1) return

    try {
        const extractPrompt = `შენ ხარ მეხსიერების ასისტენტი. გაანალიზე ეს მიმოწერა და ამოიღე მნიშვნელოვანი ინფორმაცია რომელიც მომავალში გამოადგება.

მომხმარებლის შეტყობინება: "${message}"
ასისტენტის პასუხი: "${reply.substring(0, 500)}"

თუ არის მნიშვნელოვანი ინფორმაცია (კლიენტის სახელი, კომპანია, დოკუმენტის დეტალები, სამართლებრივი ფაქტები, პრეფერენციები), დააბრუნე JSON მასივი:
[{"category": "client|document|preference|legal|general", "content": "მოკლე აღწერა"}]

თუ არაფერი მნიშვნელოვანი არაა — დააბრუნე ცარიელი მასივი: []
მხოლოდ JSON დააბრუნე, სხვა არაფერი.`

        const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
        const model = client.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { maxOutputTokens: 500 }
        })

        const result = await model.generateContent(extractPrompt)
        const text = result.response.text().trim()

        // Parse JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) return

        const items = JSON.parse(jsonMatch[0])
        if (!Array.isArray(items) || items.length === 0) return

        for (const item of items) {
            if (item.content && item.content.length > 5) {
                // Check for duplicates
                const existing = await Memory.findOne({
                    content: { $regex: item.content.substring(0, 30), $options: 'i' }
                })
                if (!existing) {
                    await Memory.create({
                        category: item.category || 'general',
                        content: item.content,
                        source: sessionId || ''
                    })
                    console.log(`Memory saved: [${item.category}] ${item.content}`)
                }
            }
        }
    } catch (err) {
        // Memory extraction is non-critical, don't break the chat
        console.log('Memory extraction skipped:', (err as Error).message?.substring(0, 80))
    }
}

export const chat = async (req: Request, res: Response) => {
    try {
        const { message, history, sessionId } = req.body

        // Build conversation history
        const chatHistory: ChatMessage[] = Array.isArray(history)
            ? [...history.map((m: any) => ({ role: m.role, content: m.content })), { role: 'user' as const, content: message }]
            : [{ role: 'user' as const, content: message }]

        // Build system prompt with memories
        const systemPrompt = await buildSystemPrompt()

        let reply = ''
        const provider = process.env.AI_PROVIDER || 'auto'

        if (provider === 'openai' && process.env.OPENAI_API_KEY) {
            reply = await chatWithOpenAI(chatHistory, systemPrompt)
        } else if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
            reply = await chatWithGemini(chatHistory, systemPrompt)
        } else {
            if (process.env.OPENAI_API_KEY) {
                try {
                    reply = await chatWithOpenAI(chatHistory, systemPrompt)
                } catch (err: any) {
                    console.log('OpenAI failed, trying Gemini...', err?.code || err?.status)
                    if (process.env.GEMINI_API_KEY) {
                        reply = await chatWithGemini(chatHistory, systemPrompt)
                    } else {
                        throw err
                    }
                }
            } else if (process.env.GEMINI_API_KEY) {
                reply = await chatWithGemini(chatHistory, systemPrompt)
            } else {
                return res.json({ reply: 'API key არ არის კონფიგურირებული. დააყენეთ OPENAI_API_KEY ან GEMINI_API_KEY .env ფაილში.' })
            }
        }

        // Extract memories in background (non-blocking)
        extractAndSaveMemories(message, reply, sessionId).catch(() => {})

        res.json({ reply })
    } catch (error: any) {
        console.log(error)
        if (error?.status === 429 || error?.code === 'insufficient_quota') {
            return res.json({ reply: 'ტოკენები ამოიწურა. გთხოვთ შეავსოთ OpenAI ბალანსი: https://platform.openai.com/settings/organization/billing' })
        }
        if (error?.status === 503) {
            return res.json({ reply: 'სერვისი დროებით გადატვირთულია. გთხოვთ სცადოთ რამდენიმე წამში.' })
        }
        return res.status(500).json({ message: "Server error" })
    }
}
