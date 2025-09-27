import React from 'react'
import { motion } from 'framer-motion'
import { Target, Calculator } from 'lucide-react'

const GoalsSection = ({ 
  form, 
  onFormChange, 
  onCaloriesChange,
  onAutoCalculateNow,
  onSaveGoals,
  loading 
}) => {
  // Simple input handlers
  const handleInputChange = (field) => (e) => {
    onFormChange(field, e.target.value)
  }

  const handleCaloriesInputChange = (e) => {
    onCaloriesChange(e.target.value)
  }
  return (
    <div className="w-full max-w-full overflow-hidden">
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
          <Target className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">الأهداف والتغذية</h2>
          <p className="text-base text-slate-600 mt-2">تحديد الأهداف اليومية وحساب الماكروز التلقائي للوصول لأهدافك</p>
        </div>
      </motion.div>

      {/* Daily Nutrition Goals Section */}
      <motion.div 
        className="bg-white rounded-2xl p-8 shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">الأهداف اليومية</h2>
              <p className="text-sm text-slate-500">حدد احتياجاتك اليومية من العناصر الغذائية</p>
            </div>
          </div>
          
          {/* Auto-calculation controls */}
          <div>
            <motion.button
              onClick={onAutoCalculateNow}
              disabled={!form.dailyCalories}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              whileHover={{ scale: form.dailyCalories ? 1.05 : 1 }}
              whileTap={{ scale: form.dailyCalories ? 0.95 : 1 }}
            >
              <Calculator className="w-5 h-5" />
              احسب الماكروز تلقائياً
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Daily Calories */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
              السعرات اليومية
            </label>
            <div className="relative">
              <input 
                className="w-full px-4 py-4 pr-20 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 text-lg font-semibold placeholder-slate-400 bg-gradient-to-r from-blue-50 to-indigo-50 text-left" 
                type="number" 
                placeholder="2000"
                value={form.dailyCalories} 
                onChange={handleCaloriesInputChange}
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 text-sm font-medium pointer-events-none">كالوري</div>
            </div>
            <div className="text-sm text-slate-500 bg-blue-50 px-3 py-2 rounded-lg">📊 الطاقة الإجمالية يومياً</div>
          </motion.div>

          {/* Daily Protein */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
              <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"></div>
              البروتين اليومي
            </label>
            <div className="relative">
              <input 
                className="w-full px-4 py-4 pr-20 border-2 rounded-xl focus:ring-4 transition-all duration-300 text-lg font-semibold placeholder-slate-400 text-left bg-gradient-to-r from-red-50 to-pink-50 border-slate-200 focus:border-red-500 focus:ring-red-100"
                type="number"
                placeholder="150"
                value={form.dailyProtein} 
                onChange={handleInputChange('dailyProtein')} 
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 text-sm font-medium pointer-events-none">جرام</div>
            </div>
            <div className="text-sm text-slate-500 bg-red-50 px-3 py-2 rounded-lg">🥩 بناء العضلات (25% من السعرات)</div>
          </motion.div>

          {/* Daily Carbs */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
              <div className="w-4 h-4 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-full shadow-sm"></div>
              الكربوهيدرات اليومية
            </label>
            <div className="relative">
              <input 
                className="w-full px-4 py-4 pr-20 border-2 rounded-xl focus:ring-4 transition-all duration-300 text-lg font-semibold placeholder-slate-400 text-left bg-gradient-to-r from-indigo-50 to-blue-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                type="number"
                placeholder="250"
                value={form.dailyCarbs} 
                onChange={handleInputChange('dailyCarbs')} 
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-500 text-sm font-medium pointer-events-none">جرام</div>
            </div>
            <div className="text-sm text-slate-500 bg-indigo-50 px-3 py-2 rounded-lg">🍞 مصدر الطاقة (45% من السعرات)</div>
          </motion.div>

          {/* Daily Fat */}
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="flex items-center gap-3 text-base font-semibold text-slate-700">
              <div className="w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full shadow-sm"></div>
              الدهون اليومية
            </label>
            <div className="relative">
              <input 
                className="w-full px-4 py-4 pr-20 border-2 rounded-xl focus:ring-4 transition-all duration-300 text-lg font-semibold placeholder-slate-400 text-left bg-gradient-to-r from-emerald-50 to-green-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
                type="number"
                placeholder="65"
                value={form.dailyFat} 
                onChange={handleInputChange('dailyFat')} 
                dir="ltr"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-500 text-sm font-medium pointer-events-none">جرام</div>
            </div>
            <div className="text-sm text-slate-500 bg-emerald-50 px-3 py-2 rounded-lg">🥑 الدهون الصحية (30% من السعرات)</div>
          </motion.div>
        </div>

        {/* Nutrition Goals Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5">💡</div>
              <div className="text-sm">
                <div className="font-medium text-blue-800 mb-1">نصائح للأهداف اليومية</div>
                <div className="text-blue-700 space-y-1">
                  <div>• <strong>السعرات:</strong> تعتمد على هدفك (خسارة/زيادة/ثبات الوزن)</div>
                  <div>• <strong>البروتين:</strong> عادة 1.6-2.2 جم لكل كيلو من وزن الجسم</div>
                  <div>• <strong>الكربوهيدرات:</strong> 45-65% من إجمالي السعرات</div>
                  <div>• <strong>الدهون:</strong> 20-35% من إجمالي السعرات</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Calculator className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-green-800 mb-1">الحساب التلقائي للماكروز</div>
                <div className="text-green-700 space-y-1">
                  <div>• <strong>البروتين:</strong> 25% من السعرات (4 كالوري/جم)</div>
                  <div>• <strong>الكربوهيدرات:</strong> 45% من السعرات (4 كالوري/جم)</div>
                  <div>• <strong>الدهون:</strong> 30% من السعرات (9 كالوري/جم)</div>
                  <div className="text-xs mt-2 text-green-600">فعّل الحساب التلقائي لحساب الماكروز تلقائياً عند تغيير السعرات</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Goals Button */}
        <motion.div 
          className="mt-8 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button 
            onClick={onSaveGoals}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:shadow-md transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center gap-3"
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
                🎯 حفظ الأهداف اليومية
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default GoalsSection
