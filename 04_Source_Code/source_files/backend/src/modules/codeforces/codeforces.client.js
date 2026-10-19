import axios from 'axios'
import { env } from '../../config/env.js'
import { ApiError } from '../../utils/ApiError.js'

const client = axios.create({
  baseURL: env.CODEFORCES_API_BASE_URL,
  timeout: env.CODEFORCES_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

async function callCodeforces(method, params) {
  try {
    const { data } = await client.get(`/${method}`, { params })
    if (data.status !== 'OK') {
      throw new Error(data.comment || `Codeforces ${method} failed`)
    }
    return data.result
  } catch (error) {
    if (error instanceof ApiError) throw error

    const comment = error.response?.data?.comment || error.message
    if (/not found|should contain|handle/i.test(comment) && error.response?.status !== 429) {
      throw new ApiError(
        404,
        'CODEFORCES_USER_NOT_FOUND',
        'The Codeforces handle could not be found.',
      )
    }
    if (error.code === 'ECONNABORTED') {
      throw new ApiError(
        504,
        'CODEFORCES_TIMEOUT',
        'Codeforces took too long to respond. Please retry.',
      )
    }
    if (error.response?.status === 429) {
      throw new ApiError(
        429,
        'CODEFORCES_RATE_LIMITED',
        'Codeforces is temporarily rate limiting requests.',
      )
    }
    throw new ApiError(
      502,
      'CODEFORCES_UNAVAILABLE',
      'Codeforces is temporarily unavailable.',
      comment,
    )
  }
}

export const codeforcesClient = {
  async getUser(handle) {
    const users = await callCodeforces('user.info', {
      handles: handle,
      checkHistoricHandles: false,
    })
    return users[0]
  },

  getSubmissions(handle, count = 10000, from = 1) {
    return callCodeforces('user.status', { handle, from, count })
  },

  getRatingHistory(handle) {
    return callCodeforces('user.rating', { handle })
  },

  getProblemset() {
    return callCodeforces('problemset.problems', {})
  },
}
