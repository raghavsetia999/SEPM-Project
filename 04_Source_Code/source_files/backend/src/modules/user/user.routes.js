import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { getProfile, patchHandle, patchPreferences, patchProfile } from './user.controller.js'
import {
  updateHandleSchema,
  updatePreferencesSchema,
  updateProfileSchema,
} from './user.validation.js'

export const userRouter = Router()

userRouter.use(authMiddleware)
userRouter.get('/profile', getProfile)
userRouter.patch('/profile', validateRequest(updateProfileSchema), asyncHandler(patchProfile))
userRouter.patch(
  '/codeforces-handle',
  validateRequest(updateHandleSchema),
  asyncHandler(patchHandle),
)
userRouter.patch(
  '/preferences',
  validateRequest(updatePreferencesSchema),
  asyncHandler(patchPreferences),
)
