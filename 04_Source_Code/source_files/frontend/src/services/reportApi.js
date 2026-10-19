import { apiClient } from './apiClient'

export const reportApi = {
  async save(handle) {
    const { data } = await apiClient.post('/reports/save', { handle })
    return data.data
  },

  async ensureWeekly() {
    const { data } = await apiClient.post('/reports/weekly')
    return data.data
  },

  async list() {
    const { data } = await apiClient.get('/reports')
    return data.data
  },

  async get(id) {
    const { data } = await apiClient.get(`/reports/${encodeURIComponent(id)}`)
    return data.data
  },

  async latest(handle) {
    const { data } = await apiClient.get(`/reports/handle/${encodeURIComponent(handle)}/latest`)
    return data.data
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/reports/${encodeURIComponent(id)}`)
    return data.data
  },

  async exportPdf(id) {
    const response = await apiClient.get(`/reports/${encodeURIComponent(id)}/export`, {
      responseType: 'blob',
    })
    return response.data
  },
}
