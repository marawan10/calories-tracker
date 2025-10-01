import React from 'react'
import { motion } from 'framer-motion'
import { Crown, Shield, User, Settings, Database, Download, Lock, Key, Upload } from 'lucide-react'

const AdminProfile = ({ 
  user,
  form,
  onFormChange,
  onSubmit,
  onPickAvatar,
  loading,
  passwordForm,
  onPasswordFormChange,
  onChangePassword,
  passwordLoading,
  onExportFoodsData,
  exportingFoods
}) => {
  // Simple input handlers
  const handleInputChange = (field) => (e) => {
    onFormChange(field, e.target.value)
  }

  const handlePasswordInputChange = (field) => (e) => {
    onPasswordFormChange(field, e.target.value)
  }
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: .3 }} 
      className="space-y-8"
    >
      {/* Enhanced Admin Header */}
      <motion.div 
        className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 rounded-3xl p-8 shadow-2xl text-white relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">لوحة تحكم المدير</h1>
              <p className="text-purple-100 text-lg">مرحباً {user?.name} - إدارة شاملة للنظام</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl border border-white border-opacity-30">
              <Shield className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">صلاحيات كاملة</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl border border-white border-opacity-30">
              <User className="w-5 h-5 text-green-300" />
              <span className="font-semibold">مدير النظام</span>
            </div>
          </div>
        </div>
      </motion.div>

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Admin Info */}
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">المعلومات الأساسية</h3>
                <p className="text-sm text-slate-500">إدارة البيانات الشخصية للمدير</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="text-base font-semibold text-slate-700 mb-4">الصورة الشخصية</div>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    {form.avatar ? (
                      <img src={form.avatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                        {form.name?.[0]?.toUpperCase?.() || 'م'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-300 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <Upload className="w-5 h-5" />
                      تغيير صورة المدير
                      <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                    </label>
                    <p className="text-sm text-slate-500 mt-2 text-center">PNG, JPG أو GIF (الحد الأقصى 5MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-3">اسم المدير</label>
                <input 
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 text-lg placeholder-slate-400" 
                  value={form.name} 
                  onChange={handleInputChange('name')} 
                  placeholder="أدخل اسم المدير"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 mb-3">البريد الإلكتروني</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl bg-slate-50 cursor-not-allowed text-lg text-slate-500" 
                    value={user?.email || ''} 
                    disabled
                    placeholder="البريد الإلكتروني"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                  <Shield className="w-4 h-4" />
                  لا يمكن تغيير البريد الإلكتروني لأسباب أمنية
                </div>
              </div>
            </div>
          </motion.div>

        {/* Admin Settings */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">إعدادات الحساب</h3>
              <p className="text-sm text-slate-500">صلاحيات ومعلومات المدير</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-purple-800">صلاحيات المدير الكاملة</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 text-purple-700">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">إدارة جميع المستخدمين</span>
                </div>
                <div className="flex items-center gap-3 text-purple-700">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm">إدارة قاعدة بيانات الأطعمة</span>
                </div>
                <div className="flex items-center gap-3 text-purple-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">الوصول إلى إعدادات النظام</span>
                </div>
                <div className="flex items-center gap-3 text-purple-700">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-sm">عرض إحصائيات الاستخدام</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-2xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-blue-800">معلومات الحساب</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-blue-600 font-medium">تاريخ الإنشاء</div>
                  <div className="text-blue-800 font-semibold">{new Date(user?.createdAt).toLocaleDateString('ar-EG')}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-blue-600 font-medium">آخر تسجيل دخول</div>
                  <div className="text-blue-800 font-semibold">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ar-EG') : 'غير متوفر'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-blue-600 font-medium">نوع الحساب</div>
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-blue-800 font-semibold">مدير النظام</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-blue-600 font-medium">حالة الحساب</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-semibold">نشط</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl p-6 border-2 border-amber-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-amber-800">تنبيهات الأمان</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">⚠️</span>
                  </div>
                  <div className="text-sm text-amber-700 leading-relaxed">
                    <strong>مهم:</strong> كمدير للنظام، تأكد من استخدام كلمة مرور قوية وعدم مشاركة بيانات الدخول مع أي شخص آخر.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">🔒</span>
                  </div>
                  <div className="text-sm text-amber-700 leading-relaxed">
                    قم بتغيير كلمة المرور بانتظام ومراجعة سجلات النشاط للتأكد من عدم وجود نشاط مشبوه.
                  </div>
                </div>
              </div>
            </div>

            {/* Export Foods Section */}
            <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-emerald-800">إدارة قاعدة البيانات</span>
              </div>
              <div className="text-sm text-emerald-700 mb-6 leading-relaxed">
                تصدير جميع الأطعمة في قاعدة البيانات كملف JSON شامل للنسخ الاحتياطي أو النقل إلى خادم آخر.
              </div>
              <motion.button
                onClick={onExportFoodsData}
                disabled={exportingFoods}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-3"
                whileHover={{ scale: exportingFoods ? 1 : 1.05 }}
                whileTap={{ scale: exportingFoods ? 1 : 0.95 }}
              >
                {exportingFoods ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري تصدير قاعدة البيانات...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    🗄️ تصدير قاعدة بيانات الأطعمة
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        </div>
        
        {/* Submit Button */}
        <motion.div 
          className="mt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button 
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center gap-3"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري حفظ بيانات المدير...
              </>
            ) : (
              <>
                👑 حفظ معلومات المدير
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Admin Password Change Section */}
      <motion.div 
        className="card p-6 space-y-6 hover:shadow-lg transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Key className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">تغيير كلمة المرور</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">كلمة المرور الحالية</label>
            <input 
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-colors" 
              value={passwordForm.currentPassword}
              onChange={handlePasswordInputChange('currentPassword')}
              placeholder="أدخل كلمة المرور الحالية"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">كلمة المرور الجديدة</label>
            <input 
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-colors" 
              value={passwordForm.newPassword}
              onChange={handlePasswordInputChange('newPassword')}
              placeholder="أدخل كلمة المرور الجديدة"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">تأكيد كلمة المرور</label>
            <input 
              type="password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-colors" 
              value={passwordForm.confirmPassword}
              onChange={handlePasswordInputChange('confirmPassword')}
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <motion.button 
            type="button"
            disabled={passwordLoading}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            onClick={onChangePassword}
            whileHover={{ scale: passwordLoading ? 1 : 1.02 }}
            whileTap={{ scale: passwordLoading ? 1 : 0.98 }}
          >
            <Key className="w-4 h-4" />
            {passwordLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </motion.button>
        </div>
      </motion.div>

    </motion.div>
  )
}

export default AdminProfile
