import React, { useEffect, useMemo, useState } from 'react'
import { Search, Edit } from 'lucide-react'
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
  const [form, setForm] = useState({
    mealType: 'breakfast',
    items: [{ food: '', weight: 100, searchQuery: '' }],
    notes: ''
  })

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/meals', { params: { date } })
      setMeals(Array.isArray(data.meals) ? data.meals : [])
    } catch (error) {
      console.error('Error fetching meals:', error)
      setMeals([])
    } finally {
      setLoading(false)
    }
  }

  const fetchFoods = async () => {
    try {
      const { data } = await api.get('/foods', { params: { limit: 1000 } })
      console.log('📊 Foods loaded:', data.foods?.length || 0)
      setFoods(Array.isArray(data.foods) ? data.foods : [])
    } catch (error) {
      console.error('❌ Error loading foods:', error)
      setFoods([])
      toast.error('فشل في تحميل قائمة الأطعمة')
    }
  }

  const fetchFrequentFoods = async () => {
    try {
      // Get user's recent meals to determine frequent foods
      const { data } = await api.get('/meals', { params: { limit: 50 } })
      const foodFrequency = {}
      
      if (Array.isArray(data.meals)) {
        data.meals.forEach(meal => {
          if (Array.isArray(meal.items)) {
            meal.items.forEach(item => {
              if (item.food && item.food._id) {
                const foodId = item.food._id
                foodFrequency[foodId] = (foodFrequency[foodId] || 0) + 1
              }
            })
          }
        })
      }
      
      // Sort foods by frequency and get top 6
      const sortedFoods = Object.entries(foodFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([foodId]) => {
          if (!Array.isArray(data.meals)) return null
          return data.meals
            .flatMap(meal => Array.isArray(meal.items) ? meal.items : [])
            .find(item => item.food?._id === foodId)?.food
        })
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
    if (Array.isArray(meals)) {
      meals.forEach(m => {
        if (m.totals) {
          t.calories += m.totals.calories || 0
          t.protein += m.totals.protein || 0
          t.carbs += m.totals.carbs || 0
          t.fat += m.totals.fat || 0
        }
      })
    }
    return t
  }, [meals])

  const addItem = () => setForm({ ...form, items: [...form.items, { food: '', weight: 100, searchQuery: '' }] })
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })

  // Filter foods based on search query for a specific item
  const getFilteredFoods = (searchQuery) => {
    if (!Array.isArray(foods)) return []
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
      setForm({ mealType: 'breakfast', items: [{ food: '', weight: 100, searchQuery: '' }], notes: '' })
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
      searchQuery: item.food.nameAr || item.food.name || ''
    }))
    
    setForm({
      mealType: meal.mealType,
      items: formItems,
      notes: meal.notes || ''
    })
    
    setEditingMeal(meal)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">الوجبات</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ تسجيل وجبة</button>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="text-sm text-slate-600">تاريخ اليوم</div>
        <input className="input md:w-56" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">جاري التحميل...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {meals.map(meal => (
              <div key={meal._id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">
                    {meal.mealType === 'breakfast' ? 'الإفطار' : meal.mealType === 'lunch' ? 'الغداء' : meal.mealType === 'dinner' ? 'العشاء' : 'سناك'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="rounded-xl px-3 py-1 border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1" 
                      onClick={() => onEdit(meal)}
                    >
                      <Edit className="w-3 h-3" />
                      تعديل
                    </button>
                    <button 
                      className="rounded-xl px-3 py-1 border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors" 
                      onClick={() => onDelete(meal)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {meal.items.map((it, idx) => {
                    const selectedFood = foods.find(f => f._id === it.food?._id)
                    const unit = selectedFood?.servingSize?.unit || 'g'
                    const unitLabel = availableUnits.find(u => u.value === unit)?.label || 'جم'
                    
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="text-slate-700">{it.food?.name}</div>
                        <div className="text-slate-500">{it.weight} {unitLabel}</div>
                        <div className="font-medium">{formatNutrition(it.nutrition.calories)} كالوري</div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  الإجمالي: {formatNutrition(meal.totals.calories)} كالوري، {formatNutrition(meal.totals.protein)} بروتين، {formatNutrition(meal.totals.carbs)} كربوهيدرات، {formatNutrition(meal.totals.fat)} دهون
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <div className="card p-4">
              <div className="font-bold mb-2">إجمالي اليوم</div>
              <div className="text-sm text-slate-700">{formatNutrition(totals.calories)} كالوري</div>
              <div className="text-xs text-slate-500">بروتين: {formatNutrition(totals.protein)} | كربوهيدرات: {formatNutrition(totals.carbs)} | دهون: {formatNutrition(totals.fat)}</div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="font-bold text-lg">{editingMeal ? 'تعديل الوجبة' : 'تسجيل وجبة'}</div>
              <button onClick={() => {
                setShowForm(false)
                setEditingMeal(null)
                setForm({ mealType: 'breakfast', items: [{ food: '', weight: 100, searchQuery: '' }], notes: '' })
              }} className="rounded-xl px-3 py-1 hover:bg-slate-100">إغلاق</button>
            </div>
            
            <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
              {/* Fixed Form Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">نوع الوجبة</label>
                    <select className="input" value={form.mealType} onChange={e => setForm({ ...form, mealType: e.target.value })}>
                      <option value="breakfast">الإفطار</option>
                      <option value="lunch">الغداء</option>
                      <option value="dinner">العشاء</option>
                      <option value="snack">سناك</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">ملاحظات</label>
                    <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Frequent Foods Section */}
                {frequentFoods.length > 0 && (
                  <div>
                    <label className="label">الأطعمة المتكررة</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {frequentFoods.map(food => (
                        <button
                          key={food._id}
                          type="button"
                          className="p-2 text-xs rounded-lg border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                          onClick={() => quickAddFood(food)}
                        >
                          {food.nameAr || food.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Food Items Section */}
                <div className="space-y-4">
                {form.items.map((item, idx) => {
                  const unitInfo = getFoodUnit(item.food)
                  const filteredFoods = getFilteredFoods(item.searchQuery)
                  
                  return (
                    <div key={`${idx}-${item.food}`} className="border border-slate-200 rounded-lg p-3 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                        <div className="lg:col-span-7">
                          <label className="label">الطعام</label>
                          <div className="space-y-2">
                            {/* Search Input */}
                            <div className="relative">
                              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                              <input
                                type="text"
                                className="input pr-10"
                                placeholder="ابحث عن طعام..."
                                value={item.searchQuery || ''}
                                onChange={e => {
                                  const items = [...form.items]
                                  const newSearchValue = e.target.value
                                  items[idx].searchQuery = newSearchValue
                                  // Clear selection when user starts typing a new search
                                  if (newSearchValue !== '' && items[idx].food) {
                                    items[idx].food = ''
                                  }
                                  setForm({ ...form, items })
                                }}
                              />
                            </div>
                            
                            {/* Food Selection Dropdown */}
                            <select 
                              className="input" 
                              value={item.food} 
                              onChange={e => {
                                const items = [...form.items]
                                items[idx].food = e.target.value
                                
                                // Auto-adjust weight based on food's default serving size
                                if (e.target.value) {
                                  const selectedFood = foods.find(f => f._id === e.target.value)
                                  if (selectedFood && selectedFood.servingSize) {
                                    items[idx].weight = selectedFood.servingSize.amount || 100
                                  }
                                  // Keep search query to show what was selected
                                  // items[idx].searchQuery = selectedFood.nameAr || selectedFood.name
                                }
                                
                                setForm({ ...form, items })
                              }}
                            >
                              <option value="">اختر طعاماً</option>
                              {filteredFoods.map(f => (
                                <option key={f._id} value={f._id}>
                                  {f.nameAr || f.name} {f.nameAr && f.name !== f.nameAr ? `(${f.name})` : ''}
                                </option>
                              ))}
                            </select>
                            
                            {/* Show search results count */}
                            {item.searchQuery && item.searchQuery.length >= 2 && (
                              <div className="text-xs text-slate-500">
                                {filteredFoods.length} نتيجة
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="lg:col-span-3">
                          <label className="label">الكمية {unitInfo.label}</label>
                          <input 
                            className="input" 
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
                          />
                        </div>
                        <div className="lg:col-span-2 flex items-end">
                          <button type="button" className="w-full rounded-xl px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-sm" onClick={() => removeItem(idx)}>حذف</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {/* Add Item Button inside scrollable area */}
                <div className="pt-4">
                  <button type="button" className="w-full rounded-xl px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-600 transition-colors" onClick={addItem}>
                    + إضافة عنصر جديد
                  </button>
                </div>
                </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end gap-3">
                  <button type="button" className="rounded-xl px-6 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => {
                    setShowForm(false)
                    setEditingMeal(null)
                    setForm({ mealType: 'breakfast', items: [{ food: '', weight: 100, searchQuery: '' }], notes: '' })
                  }}>إلغاء</button>
                  <button className="btn-primary px-6 py-2">{editingMeal ? 'تحديث الوجبة' : 'حفظ الوجبة'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
