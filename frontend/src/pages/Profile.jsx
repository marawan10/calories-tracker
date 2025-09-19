import React, { useMemo, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Download, Upload, Database, Shield } from 'lucide-react'
import api from '../lib/api'

const activityOptions = [
  { value: 'sedentary', label: 'خامل' },
  { value: 'light', label: 'نشاط خفيف' },
  { value: 'moderate', label: 'نشاط متوسط' },
  { value: 'active', label: 'نشاط عالي' },
  { value: 'very_active', label: 'نشاط عالي جداً' },
]

const goalOptions = [
  { value: 'lose_weight', label: 'خسارة وزن' },
  { value: 'maintain_weight', label: 'ثبات الوزن' },
  { value: 'gain_weight', label: 'زيادة وزن' },
]

export default function Profile() {
  const { user, updateProfile, updateGoals, loading } = useAuth()
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 65 })
  const [form, setForm] = useState(() => ({
    name: user?.name || '',
    avatar: user?.avatar || '',
    age: user?.profile?.age || '',
    gender: user?.profile?.gender || '',
    height: user?.profile?.height || '',
    weight: user?.profile?.weight || '',
    activityLevel: user?.profile?.activityLevel || 'moderate',
    goal: user?.profile?.goal || 'maintain_weight',
    // Daily goals
    dailyCalories: user?.dailyGoals?.calories || '',
    dailyProtein: user?.dailyGoals?.protein || '',
    dailyCarbs: user?.dailyGoals?.carbs || '',
    dailyFat: user?.dailyGoals?.fat || '',
  }))

  // Update form and goals when user data changes
  React.useEffect(() => {
    if (user) {
      setGoals(user?.dailyGoals || { calories: 2000, protein: 150, carbs: 250, fat: 65 })
      setForm({
        name: user?.name || '',
        avatar: user?.avatar || '',
        age: user?.profile?.age || '',
        gender: user?.profile?.gender || '',
        height: user?.profile?.height || '',
        weight: user?.profile?.weight || '',
        activityLevel: user?.profile?.activityLevel || 'moderate',
        goal: user?.profile?.goal || 'maintain_weight',
        // Daily goals
        dailyCalories: user?.dailyGoals?.calories || '',
        dailyProtein: user?.dailyGoals?.protein || '',
        dailyCarbs: user?.dailyGoals?.carbs || '',
        dailyFat: user?.dailyGoals?.fat || '',
      })
    }
  }, [user])
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef(null)

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('الرجاء اختيار صورة')
    const reader = new FileReader()
    reader.onload = () => setForm(f => ({ ...f, avatar: reader.result }))
    reader.readAsDataURL(file)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      avatar: form.avatar,
      age: form.age ? Number(form.age) : undefined,
      gender: form.gender || undefined,
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      activityLevel: form.activityLevel,
      goal: form.goal,
    }
    await updateProfile(payload)
  }

  const saveGoals = async () => {
    const goalsPayload = {
      calories: form.dailyCalories ? Number(form.dailyCalories) : undefined,
      protein: form.dailyProtein ? Number(form.dailyProtein) : undefined,
      carbs: form.dailyCarbs ? Number(form.dailyCarbs) : undefined,
      fat: form.dailyFat ? Number(form.dailyFat) : undefined,
    }
    await updateGoals(goalsPayload)
  }

  const hasBodyData = useMemo(() => form.age && form.gender && form.height && form.weight, [form])

  // Calculate BMI
  const bmi = useMemo(() => {
    if (!form.height || !form.weight) return null
    const heightInMeters = Number(form.height) / 100
    const weightInKg = Number(form.weight)
    return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1)
  }, [form.height, form.weight])

  // Get BMI category
  const bmiCategory = useMemo(() => {
    if (!bmi) return null
    const bmiValue = Number(bmi)
    if (bmiValue < 18.5) return { text: 'نقص في الوزن', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (bmiValue < 25) return { text: 'وزن طبيعي', color: 'text-green-600', bg: 'bg-green-50' }
    if (bmiValue < 30) return { text: 'زيادة في الوزن', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { text: 'سمنة', color: 'text-red-600', bg: 'bg-red-50' }
  }, [bmi])

  // Calculate BMR (Basal Metabolic Rate)
  const bmr = useMemo(() => {
    if (!form.age || !form.gender || !form.height || !form.weight) return null
    
    const age = Number(form.age)
    const height = Number(form.height)
    const weight = Number(form.weight)
    
    // Mifflin-St Jeor Equation
    if (form.gender === 'male') {
      return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5)
    } else {
      return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161)
    }
  }, [form.age, form.gender, form.height, form.weight])

  // Calculate TDEE (Total Daily Energy Expenditure)
  const tdee = useMemo(() => {
    if (!bmr || !form.activityLevel) return null
    
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }
    
    return Math.round(bmr * activityMultipliers[form.activityLevel])
  }, [bmr, form.activityLevel])

  // Export user data
  const exportUserData = async () => {
    try {
      setExporting(true)
      
      // Fetch all user data
      const [profileRes, mealsRes, goalsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/meals'),
        api.get('/auth/me') // Goals are in profile
      ])

      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        user: {
          profile: profileRes.data.user,
          meals: mealsRes.data.meals || [],
          totalMeals: mealsRes.data.total || 0
        }
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `calories-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('تم تصدير البيانات بنجاح')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('فشل في تصدير البيانات')
    } finally {
      setExporting(false)
    }
  }

  // Import user data
  const importUserData = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast.error('يرجى اختيار ملف JSON صحيح')
      return
    }

    try {
      setImporting(true)
      
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result)
          
          // Log the complete import data structure for debugging
          console.log('Backup file structure:', {
            hasUser: !!importData.user,
            hasVersion: !!importData.version,
            exportDate: importData.exportDate,
            mealsCount: importData.user?.meals?.length || 0,
            fullStructure: importData
          })
          
          // Validate import data structure
          if (!importData.user || !importData.version) {
            throw new Error('ملف غير صالح - تأكد من أنه ملف نسخ احتياطي صحيح')
          }
          
          // Check if meals exist and are valid
          if (!importData.user.meals) {
            throw new Error('لا توجد وجبات في الملف المحدد')
          }
          
          if (!Array.isArray(importData.user.meals)) {
            throw new Error('تنسيق الوجبات غير صحيح في الملف')
          }

          // Confirm import
          const confirmed = confirm(
            `هل تريد استيراد البيانات؟\n\n` +
            `تاريخ النسخة: ${new Date(importData.exportDate).toLocaleDateString('ar-EG')}\n` +
            `عدد الوجبات: ${importData.user.meals?.length || 0}\n\n` +
            `تحذير: سيتم حذف جميع بياناتك الحالية واستبدالها بالبيانات المستوردة!`
          )

          if (!confirmed) return

          let deletedCount = 0
          let importedCount = 0

          // Step 1: Delete all existing meals (optional - user choice)
          const deleteExisting = confirm(
            'هل تريد حذف الوجبات الموجودة أولاً؟\n\n' +
            'نعم = حذف الوجبات الموجودة ثم استيراد النسخة الاحتياطية\n' +
            'لا = إضافة الوجبات من النسخة الاحتياطية للوجبات الموجودة'
          )

          if (deleteExisting) {
            try {
              const { data: existingMeals } = await api.get('/meals')
              if (existingMeals.meals && existingMeals.meals.length > 0) {
                for (const meal of existingMeals.meals) {
                  try {
                    await api.delete(`/meals/${meal._id}`)
                    deletedCount++
                  } catch (error) {
                    console.error('Failed to delete existing meal:', meal._id, error)
                  }
                }
                if (deletedCount > 0) {
                  toast.success(`تم حذف ${deletedCount} وجبة موجودة`)
                }
              }
            } catch (error) {
              console.error('Error deleting existing meals:', error)
              toast.error('فشل في حذف الوجبات الموجودة')
            }
          }

          // Step 2: Import new meals
          if (importData.user.meals && importData.user.meals.length > 0) {
            let successCount = 0
            let errorCount = 0

            for (const meal of importData.user.meals) {
              try {
                // Log the original meal structure for debugging
                console.log('Original meal structure:', meal)
                
                // Remove database-specific fields and prepare meal data
                const { _id, __v, createdAt, updatedAt, user, totals, ...rawMealData } = meal
                
                // Handle different field names between export and import
                const mealData = {
                  mealType: meal.mealType,  // Backend expects mealType
                  date: meal.date,
                  items: meal.items || [],  // Backend expects items
                  notes: meal.notes || ''
                }
                
                console.log('Processed meal data:', mealData)
                
                // Ensure required fields exist
                if (!mealData.mealType || !mealData.date) {
                  console.error('Invalid meal data - missing mealType or date:', {
                    originalMeal: meal,
                    processedMeal: mealData
                  })
                  errorCount++
                  continue
                }

                // Validate items array
                if (!mealData.items || !Array.isArray(mealData.items)) {
                  console.error('Invalid meal data - items must be an array:', mealData)
                  errorCount++
                  continue
                }

                // Process items array to match API expectations
                mealData.items = mealData.items.map(item => {
                  // Handle different food item structures
                  if (item.food && typeof item.food === 'object') {
                    // If food is an object, extract the ID
                    return {
                      food: item.food._id || item.food.id,
                      weight: item.weight || 100
                    }
                  } else {
                    // If food is already an ID string
                    return {
                      food: item.food,
                      weight: item.weight || 100
                    }
                  }
                })

                // Log the complete meal data being imported for debugging
                console.log('Importing meal:', {
                  mealType: mealData.mealType,
                  date: mealData.date,
                  itemsCount: mealData.items?.length || 0,
                  fullMealData: mealData
                })

                // Try to import the meal
                const response = await api.post('/meals', mealData)
                console.log('Import success:', response.data)
                successCount++
                importedCount++
              } catch (error) {
                errorCount++
                console.error('Failed to import meal:', {
                  mealType: meal.type || meal.mealType,
                  mealDate: meal.date,
                  errorStatus: error.response?.status,
                  errorData: error.response?.data,
                  errorMessage: error.message,
                  validationErrors: error.response?.data?.errors,
                  fullError: error
                })
                
                // Show specific validation errors
                if (error.response?.data?.errors) {
                  console.error('Validation errors:', error.response.data.errors)
                  error.response.data.errors.forEach(validationError => {
                    console.error(`Validation error: ${validationError.path} - ${validationError.msg}`)
                  })
                }
                
                // Show specific error to user
                const mealType = meal.type || meal.mealType || 'unknown'
                toast.error(`فشل في استيراد وجبة ${mealType} - ${meal.date}: ${error.response?.data?.message || error.message}`)
              }
            }

            if (successCount > 0) {
              toast.success(`تم استيراد ${successCount} وجبة بنجاح${errorCount > 0 ? ` (${errorCount} فشل)` : ''}`)
            } else {
              toast.error(`فشل في استيراد الوجبات. تحقق من تنسيق الملف.`)
            }
          } else {
            toast.error('لا توجد وجبات في الملف المحدد')
          }

          // Update profile if needed
          if (importData.user.profile) {
            const { _id, __v, createdAt, updatedAt, email, ...profileData } = importData.user.profile
            if (profileData.profile) {
              try {
                await updateProfile(profileData.profile)
                toast.success('تم تحديث الملف الشخصي')
              } catch (error) {
                console.error('Failed to update profile:', error)
                toast.error('فشل في تحديث الملف الشخصي')
              }
            }
          }

          // Final summary
          const totalOperations = deletedCount + importedCount
          if (totalOperations > 0) {
            toast.success(
              `تمت العملية بنجاح!\n` +
              `${deletedCount > 0 ? `حذف: ${deletedCount} وجبة\n` : ''}` +
              `${importedCount > 0 ? `استيراد: ${importedCount} وجبة` : ''}`
            )
            
            // Refresh page data only if something was imported
            setTimeout(() => {
              window.location.reload()
            }, 2000)
          } else {
            toast.error('لم يتم تنفيذ أي عمليات. تحقق من الملف وحاول مرة أخرى.')
          }

        } catch (error) {
          console.error('Import parsing error:', error)
          toast.error(`خطأ في استيراد البيانات: ${error.message}`)
        } finally {
          setImporting(false)
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }

      reader.onerror = () => {
        toast.error('خطأ في قراءة الملف')
        setImporting(false)
      }

      reader.readAsText(file)
    } catch (error) {
      console.error('Import error:', error)
      toast.error('فشل في استيراد البيانات')
      setImporting(false)
    }
  }

  // Trigger file input
  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Test backup file structure (for debugging)
  const testBackupFile = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          console.log('=== BACKUP FILE ANALYSIS ===')
          console.log('File structure:', data)
          console.log('Has user?', !!data.user)
          console.log('Has version?', !!data.version)
          console.log('Meals count:', data.user?.meals?.length || 0)
          
          if (data.user?.meals) {
            console.log('First meal sample:', data.user.meals[0])
            data.user.meals.forEach((meal, index) => {
              console.log(`Meal ${index + 1}:`, {
                type: meal.type,
                date: meal.date,
                foodsCount: meal.foods?.length || 0,
                hasRequiredFields: !!(meal.type && meal.date && meal.foods)
              })
            })
          }
          
          alert(`تحليل الملف:\nعدد الوجبات: ${data.user?.meals?.length || 0}\nتحقق من Console للتفاصيل`)
        } catch (error) {
          console.error('File parsing error:', error)
          alert(`خطأ في قراءة الملف: ${error.message}`)
        }
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('File reading error:', error)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }} className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">الملف الشخصي</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">الصورة الشخصية</div>
            <div className="flex items-center gap-3">
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="size-20 rounded-full object-cover" />
              ) : (
                <div className="size-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold">
                  {form.name?.[0]?.toUpperCase?.() || 'م'}
                </div>
              )}
              <label className="btn-primary cursor-pointer">
                تغيير الصورة
                <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              </label>
            </div>
          </div>
          <div>
            <label className="label">الاسم</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <option value="">غير محدد</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">الطول (سم)</label>
              <input 
                className="input" 
                type="number" 
                step="0.1" 
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
                step="0.1" 
                min="30" 
                max="300" 
                value={form.weight} 
                onChange={e => setForm({ ...form, weight: e.target.value })} 
              />
            </div>
          </div>
        </div>
        <div className="card p-4 space-y-4">
          <div>
            <label className="label">مستوى النشاط</label>
            <select className="input" value={form.activityLevel} onChange={e => setForm({ ...form, activityLevel: e.target.value })}>
              {activityOptions.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">الهدف</label>
            <select className="input" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
              {goalOptions.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="text-xs text-slate-500">سيتم تحديث أهدافك اليومية تلقائياً عند توفر بيانات الجسم كاملة.</div>
        </div>
        <div className="card p-4 flex flex-col gap-3">
          <div className="text-sm text-slate-600">عند اكتمال البيانات (العمر، النوع، الطول، الوزن) سنقترح سعرات يومية ومقسّم الماكروز بناءً على هدفك.</div>
          
          {/* BMI and BMR Display */}
          {hasBodyData && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="text-sm font-medium text-slate-700">الحسابات الصحية</div>
              
              {/* BMI */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">مؤشر كتلة الجسم (BMI)</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{bmi}</span>
                  {bmiCategory && (
                    <span className={`text-xs px-2 py-1 rounded-full ${bmiCategory.bg} ${bmiCategory.color}`}>
                      {bmiCategory.text}
                    </span>
                  )}
                </div>
              </div>
              
              {/* BMR */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">معدل الأيض الأساسي (BMR)</span>
                <span className="font-bold text-slate-800">{bmr} كالوري/يوم</span>
              </div>
              
              {/* TDEE */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">إجمالي الطاقة اليومية (TDEE)</span>
                <span className="font-bold text-slate-800">{tdee} كالوري/يوم</span>
              </div>
              
              {/* Weight Loss Analysis */}
              {tdee && goals.calories && tdee !== goals.calories && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-2">تحليل فقدان الوزن</div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div>• الموصي به: {tdee} كالوري/يوم</div>
                    <div>• هدفك: {goals.calories} كالوري/يوم</div>
                    <div>• الفرق اليومي: {Math.abs(tdee - goals.calories)} كالوري</div>
                    <div>• الفرق الأسبوعي: {Math.abs((tdee - goals.calories) * 7)} كالوري</div>
                    <div className="font-medium">
                      • متوقع {tdee > goals.calories ? 'فقدان' : 'زيادة'}: {Math.abs(((tdee - goals.calories) * 7) / 7700).toFixed(2)} كجم/أسبوع
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-auto flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">حفظ التغييرات</button>
          </div>
        </div>
      </form>

      {/* Daily Nutrition Goals Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">🎯</span>
          </div>
          <h2 className="text-lg font-bold text-slate-800">الأهداف اليومية</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Calories */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              السعرات اليومية
            </label>
            <input 
              className="input" 
              type="number" 
              placeholder="2000"
              value={form.dailyCalories} 
              onChange={e => setForm({ ...form, dailyCalories: e.target.value })} 
            />
            <div className="text-xs text-slate-500">كالوري/يوم</div>
          </div>

          {/* Daily Protein */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              البروتين اليومي
            </label>
            <input 
              className="input" 
              type="number" 
              placeholder="150"
              value={form.dailyProtein} 
              onChange={e => setForm({ ...form, dailyProtein: e.target.value })} 
            />
            <div className="text-xs text-slate-500">جرام/يوم</div>
          </div>

          {/* Daily Carbs */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
              الكربوهيدرات اليومية
            </label>
            <input 
              className="input" 
              type="number" 
              placeholder="250"
              value={form.dailyCarbs} 
              onChange={e => setForm({ ...form, dailyCarbs: e.target.value })} 
            />
            <div className="text-xs text-slate-500">جرام/يوم</div>
          </div>

          {/* Daily Fat */}
          <div className="space-y-2">
            <label className="label flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              الدهون اليومية
            </label>
            <input 
              className="input" 
              type="number" 
              placeholder="65"
              value={form.dailyFat} 
              onChange={e => setForm({ ...form, dailyFat: e.target.value })} 
            />
            <div className="text-xs text-slate-500">جرام/يوم</div>
          </div>
        </div>

        {/* Nutrition Goals Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

        {/* Save Goals Button */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={saveGoals}
            disabled={loading}
            className="btn-primary px-6 py-2"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الأهداف'}
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-primary-500" />
          <h2 className="text-lg font-bold text-slate-800">إدارة البيانات</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-700">تصدير البيانات</h3>
            </div>
            <p className="text-sm text-slate-600">
              قم بتصدير جميع بياناتك (الملف الشخصي، الوجبات، الأهداف) كنسخة احتياطية
            </p>
            <button
              onClick={exportUserData}
              disabled={exporting}
              className="w-full rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'جاري التصدير...' : 'تصدير البيانات'}
            </button>
          </div>

          {/* Import Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-700">استيراد البيانات</h3>
            </div>
            <p className="text-sm text-slate-600">
              استيراد بيانات من نسخة احتياطية سابقة (سيتم استبدال البيانات الحالية)
            </p>
            <div className="space-y-2">
              <button
                onClick={triggerImport}
                disabled={importing}
                className="w-full rounded-xl px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {importing ? 'جاري الاستيراد...' : 'استيراد البيانات'}
              </button>
              <button
                onClick={() => document.getElementById('debug-file-input').click()}
                className="w-full rounded-xl px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition-colors text-sm"
              >
                🔍 تحليل ملف النسخة الاحتياطية (للتشخيص)
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-amber-800 mb-1">ملاحظة أمنية</div>
              <div className="text-amber-700">
                • احتفظ بالنسخ الاحتياطية في مكان آمن<br/>
                • لا تشارك ملفات النسخ الاحتياطي مع الآخرين<br/>
                • تأكد من صحة الملف قبل الاستيراد
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importUserData}
        style={{ display: 'none' }}
      />
      <input
        id="debug-file-input"
        type="file"
        accept=".json"
        onChange={testBackupFile}
        style={{ display: 'none' }}
      />
    </motion.div>
  )
}
