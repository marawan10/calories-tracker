import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Flame, TrendingUp, Calendar, BarChart3, Target, Zap, Wheat, Droplets, Cookie } from 'lucide-react'
import { motion } from 'framer-motion'
import api from '../lib/api'
import { addDays, toISODate } from '../utils/date'
import GlassLineChart from '../components/charts/GlassLineChart'
import DonutChart from '../components/charts/DonutChart'

export default function Reports() {
  const [range, setRange] = useState('week') // week | month
  const [stats, setStats] = useState(null)
  const [activityStats, setActivityStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const end = new Date()
      const start = addDays(new Date(), range === 'week' ? -6 : -30)
      
      // Load both meal and activity stats
      const [mealsResponse, activitiesResponse] = await Promise.all([
        api.get('/meals/stats', { params: { startDate: start.toISOString(), endDate: end.toISOString() } }),
        api.get('/activities/stats/summary', { params: { days: range === 'week' ? 7 : 31 } })
      ])
      
      setStats(mealsResponse.data)
      setActivityStats(activitiesResponse.data.summary)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [range])

  const series = useMemo(() => {
    if (!stats || !stats.dailyData || !Array.isArray(stats.dailyData)) {
      return { labels: [], datasets: [] }
    }
    const end = new Date()
    const start = addDays(end, range === 'week' ? -6 : -30)
    const labels = []
    const caloriesConsumed = []
    const caloriesBurned = []
    const netCalories = []
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' }))
      const key = toISODate(d)
      const mealRow = stats.dailyData.find(x => x.date === key)
      const activityRow = activityStats?.dailyBreakdown?.[key]
      
      const consumed = mealRow?.calories || 0
      const burned = activityRow?.calories || 0
      
      caloriesConsumed.push(consumed)
      caloriesBurned.push(burned)
      netCalories.push(consumed - burned)
    }
    
    return {
      labels,
      datasets: [
        { 
          label: 'السعرات المستهلكة', 
          data: caloriesConsumed, 
          borderColor: '#ef4444', 
          backgroundColor: 'rgba(239,68,68,.2)',
          tension: 0.4
        },
        { 
          label: 'السعرات المحروقة', 
          data: caloriesBurned, 
          borderColor: '#f97316', 
          backgroundColor: 'rgba(249,115,22,.2)',
          tension: 0.4
        },
        { 
          label: 'صافي السعرات', 
          data: netCalories, 
          borderColor: '#8b5cf6', 
          backgroundColor: 'rgba(139,92,246,.2)',
          tension: 0.4
        }
      ]
    }
  }, [stats, activityStats, range])

  const topFoods = useMemo(() => {
    if (!stats || !stats.mostLoggedFoods || typeof stats.mostLoggedFoods !== 'object') return []
    return Object.entries(stats.mostLoggedFoods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [stats])

  if (loading) return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
      <div className="text-slate-500 font-medium">جاري تحميل التقارير...</div>
    </motion.div>
  )

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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold gradient-text">التقارير والإحصائيات</h1>
            <p className="text-slate-500 mt-1">تحليل شامل لرحلتك الغذائية والصحية</p>
          </div>
        </div>
        
        {/* Enhanced Range Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">فترة التحليل:</span>
          </div>
          
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <motion.button 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                range === 'week' 
                  ? 'bg-white text-blue-600 shadow-md border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setRange('week')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-4 h-4 inline ml-2" />
              أسبوع
            </motion.button>
            <motion.button 
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                range === 'month' 
                  ? 'bg-white text-blue-600 shadow-md border border-blue-200' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setRange('month')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-4 h-4 inline ml-2" />
              شهر
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          className="card p-6 bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <div className="font-semibold text-slate-800">السعرات المستهلكة</div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats?.dailyData ? stats.dailyData.reduce((sum, day) => sum + (day.calories || 0), 0).toLocaleString() : 0}
          </div>
          <div className="text-sm text-red-500">
            متوسط {Math.round(stats?.avgCaloriesPerDay || 0)} يومياً
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="font-semibold text-slate-800">السعرات المحروقة</div>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {activityStats?.totalCaloriesBurned?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-orange-500">
            متوسط {Math.round((activityStats?.totalCaloriesBurned || 0) / (range === 'week' ? 7 : 31))} يومياً
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="font-semibold text-slate-800">صافي السعرات</div>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {((stats?.dailyData ? stats.dailyData.reduce((sum, day) => sum + (day.calories || 0), 0) : 0) - (activityStats?.totalCaloriesBurned || 0)).toLocaleString()}
          </div>
          <div className="text-sm text-purple-500">
            الفرق بين المستهلك والمحروق
          </div>
        </motion.div>

        <motion.div 
          className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="font-semibold text-slate-800">وقت التمرين</div>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round((activityStats?.totalDuration || 0) / 60)} ساعة
          </div>
          <div className="text-sm text-blue-500">
            {activityStats?.totalActivities || 0} نشاط
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="lg:col-span-2 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassLineChart 
            labels={series.labels} 
            datasets={series.datasets}
            title="اتجاه السعرات"
            subtitle="مقارنة السعرات المستهلكة والمحروقة"
            height={400}
            glassMorphism={true}
            animated={true}
            showGrid={true}
            showLegend={true}
          />
        </motion.div>
        <motion.div 
          className="card p-6 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">الأطعمة المفضلة</h3>
              <p className="text-sm text-slate-500">الأكثر تكراراً في وجباتك</p>
            </div>
          </div>
          <div className="space-y-3">
            {topFoods.map(([name, count], index) => (
              <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-slate-700 font-medium">{name}</span>
                </div>
                <span className="text-primary-600 font-semibold">{count} مرة</span>
              </div>
            ))}
            {topFoods.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">🍽️</div>
                <div>لا توجد بيانات للعرض</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          className="card p-6 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">متوسطات يومية</h3>
              <p className="text-sm text-slate-500">إحصائيات التغذية اليومية</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Calories */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">السعرات</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{Math.round(stats?.avgCaloriesPerDay || 0)}</div>
                <div className="text-xs text-slate-500">كالوري/يوم</div>
              </div>
            </div>

            {/* Protein */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">البروتين</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{Math.round(stats?.avgProteinPerDay || 0)}</div>
                <div className="text-xs text-slate-500">جرام/يوم</div>
              </div>
            </div>

            {/* Carbs */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Wheat className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">الكربوهيدرات</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{Math.round(stats?.avgCarbsPerDay || 0)}</div>
                <div className="text-xs text-slate-500">جرام/يوم</div>
              </div>
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-slate-700">الدهون</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-800">{Math.round(stats?.avgFatPerDay || 0)}</div>
                <div className="text-xs text-slate-500">جرام/يوم</div>
              </div>
            </div>

            {/* Total Meals */}
            <div className="mt-4 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">إجمالي الوجبات</span>
                </div>
                <span className="font-bold text-slate-800">{stats?.totalMeals || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          className="card p-6 lg:col-span-2 hover:shadow-lg transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">نسبة التصنيفات الغذائية</h3>
              <p className="text-sm text-slate-500">توزيع الأطعمة حسب الفئات (بالوزن)</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Chart Section */}
            <div className="flex justify-center">
              <div className="w-80 h-80">
                <DonutChart
                  labels={Object.keys(stats?.categoryBreakdown || {})}
                  data={Object.values(stats?.categoryBreakdown || {})}
                  colors={["#a855f7", "#ec4899", "#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#22c55e", "#06b6d4", "#8b5cf6", "#14b8a6", "#64748b"]}
                  enhanced={false}
                  showLegend={false}
                />
              </div>
            </div>
            
            {/* Legend Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats?.categoryBreakdown || {}).map(([category, value], index) => {
                const total = Object.values(stats?.categoryBreakdown || {}).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const colors = ["#a855f7", "#ec4899", "#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#22c55e", "#06b6d4", "#8b5cf6", "#14b8a6", "#64748b"];
                const color = colors[index % colors.length];
                
                return (
                  <motion.div 
                    key={category} 
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
                      borderLeft: `4px solid ${color}`
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div 
                          className="w-4 h-4 rounded-full shadow-md border-2 border-white"
                          style={{ backgroundColor: color }}
                        ></div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {category}
                        </div>
                        <div className="text-xs text-slate-500">
                          تصنيف غذائي
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">
                        {value.toFixed(1)} <span className="text-sm font-normal text-slate-600">جم</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div 
                          className="px-2 py-1 rounded-full text-white font-medium text-xs"
                          style={{ backgroundColor: color }}
                        >
                          {percentage}%
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              
              {Object.keys(stats?.categoryBreakdown || {}).length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📊</div>
                  <div>لا توجد بيانات للعرض</div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
