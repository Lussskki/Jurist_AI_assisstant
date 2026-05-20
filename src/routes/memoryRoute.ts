import { Router } from 'express'
import { getMemories, createMemory, deleteMemory } from '../controllers/memoryController.js'

const router = Router()

router.get('/memories', getMemories)
router.post('/memories', createMemory)
router.delete('/memories/:id', deleteMemory)

export default router
