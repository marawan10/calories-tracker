import React from 'react'
import { motion } from 'framer-motion'
import { UserCircle, User, Target, Calculator, Upload } from 'lucide-react'
import { activityOptions, goalOptions } from './constants'
import { calculateBMI, getBMICategory, calculateBMR, calculateTDEE } from './utils'

const PersonalInfoSection = ({ 
  form, 
  onFormChange, 
  onSubmit, 
  onPickAvatar, 
  loading 
}) => {
  // Simple calculations without memoization
  const hasBodyData = form.age && form.gender && form.height && form.weight
  const bmi = calculateBMI(form.height, form.weight)
  const bmiCategory = getBMICategory(bmi)
  const bmr = calculateBMR(form.age, form.gender, form.height, form.weight)
  const tdee = calculateTDEE(bmr, form.activityLevel)

  // Simple input handlers
  const handleInputChange = (field) => (e) => {
    onFormChange(field, e.target.value)
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
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
          <UserCircle className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">المعلومات الشخصية</h2>
          <p className="text-base text-slate-600 mt-2">تحديث البيانات الأساسية والصورة الشخصية للحصول على تجربة مخصصة</p>
        </div>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Profile Picture and Name */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-6">
            <div className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              الصورة الشخصية والاسم
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                {form.avatar ? (
                  <img src={form.avatar} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-all duration-300" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white flex items-center justify-center font-bold text-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    {form.name?.[0]?.toUpperCase?.() || 'م'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all duration-300 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
              <div className="flex-1 w-full">
                <label className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Upload className="w-5 h-5" />
                  تغيير الصورة الشخصية
                  <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
                </label>
                <p className="text-sm text-slate-500 mt-2 text-center">PNG, JPG أو GIF (الحد الأقصى 5MB)</p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-base font-semibold text-slate-700 mb-3">الاسم الكامل</label>
            <input 
              className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg placeholder-slate-400" 
              value={form.name} 
              onChange={handleInputChange('name')} 
              placeholder="أدخل اسمك الكامل"
            />
          </div>
        </motion.div>

        {/* Body Information */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <User className="w-3 h-3 text-white" />
            </div>
            بيانات الجسم
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">العمر</label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-lg placeholder-slate-400" 
                  type="number" 
                  min="10" 
                  max="120" 
                  value={form.age} 
                  onChange={handleInputChange('age')} 
                  placeholder="25"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">سنة</div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">النوع</label>
              <select className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-lg bg-white" value={form.gender} onChange={handleInputChange('gender')}>
                <option value="">اختر النوع</option>
                <option value="male">👨 ذكر</option>
                <option value="female">👩 أنثى</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">الطول</label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-lg placeholder-slate-400" 
                  type="number" 
                  step="0.1" 
                  min="100" 
                  max="250" 
                  value={form.height} 
                  onChange={handleInputChange('height')} 
                  placeholder="170"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">سم</div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">الوزن</label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-lg placeholder-slate-400" 
                  type="number" 
                  step="0.1" 
                  min="30" 
                  max="300" 
                  value={form.weight} 
                  onChange={handleInputChange('weight')} 
                  placeholder="70"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">كجم</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity and Goals */}
        <motion.div 
          className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            النشاط والأهداف
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">مستوى النشاط اليومي</label>
              <select className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-lg bg-white" value={form.activityLevel} onChange={handleInputChange('activityLevel')}>
                {activityOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
              <p className="text-sm text-slate-500">اختر مستوى نشاطك اليومي لحساب احتياجاتك من السعرات</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-base font-semibold text-slate-700">هدفك من التطبيق</label>
              <select className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300 text-lg bg-white" value={form.goal} onChange={handleInputChange('goal')}>
                {goalOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              <p className="text-sm text-slate-500">حدد هدفك لنساعدك في وضع خطة غذائية مناسبة</p>
            </div>
          </div>
        </motion.div>

        {/* Health Calculations */}
        {hasBodyData && (
          <motion.div 
            className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <div className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Calculator className="w-3 h-3 text-white" />
              </div>
              الحسابات الصحية
              <div className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">محسوبة تلقائياً</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* BMI */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">مؤشر كتلة الجسم</span>
                  <div className="text-xs text-slate-400">BMI</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-slate-800">{bmi}</span>
                  {bmiCategory && (
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${bmiCategory.bg} ${bmiCategory.color}`}>
                      {bmiCategory.text}
                    </span>
                  )}
                </div>
              </div>
              
              {/* BMR */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">معدل الأيض الأساسي</span>
                  <div className="text-xs text-slate-400">BMR</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-800">{bmr}</span>
                  <span className="text-sm text-slate-500">كالوري/يوم</span>
                </div>
              </div>
              
              {/* TDEE */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">إجمالي الطاقة اليومية</span>
                  <div className="text-xs text-slate-400">TDEE</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-800">{tdee}</span>
                  <span className="text-sm text-slate-500">كالوري/يوم</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-xl border border-purple-200">
              <p className="text-sm text-slate-600 text-center">
                💡 هذه الحسابات تساعدك في فهم احتياجاتك الغذائية وتحديد أهدافك بدقة أكبر
              </p>
            </div>
          </motion.div>
        )}

        <motion.div 
          className="flex justify-end pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.button 
            type="submit" 
            disabled={loading} 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center gap-3"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                💾 حفظ التغييرات
              </>
            )}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  )
}

export default PersonalInfoSection
