import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Transition } from '@headlessui/react'
import { User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MobileNav from './MobileNav'

export default function Topbar() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Navigation */}
        <MobileNav />
        
        {/* Desktop Spacer */}
        <div className="hidden md:block" />
        <Menu as="div" className="relative inline-block text-right">
          <Menu.Button className="flex items-center gap-3 hover:bg-slate-50 rounded-lg p-2 transition-colors">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{user?.name || 'مستخدم'}</div>
              <div className="text-xs text-slate-500">مرحباً بك 👋</div>
            </div>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name?.[0]?.toUpperCase?.() || 'م'}
              </div>
            )}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none overflow-hidden border border-slate-100">
              <div className="py-2">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-sm font-medium text-slate-800">{user?.name || 'مستخدم'}</div>
                  <div className="text-xs text-slate-500">{user?.email || ''}</div>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <Link 
                      to="/profile" 
                      className={`flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors ${active ? 'bg-slate-50' : ''}`}
                    >
                      <Settings className="w-4 h-4" />
                      الإعدادات
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={logout} 
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors ${active ? 'bg-red-50' : ''}`}
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
      <motion.div layout />
    </header>
  )
}
