import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { sync, jobStatus, analysis } from './jobs.controller.js'

export const jobsRouter = Router()

jobsRouter.use(authMiddleware)
jobsRouter.post('/sync', asyncHandler(sync))
jobsRouter.get('/jobs/:jobId', asyncHandler(jobStatus))
jobsRouter.get('/analysis/:handle', asyncHandler(analysis))
