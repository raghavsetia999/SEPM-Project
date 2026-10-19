import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import {
  forgotPassword,
  googleCallback,
  googleStart,
  googleStatus,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from './auth.controller.js'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.validation.js'

export const authRouter = Router()

authRouter.post('/register', validateRequest(registerSchema), asyncHandler(register))
authRouter.post('/login', validateRequest(loginSchema), asyncHandler(login))
authRouter.post('/refresh', asyncHandler(refresh))
authRouter.post('/logout', asyncHandler(logout))
authRouter.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  asyncHandler(forgotPassword),
)
authRouter.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  asyncHandler(resetPassword),
)
authRouter.get('/google/status', googleStatus)
authRouter.get('/google', googleStart)
authRouter.get('/google/callback', asyncHandler(googleCallback))
authRouter.get('/me', authMiddleware, me)
