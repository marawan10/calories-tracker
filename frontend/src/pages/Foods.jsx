import React, { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit3, Trash2, Package, Upload, AlertTriangle, Filter, ArrowUpDown, SlidersHorizontal } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { getUnitForCategory, getDisplayLabel, availableUnits } from '../utils/units'

const categories = [
  { value: 'fruits', label: 'فواكه' },
  { value: 'vegetables', label: 'خضروات' },
  { value: 'grains', label: 'حبوب ونشويات' },
  { value: 'protein', label: 'بروتين' },
  { value: 'dairy', label: 'ألبان' },
  { value: 'nuts_seeds', label: 'مكسرات وبذور' },
  { value: 'oils_fats', label: 'زيوت ودهون' },
  { value: 'beverages', label: 'مشروبات' },
  { value: 'sweets', label: 'حلويات' },
  { value: 'snacks', label: 'وجبات خفيفة' },
  { value: 'prepared_foods', label: 'أطعمة جاهزة' },
  { value: 'other', label: 'أخرى' },
]

const sortOptions = [
  { value: 'name', label: 'الاسم (أ-ي)' },
  { value: 'name_desc', label: 'الاسم (ي-أ)' },
  { value: 'calories_high', label: 'السعرات (الأعلى أولاً)' },
  { value: 'calories_low', label: 'السعرات (الأقل أولاً)' },
  { value: 'protein_high', label: 'البروتين (الأعلى أولاً)' },
  { value: 'protein_low', label: 'البروتين (الأقل أولاً)' },
  { value: 'carbs_high', label: 'الكربوهيدرات (الأعلى أولاً)' },
  { value: 'carbs_low', label: 'الكربوهيدرات (الأقل أولاً)' },
  { value: 'fat_high', label: 'الدهون (الأعلى أولاً)' },
  { value: 'fat_low', label: 'الدهون (الأقل أولاً)' },
]

