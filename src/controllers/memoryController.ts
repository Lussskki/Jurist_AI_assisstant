import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Memory from '../models/Memory.js'

const isDbConnected = () => mongoose.connection.readyState === 1

export const getMemories = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json([])
    try {
        const memories = await Memory.find().sort({ updatedAt: -1 }).limit(50)
        res.json(memories)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const createMemory = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json({ message: 'No database' })
    try {
        const { category, content, source } = req.body
        const memory = await Memory.create({ category, content, source })
        res.status(201).json(memory)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const deleteMemory = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json({ message: 'No database' })
    try {
        await Memory.findByIdAndDelete(req.params.id)
        res.json({ message: 'Deleted' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

// Build memory context string for AI prompt
export const getMemoryContext = async (): Promise<string> => {
    if (!isDbConnected()) return ''
    try {
        const memories = await Memory.find().sort({ updatedAt: -1 }).limit(50)
        if (memories.length === 0) return ''

        const grouped: Record<string, string[]> = {}
        for (const m of memories) {
            if (!grouped[m.category]) grouped[m.category] = []
            grouped[m.category].push(m.content)
        }

        const labels: Record<string, string> = {
            client: 'კლიენტები და მხარეები',
            document: 'შედგენილი დოკუმენტები',
            preference: 'მომხმარებლის პრეფერენციები',
            legal: 'სამართლებრივი ინფორმაცია',
            general: 'ზოგადი ინფორმაცია'
        }

        let context = '\n\n# დამახსოვრებული ინფორმაცია (წინა საუბრებიდან)\n'
        for (const [cat, items] of Object.entries(grouped)) {
            context += `\n## ${labels[cat] || cat}\n`
            items.forEach(item => { context += `- ${item}\n` })
        }
        return context
    } catch {
        return ''
    }
}
