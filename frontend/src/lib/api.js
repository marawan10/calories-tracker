import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 
                (import.meta.env.PROD ? 'https://calories-tracker-opal.vercel.app/api' : 'http://localhost:5000/api')

console.log('API Base URL:', baseURL)
console.log('Environment:', import.meta.env.MODE)

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

let authToken = null

api.setToken = (token) => {
  authToken = token
}

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401/403 errors globally
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear token and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      authToken = null
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export default api
