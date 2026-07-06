import api from './client'

export const getDashboard = (month, year) =>
  api.get('/dashboard', { params: { month, year } }).then((r) => r.data)

export const importTransactions = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/transactions/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const listTransactions = (params) =>
  api.get('/transactions', { params }).then((r) => r.data)

export const updateTransactionCategory = (id, category) =>
  api.patch(`/transactions/${id}`, { category }).then((r) => r.data)

export const createTransaction = (payload) =>
  api.post('/transactions', payload).then((r) => r.data)

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
export const exportTransactionsUrl = `${API_BASE}/transactions/export`

export const getBudget = (year, month) =>
  api.get(`/budget/${year}/${month}`).then((r) => r.data)

export const setBudget = (year, month, payload) =>
  api.put(`/budget/${year}/${month}`, payload).then((r) => r.data)

export const getCategoryRules = () => api.get('/category-rules').then((r) => r.data)

export const createCategoryRule = (payload) =>
  api.post('/category-rules', payload).then((r) => r.data)

export const deleteCategoryRule = (id) => api.delete(`/category-rules/${id}`).then((r) => r.data)

export const getSummary = (year, month) => api.get(`/summary/${year}/${month}`).then((r) => r.data)

export const sendSummary = (year, month) =>
  api.post(`/summary/${year}/${month}/send`).then((r) => r.data)
