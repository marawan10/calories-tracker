import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Target, TrendingUp, Zap, Flame, Utensils, Calendar, Crown, ChevronRight, Plus } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { toISODate, getCurrentWeekRange, rangeDays, getWeekDayLabels, addDays } from '../utils/date'
import { formatNutrition } from '../utils/formatNumber'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import GlassLineChart from '../components/charts/GlassLineChart'
import DonutChart from '../components/charts/DonutChart'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { SkeletonStats, SkeletonChart } from '../components/ui/EnhancedSkeleton'
import { AnimatedCounter, ProgressRing } from '../components/ui/MicroInteractions'
import GoogleFitIntegration from '../components/GoogleFitIntegration'

export default function Dashboard() {
  const [today, setToday] = useState(() => toISODate(new Date()))
  const [daily, setDaily] = useState({ dailyTotals: {}, mealsByType: {}, totalMeals: 0 })
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 65 })
  const [cumulative, setCumulative] = useState(null)
  const [activityData, setActivityData] = useState(null)
  const [cumulativeActivityData, setCumulativeActivityData] = useState(null)
  const [userStartDate, setUserStartDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        // First get user info to determine start date
        const { data: me } = await api.get('/auth/me')
        setGoals(me.user?.dailyGoals || goals)
        
        // Get user's first meal date for cumulative calculations
        let startDate = userStartDate
        if (!startDate) {
          try {
            // Get meals sorted by date ascending to find the earliest
            const { data: firstMealRes } = await api.get('/meals', { 
              params: { 
                limit: 1, 
                page: 1,
                // We need to get the oldest meal, but the API sorts by date descending by default
                // So let's use a large date range to get all data and find the earliest
              } 
            })
            
            if (firstMealRes.meals && firstMealRes.meals.length > 0) {
              // The API returns meals sorted by date descending, so we need to get all meals to find the earliest
              // For now, let's use 90 days ago as a safe starting point to capture most historical data
              startDate = toISODate(addDays(new Date(), -90))
              setUserStartDate(startDate)
              console.log('Using 90 days ago as start date for cumulative tracking:', startDate)
            } else {
              // If no meals exist, use 30 days ago as default
              startDate = toISODate(addDays(new Date(), -30))
              setUserStartDate(startDate)
              console.log('No meals found, using 30 days ago as default:', startDate)
            }
          } catch (error) {
            console.error('Error fetching first meal date:', error)
            // Fallback to 90 days ago to capture more historical data
            startDate = toISODate(addDays(new Date(), -90))
            setUserStartDate(startDate)
            console.log('Error occurred, using 90 days ago as fallback:', startDate)
          }
        }
        
        console.log('Fetching cumulative data from', startDate, 'to', today)
        
        const [{ data: dailyRes }, { data: stats }, activityRes, cumulativeActivityRes] = await Promise.all([
          api.get(`/meals/daily/${today}`),
          api.get(`/meals/stats?startDate=${startDate}&endDate=${today}`),
          api.get('/activities', { params: { date: today } }).catch(() => ({ data: { dailyTotals: null } })),
          api.get('/activities/stats/summary', { params: { startDate: startDate, endDate: today } }).catch(() => ({ data: { summary: null } }))
        ])
        
        console.log('Cumulative stats received:', stats)
        console.log('Daily data count:', stats?.dailyData?.length)
        setDaily(dailyRes)
        setCumulative(stats)
        setActivityData(activityRes.data?.dailyTotals)
        setCumulativeActivityData(cumulativeActivityRes.data?.summary)
        
        console.log('State updated with cumulative data:', {
          dailyDataCount: stats?.dailyData?.length,
          totalMeals: stats?.totalMeals,
          avgCaloriesPerDay: stats?.avgCaloriesPerDay
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [today, refreshTrigger])

  // Add a function to refresh dashboard data
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'meals_updated') {
        setRefreshTrigger(prev => prev + 1)
        localStorage.removeItem('meals_updated')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events within the same tab
    const handleMealsUpdate = () => {
      setRefreshTrigger(prev => prev + 1)
    }
    
    window.addEventListener('meals_updated', handleMealsUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('meals_updated', handleMealsUpdate)
    }
  }, [])

  const donutData = useMemo(() => {
    const { protein = 0, carbs = 0, fat = 0, calories = 0 } = daily.dailyTotals || {}
    const totalMacros = protein + carbs + fat
    
    return { 
      labels: ['بروتين', 'كربوهيدرات', 'دهون'], 
      data: [protein, carbs, fat],
      goals: [goals.protein, goals.carbs, goals.fat],
      totalCalories: calories,
      totalMacros,
      percentages: totalMacros > 0 ? [
        ((protein / totalMacros) * 100).toFixed(1),
        ((carbs / totalMacros) * 100).toFixed(1),
        ((fat / totalMacros) * 100).toFixed(1)
      ] : [0, 0, 0]
    }
  }, [daily, goals])

  // Calculate TDEE for recommended calories
  const calculateTDEE = () => {
    if (!user?.profile?.age || !user?.profile?.gender || !user?.profile?.height || !user?.profile?.weight || !user?.profile?.activityLevel) {
      return goals.calories || 2000 // Fallback to user's goal or default
    }
    
    const { age, gender, height, weight, activityLevel } = user.profile
    
    // BMR calculation (Mifflin-St Jeor Equation)
    let bmr
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }
    
    return Math.round(bmr * activityMultipliers[activityLevel])
  }
  
  const recommendedDaily = calculateTDEE()

  // Cumulative series calculation - show all available data or last 30 days
  const cumulativeSeries = useMemo(() => {
    if (!cumulative || !cumulative.dailyData) return { labels: [], datasets: [] }
    
    // Use all available data if less than 30 days, otherwise show last 30 days
    let dataToShow = cumulative.dailyData
    
    if (cumulative.dailyData.length > 30) {
      // Sort by date and take last 30 days
      dataToShow = cumulative.dailyData
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30)
    } else {
      // Show all data if less than 30 days
      dataToShow = cumulative.dailyData.sort((a, b) => new Date(a.date) - new Date(b.date))
    }
    
    const labels = dataToShow.map(d => {
      const date = new Date(d.date)
      return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
    })

    const values = dataToShow.map(d => d.calories || 0)
    const goalLine = dataToShow.map(() => goals.calories || 0)
    const recommendedLine = dataToShow.map(() => recommendedDaily || 0)

    return {
      labels,
      datasets: [
        {
          label: 'السعرات الحرارية',
          data: values,
          fill: false,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,.2)',
          tension: 0.1
        },
        {
          label: 'الهدف',
          data: goalLine,
          borderDash: [6,4],
          borderColor: '#64748b',
          backgroundColor: 'transparent',
          pointRadius: 0
        },
        {
          label: 'الموصي به',
          data: recommendedLine,
          borderDash: [10,5],
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          pointRadius: 0
        },
      ]
    }
  }, [cumulative, goals.calories, recommendedDaily, user])

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="skeleton h-8 w-48 rounded"></div>
          <div className="skeleton h-6 w-6 rounded-full"></div>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <LoadingSkeleton type="stat" count={4} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton type="chart" count={2} />
          <LoadingSkeleton type="chart" count={1} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton type="card" count={2} />
        </div>
      </div>
    )
  }

  const t = daily.dailyTotals || {}
  const cumulativeActual = cumulative ? cumulative.dailyData.reduce((s, d) => s + (d.calories || 0), 0) : 0
  const cumulativeBurned = cumulativeActivityData?.totalCaloriesBurned || 0
  const goalDaily = goals.calories || recommendedDaily
  const daysTracked = cumulative?.dailyData?.length || 1
  
  const cumulativeRecommended = recommendedDaily * daysTracked
  const cumulativeGoal = goalDaily * daysTracked
  const cumulativeDiff = cumulativeActual - cumulativeGoal
  
  // Weight loss analysis based on CUMULATIVE consumption AND calories burned from smart watch
  const cumulativeDeficit = (cumulativeRecommended - cumulativeActual) + cumulativeBurned // Total calories saved
  const totalExpectedWeightLoss = cumulativeDeficit / 7700 // Total kg lost since start
  const avgWeeklyWeightLoss = totalExpectedWeightLoss / (daysTracked / 7) // Average per week
  const monthlyWeightLoss = avgWeeklyWeightLoss * 4.33 // Average weeks per month

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Stats Skeleton */}
        <SkeletonStats count={5} />
        
        {/* Analytics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                  <div className="h-3 bg-slate-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="h-16 bg-slate-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Chart Skeleton */}
        <SkeletonChart />
      </div>
    )
  }

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Enhanced Header with Quick Actions */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold gradient-text">لوحة التحكم</h1>
              {user?.role === 'admin' && (
                <motion.div 
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Crown className="w-3 h-3" />
                  <span>مدير النظام</span>
                </motion.div>
              )}
            </div>
            <p className="text-slate-500 mt-1">مرحباً {user?.name}، إليك ملخص يومك الغذائي</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Add Meal Button */}
          <motion.button
            onClick={() => window.location.href = '/meals'}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">إضافة وجبة</span>
          </motion.button>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{new Date().toLocaleDateString('ar-EG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="سعرات مستهلكة" 
          value={t.calories || 0}
          suffix=" كالوري"
          subtitle={`الهدف: ${goals.calories} كالوري`}
          icon={<Utensils className="w-5 h-5" />}
          delay={0.1}
          isNumeric={true}
        />
        <StatCard 
          title="سعرات محروقة" 
          value={cumulativeActivityData?.totalCaloriesBurned || 0}
          suffix=" كالوري"
          subtitle={`إجمالي ${daysTracked} يوم`}
          gradient="from-red-500 to-orange-500"
          icon={<Flame className="w-5 h-5" />}
          delay={0.2}
          isNumeric={true}
        />
        <StatCard 
          title="البروتين" 
          value={t.protein || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.protein} جم`}
          gradient="from-rose-500 to-pink-500"
          icon={<Target className="w-5 h-5" />}
          delay={0.3}
          isNumeric={true}
        />
        <StatCard 
          title="الكربوهيدرات" 
          value={t.carbs || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.carbs} جم`}
          gradient="from-sky-500 to-cyan-500"
          icon={<TrendingUp className="w-5 h-5" />}
          delay={0.4}
          isNumeric={true}
        />
        <StatCard 
          title="الدهون" 
          value={t.fat || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.fat} جم`}
          gradient="from-emerald-500 to-teal-500"
          icon={<Activity className="w-5 h-5" />}
          delay={0.5}
          isNumeric={true}
        />
      </div>

      {/* Net Calories Summary Card */}
      <motion.div 
        className="card p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">صافي السعرات التراكمي</h3>
              <p className="text-slate-500 text-sm">إجمالي الفرق بين المستهلك والمحروق</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600">
              {(cumulativeActual - (cumulativeActivityData?.totalCaloriesBurned || 0)).toLocaleString()}
            </div>
            <div className="text-sm text-slate-500">سعرة حرارية (خلال {daysTracked} يوم)</div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Analytics Section */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        {/* Streak Counter */}
        <motion.div 
          className="card p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-800">إجمالي الأيام</h3>
              <p className="text-xs text-emerald-600">أيام التتبع التراكمية</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              <AnimatedCounter 
                value={cumulative?.dailyData?.filter(d => d.calories > 0).length || 0}
                duration={1.5}
              />
            </div>
            <div className="text-sm text-emerald-700 font-medium">يوم من إجمالي {daysTracked} يوم</div>
            <div className="mt-3 p-2 bg-emerald-100 rounded-lg">
              <div className="text-xs text-emerald-600 text-center">
                معدل التتبع: {Math.round((cumulative?.dailyData?.filter(d => d.calories > 0).length / daysTracked) * 100)}%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div 
          className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-blue-800">التقدم التراكمي</h3>
              <p className="text-xs text-blue-600">مقارنة بالأهداف التراكمية</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <ProgressRing 
              progress={Math.min((cumulativeActual / cumulativeGoal) * 100, 100)}
              size={80}
              color="text-blue-500"
            />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                <AnimatedCounter value={Math.round(cumulativeActual)} />
              </div>
              <div className="text-sm text-blue-500">من <AnimatedCounter value={Math.round(cumulativeGoal)} /> سعرة</div>
              <div className="text-xs text-blue-400 mt-1">إجمالي {daysTracked} يوم</div>
            </div>
          </div>
        </motion.div>

        {/* Trend Analysis */}
        <motion.div 
          className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-lg transition-all duration-300"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-purple-800">تحليل الاتجاه</h3>
              <p className="text-xs text-purple-600">التوقعات التراكمية للوزن</p>
            </div>
          </div>
          <div className="text-center">
            <div className="space-y-2">
              <motion.div 
                className={`text-2xl font-bold ${
                  totalExpectedWeightLoss > 0 ? 'text-green-600' : 'text-red-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.1, type: "spring" }}
              >
                {totalExpectedWeightLoss > 0 ? '-' : '+'}{Math.abs(totalExpectedWeightLoss).toFixed(1)} كجم
              </motion.div>
              <div className="text-xs text-purple-700 font-medium">إجمالي متوقع</div>
              
              <div className="text-sm font-bold text-purple-600">
                {monthlyWeightLoss > 0 ? '-' : '+'}{Math.abs(monthlyWeightLoss).toFixed(1)} كجم/شهر
              </div>
              <div className="text-xs text-purple-500">معدل شهري</div>
            </div>
            <div className="mt-3 p-2 bg-purple-100 rounded-lg">
              <div className="text-xs text-purple-600">
                {cumulativeDeficit > 0 
                  ? `عجز ${cumulativeDeficit.toLocaleString()} سعرة إجمالي`
                  : `فائض ${Math.abs(cumulativeDeficit).toLocaleString()} سعرة إجمالي`
                }
                {cumulativeBurned > 0 && (
                  <div className="text-xs text-purple-500 mt-1">
                    شامل {cumulativeBurned.toLocaleString()} سعرة محروقة
                  </div>
                )}
                <div className="text-xs text-purple-500 mt-1">
                  خلال {daysTracked} يوم
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-3 order-2 lg:order-1" data-chart="calories">
          <GlassLineChart 
            labels={cumulativeSeries.labels} 
            datasets={cumulativeSeries.datasets}
            title={`السعرات التراكمية${cumulative?.dailyData?.length > 30 ? ' - آخر 30 يوم' : ''}`}
            subtitle={`تتبع السعرات الحرارية اليومية مقارنة بالأهداف (إجمالي ${daysTracked} يوم)`}
            height={350}
            glassMorphism={true}
            animated={true}
            showGrid={true}
            showLegend={true}
          />
        </div>
        <div className="card p-4 sm:p-6 lg:col-span-2 relative overflow-hidden order-1 lg:order-2" data-chart="macros">
          <div className="relative min-h-[300px] lg:min-h-[450px] flex flex-col">
            {/* Enhanced Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-8 bg-gradient-to-b from-red-500 to-green-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-800">توزيع الماكروز</h3>
            </div>
            
            {donutData.totalMacros > 0 ? (
              <div className="flex-1 flex flex-col">
                {/* Chart Section */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-36 h-36 sm:w-44 sm:h-44">
                    <DonutChart 
                      labels={donutData.labels} 
                      data={donutData.data}
                      goals={donutData.goals}
                      colors={['#dc2626', '#2563eb', '#059669']}
                      enhanced={true}
                      showLegend={false}
                      centerText={{
                        value: formatNutrition(donutData.totalCalories),
                        label: 'سعرة حرارية'
                      }}
                    />
                  </div>
                </div>
                
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
                  {donutData.labels.map((label, index) => {
                    const value = donutData.data[index];
                    const percentage = donutData.percentages[index];
                    const goal = donutData.goals[index];
                    const colors = ['#dc2626', '#2563eb', '#059669'];
                    const bgColors = ['bg-red-50', 'bg-blue-50', 'bg-green-50'];
                    const borderColors = ['border-red-200', 'border-blue-200', 'border-green-200'];
                    
                    return (
                      <motion.div 
                        key={label} 
                        className={`p-2 sm:p-3 md:p-4 lg:p-5 rounded-lg border-2 ${borderColors[index]} ${bgColors[index]} text-center min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + index * 0.1 }}
                      >
                        {/* Color Indicator */}
                        <div className="flex justify-center mb-1">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: colors[index] }}
                          ></div>
                        </div>
                        
                        {/* Label */}
                        <div className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-slate-700 mb-1 md:mb-2">
                          {label}
                        </div>
                        
                        {/* Value */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-800">
                            {formatNutrition(value)}
                          </div>
                          <div className="text-xs sm:text-sm md:text-base text-slate-600">جم</div>
                          
                          {/* Percentage */}
                          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mt-1 md:mt-2" style={{ color: colors[index] }}>
                            {percentage}%
                          </div>
                        </div>
                        
                        {/* Goal Progress */}
                        {goal && (
                          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-slate-200">
                            <div className="text-xs sm:text-sm md:text-base text-slate-500 leading-tight">
                              الهدف: {goal} جم
                            </div>
                            <div className="text-xs sm:text-sm md:text-base font-medium mt-1 md:mt-2" style={{ color: colors[index] }}>
                              {((value / goal) * 100).toFixed(0)}% مكتمل
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Summary Bar */}
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <span className="text-sm font-semibold text-slate-700">إجمالي الماكروز</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-bold text-slate-800">
                        {formatNutrition(donutData.totalMacros)} جم
                      </div>
                      <div className="text-xs text-slate-500">
                        من {formatNutrition(donutData.totalCalories)} سعرة
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-4">
                  <Activity className="w-10 h-10 text-slate-400" />
                </div>
                <h4 className="text-slate-600 font-semibold mb-2">لم يتم تسجيل وجبات اليوم بعد</h4>
                <p className="text-slate-400 text-sm">ابدأ بإضافة وجباتك لرؤية توزيع الماكروز</p>
                <motion.button
                  onClick={() => window.location.href = '/meals'}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  إضافة وجبة الآن
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Enhanced Meals Section */}
      <motion.div 
        className="card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">وجبات اليوم</h3>
          </div>
          <motion.button
            onClick={() => window.location.href = '/meals'}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-3 h-3" />
            <span>إضافة وجبة</span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'breakfast', label: 'الإفطار', icon: '🌅', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
            { type: 'lunch', label: 'الغداء', icon: '☀️', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
            { type: 'dinner', label: 'العشاء', icon: '🌙', color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
            { type: 'snack', label: 'سناك', icon: '🍎', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' }
          ].map(({ type, label, icon, color, bg, border, text }) => {
            const mealCount = (daily.mealsByType?.[type] || []).length;
            return (
              <motion.div 
                key={type} 
                className={`p-4 rounded-xl border ${border} ${bg} hover:shadow-md transition-all duration-300 cursor-pointer group`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/meals'}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <div className={`text-sm font-medium ${text}`}>{label}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${text} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
                <div className={`text-2xl font-bold ${text} mb-1`}>
                  {mealCount} وجبة
                </div>
                <div className="text-xs text-slate-500">
                  {mealCount === 0 ? 'لم يتم إضافة وجبات' : `تم تسجيل ${mealCount} وجبة`}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Quick Stats */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-600">إجمالي الوجبات اليوم:</span>
            </div>
            <span className="font-bold text-slate-800">{daily.totalMeals || 0} وجبة</span>
          </div>
        </div>
      </motion.div>
      
      {/* Google Fit Integration Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <GoogleFitIntegration 
          onDataSync={(data) => {
            console.log('Google Fit data synced:', data)
            // Refresh dashboard data after sync
            setRefreshTrigger(prev => prev + 1)
          }}
        />
      </motion.div>
    </motion.div>
  )
}
