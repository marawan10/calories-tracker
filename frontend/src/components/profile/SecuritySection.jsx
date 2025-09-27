import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Key } from 'lucide-react'

const SecuritySection = ({ 
  passwordForm, 
  onPasswordFormChange, 
  onChangePassword, 
  passwordLoading 
}) => {
  // Simple input handlers
  const handlePasswordInputChange = (field) => (e) => {
    onPasswordFormChange(field, e.target.value)
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <motion.div 
        className="flex items-center gap-6 mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 via-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">الأمان والحساب</h2>
          <p className="text-base text-slate-600 mt-2">إدارة كلمة المرور وإعدادات الأمان لحماية حسابك</p>
        </div>
      </motion.div>

      <motion.div 
        className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <Key className="w-4 h-4 text-white" />
          </div>
          تغيير كلمة المرور
        </div>

        {/* Security Notice */}
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm">⚠️</span>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 mb-2">نصائح الأمان</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز</li>
                <li>• يجب أن تكون كلمة المرور 8 أحرف على الأقل</li>
                <li>• لا تشارك كلمة المرور مع أي شخص آخر</li>
                <li>• غيّر كلمة المرور بانتظام لضمان الأمان</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-base font-semibold text-slate-700">كلمة المرور الحالية</label>
              <div className="relative">
                <input 
                  type="password"
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-300 text-lg placeholder-slate-400 bg-gradient-to-r from-red-50 to-pink-50" 
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange('currentPassword')}
                  placeholder="أدخل كلمة المرور الحالية"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-base font-semibold text-slate-700">كلمة المرور الجديدة</label>
              <div className="relative">
                <input 
                  type="password"
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300 text-lg placeholder-slate-400 bg-gradient-to-r from-green-50 to-emerald-50" 
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange('newPassword')}
                  placeholder="أدخل كلمة المرور الجديدة"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Key className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-base font-semibold text-slate-700">تأكيد كلمة المرور</label>
              <div className="relative">
                <input 
                  type="password"
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg placeholder-slate-400 bg-gradient-to-r from-blue-50 to-indigo-50" 
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange('confirmPassword')}
                  placeholder="أعد إدخال كلمة المرور الجديدة"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Key className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="flex justify-end pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button 
              type="button"
              onClick={onChangePassword}
              disabled={passwordLoading}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center gap-3"
              whileHover={{ scale: passwordLoading ? 1 : 1.05 }}
              whileTap={{ scale: passwordLoading ? 1 : 0.95 }}
            >
              {passwordLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري التغيير...
                </>
              ) : (
                <>
                  🔐 تغيير كلمة المرور
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default SecuritySection
