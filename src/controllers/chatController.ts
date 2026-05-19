import { Request, Response } from 'express'
import OpenAI from 'openai'
import { juristPrompt } from '../prompts/juristPrompt.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const chat = async (req: Request, res: Response) => {
    try {
        const message = req.body.message

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: juristPrompt },
                { role: "user", content: message }
            ],
            max_tokens: 8000
        })

        const reply = completion.choices[0]?.message?.content || ''
        res.json({ reply })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Server error" })
    }
}
