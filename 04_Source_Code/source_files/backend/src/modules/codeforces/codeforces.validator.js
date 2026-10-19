import { codeforcesClient } from './codeforces.client.js'
import { ApiError } from '../../utils/ApiError.js'

const handleCache = new Map()
const HANDLE_CACHE_TTL_MS = 5 * 60 * 1000

export async function assertCodeforcesHandleExists(handle) {
  const key = String(handle || '').trim().toLowerCase()
  if (!key) {
    throw new ApiError(400, 'CODEFORCES_HANDLE_REQUIRED', 'A Codeforces handle is required.')
  }

  const cached = handleCache.get(key)
  if (cached && Date.now() - cached.checkedAt < HANDLE_CACHE_TTL_MS) {
    if (!cached.exists) {
      throw new ApiError(400, 'CODEFORCES_HANDLE_NOT_FOUND', 'That Codeforces handle could not be found.')
    }
    return cached.handle
  }

  try {
    const users = await codeforcesClient.getUser(key)
    if (!users?.[0]?.handle) {
      throw new ApiError(400, 'CODEFORCES_HANDLE_NOT_FOUND', 'That Codeforces handle could not be found.')
    }
    handleCache.set(key, { exists: true, handle: users[0].handle, checkedAt: Date.now() })
    return users[0].handle
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CODEFORCES_USER_NOT_FOUND') {
      handleCache.set(key, { exists: false, checkedAt: Date.now() })
      throw new ApiError(400, 'CODEFORCES_HANDLE_NOT_FOUND', 'That Codeforces handle could not be found.')
    }
    // Codeforces unavailable/rate-limited: fail open so registration is not blocked.
    if (
      error instanceof ApiError &&
      ['CODEFORCES_TIMEOUT', 'CODEFORCES_RATE_LIMITED', 'CODEFORCES_UNAVAILABLE'].includes(error.code)
    ) {
      return String(handle).trim()
    }
    throw error
  }
}
