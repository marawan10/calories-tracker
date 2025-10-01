import React, { useMemo, useState } from 'react'
import { Calculator, Target, TrendingUp, Activity, Heart, Scale, User, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

function classifyBMI(bmi, age) {
  // General WHO categories; can be refined by age
  if (!bmi) return { label: 'غير محدد', color: 'text-slate-500' }
  if (bmi < 18.5) return { label: 'نحافة', color: 'text-sky-600' }
  if (bmi < 25) return { label: 'وزن طبيعي', color: 'text-emerald-600' }
  if (bmi < 30) return { label: 'زيادة وزن', color: 'text-amber-600' }
  return { label: 'سمنة', color: 'text-rose-600' }
}

function estimateDailyCalories({ age, gender, heightCm, weightKg, activity = 'moderate' }) {
  if (!age || !gender || !heightCm || !weightKg) return null
  // Mifflin-St Jeor
  const s = gender === 'male' ? 5 : -161
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s
  const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
  return Math.round(bmr * (activityMultipliers[activity] || 1.55))
}

export default function BMI() {
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', activity: 'moderate' })
  const { user } = useAuth()

  const heightM = useMemo(() => (form.height ? Number(form.height) / 100 : 0), [form.height])
  const weightKg = useMemo(() => (form.weight ? Number(form.weight) : 0), [form.weight])
  const bmi = useMemo(() => (heightM > 0 ? weightKg / (heightM * heightM) : 0), [heightM, weightKg])
  const bmiClass = useMemo(() => classifyBMI(bmi, Number(form.age)), [bmi, form.age])
  const dailyCalories = useMemo(() => estimateDailyCalories({
    age: Number(form.age), gender: form.gender, heightCm: Number(form.height), weightKg, activity: form.activity
  }), [form, weightKg])


  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">حاسبة مؤشر كتلة الجسم</h1>
            <p className="text-slate-500 mt-1">احسب مؤشر كتلة جسمك والسعرات اليومية المطلوبة</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200">
          <Heart className="w-4 h-4" />
          <span className="font-medium">صحة وعافية</span>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <motion.div 
          className="card p-6 space-y-6 xl:col-span-2 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="label">الطول (سم)</label>
              <input 
                className="input" 
                type="number" 
                min="100" 
                max="250" 
                value={form.height} 
                onChange={e => setForm({ ...form, height: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">الوزن (كجم)</label>
              <input 
                className="input" 
                type="number" 
                min="30" 
                max="300" 
                step="0.1" 
                value={form.weight} 
                onChange={e => setForm({ ...form, weight: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">العمر</label>
              <input 
                className="input" 
                type="number" 
                min="10" 
                max="120" 
                value={form.age} 
                onChange={e => setForm({ ...form, age: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">النوع</label>
              <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div>
              <label className="label">النشاط</label>
              <select className="input" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })}>
                <option value="sedentary">خامل</option>
                <option value="light">نشاط خفيف</option>
                <option value="moderate">نشاط متوسط</option>
                <option value="active">نشاط عالي</option>
                <option value="very_active">نشاط عالي جداً</option>
              </select>
            </div>
          </div>
          {/* Enhanced Results Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div 
              className="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm text-slate-600 font-medium">مؤشر كتلة الجسم</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bmi ? (bmi < 18.5 ? 'bg-sky-100 text-sky-700' : 
                        bmi < 25 ? 'bg-emerald-100 text-emerald-700' : 
                        bmi < 30 ? 'bg-amber-100 text-amber-700' : 
                        'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-500'
                }`}>
                  {bmiClass.label}
                </div>
              </div>
              <div className={`text-4xl font-extrabold ${bmiClass.color} mb-2`}>
                {bmi ? bmi.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-slate-500">
                {bmi ? 'مؤشر صحي لتقييم الوزن' : 'أدخل البيانات لحساب المؤشر'}
              </div>
            </motion.div>
            
            <motion.div 
              className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Scale className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm text-slate-600 font-medium">الوزن الحالي</div>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
              <div className="text-4xl font-extrabold text-emerald-700 mb-2">
                {weightKg || '-'} 
                {weightKg && <span className="text-lg text-emerald-600 ml-1">كجم</span>}
              </div>
              <div className="text-xs text-slate-500">
                {weightKg ? 'الوزن المُدخل للحساب' : 'أدخل وزنك بالكيلوجرام'}
              </div>
            </motion.div>
            
            <motion.div 
              className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.02, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm text-slate-600 font-medium">السعرات اليومية</div>
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                  TDEE
                </div>
              </div>
              <div className="text-4xl font-extrabold text-amber-700 mb-2">
                {dailyCalories || '-'}
                {dailyCalories && <span className="text-lg text-amber-600 ml-1">كالوري</span>}
              </div>
              <div className="text-xs text-slate-500">
                {dailyCalories ? 'السعرات المطلوبة يومياً للحفاظ على الوزن' : 'أكمل البيانات لحساب السعرات'}
              </div>
            </motion.div>
          </div>

          {/* Additional Health Insights */}
          {bmi > 0 && dailyCalories > 0 && (
            <motion.div 
              className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-blue-800">نصائح صحية مخصصة</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">توصيات الوزن:</h4>
                  <p className="text-sm text-blue-600">
                    {bmi < 18.5 ? 'يُنصح بزيادة الوزن تدريجياً مع التركيز على البروتين والتمارين' :
                     bmi < 25 ? 'وزنك في المعدل الطبيعي، حافظ على نمط حياة صحي' :
                     bmi < 30 ? 'يُنصح بفقدان الوزن تدريجياً مع نظام غذائي متوازن' :
                     'استشر طبيباً مختصاً لوضع خطة آمنة لفقدان الوزن'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-700">توصيات التغذية:</h4>
                  <p className="text-sm text-blue-600">
                    للحفاظ على الوزن: {dailyCalories} كالوري يومياً<br/>
                    لفقدان الوزن: {Math.round(dailyCalories * 0.8)} كالوري يومياً<br/>
                    لزيادة الوزن: {Math.round(dailyCalories * 1.2)} كالوري يومياً
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          
        </motion.div>
        
        <motion.div 
          className="card p-6 space-y-4 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-white" />
            </div>
            <div className="font-bold text-lg text-slate-800">دليل مؤشر كتلة الجسم</div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="text-slate-700">أقل من 18.5</span>
              <span className="text-sky-600 font-semibold">نحافة</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <span className="text-slate-700">18.5 - 24.9</span>
              <span className="text-emerald-600 font-semibold">وزن طبيعي</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-slate-700">25.0 - 29.9</span>
              <span className="text-amber-600 font-semibold">زيادة وزن</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-200">
              <span className="text-slate-700">30.0 فأكثر</span>
              <span className="text-rose-600 font-semibold">سمنة</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">ملاحظة مهمة</div>
                <div className="text-xs text-blue-700">
                  مؤشر كتلة الجسم لا يعكس التكوين الجسدي (العضلات مقابل الدهون) وقد يختلف حسب العمر والجنس .
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
