import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, BarChart3, ClipboardList, UtensilsCrossed, PieChart, Activity, Calculator, Users, Crown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
    isActive 
      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg' 
      : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
  }`

const menuVariants = {
  closed: {
    x: '-100%',
    transition: {
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  open: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  closed: { x: -20, opacity: 0 },
  open: { x: 0, opacity: 1 }
}

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth()

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
        onClick={toggleMenu}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} className="text-slate-700" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={24} className="text-slate-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile Menu Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 md:hidden"
                style={{ 
                  zIndex: 99999,
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeMenu}
              />
              
              {/* Mobile Menu */}
              <motion.div
                className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white backdrop-blur-md border-r border-slate-200/50 md:hidden shadow-2xl overflow-y-auto"
                style={{ 
                  zIndex: 100000,
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  height: '100vh',
                  width: '320px',
                  maxWidth: '85vw'
                }}
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
            <div className="p-4">
              {/* Close Button */}
              <motion.div 
                className="flex justify-end mb-4"
                variants={itemVariants}
              >
                <motion.button
                  onClick={closeMenu}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={20} className="text-slate-600" />
                </motion.button>
              </motion.div>
              
              <motion.div 
                className="card-gradient rounded-2xl p-4 text-white shadow-lg mb-6"
                variants={itemVariants}
              >
                <div className="text-xs uppercase opacity-80">تغذية</div>
                <div className="text-lg font-bold">كُل بحساب</div>
              </motion.div>
            </div>

            <nav className="px-4 space-y-2">
              {user?.role === 'admin' ? (
                // Admin Navigation
                <>
                  <motion.div variants={itemVariants}>
                    <NavLink to="/admin/users" className={navItemClass} onClick={closeMenu}>
                      <Users size={20} />
                      <span>إدارة المستخدمين</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/admin/foods" className={navItemClass} onClick={closeMenu}>
                      <UtensilsCrossed size={20} />
                      <span>إدارة الأطعمة</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/profile" className={navItemClass} onClick={closeMenu}>
                      <Crown size={20} />
                      <span>ملف المدير</span>
                    </NavLink>
                  </motion.div>
                </>
              ) : (
                // User Navigation
                <>
                  <motion.div variants={itemVariants}>
                    <NavLink to="/" className={navItemClass} onClick={closeMenu} end>
                      <BarChart3 size={20} />
                      <span>لوحة التحكم</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/foods" className={navItemClass} onClick={closeMenu}>
                      <UtensilsCrossed size={20} />
                      <span>الأطعمة</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/meals" className={navItemClass} onClick={closeMenu}>
                      <ClipboardList size={20} />
                      <span>الوجبات</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/reports" className={navItemClass} onClick={closeMenu}>
                      <PieChart size={20} />
                      <span>التقارير</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/activities" className={navItemClass} onClick={closeMenu}>
                      <Activity size={20} />
                      <span>بيانات الساعة الذكية</span>
                    </NavLink>
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <NavLink to="/bmi" className={navItemClass} onClick={closeMenu}>
                      <Calculator size={20} />
                      <span>حاسبة BMI</span>
                    </NavLink>
                  </motion.div>
                </>
              )}
            </nav>
          </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
