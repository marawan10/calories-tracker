import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, ClipboardList, UtensilsCrossed, PieChart, Activity, Users, Crown, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
    isActive 
      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg' 
      : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700'
  }`

const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
}

export default function Sidebar() {
  const { user } = useAuth()
  
  return (
    <motion.aside 
      className="hidden md:block w-64 min-h-screen border-r border-slate-200/50 bg-white/80 backdrop-blur-sm"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-4">
        <motion.div 
          className="card-gradient rounded-2xl p-4 text-white shadow-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-xs uppercase opacity-80">تغذية</div>
          <div className="text-lg font-bold">كُل بحساب</div>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-1 text-xs mt-1 opacity-90">
              <Crown size={12} />
              <span>مدير</span>
            </div>
          )}
        </motion.div>
      </div>
      <nav className="px-4 space-y-2">
        {/* Regular User Navigation */}
        {user?.role !== 'admin' && (
          <>
            <NavLink to="/" className={navItemClass} end>
              <BarChart3 size={18} />
              <span>لوحة التحكم</span>
            </NavLink>
            <NavLink to="/foods" className={navItemClass}>
              <UtensilsCrossed size={18} />
              <span>الأطعمة</span>
            </NavLink>
            <NavLink to="/meals" className={navItemClass}>
              <ClipboardList size={18} />
              <span>الوجبات</span>
            </NavLink>
            <NavLink to="/activities" className={navItemClass}>
              <Zap size={18} />
              <span>بيانات الساعة الذكية</span>
            </NavLink>
            <NavLink to="/reports" className={navItemClass}>
              <PieChart size={18} />
              <span>التقارير</span>
            </NavLink>
            <NavLink to="/bmi" className={navItemClass}>
              <Activity size={18} />
              <span>حاسبة BMI</span>
            </NavLink>
          </>
        )}
        
        {/* Admin Navigation */}
        {user?.role === 'admin' && (
          <>
            <div className="pt-2 pb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
                إدارة النظام
              </div>
            </div>
            <NavLink to="/admin/users" className={navItemClass}>
              <Users size={18} />
              <span>إدارة المستخدمين</span>
            </NavLink>
            <NavLink to="/foods" className={navItemClass}>
              <UtensilsCrossed size={18} />
              <span>إدارة الأطعمة</span>
            </NavLink>
          </>
        )}
      </nav>
    </motion.aside>
  )
}
