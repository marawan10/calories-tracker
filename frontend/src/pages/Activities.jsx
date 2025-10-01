import React, { useEffect, useState, useMemo } from 'react'
import { Search, Plus, X, Activity, Clock, Flame, Edit, Trash2, Calendar, TrendingUp, Zap, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { toISODate } from '../utils/date'
import { formatNutrition } from '../utils/formatNumber'
import GoogleFitDebug from '../components/GoogleFitDebug'
import GoogleFitIntegration from '../components/GoogleFitIntegration'

export default function Activities() {
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [activities, setActivities] = useState([])
  const [predefinedActivities, setPredefinedActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState(null)
  const [dailyTotals, setDailyTotals] = useState(null)
  const [form, setForm] = useState({
    caloriesBurned: 0,
    notes: ''
  })
  const [googleFitData, setGoogleFitData] = useState(null)
  const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false)

  // Check if there's already an entry for the selected date
  const dailyEntry = useMemo(() => {
    return activities.find(activity => 
      activity.name === 'نشاط من الساعة الذكية' && 
      new Date(activity.date).toDateString() === new Date(date).toDateString()
    )
  }, [activities, date])

  const hasEntryForToday = Boolean(dailyEntry)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/activities', { params: { date } })
      setActivities(data.activities)
      setDailyTotals(data.dailyTotals)
    } finally {
      setLoading(false)
    }
  }

  const fetchPredefinedActivities = async () => {
    try {
      const { data } = await api.get('/activities/predefined')
      setPredefinedActivities(data.activities)
    } catch (error) {
      console.error('Error loading predefined activities:', error)
    }
  }

  useEffect(() => { fetchActivities() }, [date])
  useEffect(() => { fetchPredefinedActivities() }, [])

  // Calculate BMR (Basal Metabolic Rate) - approximate daily calories burned at rest
  const calculateBMR = () => {
    // Using average BMR of ~1800 calories per day = ~75 calories per hour = ~1.25 calories per minute
    // For activities, we'll estimate BMR portion and subtract it
    return 1800 // Daily BMR - will be prorated based on activity duration
  }

  // Calculate activity-only calories (excluding BMR)
  const getActivityOnlyCalories = (totalCalories, steps) => {
    const bmrPerDay = calculateBMR()
    const bmrPerStep = bmrPerDay / 10000 // Assuming 10,000 steps baseline per day
    const estimatedBMRCalories = Math.min(steps * bmrPerStep * 0.3, totalCalories * 0.4) // Cap BMR at 40% of total
    
    const activityCalories = Math.max(totalCalories - estimatedBMRCalories, totalCalories * 0.6)
    return Math.round(activityCalories)
  }

  // Handle Google Fit data sync
  const handleGoogleFitDataSync = (fitData) => {
    console.log('Google Fit data received:', fitData)
    setGoogleFitData(fitData)
    
    // Calculate activity-only calories (excluding BMR)
    const activityOnlyCalories = fitData ? getActivityOnlyCalories(fitData.calories, fitData.steps) : 0
    
    // Auto-update existing entry if connected to Google Fit
    if (fitData && fitData.calories > 0 && isGoogleFitConnected && dailyEntry) {
      updateGoogleFitEntry(activityOnlyCalories, fitData)
    }
    
    // Auto-populate form with Google Fit data if available and no entry exists
    if (fitData && fitData.calories > 0 && !dailyEntry) {
      setForm(prev => ({
        ...prev,
        caloriesBurned: activityOnlyCalories,
        notes: `بيانات من Google Fit - ${fitData.steps} خطوة، ${(fitData.distance / 1000).toFixed(1)} كم (نشاط فقط، بدون BMR)`
      }))
    }
  }

  // Auto-update Google Fit entry
  const updateGoogleFitEntry = async (activityCalories, fitData) => {
    try {
      const payload = {
        name: 'نشاط من الساعة الذكية',
        nameAr: 'نشاط من الساعة الذكية',
        type: 'other',
        caloriesBurned: activityCalories,
        notes: `بيانات من Google Fit - ${fitData.steps} خطوة، ${(fitData.distance / 1000).toFixed(1)} كم (نشاط فقط، بدون BMR)`,
        date: date,
        isFromGoogleFit: true
      }

      await api.put(`/activities/${dailyEntry._id}`, payload)
      console.log('✅ Auto-updated Google Fit entry with activity-only calories')
      
      // Refresh activities to show updated data
      fetchActivities()
    } catch (error) {
      console.error('Failed to auto-update Google Fit entry:', error)
    }
  }

  // Handle Google Fit connection status
  const handleGoogleFitConnection = (connected) => {
    setIsGoogleFitConnected(connected)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      // Simple payload with calories directly from smartwatch
      const payload = { 
        name: 'نشاط من الساعة الذكية',
        nameAr: 'نشاط من الساعة الذكية',
        type: 'other',
        caloriesBurned: form.caloriesBurned, // Use calories directly from smartwatch
        notes: form.notes,
        date: date,
        isFromGoogleFit: isGoogleFitConnected && googleFitData // Mark if from Google Fit
      }
      
      if (editingActivity || dailyEntry) {
        // Update existing entry
        const entryToUpdate = editingActivity || dailyEntry
        await api.put(`/activities/${entryToUpdate._id}`, payload)
        toast.success('تم تحديث بيانات الساعة الذكية')
      } else {
        // Create new entry only if no entry exists for this date
        await api.post('/activities', payload)
        toast.success('تم حفظ بيانات الساعة الذكية')
      }
      
      setShowForm(false)
      setEditingActivity(null)
      setForm({ caloriesBurned: 0, notes: '' })
      fetchActivities()
    } catch (e) {
      toast.error(e?.response?.data?.message || 'فشل في حفظ البيانات')
    }
  }

  const onEdit = (activity) => {
    setForm({
      caloriesBurned: activity.caloriesBurned,
      notes: activity.notes || ''
    })
    setEditingActivity(activity)
    setShowForm(true)
  }

  const onDelete = async (activity) => {
    if (!confirm('حذف هذا النشاط؟')) return
    try {
      await api.delete(`/activities/${activity._id}`)
      toast.success('تم الحذف')
      fetchActivities()
    } catch (e) {
      toast.error('فشل الحذف')
    }
  }

  const quickAddActivity = (predefined) => {
    setForm({
      name: predefined.name,
      nameAr: predefined.nameAr,
      type: predefined.type,
      duration: 30,
      intensity: predefined.intensity,
      metValue: predefined.metValue,
      notes: ''
    })
    setShowForm(true)
  }

  const getActivityTypeIcon = (type) => {
    switch (type) {
      case 'cardio': return <Activity className="w-5 h-5" />
      case 'strength': return <Zap className="w-5 h-5" />
      case 'sports': return <TrendingUp className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }

  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'cardio': return 'bg-red-100 text-red-600 border-red-200'
      case 'strength': return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'sports': return 'bg-green-100 text-green-600 border-green-200'
      case 'daily': return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
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
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">بيانات الساعة الذكية</h1>
              <motion.span 
                className={`px-3 py-1 text-xs font-medium rounded-full border ${
                  isGoogleFitConnected 
                    ? 'bg-gradient-to-r from-green-100 to-blue-100 text-green-600 border-green-200'
                    : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-600 border-orange-200'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {isGoogleFitConnected ? 'متصل بـ Google Fit' : 'غير متصل'}
              </motion.span>
            </div>
            <p className="text-slate-500 mt-1">
              {isGoogleFitConnected 
                ? 'مزامنة تلقائية مع Google Fit للحصول على بيانات دقيقة'
                : 'اتصل بـ Google Fit للحصول على بيانات تلقائية من ساعتك الذكية'
              }
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {hasEntryForToday ? (
            // Show edit button only if NOT from Google Fit, or show different text if from Google Fit
            dailyEntry?.isFromGoogleFit || (isGoogleFitConnected && googleFitData) ? (
              <motion.div 
                className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200"
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">محدث تلقائياً من Google Fit</span>
              </motion.div>
            ) : (
              <motion.button 
                className="btn-secondary flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  setForm({
                    caloriesBurned: dailyEntry.caloriesBurned,
                    notes: dailyEntry.notes || ''
                  })
                  setEditingActivity(dailyEntry)
                  setShowForm(true)
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit className="w-4 h-4" />
                تعديل بيانات اليوم
              </motion.button>
            )
          ) : (
            <motion.button 
              className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              إدخال بيانات الساعة
            </motion.button>
          )}
          
          {/* Google Fit Quick Sync - only show if connected and no entry exists */}
          {!hasEntryForToday && isGoogleFitConnected && googleFitData && (
            <motion.button 
              className="px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 rounded-xl border border-green-200 hover:from-green-200 hover:to-blue-200 transition-all text-sm font-medium flex items-center gap-2"
              onClick={() => {
                const activityCalories = getActivityOnlyCalories(googleFitData.calories, googleFitData.steps)
                setForm({ 
                  caloriesBurned: activityCalories, 
                  notes: `بيانات من Google Fit - ${googleFitData.steps} خطوة، ${(googleFitData.distance / 1000).toFixed(1)} كم (نشاط فقط، بدون BMR)`
                })
                setShowForm(true)
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Smartphone className="w-4 h-4" />
              {getActivityOnlyCalories(googleFitData.calories, googleFitData.steps)} سعرة نشاط
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Google Fit Debug Panel - Only show in development */}
      {import.meta.env.DEV && <GoogleFitDebug />}

      {/* Date Selector */}
      <div className="card p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div>
              <div className="font-semibold text-slate-800">اختر التاريخ</div>
              <div className="text-sm text-slate-500">عرض أنشطة يوم محدد</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 md:max-w-xs">
              <input 
                className="input w-full border-orange-200 focus:border-orange-400 focus:ring-orange-100" 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
              />
            </div>
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              {hasEntryForToday ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">تم الإدخال</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium">لم يتم الإدخال</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Fit Integration */}
      <GoogleFitIntegration 
        onDataSync={handleGoogleFitDataSync}
        onConnectionChange={handleGoogleFitConnection}
      />

      {loading ? (
        <motion.div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
          <div className="text-slate-500 font-medium">جاري تحميل الأنشطة...</div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {activities.length === 0 ? (
                <motion.div className="card p-12 text-center">
                  <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">لا توجد بيانات مسجلة</h3>
                  <p className="text-slate-500 mb-6">ابدأ بإدخال بيانات النشاط من ساعتك الذكية</p>
                  <button 
                    className="btn-primary flex items-center gap-2 mx-auto"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    إدخال بيانات الساعة
                  </button>
                </motion.div>
              ) : (
                activities.map((activity, index) => (
                  <motion.div 
                    key={activity._id} 
                    className="card p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityTypeColor(activity.type)}`}>
                          {getActivityTypeIcon(activity.type)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-lg">
                            {activity.nameAr || activity.name}
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {formatNutrition(activity.caloriesBurned)} سعرة محروقة
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              من الساعة الذكية
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.button 
                          className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors" 
                          onClick={() => onEdit(activity)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button 
                          className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors" 
                          onClick={() => onDelete(activity)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 min-w-[200px]">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Flame className="w-5 h-5 text-red-500" />
                          <span className="font-semibold text-slate-700">السعرات المحروقة</span>
                        </div>
                        <div className="font-bold text-2xl text-red-600">{formatNutrition(activity.caloriesBurned)}</div>
                        <div className="text-red-500 text-sm">من الساعة الذكية</div>
                      </div>
                    </div>

                    {activity.notes && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-l-blue-400">
                        <div className="text-sm text-blue-800">{activity.notes}</div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            {dailyTotals && (
              <motion.div 
                className="card p-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-bold text-slate-800">إجمالي اليوم</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-slate-600">السعرات المحروقة</span>
                    <span className="font-bold text-lg text-red-600">{formatNutrition(dailyTotals.totalCaloriesBurned)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-slate-600">إجمالي الوقت</span>
                    <span className="font-bold text-blue-600">{dailyTotals.totalDuration} دقيقة</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="text-slate-600">عدد الأنشطة</span>
                    <span className="font-bold text-green-600">{dailyTotals.activityCount}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm" 
            onClick={() => setShowForm(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-slate-800">
                      {editingActivity || hasEntryForToday ? 'تعديل بيانات الساعة الذكية' : 'إدخال بيانات الساعة الذكية'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {editingActivity || hasEntryForToday ? 'قم بتعديل البيانات المسجلة لهذا اليوم' : 'أدخل البيانات التي تظهر على ساعتك الذكية (مرة واحدة يومياً)'}
                    </div>
                  </div>
                </div>
                <motion.button 
                  onClick={() => {
                    setShowForm(false)
                    setEditingActivity(null)
                    setForm({ name: '', nameAr: '', type: 'cardio', duration: 30, intensity: 'moderate', metValue: 5.0, notes: '' })
                  }} 
                  className="p-2 rounded-xl hover:bg-slate-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-slate-600" />
                </motion.button>
              </div>
              
              <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Google Fit Status Notice */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-xl border ${
                      isGoogleFitConnected 
                        ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                        : 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isGoogleFitConnected ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        <Smartphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {isGoogleFitConnected ? 'متصل بـ Google Fit' : 'إدخال يدوي'}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {isGoogleFitConnected 
                            ? 'البيانات محدثة تلقائياً من Google Fit'
                            : 'اتصل بـ Google Fit للحصول على بيانات تلقائية'
                          }
                        </p>
                      </div>
                    </div>
                    {isGoogleFitConnected && googleFitData ? (
                      <div className="bg-white p-4 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-slate-700">بيانات اليوم من Google Fit:</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-red-600">{getActivityOnlyCalories(googleFitData.calories, googleFitData.steps)}</div>
                            <div className="text-gray-500">سعرة نشاط</div>
                            <div className="text-xs text-gray-400">من أصل {googleFitData.calories}</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{googleFitData.steps}</div>
                            <div className="text-gray-500">خطوة</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{(googleFitData.distance / 1000).toFixed(1)}</div>
                            <div className="text-gray-500">كم</div>
                          </div>
                        </div>
                      </div>
                    ) : !isGoogleFitConnected && (
                      <div className="bg-white p-4 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="w-4 h-4 text-orange-600" />
                          <span className="font-medium text-slate-700">كيفية الاستخدام:</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          أدخل إجمالي السعرات المحروقة يدوياً أو اتصل بـ Google Fit للحصول على البيانات تلقائياً
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Ultra Simple Form - Just Calories */}
                  <div className="max-w-md mx-auto">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Flame className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">السعرات المحروقة</h3>
                      <p className="text-sm text-slate-500">أدخل الرقم الذي يظهر على ساعتك الذكية</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">
                          إجمالي السعرات المحروقة
                        </label>
                        <input
                          type="number"
                          value={form.caloriesBurned}
                          onChange={(e) => setForm(prev => ({ ...prev, caloriesBurned: parseInt(e.target.value) || 0 }))}
                          className={`w-full text-center text-4xl font-bold bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 ${
                            (dailyEntry?.isFromGoogleFit || (isGoogleFitConnected && googleFitData)) ? 'cursor-not-allowed opacity-70' : ''
                          }`}
                          placeholder="0"
                          min="0"
                          max="5000"
                          required
                          readOnly={dailyEntry?.isFromGoogleFit || (isGoogleFitConnected && googleFitData)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات (اختيارية)</label>
                        <textarea
                          rows="3"
                          placeholder="أضف ملاحظات حول النشاط..."
                          value={form.notes} 
                          onChange={e => setForm({ ...form, notes: e.target.value })}
                          className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                            (dailyEntry?.isFromGoogleFit || (isGoogleFitConnected && googleFitData)) ? 'cursor-not-allowed opacity-70 bg-gray-50' : ''
                          }`}
                          readOnly={dailyEntry?.isFromGoogleFit || (isGoogleFitConnected && googleFitData)}
                        />
                      </div>
                    </div>
                
                {/* Footer */}
                <div className="p-6 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-slate-600">
                      أدخل البيانات كما تظهر على ساعتك الذكية بدقة
                    </div>
                    <div className="flex gap-3">
                      <motion.button 
                        type="button" 
                        className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 font-medium" 
                        onClick={() => {
                          setShowForm(false)
                          setEditingActivity(null)
                          setForm({ caloriesBurned: 0, notes: '' })
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        إلغاء
                      </motion.button>
                      <motion.button 
                        className="btn-primary px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Activity className="w-5 h-5" />
                        {editingActivity || hasEntryForToday ? 'تحديث البيانات' : 'حفظ بيانات الساعة'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
