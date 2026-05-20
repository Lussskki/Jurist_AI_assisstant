import mongoose, { Schema, Document } from 'mongoose'

export interface IMemory extends Document {
    category: 'client' | 'document' | 'preference' | 'legal' | 'general'
    content: string
    source: string // chat ID where this memory was created
    createdAt: Date
    updatedAt: Date
}

const MemorySchema = new Schema<IMemory>({
    category: {
        type: String,
        enum: ['client', 'document', 'preference', 'legal', 'general'],
        default: 'general'
    },
    content: { type: String, required: true },
    source: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model<IMemory>('Memory', MemorySchema)
