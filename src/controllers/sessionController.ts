import { Request, Response } from 'express'
import mongoose from 'mongoose'
import Chat from '../models/Chat.js'

const isDbConnected = () => mongoose.connection.readyState === 1

export const getSessions = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json([])
    try {
        const sessions = await Chat.find()
            .select('title preview createdAt updatedAt')
            .sort({ updatedAt: -1 })
        res.json(sessions)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const getSession = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.status(404).json({ message: 'Database not connected' })
    try {
        const chat = await Chat.findById(req.params.id)
        if (!chat) return res.status(404).json({ message: 'Chat not found' })
        res.json(chat)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const createSession = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json({ _id: 'temp', title: req.body.title, messages: [], preview: '', updatedAt: new Date() })
    try {
        const { title, messages } = req.body
        const preview = messages?.[0]?.content?.substring(0, 60) || ''
        const chat = await Chat.create({ title, messages: messages || [], preview })
        res.status(201).json(chat)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const updateSession = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json({ message: 'No database' })
    try {
        const { messages, title } = req.body
        const update: Record<string, unknown> = {}
        if (messages) {
            update.messages = messages
            update.preview = messages[messages.length - 1]?.content?.substring(0, 60) || ''
        }
        if (title) update.title = title

        const chat = await Chat.findByIdAndUpdate(req.params.id, update, { new: true })
        if (!chat) return res.status(404).json({ message: 'Chat not found' })
        res.json(chat)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

export const deleteSession = async (req: Request, res: Response) => {
    if (!isDbConnected()) return res.json({ message: 'No database' })
    try {
        const chat = await Chat.findByIdAndDelete(req.params.id)
        if (!chat) return res.status(404).json({ message: 'Chat not found' })
        res.json({ message: 'Deleted' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}
