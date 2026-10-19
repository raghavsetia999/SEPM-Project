import { apiClient } from './apiClient'

export const authApi = {
  async register(payload) {
    const { data } = await apiClient.post('/auth/register', payload)
    return data.data.user
  },

  async login(payload) {
    const { data } = await apiClient.post('/auth/login', payload)
    return data.data.user
  },

  async logout() {
    await apiClient.post('/auth/logout')
  },

  async me() {
    const { data } = await apiClient.get('/auth/me')
    return data.data.user
  },

  async forgotPassword(email) {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data.data
  },

  async resetPassword(payload) {
    const { data } = await apiClient.post('/auth/reset-password', payload)
    return data.data.user
  },

  async googleStatus() {
    const { data } = await apiClient.get('/auth/google/status')
    return data.data
  },

  googleLoginUrl() {
    return apiClient.getUri({ url: '/auth/google' })
  },
}
