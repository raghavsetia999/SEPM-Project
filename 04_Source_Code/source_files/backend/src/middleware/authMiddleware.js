import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../modules/user/user.model.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const authMiddleware = asyncHandler(async (request, _response, next) => {
  const bearerToken = request.headers.authorization?.startsWith('Bearer ')
    ? request.headers.authorization.slice(7)
    : null
  const token = request.cookies?.accessToken || bearerToken

  if (!token) {
    throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Please log in to continue.')
  }

  let payload
  try {
    payload = jwt.verify(token, env.JWT_SECRET)
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please log in again.')
    }
    throw new ApiError(401, 'INVALID_SESSION', 'Your session is invalid.')
  }

  const user = await User.findById(payload.sub)
  if (!user) {
    throw new ApiError(401, 'INVALID_SESSION', 'The account for this session no longer exists.')
  }

  request.user = user
  next()
})
