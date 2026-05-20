import dns from 'node:dns'
dns.setServers(['8.8.8.8', '8.8.4.4'])

import dotenv from "dotenv"
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from './database/connect.js'
import chatRouter from './routes/chatRoute.js'
import sessionRouter from './routes/sessionRoute.js'
import memoryRouter from './routes/memoryRoute.js'

dotenv.config()
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

connectDB()

app.use(cors())
app.use(express.json())
app.use('/api', chatRouter)
app.use('/api', sessionRouter)
app.use('/api', memoryRouter)

app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
})

const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
    console.log(`Jurist AI server running on port ${PORT}`)
})
