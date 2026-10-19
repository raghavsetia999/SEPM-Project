import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { handleParamsSchema } from '../codeforces/codeforces.validation.js'
import { analyze, rating, summary, upsolving, verdicts, weakness } from './analytics.controller.js'

export const analyticsRouter = Router()

analyticsRouter.use(authMiddleware)
analyticsRouter.post('/analyze/:handle', validateRequest(handleParamsSchema), asyncHandler(analyze))
analyticsRouter.get('/summary/:handle', validateRequest(handleParamsSchema), asyncHandler(summary))
analyticsRouter.get(
  '/weakness/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(weakness),
)
analyticsRouter.get('/rating/:handle', validateRequest(handleParamsSchema), asyncHandler(rating))
analyticsRouter.get(
  '/verdicts/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(verdicts),
)
analyticsRouter.get(
  '/upsolving/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(upsolving),
)
