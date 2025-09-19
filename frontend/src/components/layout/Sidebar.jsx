import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, ClipboardList, UtensilsCrossed, PieChart, Activity } from 'lucide-react'

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
        </motion.div>
      </div>
      <nav className="px-4 space-y-2">
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
        <NavLink to="/reports" className={navItemClass}>
          <PieChart size={18} />
          <span>التقارير</span>
        </NavLink>
        <NavLink to="/bmi" className={navItemClass}>
          <Activity size={18} />
          <span>حاسبة BMI</span>
        </NavLink>
      </nav>
    </motion.aside>
  )
}
