import axios from 'axios'

// In dev, Vite proxies /api -> localhost:8000 (see vite.config.js).
// In prod (Vercel), set VITE_API_URL to the deployed backend origin, e.g.
// https://spendsense-api.onrender.com
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

const api = axios.create({
  baseURL: API_BASE,
})

export default api