export default function Foods() {
  const [foods, setFoods] = useState([])
  const [totalFoods, setTotalFoods] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    caloriesMin: '',
    caloriesMax: '',
    proteinMin: '',
    proteinMax: '',
    carbsMin: '',
    carbsMax: '',
    fatMin: '',
    fatMax: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', nameAr: '', category: 'other', brand: '',
    nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
    servingSize: { amount: 100, unit: 'g' },
    isPublic: false
  })
  const [editing, setEditing] = useState(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const fetchFoods = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/foods', { params: { search: query || undefined, category: category || undefined, limit: 1000 } })
      setFoods(data.foods)
      setTotalFoods(data.pagination?.total || data.total || data.foods.length)
    } finally {
      setLoading(false)
    }
  }

  // Get total count without filters
  const fetchTotalCount = async () => {
    try {
      const { data } = await api.get('/foods', { params: { limit: 1 } })
      setTotalFoods(data.pagination?.total || data.total || 0)
    } catch (error) {
      console.error('Error fetching total count:', error)
    }
  }

  // Handle category change to auto-set unit
  const handleCategoryChange = (newCategory) => {
    const categoryUnit = getUnitForCategory(newCategory)
    setForm({ 
      ...form, 
      category: newCategory,
      servingSize: { 
        amount: 100, 
        unit: categoryUnit.unit 
      }
    })
  }

  useEffect(() => { 
    fetchFoods()
    if (!query && !category) {
      fetchTotalCount()
    }
  }, [])

  useEffect(() => { fetchFoods() }, [query, category])

  // Apply filters and sorting to foods
  const filteredAndSortedFoods = useMemo(() => {
    let filtered = [...foods]

    // Apply nutritional filters
    filtered = filtered.filter(food => {
      const { calories, protein, carbs, fat } = food.nutrition
      
      if (filters.caloriesMin && calories < parseFloat(filters.caloriesMin)) return false
      if (filters.caloriesMax && calories > parseFloat(filters.caloriesMax)) return false
      if (filters.proteinMin && protein < parseFloat(filters.proteinMin)) return false
      if (filters.proteinMax && protein > parseFloat(filters.proteinMax)) return false
      if (filters.carbsMin && carbs < parseFloat(filters.carbsMin)) return false
      if (filters.carbsMax && carbs > parseFloat(filters.carbsMax)) return false
      if (filters.fatMin && fat < parseFloat(filters.fatMin)) return false
      if (filters.fatMax && fat > parseFloat(filters.fatMax)) return false
      
      return true
    })

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.nameAr || a.name).localeCompare(b.nameAr || b.name, 'ar')
        case 'name_desc':
          return (b.nameAr || b.name).localeCompare(a.nameAr || a.name, 'ar')
        case 'calories_high':
          return b.nutrition.calories - a.nutrition.calories
        case 'calories_low':
          return a.nutrition.calories - b.nutrition.calories
        case 'protein_high':
          return b.nutrition.protein - a.nutrition.protein
        case 'protein_low':
          return a.nutrition.protein - b.nutrition.protein
        case 'carbs_high':
          return b.nutrition.carbs - a.nutrition.carbs
        case 'carbs_low':
          return a.nutrition.carbs - b.nutrition.carbs
        case 'fat_high':
          return b.nutrition.fat - a.nutrition.fat
        case 'fat_low':
          return a.nutrition.fat - b.nutrition.fat
        default:
          return 0
      }
    })

    return filtered
  }, [foods, filters, sortBy])

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      caloriesMin: '',
      caloriesMax: '',
      proteinMin: '',
      proteinMax: '',
      carbsMin: '',
      carbsMax: '',
      fatMin: '',
      fatMax: ''
    })
    setSortBy('name')
    setShowFilters(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/foods/${editing._id}`, form)
        toast.success('تم تحديث الطعام')
      } else {
        await api.post('/foods', form)
        toast.success('تم إضافة الطعام')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ 
        name: '', nameAr: '', category: 'other', brand: '', 
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }, 
        servingSize: { amount: 100, unit: 'g' },
        isPublic: false 
      })
      fetchFoods()
      if (!editing) {
        fetchTotalCount() // Update total count when adding new food
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'حدث خطأ')
    }
  }

  const onEdit = (food) => {
    setEditing(food)
    setForm({
      name: food.name,
      nameAr: food.nameAr || '',
      category: food.category,
      brand: food.brand || '',
      nutrition: {
        calories: food.nutrition.calories,
        protein: food.nutrition.protein,
        carbs: food.nutrition.carbs,
        fat: food.nutrition.fat,
      },
      servingSize: food.servingSize || { amount: 100, unit: 'g' },
      isPublic: food.isPublic,
      description: food.description || ''
    })
    setShowForm(true)
  }

  const onDelete = async (food) => {
    if (!confirm(`حذف ${food.name}؟`)) return
    try {
      await api.delete(`/foods/${food._id}`)
      toast.success('تم الحذف')
      fetchFoods()
      fetchTotalCount() // Update total count when deleting food
    } catch (e) {
      toast.error(e?.response?.data?.message || 'فشل الحذف')
    }
  }

  // Validate food item structure
  const validateFoodItem = (food) => {
    const required = ['name', 'nameAr', 'category', 'nutrition']
    const nutritionRequired = ['calories', 'protein', 'carbs', 'fat']
    
    for (const field of required) {
      if (!food[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    for (const field of nutritionRequired) {
      if (typeof food.nutrition[field] !== 'number') {
        throw new Error(`Invalid nutrition field: ${field}`)
      }
    }
    
    // Validate category
    const validCategories = categories.map(c => c.value)
    if (!validCategories.includes(food.category)) {
      throw new Error(`Invalid category: ${food.category}`)
    }
    
    return true
  }

  // Handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast.error('يرجى اختيار ملف JSON صحيح')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        setImporting(true)
        const jsonData = JSON.parse(e.target.result)
        
        if (!Array.isArray(jsonData)) {
          throw new Error('JSON file must contain an array of food items')
        }

        // Validate all items first
        const validatedFoods = []
        for (let i = 0; i < jsonData.length; i++) {
          try {
            validateFoodItem(jsonData[i])
            validatedFoods.push({
              ...jsonData[i],
              isPublic: jsonData[i].isPublic !== false, // Default to true
              servingSize: jsonData[i].servingSize || { amount: 100, unit: 'g' }
            })
          } catch (error) {
            console.warn(`Skipping item ${i + 1}: ${error.message}`)
          }
        }

        if (validatedFoods.length === 0) {
          throw new Error('No valid food items found in the file')
        }

        // Import foods one by one
        let successCount = 0
        let errorCount = 0
        
        for (const food of validatedFoods) {
          try {
            await api.post('/foods', food)
            successCount++
          } catch (error) {
            errorCount++
            console.error('Failed to import food:', food.name, error)
          }
        }

        toast.success(`تم استيراد ${successCount} عنصر بنجاح${errorCount > 0 ? ` (${errorCount} فشل)` : ''}`)
        fetchFoods()
        fetchTotalCount()
        
      } catch (error) {
        console.error('Import error:', error)
        toast.error(`خطأ في الاستيراد: ${error.message}`)
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
  }

  // Trigger file input with confirmation
  const triggerFileInput = () => {
    const confirmed = confirm(
      'هل أنت متأكد من استيراد البيانات؟\n' +
      'سيتم إضافة جميع الأطعمة من الملف إلى قاعدة البيانات.\n' +
      'تأكد من أن الملف يحتوي على بيانات صحيحة.'
    )
    
    if (confirmed && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Delete all foods with multiple confirmations
  const deleteAllFoods = async () => {
    // First confirmation
    const firstConfirm = confirm(
      '⚠️ تحذير: حذف جميع الأطعمة\n\n' +
      'هذا الإجراء سيحذف جميع الأطعمة من قاعدة البيانات نهائياً!\n' +
      'هل أنت متأكد من المتابعة؟'
    )
    
    if (!firstConfirm) return

    // Second confirmation with typing requirement
    const confirmText = prompt(
      'للتأكيد، اكتب "حذف جميع الأطعمة" بالضبط:\n\n' +
      'تحذير: هذا الإجراء لا يمكن التراجع عنه!'
    )
    
    if (confirmText !== 'حذف جميع الأطعمة') {
      toast.error('تم إلغاء العملية - النص غير صحيح')
      return
    }

    // Final confirmation
    const finalConfirm = confirm(
      '🚨 التأكيد الأخير 🚨\n\n' +
      `سيتم حذف ${foods.length} عنصر غذائي نهائياً!\n` +
      'هل أنت متأكد 100% من هذا الإجراء؟'
    )
    
    if (!finalConfirm) return

    try {
      setDeleting(true)
      
      // Delete all foods one by one to ensure proper cleanup
      let deletedCount = 0
      let errorCount = 0
      
      for (const food of foods) {
        try {
          await api.delete(`/foods/${food._id}`)
          deletedCount++
        } catch (error) {
          errorCount++
          console.error('Failed to delete food:', food.name, error)
        }
      }
      
      toast.success(`تم حذف ${deletedCount} عنصر${errorCount > 0 ? ` (${errorCount} فشل)` : ''}`)
      fetchFoods()
      fetchTotalCount()
      
    } catch (error) {
      console.error('Delete all error:', error)
      toast.error('حدث خطأ أثناء حذف الأطعمة')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold gradient-text">الأطعمة</h1>
          <div className="badge bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
            {query || category || Object.values(filters).some(f => f) ? (
              `${filteredAndSortedFoods.length} من ${foods.length} عنصر`
            ) : (
              `${foods.length} عنصر`
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-3">
            <button 
              className="rounded-xl px-4 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-2"
              onClick={deleteAllFoods}
              disabled={deleting || foods.length === 0}
            >
              <AlertTriangle className="w-4 h-4" />
              {deleting ? 'جاري الحذف...' : 'حذف الكل'}
            </button>
            <button 
              className="rounded-xl px-4 py-2 border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-2"
              onClick={triggerFileInput}
              disabled={importing}
            >
              <Upload className="w-4 h-4" />
              {importing ? 'جاري الاستيراد...' : 'استيراد JSON'}
            </button>
            <button 
              className="btn-primary"
              onClick={() => { setShowForm(true); setEditing(null) }}
            >
              <Plus className="w-4 h-4" />
              إضافة طعام
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      <div className="card p-4 sm:p-6 space-y-4">
        {/* Main Search and Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              className="input pl-10" 
              placeholder="ابحث عن طعام" 
              value={query} 
              onChange={e => setQuery(e.target.value)} 
            />
          </div>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">كل التصنيفات</option>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="input" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button 
              className={`rounded-xl px-3 py-2 border transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'border-primary-300 bg-primary-50 text-primary-700' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              فلترة
            </button>
            <button 
              className="rounded-xl px-3 py-2 border border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={() => { 
                setQuery(''); 
                setCategory(''); 
                clearFilters(); 
                fetchFoods() 
              }}
            >
              تفريغ
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="label text-sm font-medium mb-2">السعرات الحرارية</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="من"
                      value={filters.caloriesMin}
                      onChange={e => setFilters({...filters, caloriesMin: e.target.value})}
                    />
                    <input
                      type="number"
                      className="input text-sm"
                      placeholder="إلى"
                      value={filters.caloriesMax}
                      onChange={e => setFilters({...filters, caloriesMax: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-sm font-medium mb-2">البروتين (جم)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="من"
                      value={filters.proteinMin}
                      onChange={e => setFilters({...filters, proteinMin: e.target.value})}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="إلى"
                      value={filters.proteinMax}
                      onChange={e => setFilters({...filters, proteinMax: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-sm font-medium mb-2">الكربوهيدرات (جم)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="من"
                      value={filters.carbsMin}
                      onChange={e => setFilters({...filters, carbsMin: e.target.value})}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="إلى"
                      value={filters.carbsMax}
                      onChange={e => setFilters({...filters, carbsMax: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="label text-sm font-medium mb-2">الدهون (جم)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="من"
                      value={filters.fatMin}
                      onChange={e => setFilters({...filters, fatMin: e.target.value})}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="input text-sm"
                      placeholder="إلى"
                      value={filters.fatMax}
                      onChange={e => setFilters({...filters, fatMax: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="rounded-xl px-4 py-2 border border-slate-200 hover:bg-slate-50 transition-colors text-sm"
                  onClick={clearFilters}
                >
                  مسح الفلاتر
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LoadingSkeleton type="food" count={6} />
        </div>
      ) : filteredAndSortedFoods.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">لا توجد نتائج</h3>
          <p className="text-slate-500 mb-4">
            {query || category || Object.values(filters).some(f => f) 
              ? 'لم يتم العثور على أطعمة تطابق معايير البحث والفلترة'
              : 'لا توجد أطعمة في قاعدة البيانات'
            }
          </p>
          {(query || category || Object.values(filters).some(f => f)) && (
            <button
              className="btn-primary"
              onClick={() => { 
                setQuery(''); 
                setCategory(''); 
                clearFilters(); 
                fetchFoods() 
              }}
            >
              مسح جميع الفلاتر
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedFoods.map((food) => (
            <div key={food._id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-slate-800 mb-1">
                    {food.nameAr || food.name}
                  </div>
                  <div className="text-xs text-slate-500">{food.brand || 'غير محدد'}</div>
                </div>
                <div className="badge bg-accent-100 text-accent-700">
                  {getDisplayLabel(food)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-primary-50 text-center">
                  <div className="font-bold text-primary-700">{food.nutrition.calories}</div>
                  <div className="text-xs text-primary-600">سعرة</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 text-center">
                  <div className="font-bold text-rose-700">{food.nutrition.protein}</div>
                  <div className="text-xs text-rose-600">بروتين</div>
                </div>
                <div className="p-2 rounded-lg bg-sky-50 text-center">
                  <div className="font-bold text-sky-700">{food.nutrition.carbs}</div>
                  <div className="text-xs text-sky-600">كربوهيدرات</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 text-center">
                  <div className="font-bold text-emerald-700">{food.nutrition.fat}</div>
                  <div className="text-xs text-emerald-600">دهون</div>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <button 
                    className="btn-primary flex-1 text-sm"
                    onClick={() => onEdit(food)}
                  >
                    <Edit3 className="w-3 h-3" />
                    تعديل
                  </button>
                  <button 
                    className="flex-1 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-sm flex items-center justify-center gap-1"
                    onClick={() => onDelete(food)}
                  >
                    <Trash2 className="w-3 h-3" />
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && showForm && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold">{editing ? 'تعديل طعام' : 'إضافة طعام'}</div>
              <button onClick={() => setShowForm(false)} className="rounded-xl px-3 py-1 hover:bg-slate-100">إغلاق</button>
            </div>
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="label">الاسم (إنجليزي)</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">الاسم (عربي)</label>
                <input className="input" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} />
              </div>
              <div>
                <label className="label">التصنيف</label>
                <select className="input" value={form.category} onChange={e => handleCategoryChange(e.target.value)}>
                  {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">العلامة التجارية</label>
                <input className="input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <label className="label">الكمية</label>
                <input className="input" type="number" value={form.servingSize.amount} onChange={e => setForm({ ...form, servingSize: { ...form.servingSize, amount: +e.target.value } })} required />
              </div>
              <div>
                <label className="label">الوحدة</label>
                <select className="input" value={form.servingSize.unit} onChange={e => setForm({ ...form, servingSize: { ...form.servingSize, unit: e.target.value } })}>
                  {availableUnits.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">سعرات/{form.servingSize.amount} {availableUnits.find(u => u.value === form.servingSize.unit)?.label || 'وحدة'}</label>
                <input className="input" type="number" value={form.nutrition.calories} onChange={e => setForm({ ...form, nutrition: { ...form.nutrition, calories: +e.target.value } })} required />
              </div>
              <div>
                <label className="label">بروتين/{form.servingSize.amount} {availableUnits.find(u => u.value === form.servingSize.unit)?.label || 'وحدة'}</label>
                <input className="input" type="number" step="0.1" value={form.nutrition.protein} onChange={e => setForm({ ...form, nutrition: { ...form.nutrition, protein: +e.target.value } })} required />
              </div>
              <div>
                <label className="label">كربوهيدرات/{form.servingSize.amount} {availableUnits.find(u => u.value === form.servingSize.unit)?.label || 'وحدة'}</label>
                <input className="input" type="number" step="0.1" value={form.nutrition.carbs} onChange={e => setForm({ ...form, nutrition: { ...form.nutrition, carbs: +e.target.value } })} required />
              </div>
              <div>
                <label className="label">دهون/{form.servingSize.amount} {availableUnits.find(u => u.value === form.servingSize.unit)?.label || 'وحدة'}</label>
                <input className="input" type="number" step="0.1" value={form.nutrition.fat} onChange={e => setForm({ ...form, nutrition: { ...form.nutrition, fat: +e.target.value } })} required />
              </div>
              <div className="md:col-span-3">
                <label className="label">الوصف</label>
                <textarea className="input min-h-[90px]" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="md:col-span-3 flex items-center gap-2">
                <input id="isPublic" type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} />
                <label htmlFor="isPublic" className="text-sm text-slate-700">جعل الطعام عاماً</label>
              </div>
              <div className="md:col-span-3 flex gap-2 justify-end">
                <button type="button" className="rounded-xl px-4 py-2 border" onClick={() => setShowForm(false)}>إلغاء</button>
                <button className="btn-primary">{editing ? 'تحديث' : 'إضافة'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  )
}
