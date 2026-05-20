import mongoose from 'mongoose'

export const connectDB = async () => {
    const uri = process.env.MONGO_URI
    if (!uri) {
        console.log('MONGO_URI not set — running without database (sessions will not be saved)')
        return
    }
    try {
        await mongoose.connect(uri)
        console.log('MongoDB connected')
    } catch (error) {
        console.log('MongoDB connection error — running without database:', (error as Error).message)
    }
}
