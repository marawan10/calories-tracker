import React from 'react'
import { motion } from 'framer-motion'
import { User, Crown, Settings } from 'lucide-react'
import ProfileSidebar from './ProfileSidebar'
import PersonalInfoSection from './PersonalInfoSection'
import GoalsSection from './GoalsSection'
import SecuritySection from './SecuritySection'
import DataSection from './DataSection'
import { profileSections } from './constants'

const UserProfile = ({ 
  user,
  activeSection,
  onSectionChange,
  form,
  onFormChange,
  onSubmit,
  onPickAvatar,
  loading,
  onCaloriesChange,
  autoCalculate,
  onAutoCalculateToggle,
  onAutoCalculateNow,
  onSaveGoals,
  passwordForm,
  onPasswordFormChange,
  onChangePassword,
  passwordLoading,
  onExportUserData,
  onExportToCSV,
  onExportAnalyticsReport,
  onExportHtmlReport,
  onTriggerImport,
  onImportUserData,
  exporting,
  importing,
  fileInputRef
}) => {
  // Simple section rendering without complex logic
  let currentSection = null
  
  if (activeSection === 'personal') {
    currentSection = (
      <PersonalInfoSection 
        form={form}
        onFormChange={onFormChange}
        onSubmit={onSubmit}
        onPickAvatar={onPickAvatar}
        loading={loading}
      />
    )
  } else if (activeSection === 'goals') {
    currentSection = (
      <GoalsSection 
        form={form}
        onFormChange={onFormChange}
        onCaloriesChange={onCaloriesChange}
        autoCalculate={autoCalculate}
        onAutoCalculateToggle={onAutoCalculateToggle}
        onAutoCalculateNow={onAutoCalculateNow}
        onSaveGoals={onSaveGoals}
        loading={loading}
      />
    )
  } else if (activeSection === 'security') {
    currentSection = (
      <SecuritySection 
        passwordForm={passwordForm}
        onPasswordFormChange={onPasswordFormChange}
        onChangePassword={onChangePassword}
        passwordLoading={passwordLoading}
      />
    )
  } else if (activeSection === 'data') {
    currentSection = (
      <DataSection 
        onExportUserData={onExportUserData}
        onExportToCSV={onExportToCSV}
        onExportAnalyticsReport={onExportAnalyticsReport}
        onExportHtmlReport={onExportHtmlReport}
        onTriggerImport={onTriggerImport}
        onImportUserData={onImportUserData}
        exporting={exporting}
        importing={importing}
        fileInputRef={fileInputRef}
      />
    )
  } else {
    // Default to personal section
    currentSection = (
      <PersonalInfoSection 
        form={form}
        onFormChange={onFormChange}
        onSubmit={onSubmit}
        onPickAvatar={onPickAvatar}
        loading={loading}
      />
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">الملف الشخصي</h1>
              {user?.role === 'admin' && (
                <motion.div 
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Crown className="w-3 h-3" />
                  <span>مدير النظام</span>
                </motion.div>
              )}
            </div>
            <p className="text-slate-500 mt-1">إدارة معلوماتك الشخصية وإعدادات الحساب بسهولة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Profile Completion Indicator */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center">
              <div className="text-sm font-bold text-slate-800">
                {user?.profile ? Math.round(
                  ((user.profile.age ? 1 : 0) + 
                   (user.profile.gender ? 1 : 0) + 
                   (user.profile.height ? 1 : 0) + 
                   (user.profile.weight ? 1 : 0) + 
                   (user.profile.activityLevel ? 1 : 0)) / 5 * 100
                ) : 0}%
              </div>
              <div className="text-xs text-slate-500">اكتمال الملف</div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-800">{profileSections.length}</div>
              <div className="text-xs text-slate-500">أقسام</div>
            </div>
          </div>
          
          {/* Quick Settings Button */}
          <motion.button
            onClick={() => onSectionChange('security')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">الإعدادات</span>
          </motion.button>
          
        </div>
      </motion.div>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-80 lg:flex-shrink-0">
          <ProfileSidebar 
            activeSection={activeSection}
            onSectionChange={onSectionChange}
            user={user}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {currentSection}
        </div>
      </div>
    </motion.div>
  )
}

export default UserProfile
