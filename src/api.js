import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const getReferenceData = () => api.get('/reference-data')
export const getDashboardData = () => api.get('/dashboard')
export const getComplaints = (filters = {}) => api.get('/complaints', { params: filters })
export const getComplaint = (id) => api.get(`/complaints/${id}`)
export const createComplaint = (data) => api.post('/complaints', data)
export const updateComplaint = (id, data) => api.put(`/complaints/${id}`, data)
export const deleteComplaint = (id) => api.delete(`/complaints/${id}`)
export const updateComplaintStatus = (id, status) => api.post(`/complaints/${id}/update-status`, { status })
export const uploadDocument = (complaintId, file, isValidation = false) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('is_validation', isValidation.toString())
  return api.post(`/complaints/${complaintId}/upload-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
export const downloadDocument = (docId) => window.open(`${API_BASE_URL}/documents/${docId}`, '_blank')

export default api


