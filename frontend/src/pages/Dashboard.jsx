import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Target, TrendingUp, Zap } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { toISODate, getCurrentWeekRange, rangeDays, getWeekDayLabels } from '../utils/date'
import { formatNutrition } from '../utils/formatNumber'
import StatCard from '../components/ui/StatCard'
import ProgressBar from '../components/ui/ProgressBar'
import LineChart from '../components/charts/LineChart'
import DonutChart from '../components/charts/DonutChart'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

export default function Dashboard() {
  const [today, setToday] = useState(() => toISODate(new Date()))
  const [daily, setDaily] = useState({ dailyTotals: {}, mealsByType: {}, totalMeals: 0 })
  const [goals, setGoals] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 65 })
  const [weekly, setWeekly] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [{ data: me }, { data: dailyRes }, { data: stats }] = await Promise.all([
          api.get('/auth/me'),
          api.get(`/meals/daily/${today}`),
          (() => {
            const { start, end } = getCurrentWeekRange()
            return api.get(`/meals/stats?startDate=${toISODate(start)}&endDate=${toISODate(end)}`)
          })()
        ])
        setGoals(me.user?.dailyGoals || goals)
        setDaily(dailyRes)
        setWeekly(stats)
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

  // Week series calculation (moved to top level with other hooks)
  const weekSeries = useMemo(() => {
    if (!weekly) return { labels: [], datasets: [] }
    
    // Get current week range (Saturday to Friday)
    const { start, end } = getCurrentWeekRange()
    const days = rangeDays(start, end)
    const labels = getWeekDayLabels()

    const map = new Map(weekly.dailyData.map(d => [d.date, d]))

    const values = days.map(d => {
      const key = toISODate(d)
      const row = map.get(key)
      return row?.calories || 0
    })

    const goalLine = days.map(() => goals.calories || 0)
    const recommendedLine = days.map(() => recommendedDaily || 0)

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
  }, [weekly, goals.calories, recommendedDaily, user])

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
  const weeklyActual = weekly ? weekly.dailyData.reduce((s, d) => s + (d.calories || 0), 0) : 0
  const goalDaily = goals.calories || recommendedDaily
  
  const weeklyRecommended = recommendedDaily * (weekly?.dailyData?.length || 7)
  const weeklyGoal = goalDaily * (weekly?.dailyData?.length || 7)
  const weeklyDiff = weeklyActual - weeklyGoal
  
  // Weight loss analysis
  const weeklyDeficit = weeklyRecommended - weeklyGoal // Calories saved per week
  const expectedWeightLoss = weeklyDeficit / 7700 // kg per week (7700 calories = 1kg)
  const monthlyWeightLoss = expectedWeightLoss * 4.33 // Average weeks per month

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header with simple animation */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold gradient-text">لوحة التحكم</h1>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Activity className="w-4 h-4 text-primary-500" />
          <span>اليوم: {new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </motion.div>

      {/* Stats Cards with staggered animation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="سعرات اليوم" 
          value={t.calories || 0}
          suffix=" كالوري"
          subtitle={`الهدف: ${goals.calories} كالوري`}
          icon={<Zap className="w-5 h-5" />}
          delay={0.1}
          isNumeric={true}
        />
        <StatCard 
          title="البروتين" 
          value={t.protein || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.protein} جم`}
          gradient="from-rose-500 to-pink-500"
          icon={<Target className="w-5 h-5" />}
          delay={0.2}
          isNumeric={true}
        />
        <StatCard 
          title="الكربوهيدرات" 
          value={t.carbs || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.carbs} جم`}
          gradient="from-sky-500 to-cyan-500"
          icon={<TrendingUp className="w-5 h-5" />}
          delay={0.3}
          isNumeric={true}
        />
        <StatCard 
          title="الدهون" 
          value={t.fat || 0}
          suffix=" جم"
          subtitle={`الهدف: ${goals.fat} جم`}
          gradient="from-emerald-500 to-teal-500"
          icon={<Activity className="w-5 h-5" />}
          delay={0.4}
          isNumeric={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="card p-4 sm:p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-lg">سعرات الأسبوع</h3>
          </div>
          <div className="h-64 sm:h-80">
            <LineChart labels={weekSeries.labels} datasets={weekSeries.datasets} height={100} />
          </div>
        </div>
        <div className="card p-4 sm:p-6 lg:col-span-2 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <div className="w-2 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                توزيع الماكروز اليومي
              </h3>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                {donutData.totalMacros > 0 ? `${formatNutrition(donutData.totalMacros)} جم` : 'لا توجد بيانات'}
              </div>
            </div>
            
            <div className="h-80 mb-4">
              <DonutChart 
                labels={donutData.labels} 
                data={donutData.data}
                goals={donutData.goals}
                colors={['#dc2626', '#2563eb', '#059669']}
                enhanced={true}
                centerText={{
                  value: formatNutrition(donutData.totalCalories),
                  label: 'سعرة حرارية'
                }}
              />
            </div>
            
            {/* Macro breakdown cards */}
            {donutData.totalMacros > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                {donutData.labels.map((label, index) => {
                  const value = donutData.data[index];
                  const goal = donutData.goals[index];
                  const percentage = donutData.percentages[index];
                  const progress = goal ? ((value / goal) * 100).toFixed(0) : 0;
                  const colors = ['bg-red-600', 'bg-blue-600', 'bg-green-600'];
                  const bgColors = ['bg-red-50', 'bg-blue-50', 'bg-green-50'];
                  const textColors = ['text-red-700', 'text-blue-700', 'text-green-700'];
                  
                  return (
                    <div key={label} className={`${bgColors[index]} p-3 rounded-lg border border-opacity-20`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 ${colors[index]} rounded-full`}></div>
                        <span className="text-xs font-medium text-slate-600">{label}</span>
                      </div>
                      <div className={`text-sm font-bold ${textColors[index]}`}>
                        {formatNutrition(value)} جم
                      </div>
                      <div className="text-xs text-slate-500 flex justify-between">
                        <span>{percentage}%</span>
                        {goal && <span>{progress}% من الهدف</span>}
                      </div>
                      {goal && (
                        <div className="mt-1 bg-white bg-opacity-50 rounded-full h-1">
                          <div 
                            className={`h-1 ${colors[index]} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* No data state */}
            {donutData.totalMacros === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm">لم يتم تسجيل وجبات اليوم بعد</p>
                <p className="text-slate-400 text-xs mt-1">ابدأ بإضافة وجباتك لرؤية توزيع الماكروز</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-slate-600">فرق الأسبوع (الهدف)</div>
          <div className={`text-2xl font-extrabold ${weeklyDiff >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {weeklyDiff >= 0 ? '+' : ''}{formatNutrition(weeklyDiff)} كالوري
          </div>
          <div className="text-xs text-slate-500">الإجمالي: {formatNutrition(weeklyActual)} | الهدف: {formatNutrition(weeklyGoal)}</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm text-slate-600">الموصي به أسبوعياً</div>
          <div className="text-2xl font-extrabold text-blue-600">
            {formatNutrition(weeklyRecommended)} كالوري
          </div>
          <div className="text-xs text-slate-500">يومياً: {formatNutrition(recommendedDaily)} كالوري</div>
        </div>
        
        <div className="card p-4">
          <div className="text-sm text-slate-600">تحليل فقدان الوزن</div>
          {weeklyDeficit > 0 ? (
            <>
              <div className="text-2xl font-extrabold text-green-600">
                -{expectedWeightLoss.toFixed(2)} كجم
              </div>
              <div className="text-xs text-slate-500">
                أسبوعياً | شهرياً: -{monthlyWeightLoss.toFixed(1)} كجم
              </div>
            </>
          ) : weeklyDeficit < 0 ? (
            <>
              <div className="text-2xl font-extrabold text-orange-600">
                +{Math.abs(expectedWeightLoss).toFixed(2)} كجم
              </div>
              <div className="text-xs text-slate-500">
                زيادة أسبوعياً | شهرياً: +{Math.abs(monthlyWeightLoss).toFixed(1)} كجم
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-extrabold text-slate-600">
                ثبات الوزن
              </div>
              <div className="text-xs text-slate-500">
                الهدف = الموصي به
              </div>
            </>
          )}
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <ProgressBar 
          label="السعرات" 
          value={t.calories || 0} 
          max={goals.calories} 
          delay={0.1}
        />
        <ProgressBar 
          label="البروتين" 
          value={t.protein || 0} 
          max={goals.protein} 
          color="from-rose-500 to-pink-500" 
          delay={0.2}
        />
        <ProgressBar 
          label="الكربوهيدرات" 
          value={t.carbs || 0} 
          max={goals.carbs} 
          color="from-sky-500 to-cyan-500" 
          delay={0.3}
        />
        <ProgressBar 
          label="الدهون" 
          value={t.fat || 0} 
          max={goals.fat} 
          color="from-emerald-500 to-teal-500" 
          delay={0.4}
        />
      </motion.div>

      <div className="card p-4">
        <h3 className="font-bold text-slate-800 mb-3">وجبات اليوم</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['breakfast','lunch','dinner','snack'].map(type => (
            <div key={type} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
              <div className="text-sm text-slate-600 mb-2">{type === 'breakfast' ? 'الإفطار' : type === 'lunch' ? 'الغداء' : type === 'dinner' ? 'العشاء' : 'سناك'}</div>
              <div className="text-2xl font-extrabold text-slate-800">{(daily.mealsByType?.[type] || []).length} وجبة</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
