import mongoose, { Schema, Document } from 'mongoose'

interface IMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export interface IChat extends Document {
    title: string
    messages: IMessage[]
    preview: string
    createdAt: Date
    updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
})

const ChatSchema = new Schema<IChat>({
    title: { type: String, required: true },
    messages: [MessageSchema],
    preview: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model<IChat>('Chat', ChatSchema)
