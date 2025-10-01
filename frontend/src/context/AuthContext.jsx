import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    api.setToken(token)
  }, [token])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      toast.success('تم تسجيل الدخول بنجاح')
      navigate('/')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'فشل تسجيل الدخول')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    try {
      setLoading(true)
      const { data } = await api.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
      toast.success('تم إنشاء الحساب بنجاح')
      navigate('/')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'حدث خطأ أثناء التسجيل')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const refreshMe = async () => {
    if (!token) return
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      // If refresh fails (e.g., token expired), logout user
      console.error('Failed to refresh user data:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout()
      }
    }
  }

  const updateProfile = async (payload) => {
    try {
      setLoading(true)
      const { data } = await api.put('/users/profile', payload)
      toast.success('تم تحديث الملف الشخصي')
      
      // Properly update user state with nested profile structure
      const updatedUser = {
        ...user,
        name: payload.name || user.name,
        avatar: payload.avatar || user.avatar,
        profile: {
          ...user.profile,
          age: payload.age,
          gender: payload.gender,
          height: payload.height,
          weight: payload.weight,
          activityLevel: payload.activityLevel,
          goal: payload.goal,
        }
      }
      
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return data
    } catch (e) {
      toast.error(e?.response?.data?.message || 'فشل تحديث الملف الشخصي')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const updateGoals = async (payload) => {
    try {
      setLoading(true)
      const { data } = await api.put('/users/goals', payload)
      toast.success('تم حفظ الأهداف اليومية')
      
      // Properly update user state with nested dailyGoals structure
      const updatedUser = {
        ...user,
        dailyGoals: {
          ...user.dailyGoals,
          ...payload
        }
      }
      
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return data
    } catch (e) {
      toast.error(e?.response?.data?.message || 'فشل حفظ الأهداف')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    if (location.pathname !== '/login') navigate('/login')
  }

  const value = useMemo(() => ({ token, user, setUser, login, register, updateProfile, updateGoals, refreshMe, logout, loading }), [token, user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
