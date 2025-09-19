import React from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 min-h-screen w-full md:w-auto">
          <Topbar />
          <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
