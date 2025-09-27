import React, { Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, Transition } from '@headlessui/react'
import { User, Settings, LogOut, ArrowRight, Home } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import MobileNav from './MobileNav'

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isProfilePage = location.pathname === '/profile'
  
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Mobile Navigation or Profile Navigation */}
        {isProfilePage ? (
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-medium">العودة للرئيسية</span>
            </motion.button>
            
            {/* Brand Logo for Profile Page */}
            <div className="hidden md:flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">كُل بحساب</div>
                <div className="text-xs text-slate-500">الملف الشخصي</div>
              </div>
            </div>
          </div>
        ) : (
          <MobileNav />
        )}
        
        {/* Desktop Spacer */}
        {!isProfilePage && <div className="hidden md:block" />}
        
        <Menu as="div" className="relative inline-block text-right">
          <Menu.Button className="group flex items-center gap-3 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100/50 rounded-2xl p-3 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 border border-transparent hover:border-slate-200/50">
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors duration-200">{user?.name || 'مستخدم'}</div>
              <div className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors duration-200 flex items-center gap-1">
                <span>مرحباً بك</span>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                >
                  👋
                </motion.span>
              </div>
            </div>
            {user?.avatar ? (
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-white">
                  {user?.name?.[0]?.toUpperCase?.() || 'م'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white rounded-full shadow-sm"></div>
              </div>
            )}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95 translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 translate-y-1"
          >
            <Menu.Items className="absolute right-0 mt-3 w-48 origin-top-right rounded-2xl bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-slate-200/50 focus:outline-none overflow-hidden border border-slate-100/50 z-20">
              {/* Header Section with Enhanced Design */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50/50 to-slate-100/30 border-b border-slate-200/50">
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-xs">
                      {user?.name?.[0]?.toUpperCase?.() || 'م'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'مستخدم'}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
                  </div>
                </div>
              </div>
              
              {/* Menu Items with Enhanced Styling */}
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link 
                      to="/profile" 
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        active 
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-500' 
                          : 'text-slate-700 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${active ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <Settings className={`w-3.5 h-3.5 ${active ? 'text-blue-600' : 'text-slate-600'}`} />
                      </div>
                      <span>الإعدادات</span>
                    </Link>
                  )}
                </Menu.Item>
                
                {/* Divider */}
                <div className="mx-3 my-1 border-t border-slate-200/60"></div>
                
                <Menu.Item>
                  {({ active }) => (
                    <button 
                      onClick={logout} 
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                        active 
                          ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-r-2 border-red-500' 
                          : 'text-red-600 hover:bg-red-50/80'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${active ? 'bg-red-100' : 'bg-red-50'}`}>
                        <LogOut className={`w-3.5 h-3.5 ${active ? 'text-red-600' : 'text-red-500'}`} />
                      </div>
                      <span>تسجيل الخروج</span>
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
