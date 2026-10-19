import { Router } from 'express'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { getRating, getSnapshot, getSubmissions, getUser } from './codeforces.controller.js'
import { handleParamsSchema } from './codeforces.validation.js'

export const codeforcesRouter = Router()

codeforcesRouter.get('/user/:handle', validateRequest(handleParamsSchema), asyncHandler(getUser))
codeforcesRouter.get(
  '/submissions/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(getSubmissions),
)
codeforcesRouter.get(
  '/rating/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(getRating),
)
codeforcesRouter.get(
  '/snapshot/:handle',
  validateRequest(handleParamsSchema),
  asyncHandler(getSnapshot),
)
