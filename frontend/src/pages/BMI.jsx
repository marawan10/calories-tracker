import React, { useMemo, useState } from 'react'
import { Calculator, Target, TrendingUp, Save } from 'lucide-react'
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
  const { updateGoals, user } = useAuth()

  const heightM = useMemo(() => (form.height ? Number(form.height) / 100 : 0), [form.height])
  const weightKg = useMemo(() => (form.weight ? Number(form.weight) : 0), [form.weight])
  const bmi = useMemo(() => (heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 0), [heightM, weightKg])
  const bmiClass = useMemo(() => classifyBMI(bmi, Number(form.age)), [bmi, form.age])
  const dailyCalories = useMemo(() => estimateDailyCalories({
    age: Number(form.age), gender: form.gender, heightCm: Number(form.height), weightKg, activity: form.activity
  }), [form, weightKg])

  const saveRecommended = async () => {
    if (!dailyCalories) return
    // Macro split: 25% protein, 45% carbs, 30% fat
    const protein = Math.round((dailyCalories * 0.25) / 4)
    const carbs = Math.round((dailyCalories * 0.45) / 4)
    const fat = Math.round((dailyCalories * 0.30) / 9)
    await updateGoals({ calories: dailyCalories, protein, carbs, fat })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="w-6 h-6 text-primary-500" />
        <h1 className="text-2xl font-bold gradient-text">حاسبة مؤشر كتلة الجسم (BMI)</h1>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <div className="card p-4 sm:p-6 space-y-4 xl:col-span-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-100">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary-600" />
                <div className="text-sm text-slate-600 font-medium">BMI</div>
              </div>
              <div className={`text-3xl font-extrabold ${bmiClass.color} mb-1`}>
                {bmi ? bmi.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-slate-500">{bmiClass.label}</div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <div className="text-sm text-slate-600 font-medium">الوزن</div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 mb-1">
                {weightKg || '-'} كجم
              </div>
              <div className="text-xs text-slate-500">بالاعتماد على القيم المُدخلة</div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                <div className="text-sm text-slate-600 font-medium">السعرات المقترحة</div>
              </div>
              <div className="text-3xl font-extrabold text-amber-700 mb-1">
                {dailyCalories || '-'} كالوري
              </div>
              <div className="text-xs text-slate-500">بناءً على معادلة Mifflin-St Jeor</div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button 
              disabled={!dailyCalories} 
              onClick={saveRecommended} 
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              حفظ كأهداف يومية
            </button>
          </div>
        </div>
        <div className="card p-4 sm:p-6 space-y-3">
          <div className="font-bold text-lg">دليل مبسّط لتصنيف BMI</div>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>أقل من 18.5: نحافة</li>
            <li>18.5 إلى 24.9: وزن طبيعي</li>
            <li>25 إلى 29.9: زيادة وزن</li>
            <li>30 فأكثر: سمنة</li>
          </ul>
          <div className="text-xs text-slate-500">ملحوظة: لا يعكس BMI التكوين الجسدي (العضلات مقابل الدهون) وقد يختلف حسب العمر والجنس.</div>
        </div>
      </div>
    </div>
  )
}
