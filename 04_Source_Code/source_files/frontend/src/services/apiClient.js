import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error
    error.userMessage =
      apiError?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The request took too long. Please try again.'
        : 'Unable to reach the server. Check that the API is running.')
    error.apiCode = apiError?.code || 'NETWORK_ERROR'
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(error) {
  return error?.userMessage || 'Something went wrong. Please try again.'
}
