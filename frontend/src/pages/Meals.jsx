import React, { useEffect, useMemo, useState } from 'react'
import { Search, Edit, Plus, X, Utensils, Clock, Star, Trash2, Calendar, ChefHat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { toISODate } from '../utils/date'
import { getDisplayLabel, availableUnits } from '../utils/units'
import { formatNutrition } from '../utils/formatNumber'

export default function Meals() {
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [meals, setMeals] = useState([])
  const [foods, setFoods] = useState([])
  const [frequentFoods, setFrequentFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [foodSearch, setFoodSearch] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState({
    mealType: 'breakfast',
    items: [{ food: '', weight: 100, searchQuery: '', showResults: false }],
    notes: ''
  })

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/meals', { params: { date } })
      setMeals(data.meals)
    } finally {
      setLoading(false)
    }
  }

  const fetchFoods = async () => {
    try {
      const { data } = await api.get('/foods', { params: { limit: 1000 } })
      console.log('📊 Foods loaded:', data.foods.length)
      setFoods(data.foods)
    } catch (error) {
      console.error('❌ Error loading foods:', error)
      toast.error('فشل في تحميل قائمة الأطعمة')
    }
  }

  const fetchFrequentFoods = async () => {
    try {
      // Get user's recent meals to determine frequent foods
      const { data } = await api.get('/meals', { params: { limit: 50 } })
      const foodFrequency = {}
      
      data.meals.forEach(meal => {
        meal.items.forEach(item => {
          if (item.food && item.food._id) {
            const foodId = item.food._id
            foodFrequency[foodId] = (foodFrequency[foodId] || 0) + 1
          }
        })
      })
      
      // Sort foods by frequency and get top 6
      const sortedFoods = Object.entries(foodFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([foodId]) => data.meals
          .flatMap(meal => meal.items)
          .find(item => item.food?._id === foodId)?.food
        )
        .filter(Boolean)
      
      setFrequentFoods(sortedFoods)
    } catch (error) {
      console.error('Error fetching frequent foods:', error)
    }
  }

  useEffect(() => { fetchMeals() }, [date])
  useEffect(() => { 
    fetchFoods()
    fetchFrequentFoods()
  }, [])

  const totals = useMemo(() => {
    const t = { calories: 0, protein: 0, carbs: 0, fat: 0 }
    meals.forEach(m => {
      t.calories += m.totals.calories
      t.protein += m.totals.protein
      t.carbs += m.totals.carbs
      t.fat += m.totals.fat
    })
    return t
  }, [meals])

  const addItem = () => setForm({ ...form, items: [...form.items, { food: '', weight: 100, searchQuery: '', showResults: false }] })
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  // Filter foods based on search query for a specific item
  const getFilteredFoods = (searchQuery) => {
    if (!searchQuery || searchQuery.length < 1) return foods
    
    const query = searchQuery.toLowerCase().trim()
    
    // Debug logging - check if foods are loaded (remove after testing)
    if (foods.length === 0) {
      console.warn('⚠️ No foods loaded - this might cause search issues')
    }
    
    // Split query into words for better matching
    const queryWords = query.split(/\s+/).filter(word => word.length > 0)
    
    const filteredResults = foods.filter(food => {
      const nameEn = (food.name || '').toLowerCase()
      const nameAr = (food.nameAr || '').toLowerCase()
      
      // Check if any query word is found in either name
      return queryWords.some(word => 
        nameEn.includes(word) || 
        nameAr.includes(word) ||
        // Also check if the food name words contain the query word
        nameEn.split(/\s+/).some(foodWord => foodWord.includes(word)) ||
        nameAr.split(/\s+/).some(foodWord => foodWord.includes(word))
      )
    }).sort((a, b) => {
      // Sort by relevance - exact matches first, then partial matches
      const aNameEn = (a.name || '').toLowerCase()
      const aNameAr = (a.nameAr || '').toLowerCase()
      const bNameEn = (b.name || '').toLowerCase()
      const bNameAr = (b.nameAr || '').toLowerCase()
      
      // Check for exact matches first
      const aExactMatch = aNameEn.includes(query) || aNameAr.includes(query)
      const bExactMatch = bNameEn.includes(query) || bNameAr.includes(query)
      
      if (aExactMatch && !bExactMatch) return -1
      if (!aExactMatch && bExactMatch) return 1
      
      // Check for matches at the beginning of words
      const aStartsMatch = queryWords.some(word => 
        aNameEn.startsWith(word) || aNameAr.startsWith(word) ||
        aNameEn.split(/\s+/).some(foodWord => foodWord.startsWith(word)) ||
        aNameAr.split(/\s+/).some(foodWord => foodWord.startsWith(word))
      )
      const bStartsMatch = queryWords.some(word => 
        bNameEn.startsWith(word) || bNameAr.startsWith(word) ||
        bNameEn.split(/\s+/).some(foodWord => foodWord.startsWith(word)) ||
        bNameAr.split(/\s+/).some(foodWord => foodWord.startsWith(word))
      )
      
      if (aStartsMatch && !bStartsMatch) return -1
      if (!aStartsMatch && bStartsMatch) return 1
      
      // Default alphabetical sort
      return (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar')
    })
    
    // Debug logging for results (remove after testing)
    // console.log(`🔍 Search "${query}" found ${filteredResults.length} results`)
    
    return filteredResults
  }

  // Get unit info for a selected food
  const getFoodUnit = (foodId) => {
    if (!foodId) return { unit: 'g', label: '(جم)' }
    
    const food = foods.find(f => f._id === foodId)
    if (!food) return { unit: 'g', label: '(جم)' }
    
    // Check if food has servingSize with unit, otherwise use category-based default
    let unit = food.servingSize?.unit
    
    // If no unit specified, determine by category
    if (!unit) {
      const categoryDefaults = {
        'beverages': 'ml',
        'dairy': 'ml', 
        'oils_fats': 'ml',
        'other': 'g'
      }
      unit = categoryDefaults[food.category] || 'g'
    }
    
    // Create more descriptive labels
    const labelMap = {
      'g': '(جم)',
      'ml': '(مل)',
      'piece': '(قطعة)',
      'cup': '(كوب)',
      'tbsp': '(ملعقة كبيرة)',
      'tsp': '(ملعقة صغيرة)'
    }
    
    console.log(`Food: ${food.name}, Category: ${food.category}, Unit: ${unit}`) // Debug log
    
    return { 
      unit, 
      label: labelMap[unit] || '(جم)'
    }
  }

  // Quick add frequent food
  const quickAddFood = (food) => {
    const defaultWeight = food.servingSize?.amount || 100
    setForm({
      ...form,
      items: [...form.items, { food: food._id, weight: defaultWeight, searchQuery: '' }]
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      // Filter out empty food items and ensure proper data types
      const validItems = form.items
        .filter(i => i.food && i.weight >= 0.1)
        .map(i => ({ 
          food: i.food, 
          weight: parseFloat(i.weight) 
        }))
      
      if (validItems.length === 0) {
        toast.error('يجب إضافة عنصر واحد على الأقل')
        return
      }
      
      const payload = { 
        mealType: form.mealType,
        items: validItems,
        notes: form.notes || '',
        ...(editingMeal ? {} : { date }) // Only include date for new meals
      }
      
      console.log('📤 Sending payload:', payload) // Debug log
      
      if (editingMeal) {
        // Update existing meal
        await api.put(`/meals/${editingMeal._id}`, payload)
        toast.success('تم تحديث الوجبة')
      } else {
        // Create new meal
        await api.post('/meals', payload)
        toast.success('تم تسجيل الوجبة')
      }
      
      setShowForm(false)
      setEditingMeal(null)
      setCurrentStep(1)
      setForm({ mealType: 'breakfast', items: [{ food: '', weight: 100, searchQuery: '', showResults: false }], notes: '' })
      fetchMeals()
      fetchFrequentFoods() // Update frequent foods after adding/updating meal
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('meals_updated'))
      localStorage.setItem('meals_updated', Date.now().toString())
    } catch (e) {
      console.error('❌ Submit error:', e.response?.data) // Debug log
      
      // Show specific validation errors if available
      if (e.response?.data?.errors && Array.isArray(e.response.data.errors)) {
        const errorMessages = e.response.data.errors.map(err => err.msg).join(', ')
        toast.error(`خطأ في التحقق: ${errorMessages}`)
      } else {
        toast.error(e?.response?.data?.message || (editingMeal ? 'فشل تحديث الوجبة' : 'فشل إضافة الوجبة'))
      }
    }
  }

  const onEdit = (meal) => {
    // Populate form with meal data
    const formItems = meal.items.map(item => ({
      food: item.food._id,
      weight: item.weight,
      searchQuery: item.food.nameAr || item.food.name || '',
      showResults: false
    }))
    
    setForm({
      mealType: meal.mealType,
      items: formItems,
      notes: meal.notes || ''
    })
    
    setEditingMeal(meal)
    setCurrentStep(2) // Skip to step 2 for editing
    setShowForm(true)
  }

  const onDelete = async (meal) => {
    if (!confirm('حذف هذه الوجبة؟')) return
    try {
      await api.delete(`/meals/${meal._id}`)
      toast.success('تم الحذف')
      fetchMeals()
      fetchFrequentFoods() // Update frequent foods after deleting meal
      
      // Trigger dashboard refresh
      window.dispatchEvent(new CustomEvent('meals_updated'))
      localStorage.setItem('meals_updated', Date.now().toString())
    } catch (e) {
      toast.error('فشل الحذف')
    }
  }

  return (
    <motion.div 
      className="space-y-6"
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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">إدارة الوجبات</h1>
              <motion.div 
                className="badge bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium border border-orange-200"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {meals.length} وجبة اليوم
              </motion.div>
            </div>
            <p className="text-slate-500 mt-1">تتبع وجباتك اليومية وحساب السعرات الحرارية بدقة</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-center">
              <div className="text-sm font-bold text-slate-800">{meals.reduce((sum, meal) => sum + (meal.totals?.calories || 0), 0)}</div>
              <div className="text-xs text-slate-500">سعرة</div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="text-center">
              <div className="text-sm font-bold text-slate-800">{meals.length}</div>
              <div className="text-xs text-slate-500">وجبة</div>
            </div>
          </div>
          
          <motion.button 
            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            تسجيل وجبة جديدة
          </motion.button>
        </div>
      </motion.div>

      {/* Enhanced Date Selector */}
      <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-slate-800">اختر التاريخ</div>
              <div className="text-sm text-slate-500">عرض وجبات يوم محدد</div>
            </div>
          </div>
          <div className="flex-1 md:max-w-xs">
            <input 
              className="input w-full border-blue-200 focus:border-blue-400 focus:ring-blue-100" 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {loading ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
          <div className="text-slate-500 font-medium">جاري تحميل الوجبات...</div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {meals.length === 0 ? (
                <motion.div 
                  className="card p-12 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ChefHat className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد وجبات مسجلة</h3>
                  <p className="text-slate-500 mb-6">ابدأ بتسجيل وجبتك الأولى لهذا اليوم</p>
                  <button 
                    className="btn-primary flex items-center gap-2 mx-auto"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    تسجيل وجبة جديدة
                  </button>
                </motion.div>
              ) : (
                meals.map((meal, index) => (
                  <motion.div 
                    key={meal._id} 
                    className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          meal.mealType === 'breakfast' ? 'bg-yellow-100 text-yellow-600' :
                          meal.mealType === 'lunch' ? 'bg-orange-100 text-orange-600' :
                          meal.mealType === 'dinner' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-lg">
                            {meal.mealType === 'breakfast' ? 'الإفطار' : 
                             meal.mealType === 'lunch' ? 'الغداء' : 
                             meal.mealType === 'dinner' ? 'العشاء' : 'سناك'}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(meal.createdAt).toLocaleTimeString('ar-EG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button 
                          className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors" 
                          onClick={() => onEdit(meal)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button 
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" 
                          onClick={() => onDelete(meal)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {meal.items.map((it, idx) => {
                        const selectedFood = foods.find(f => f._id === it.food?._id)
                        const unit = selectedFood?.servingSize?.unit || 'g'
                        const unitLabel = availableUnits.find(u => u.value === unit)?.label || 'جم'
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                              <div className="font-medium text-slate-700">{it.food?.nameAr || it.food?.name}</div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-slate-500">{it.weight} {unitLabel}</div>
                              <div className="font-semibold text-primary-600">
                                {formatNutrition(it.nutrition.calories)} كالوري
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <div className="font-bold text-red-600">{formatNutrition(meal.totals.calories)}</div>
                          <div className="text-red-500 text-xs">كالوري</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="font-bold text-blue-600">{formatNutrition(meal.totals.protein)}</div>
                          <div className="text-blue-500 text-xs">بروتين</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded-lg">
                          <div className="font-bold text-yellow-600">{formatNutrition(meal.totals.carbs)}</div>
                          <div className="text-yellow-500 text-xs">كربوهيدرات</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="font-bold text-green-600">{formatNutrition(meal.totals.fat)}</div>
                          <div className="text-green-500 text-xs">دهون</div>
                        </div>
                      </div>
                    </div>

                    {meal.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-400">
                        <div className="text-sm text-blue-800">{meal.notes}</div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Summary Sidebar */}
          <div className="space-y-4">
            <motion.div 
              className="card p-6 bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <div className="font-bold text-slate-800">إجمالي اليوم</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600">السعرات الحرارية</span>
                  <span className="font-bold text-lg text-red-600">{formatNutrition(totals.calories)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600">البروتين</span>
                  <span className="font-bold text-blue-600">{formatNutrition(totals.protein)} جم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600">الكربوهيدرات</span>
                  <span className="font-bold text-yellow-600">{formatNutrition(totals.carbs)} جم</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-slate-600">الدهون</span>
                  <span className="font-bold text-green-600">{formatNutrition(totals.fat)} جم</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 backdrop-blur-sm" 
            onClick={() => setShowForm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white w-full md:max-w-4xl h-[95vh] md:h-auto md:max-h-[90vh] flex flex-col shadow-2xl rounded-t-3xl md:rounded-2xl" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Mobile-Friendly Header */}
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                <div className="flex items-center gap-3">
                  {/* Back Button for Step 2 */}
                  {currentStep === 2 && (
                    <motion.button 
                      onClick={() => setCurrentStep(1)}
                      className="p-2 rounded-xl hover:bg-slate-200 transition-colors mr-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                  )}
                  
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                    <Utensils className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg md:text-xl text-slate-800">
                      {editingMeal ? 'تعديل الوجبة' : 'إضافة وجبة'}
                    </div>
                    <div className="text-xs md:text-sm text-slate-500 hidden md:block">
                      {editingMeal ? 'قم بتعديل تفاصيل الوجبة' : 'أضف الأطعمة والكميات لوجبتك'}
                    </div>
                  </div>
                </div>
                <motion.button 
                  onClick={() => {
                    setShowForm(false)
                    setEditingMeal(null)
                    setCurrentStep(1)
                    setForm({ mealType: 'breakfast', items: [{ food: '', weight: 100, searchQuery: '', showResults: false }], notes: '' })
                  }} 
                  className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-slate-600" />
                </motion.button>
              </div>
              
              <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Progress Indicator */}
                <div className="p-3 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-secondary-50">
                  <div className="flex items-center justify-center gap-3">
                    <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary-600' : 'text-slate-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>1</div>
                      <span className="text-xs font-medium">نوع الوجبة</span>
                    </div>
                    <div className={`w-6 h-0.5 ${currentStep >= 2 ? 'bg-primary-500' : 'bg-slate-300'}`}></div>
                    <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-slate-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>2</div>
                      <span className="text-xs font-medium">الأطعمة</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Meal Type Selection */}
                {currentStep === 1 && (
                  <motion.div 
                    className="flex-1 flex flex-col items-center justify-center p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="w-full max-w-md space-y-4">
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-slate-800 mb-1">اختر نوع الوجبة</h3>
                        <p className="text-sm text-slate-500">حدد نوع الوجبة التي تريد تسجيلها</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'breakfast', label: 'الإفطار', icon: '🌅', color: 'from-yellow-400 to-orange-500' },
                          { value: 'lunch', label: 'الغداء', icon: '☀️', color: 'from-orange-400 to-red-500' },
                          { value: 'dinner', label: 'العشاء', icon: '🌙', color: 'from-purple-400 to-indigo-500' },
                          { value: 'snack', label: 'سناك', icon: '🍎', color: 'from-green-400 to-emerald-500' }
                        ].map(opt => (
                          <motion.button
                            key={opt.value}
                            type="button"
                            className={`p-4 rounded-xl text-center border-2 transition-all duration-300 ${
                              form.mealType === opt.value 
                                ? `bg-gradient-to-br ${opt.color} text-white border-transparent shadow-lg` 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:shadow-md'
                            }`}
                            onClick={() => setForm({ ...form, mealType: opt.value })}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="text-3xl mb-2">{opt.icon}</div>
                            <div className="font-bold text-base">{opt.label}</div>
                          </motion.button>
                        ))}
                      </div>
                      
                      <motion.button
                        type="button"
                        className="w-full btn-primary py-3 text-base font-semibold"
                        onClick={() => setCurrentStep(2)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        التالي - اختيار الأطعمة
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Food Items Selection */}
                {currentStep === 2 && (
                  <motion.div 
                    className="flex-1 flex flex-col relative"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    {/* Scrollable Content */}
                    <div className="overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-primary-300 scrollbar-track-slate-100" style={{ height: 'calc(95vh - 200px)', paddingBottom: '80px' }}>
                      {/* Frequent Foods */}
                      {frequentFoods.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-primary-50 to-secondary-50 p-3 rounded-xl border border-primary-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-primary-600" />
                            <label className="font-medium text-slate-800 text-sm">الأطعمة المفضلة</label>
                          </div>
                          <div className="overflow-hidden">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              {frequentFoods.map(food => (
                                <motion.button
                                  key={food._id}
                                  type="button"
                                  className="flex-shrink-0 p-2 md:p-3 text-xs md:text-sm rounded-xl bg-white border border-primary-200 text-primary-700 hover:bg-primary-100 hover:border-primary-300 transition-all duration-200 shadow-sm hover:shadow-md min-w-[100px] md:min-w-[120px] max-w-[120px]"
                                  onClick={() => quickAddFood(food)}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="font-medium text-center truncate">{food.nameAr || food.name}</div>
                                  <div className="text-xs text-primary-500 mt-1 text-center">انقر للإضافة</div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Food Items */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-slate-600" />
                            <h3 className="font-medium text-slate-800 text-sm">أطعمة الوجبة</h3>
                          </div>
                          {form.items.length > 1 && (
                            <div className="text-xs text-primary-600 flex items-center gap-1 bg-primary-50 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                              يمكنك التمرير
                            </div>
                          )}
                        </div>
                        
                        {form.items.map((item, idx) => {
                          const unitInfo = getFoodUnit(item.food)
                          const filteredFoods = getFilteredFoods(item.searchQuery)
                          const selectedFood = foods.find(f => f._id === item.food)
                          
                          return (
                            <motion.div 
                              key={`${idx}-${item.food}`} 
                              className="bg-white border-2 border-slate-200 rounded-xl p-3 hover:border-primary-300 transition-all duration-200 shadow-sm"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">اختر الطعام</label>
                                  
                                  {/* Show Search Input only when no food is selected */}
                                  {!selectedFood && (
                                    <>
                                      {/* Search Input */}
                                      <div className="relative mb-3">
                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                          type="text"
                                          className="input w-full pr-10 border-slate-300 focus:border-primary-500 focus:ring-primary-200"
                                          placeholder="ابحث عن طعام..."
                                          value={item.searchQuery || ''}
                                          onChange={e => {
                                            const items = [...form.items]
                                            items[idx].searchQuery = e.target.value
                                            items[idx].showResults = e.target.value.length > 0
                                            setForm({ ...form, items })
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Food Selection Results */}
                                      {item.showResults && item.searchQuery && filteredFoods.length > 0 && (
                                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                                          {filteredFoods.slice(0, 10).map(food => (
                                            <motion.button
                                              key={food._id}
                                              type="button"
                                              className="w-full p-3 text-right hover:bg-primary-50 border-b border-slate-100 last:border-b-0 transition-colors"
                                              onClick={() => {
                                                const items = [...form.items]
                                                items[idx].food = food._id
                                                items[idx].searchQuery = ''
                                                items[idx].showResults = false
                                                if (food.servingSize) {
                                                  items[idx].weight = food.servingSize.amount || 100
                                                }
                                                setForm({ ...form, items })
                                              }}
                                              whileHover={{ backgroundColor: 'rgb(239 246 255)' }}
                                            >
                                              <div className="font-medium text-slate-800">
                                                {food.nameAr || food.name}
                                              </div>
                                              {food.nameAr && food.name !== food.nameAr && (
                                                <div className="text-sm text-slate-500">{food.name}</div>
                                              )}
                                            </motion.button>
                                          ))}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  
                                  {/* Selected Food Display - Only show when food is selected */}
                                  {selectedFood && (
                                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-primary-800">
                                            {selectedFood.nameAr || selectedFood.name}
                                          </div>
                                          
                                        </div>
                                        <motion.button
                                          type="button"
                                          onClick={() => {
                                            const items = [...form.items]
                                            items[idx].food = ''
                                            items[idx].searchQuery = ''
                                            items[idx].showResults = false
                                            setForm({ ...form, items })
                                          }}
                                          className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <X className="w-4 h-4" />
                                        </motion.button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Weight Input and Remove Button */}
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                      الكمية {unitInfo.label}
                                    </label>
                                    <input 
                                      className="input w-full border-slate-300 focus:border-primary-500 focus:ring-primary-200 text-center font-semibold" 
                                      type="number" 
                                      min="0.1" 
                                      max="5000" 
                                      step="0.1"
                                      value={item.weight} 
                                      onChange={e => {
                                        const items = [...form.items]
                                        items[idx].weight = +e.target.value
                                        setForm({ ...form, items })
                                      }} 
                                      inputMode="decimal"
                                    />
                                  </div>
                                  
                                  {form.items.length > 1 && (
                                    <div className="flex items-end">
                                      <motion.button 
                                        type="button" 
                                        className="p-3 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200" 
                                        onClick={() => removeItem(idx)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </motion.button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                        
                        {/* Add Item Button */}
                        <motion.button 
                          type="button" 
                          className="w-full p-4 rounded-xl border-2 border-dashed border-primary-300 text-primary-600 hover:border-primary-400 hover:bg-primary-50 transition-all duration-300 font-medium flex items-center justify-center gap-2" 
                          onClick={addItem}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Plus className="w-5 h-5" />
                          إضافة طعام آخر
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Footer - Absolutely positioned */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
                      <motion.button 
                        className="w-full btn-primary px-6 py-3 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Utensils className="w-4 h-4" />
                        {editingMeal ? 'تحديث الوجبة' : 'حفظ الوجبة'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
