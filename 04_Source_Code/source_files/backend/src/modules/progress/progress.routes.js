import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { handleParamsSchema } from '../codeforces/codeforces.validation.js'
import { progress } from './progress.controller.js'

export const progressRouter = Router()

progressRouter.use(authMiddleware)
progressRouter.get('/:handle', validateRequest(handleParamsSchema), asyncHandler(progress))
