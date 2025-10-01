import React from 'react'
import { motion } from 'framer-motion'
import { Settings, UserCircle, Target, Lock, Database } from 'lucide-react'
import { profileSections } from './constants'

const iconMap = {
  UserCircle,
  Target,
  Lock,
  Database
}

const ProfileSidebar = ({ activeSection, onSectionChange, user }) => {
  // Simple click handler
  const handleSectionClick = (sectionId) => {
    onSectionChange(sectionId)
  }
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 backdrop-blur-sm"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Sidebar Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">أقسام الملف الشخصي</h3>
            <p className="text-sm text-slate-500">اختر القسم الذي تريد تعديله</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="space-y-3">
        {profileSections.map((section, index) => {
          const Icon = iconMap[section.icon]
          const isActive = activeSection === section.id
          
          return (
            <motion.button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={`w-full text-right p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 text-blue-700 border-2 border-blue-300 shadow-lg shadow-blue-100' 
                  : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-gray-50 text-slate-700 border-2 border-transparent hover:border-slate-300 hover:shadow-md'
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 group-hover:from-slate-200 group-hover:to-slate-300 group-hover:text-slate-600'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-right flex-1">
                  <div className={`font-bold text-base transition-colors ${
                    isActive ? 'text-blue-800' : 'text-slate-800 group-hover:text-slate-900'
                  }`}>
                    {section.label}
                  </div>
                  <div className={`text-sm mt-1 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'
                  }`}>
                    {section.description}
                  </div>
                </div>
                {isActive && (
                  <motion.div
                    className="w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-lg"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Profile Progress */}
      <div className="mt-8 p-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-200 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <UserCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-bold text-emerald-800">تقدم الملف الشخصي</span>
            <p className="text-sm text-emerald-600">اكمل بياناتك للحصول على تجربة أفضل</p>
          </div>
        </div>
        <div className="w-full bg-emerald-100 rounded-full h-3 mb-3 shadow-inner">
          <motion.div 
            className="bg-gradient-to-r from-emerald-500 to-green-500 h-3 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ 
              width: `${user?.profile ? Math.round(
                ((user.profile.age ? 1 : 0) + 
                 (user.profile.gender ? 1 : 0) + 
                 (user.profile.height ? 1 : 0) + 
                 (user.profile.weight ? 1 : 0) + 
                 (user.profile.activityLevel ? 1 : 0)) / 5 * 100
              ) : 0}%` 
            }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-emerald-700">
            {user?.profile ? Math.round(
              ((user.profile.age ? 1 : 0) + 
               (user.profile.gender ? 1 : 0) + 
               (user.profile.height ? 1 : 0) + 
               (user.profile.weight ? 1 : 0) + 
               (user.profile.activityLevel ? 1 : 0)) / 5 * 100
            ) : 0}% مكتمل
          </p>
          <div className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
            {5 - (user?.profile ? 
              ((user.profile.age ? 1 : 0) + 
               (user.profile.gender ? 1 : 0) + 
               (user.profile.height ? 1 : 0) + 
               (user.profile.weight ? 1 : 0) + 
               (user.profile.activityLevel ? 1 : 0)) : 0)} حقول متبقية
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ProfileSidebar
