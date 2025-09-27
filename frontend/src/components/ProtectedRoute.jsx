import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './layout/Layout'

export default function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  userOnly = false, 
  adminRedirect = null 
}) {
  const { token, user } = useAuth()
  
  if (!token) return <Navigate to="/login" replace />
  
  // Admin-only routes (like /admin/users)
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  // User-only routes (like /meals, /activities, /reports, /bmi)
  if (userOnly && user?.role === 'admin') {
    return <Navigate to="/admin/users" replace />
  }
  
  // Special case: redirect admin users from dashboard to admin panel
  if (adminRedirect && user?.role === 'admin') {
    return <Navigate to={adminRedirect} replace />
  }
  
  return <Layout>{children}</Layout>
}
