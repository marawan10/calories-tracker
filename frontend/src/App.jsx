import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import ChartsSetup from './components/charts/ChartsSetup.jsx'

import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Foods from './pages/Foods.jsx'
import Meals from './pages/Meals.jsx'
import Activities from './pages/Activities.jsx'
import Reports from './pages/Reports.jsx'
import Profile from './pages/Profile.jsx'
import BMI from './pages/BMI.jsx'
import AdminUsers from './pages/admin/AdminUsers.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <ChartsSetup />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute adminRedirect="/admin/users">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foods"
          element={
            <ProtectedRoute>
              <Foods />
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals"
          element={
            <ProtectedRoute userOnly={true}>
              <Meals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute userOnly={true}>
              <Activities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute userOnly={true}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bmi"
          element={
            <ProtectedRoute userOnly={true}>
              <BMI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
