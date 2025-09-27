import React from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  const location = useLocation()
  const isProfilePage = location.pathname === '/profile'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Desktop Sidebar - Hidden on Profile page */}
        {!isProfilePage && <Sidebar />}
        
        {/* Main Content Area */}
        <div className={`flex-1 min-h-screen w-full ${!isProfilePage ? 'md:w-auto' : ''}`}>
          <Topbar />
          <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
