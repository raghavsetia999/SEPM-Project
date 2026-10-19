import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { ApiError } from '../utils/ApiError.js'

export function notFoundMiddleware(request, _response, next) {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `No route matches ${request.method} ${request.path}.`))
}

export function errorMiddleware(error, _request, response, _next) {
  let normalized = error

  if (error instanceof ZodError) {
    normalized = new ApiError(
      400,
      'VALIDATION_ERROR',
      'The request contains invalid data.',
      error.flatten(),
    )
  } else if (error instanceof mongoose.Error.ValidationError) {
    normalized = new ApiError(400, 'DATABASE_VALIDATION_ERROR', error.message)
  } else if (error?.code === 11000) {
    normalized = new ApiError(409, 'DUPLICATE_RESOURCE', 'A record with this value already exists.')
  }

  const statusCode = normalized.statusCode || 500
  const body = {
    success: false,
    error: {
      code: normalized.code || 'INTERNAL_SERVER_ERROR',
      message: statusCode === 500 ? 'An unexpected server error occurred.' : normalized.message,
      details: normalized.details || null,
    },
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    body.error.debug = normalized.message
  }

  response.status(statusCode).json(body)
}
