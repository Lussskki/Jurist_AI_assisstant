import { Router } from 'express'
import { getSessions, getSession, createSession, updateSession, deleteSession } from '../controllers/sessionController.js'
const router = Router()

router.get('/sessions', getSessions)
router.get('/sessions/:id', getSession)
router.post('/sessions', createSession)
router.put('/sessions/:id', updateSession)
router.delete('/sessions/:id', deleteSession)

export default router
