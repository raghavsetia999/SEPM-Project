import { apiClient } from './apiClient'

export const userApi = {
  async updateProfile(payload) {
    const { data } = await apiClient.patch('/user/profile', payload)
    return data.data.user
  },

  async updateHandle(codeforcesHandle) {
    const { data } = await apiClient.patch('/user/codeforces-handle', { codeforcesHandle })
    return data.data.user
  },

  async updatePreferences(payload) {
    const { data } = await apiClient.patch('/user/preferences', payload)
    return data.data.user
  },
}
