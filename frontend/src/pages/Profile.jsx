import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../lib/api'
import AdminProfile from '../components/profile/AdminProfile'
import UserProfile from '../components/profile/UserProfile'
import { calculateMacros, generateRecommendations } from '../components/profile/utils'

export default function Profile() {
  const { user, updateProfile, updateGoals, loading } = useAuth()
  
  // Simple state without complex initialization
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [exportingFoods, setExportingFoods] = useState(false)
  const [autoCalculate, setAutoCalculate] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fileInputRef = useRef(null)
  
  // Initialize form data directly from user
  const getFormData = () => ({
    name: user?.name || '',
    avatar: user?.avatar || '',
    age: user?.profile?.age || '',
    gender: user?.profile?.gender || '',
    height: user?.profile?.height || '',
    weight: user?.profile?.weight || '',
    activityLevel: user?.profile?.activityLevel || 'moderate',
    goal: user?.profile?.goal || 'maintain_weight',
    dailyCalories: user?.dailyGoals?.calories || '',
    dailyProtein: user?.dailyGoals?.protein || '',
    dailyCarbs: user?.dailyGoals?.carbs || '',
    dailyFat: user?.dailyGoals?.fat || '',
  })
  
  const [form, setForm] = useState(getFormData())
  
  // Update form when user data changes (watch for actual data changes)
  useEffect(() => {
    if (user) {
      const newFormData = {
        name: user?.name || '',
        avatar: user?.avatar || '',
        age: user?.profile?.age || '',
        gender: user?.profile?.gender || '',
        height: user?.profile?.height || '',
        weight: user?.profile?.weight || '',
        activityLevel: user?.profile?.activityLevel || 'moderate',
        goal: user?.profile?.goal || 'maintain_weight',
        dailyCalories: user?.dailyGoals?.calories || '',
        dailyProtein: user?.dailyGoals?.protein || '',
        dailyCarbs: user?.dailyGoals?.carbs || '',
        dailyFat: user?.dailyGoals?.fat || '',
      }
      setForm(newFormData)
    }
  }, [
    user?.id, 
    user?.name, 
    user?.avatar, 
    user?.profile?.age, 
    user?.profile?.gender, 
    user?.profile?.height, 
    user?.profile?.weight, 
    user?.profile?.activityLevel, 
    user?.profile?.goal,
    user?.dailyGoals?.calories,
    user?.dailyGoals?.protein,
    user?.dailyGoals?.carbs,
    user?.dailyGoals?.fat
  ])

  // Simple form handlers without useCallback
  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId)
  }

  const handleAutoCalculateToggle = () => {
    setAutoCalculate(!autoCalculate)
  }

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('الرجاء اختيار صورة')
    const reader = new FileReader()
    reader.onload = () => handleFormChange('avatar', reader.result)
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

  const onChangePassword = async (e) => {
    if (e) e.preventDefault()
    
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين')
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    
    try {
      setPasswordLoading(true)
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      
      toast.success('تم تغيير كلمة المرور بنجاح')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Password change error:', error)
      if (error.response?.status === 400) {
        toast.error('كلمة المرور الحالية غير صحيحة')
      } else {
        toast.error('فشل في تغيير كلمة المرور')
      }
    } finally {
      setPasswordLoading(false)
    }
  }

  const exportFoodsData = async () => {
    try {
      setExportingFoods(true)
      const response = await api.get('/foods?limit=10000')
      const foods = response.data.foods || response.data
      
      if (!foods || foods.length === 0) {
        toast.error('لا توجد أطعمة لتصديرها')
        return
      }
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        totalFoods: foods.length,
        foods: foods.map(food => ({
          name: food.name,
          nameAr: food.nameAr,
          category: food.category,
          categoryAr: food.categoryAr,
          brand: food.brand,
          barcode: food.barcode,
          nutrition: {
            calories: food.nutrition?.calories || 0,
            protein: food.nutrition?.protein || 0,
            carbs: food.nutrition?.carbs || 0,
            fat: food.nutrition?.fat || 0,
            fiber: food.nutrition?.fiber || 0,
            sugar: food.nutrition?.sugar || 0,
            sodium: food.nutrition?.sodium || 0
          },
          servingSize: food.servingSize,
          per100g: food.per100g,
          isPublic: food.isPublic,
          isVerified: food.isVerified,
          createdBy: food.createdBy,
          createdAt: food.createdAt,
          updatedAt: food.updatedAt
        }))
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `foods-database-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(`تم تصدير ${foods.length} عنصر غذائي بنجاح`)
      
    } catch (error) {
      console.error('Export foods error:', error)
      toast.error('فشل في تصدير قاعدة بيانات الأطعمة')
    } finally {
      setExportingFoods(false)
    }
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

  const handleCaloriesChange = (value) => {
    setForm(prev => ({ ...prev, dailyCalories: value }))
    
    if (autoCalculate && value) {
      const macros = calculateMacros(value)
      setForm(prev => ({
        ...prev,
        dailyProtein: macros.protein.toString(),
        dailyCarbs: macros.carbs.toString(),
        dailyFat: macros.fat.toString()
      }))
    }
  }

  const autoCalculateNow = () => {
    if (!form.dailyCalories) {
      toast.error('يرجى إدخال السعرات اليومية أولاً')
      return
    }
    
    const macros = calculateMacros(form.dailyCalories)
    setForm(prev => ({
      ...prev,
      dailyProtein: macros.protein.toString(),
      dailyCarbs: macros.carbs.toString(),
      dailyFat: macros.fat.toString()
    }))
    
    toast.success('تم حساب الماكروز تلقائياً')
  }

  const exportUserData = async () => {
    try {
      setExporting(true)
      const [profileRes, mealsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/meals?limit=10000') // Get all meals, not just the first 20
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

  const exportToCSV = async () => {
    try {
      setExporting(true)
      const mealsRes = await api.get('/meals?limit=10000') // Get all meals for CSV export
      const meals = mealsRes.data.meals || []
      
      const csvHeaders = ['التاريخ', 'نوع الوجبة', 'الطعام', 'الكمية (جم)', 'السعرات', 'البروتين', 'الكربوهيدرات', 'الدهون']
      const csvRows = meals.flatMap(meal => 
        meal.items.map(item => [
          new Date(meal.date).toLocaleDateString('ar-EG'),
          meal.type === 'breakfast' ? 'إفطار' : 
          meal.type === 'lunch' ? 'غداء' : 
          meal.type === 'dinner' ? 'عشاء' : 'سناك',
          item.food.nameAr || item.food.name,
          item.weight,
          Math.round((item.food.calories * item.weight) / 100),
          Math.round((item.food.protein * item.weight) / 100),
          Math.round((item.food.carbs * item.weight) / 100),
          Math.round((item.food.fat * item.weight) / 100)
        ])
      )
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meals-data-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('تم تصدير البيانات كـ CSV بنجاح')
    } catch (error) {
      console.error('CSV Export error:', error)
      toast.error('فشل في تصدير البيانات')
    } finally {
      setExporting(false)
    }
  }

  const exportAnalyticsReport = async () => {
    try {
      setExporting(true)
      const [mealsRes, activitiesRes] = await Promise.all([
        api.get('/meals/stats?days=30'),
        api.get('/activities').catch(() => ({ data: { activities: [] } }))
      ])
      
      const stats = mealsRes.data
      const activities = activitiesRes.data.activities || []
      
      const report = {
        reportDate: new Date().toISOString(),
        period: 'آخر 30 يوم',
        summary: {
          totalMeals: stats.totalMeals || 0,
          avgCaloriesPerDay: stats.avgCaloriesPerDay || 0,
          totalCalories: stats.dailyData?.reduce((sum, day) => sum + (day.calories || 0), 0) || 0,
          totalProtein: stats.dailyData?.reduce((sum, day) => sum + (day.protein || 0), 0) || 0,
          totalCarbs: stats.dailyData?.reduce((sum, day) => sum + (day.carbs || 0), 0) || 0,
          totalFat: stats.dailyData?.reduce((sum, day) => sum + (day.fat || 0), 0) || 0,
          activeDays: stats.dailyData?.filter(d => d.calories > 0).length || 0,
          totalActivities: activities.length,
          totalCaloriesBurned: activities.reduce((sum, act) => sum + (act.caloriesBurned || 0), 0)
        },
        dailyBreakdown: stats.dailyData || [],
        goals: user?.dailyGoals || {},
        recommendations: generateRecommendations(stats, user?.dailyGoals)
      }
      
      const dataStr = JSON.stringify(report, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('تم تصدير تقرير التحليلات بنجاح')
    } catch (error) {
      console.error('Analytics export error:', error)
      toast.error('فشل في تصدير التقرير')
    } finally {
      setExporting(false)
    }
  }

  const exportHtmlReport = async () => {
    try {
      setExporting(true)
      console.log('Starting HTML report export...')
      toast.loading('جاري إنشاء التقرير التفاعلي...', { duration: 5000 })
      
      const [mealsRes, activitiesRes] = await Promise.all([
        api.get('/meals/stats?days=30'),
        api.get('/activities').catch(() => ({ data: { activities: [] } }))
      ])
      
      const stats = mealsRes.data
      const activities = activitiesRes.data.activities || []
      console.log('Data fetched:', { stats, activities })
      
      const { generateNutritionReport } = await import('../utils/htmlReportGenerator')
      
      const chartElements = {}
      const caloriesChart = document.querySelector('[data-chart="calories"]')
      const macrosChart = document.querySelector('[data-chart="macros"]')
      
      if (caloriesChart) chartElements.caloriesChart = caloriesChart
      if (macrosChart) chartElements.macrosChart = macrosChart
      
      const result = await generateNutritionReport(
        user,
        stats,
        { activities },
        chartElements
      )
      
      if (result.success) {
        toast.success(`تم إنشاء التقرير التفاعلي بنجاح: ${result.filename}`)
      } else {
        throw new Error(result.error)
      }
      
    } catch (error) {
      console.error('HTML report export error:', error)
      toast.error(`فشل في إنشاء التقرير التفاعلي: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

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
          
          if (!importData.user || !importData.version) {
            throw new Error('ملف غير صالح - تأكد من أنه ملف نسخ احتياطي صحيح')
          }
          
          if (!importData.user.meals) {
            throw new Error('لا توجد وجبات في الملف المحدد')
          }
          
          if (!Array.isArray(importData.user.meals)) {
            throw new Error('تنسيق الوجبات غير صحيح في الملف')
          }

          const confirmed = confirm(
            `هل تريد استيراد البيانات؟\n\n` +
            `تاريخ النسخة: ${new Date(importData.exportDate).toLocaleDateString('ar-EG')}\n` +
            `عدد الوجبات: ${importData.user.meals?.length || 0}\n\n` +
            `تحذير: سيتم حذف جميع بياناتك الحالية واستبدالها بالبيانات المستوردة!`
          )

          if (!confirmed) return

          let deletedCount = 0
          let importedCount = 0

          // First, get existing meals data
          let existingMealsData = null
          try {
            const { data: existingMeals } = await api.get('/meals?limit=10000')
            existingMealsData = existingMeals
          } catch (error) {
            console.error('Error getting existing meals:', error)
          }

          const existingMealsCount = existingMealsData?.meals?.length || 0
          const deleteExisting = confirm(
            `هل تريد حذف الوجبات الموجودة أولاً؟\n\n` +
            `عدد الوجبات الموجودة: ${existingMealsCount}\n` +
            `عدد الوجبات في الملف: ${importData.user.meals?.length || 0}\n\n` +
            `نعم = حذف الوجبات الموجودة ثم استيراد النسخة الاحتياطية\n` +
            `لا = إضافة الوجبات من النسخة الاحتياطية للوجبات الموجودة`
          )

          if (deleteExisting && existingMealsData?.meals?.length > 0) {
            try {
              toast('جاري حذف الوجبات الموجودة...')
              const existingMeals = existingMealsData.meals
              console.log(`Deleting ${existingMeals.length} existing meals...`)
              
              // Delete meals in batches to avoid overwhelming the server
              const batchSize = 10
              for (let i = 0; i < existingMeals.length; i += batchSize) {
                const batch = existingMeals.slice(i, i + batchSize)
                const deletePromises = batch.map(meal => 
                  api.delete(`/meals/${meal._id}`).catch(error => {
                    console.error('Failed to delete meal:', meal._id, error)
                    return null
                  })
                )
                
                const results = await Promise.all(deletePromises)
                deletedCount += results.filter(r => r !== null).length
                
                // Small delay between batches
                if (i + batchSize < existingMeals.length) {
                  await new Promise(resolve => setTimeout(resolve, 100))
                }
              }
              
              if (deletedCount > 0) {
                toast.success(`تم حذف ${deletedCount} وجبة موجودة`)
                // Wait a moment for the deletion to complete
                await new Promise(resolve => setTimeout(resolve, 500))
                
                // Verify deletion by checking remaining meals
                try {
                  const { data: remainingMeals } = await api.get('/meals?limit=10000')
                  if (remainingMeals.meals && remainingMeals.meals.length > 0) {
                    console.warn(`Warning: ${remainingMeals.meals.length} meals still remain after deletion`)
                    toast(`تحذير: لا تزال ${remainingMeals.meals.length} وجبة موجودة`, { icon: '⚠️' })
                  } else {
                    console.log('All existing meals successfully deleted')
                  }
                } catch (error) {
                  console.error('Error verifying deletion:', error)
                }
              }
            } catch (error) {
              console.error('Error deleting existing meals:', error)
              toast.error('فشل في حذف الوجبات الموجودة')
            }
          }

          if (importData.user.meals && importData.user.meals.length > 0) {
            // Prepare batch payload
            const mealsPayload = importData.user.meals.map(meal => {
              const mealData = {
                mealType: meal.mealType,
                date: meal.date,
                items: (meal.items || []).map(item => {
                  if (item.food && typeof item.food === 'object') {
                    // Determine default weight based on serving unit
                    let defaultWeight = 100; // Default for gram-based foods
                    if (item.food.servingSize) {
                      if (item.food.servingSize.unit === 'piece') {
                        defaultWeight = 1; // 1 piece
                      } else if (item.food.servingSize.unit === 'cup') {
                        defaultWeight = 1; // 1 cup
                      } else if (item.food.servingSize.unit === 'tbsp') {
                        defaultWeight = 1; // 1 tablespoon
                      } else if (item.food.servingSize.unit === 'tsp') {
                        defaultWeight = 1; // 1 teaspoon
                      } else if (item.food.servingSize.unit === 'g' || item.food.servingSize.unit === 'ml') {
                        defaultWeight = item.food.servingSize.amount || 100; // Use serving size amount
                      }
                    }
                    
                    const finalWeight = item.weight || defaultWeight;
                    
                    return {
                      food: item.food._id || item.food.id,
                      weight: finalWeight,
                      foodData: {
                        name: item.food.name,
                        nameAr: item.food.nameAr,
                        category: item.food.category,
                        nutrition: item.food.nutrition,
                        servingSize: item.food.servingSize
                      }
                    }
                  }
                  
                  // For items without food object, use original weight or default
                  return { food: item.food, weight: item.weight || 100 }
                }),
                notes: meal.notes || ''
              }
              return mealData
            })

            // Chunk to avoid payload size/timeouts (e.g., 50 per request)
            const chunkSize = 50
            let successCount = 0
            let errorCount = 0
            for (let i = 0; i < mealsPayload.length; i += chunkSize) {
              const chunk = mealsPayload.slice(i, i + chunkSize)
              try {
                const { data } = await api.post('/meals/import-batch', { meals: chunk })
                successCount += data.successCount || 0
                errorCount += data.errorCount || 0
                importedCount += data.successCount || 0
                if ((data.results || []).some(r => !r.success)) {
                  console.warn('Some items failed in chunk', { start: i, end: i + chunk.length, results: data.results })
                }
              } catch (error) {
                errorCount += chunk.length
                console.error('Batch import error:', error)
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

          const totalOperations = deletedCount + importedCount
          if (totalOperations > 0) {
            toast.success(
              `تمت العملية بنجاح!\n` +
              `${deletedCount > 0 ? `حذف: ${deletedCount} وجبة\n` : ''}` +
              `${importedCount > 0 ? `استيراد: ${importedCount} وجبة` : ''}`
            )
            
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

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }


  // Conditional rendering based on user role
  if (user?.role === 'admin') {
    return (
      <AdminProfile 
        user={user}
        form={form}
        onFormChange={handleFormChange}
        onSubmit={onSubmit}
        onPickAvatar={onPickAvatar}
        loading={loading}
        passwordForm={passwordForm}
        onPasswordFormChange={handlePasswordFormChange}
        onChangePassword={onChangePassword}
        passwordLoading={passwordLoading}
        onExportFoodsData={exportFoodsData}
        exportingFoods={exportingFoods}
      />
    )
  }

  return (
    <UserProfile 
      user={user}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      form={form}
      onFormChange={handleFormChange}
      onSubmit={onSubmit}
      onPickAvatar={onPickAvatar}
      loading={loading}
      onCaloriesChange={handleCaloriesChange}
      autoCalculate={autoCalculate}
      onAutoCalculateToggle={handleAutoCalculateToggle}
      onAutoCalculateNow={autoCalculateNow}
      onSaveGoals={saveGoals}
      passwordForm={passwordForm}
      onPasswordFormChange={handlePasswordFormChange}
      onChangePassword={onChangePassword}
      passwordLoading={passwordLoading}
      onExportUserData={exportUserData}
      onExportToCSV={exportToCSV}
      onExportAnalyticsReport={exportAnalyticsReport}
      onExportHtmlReport={exportHtmlReport}
      onTriggerImport={triggerImport}
      onImportUserData={importUserData}
      exporting={exporting}
      importing={importing}
      fileInputRef={fileInputRef}
    />
  )
}
