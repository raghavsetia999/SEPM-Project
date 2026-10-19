import { apiClient } from './apiClient'

export const progressApi = {
  async get(handle) {
    const { data } = await apiClient.get(`/progress/${encodeURIComponent(handle)}`)
    return data.data
  },
}
