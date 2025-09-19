import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { addDays, toISODate } from '../utils/date'
import LineChart from '../components/charts/LineChart'
import DonutChart from '../components/charts/DonutChart'

export default function Reports() {
  const [range, setRange] = useState('week') // week | month
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const end = new Date()
      const start = addDays(new Date(), range === 'week' ? -6 : -29)
      const { data } = await api.get('/meals/stats', { params: { startDate: start.toISOString(), endDate: end.toISOString() } })
      setStats(data)
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
    const start = addDays(end, range === 'week' ? -6 : -29)
    const labels = []
    const values = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' }))
      const key = toISODate(d)
      const row = stats.dailyData.find(x => x.date === key)
      values.push(row?.calories || 0)
    }
    return {
      labels,
      datasets: [
        { label: 'السعرات الحرارية', data: values, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,.2)' }
      ]
    }
  }, [stats, range])

  const topFoods = useMemo(() => {
    if (!stats || !stats.mostLoggedFoods || typeof stats.mostLoggedFoods !== 'object') return []
    return Object.entries(stats.mostLoggedFoods)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [stats])

  if (loading) return <div className="text-center text-slate-500 py-10">جاري التحميل...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">التقارير</h1>
        <select value={range} onChange={e => setRange(e.target.value)} className="input w-40">
          <option value="week">أسبوع</option>
          <option value="month">شهر</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 lg:col-span-2">
          <div className="font-bold mb-2">اتجاه السعرات</div>
          <LineChart labels={series.labels} datasets={series.datasets} />
        </div>
        <div className="card p-4">
          <div className="font-bold mb-2">أكثر الأطعمة تكراراً</div>
          <ul className="space-y-2 text-sm">
            {topFoods.map(([name, count]) => (
              <li key={name} className="flex items-center justify-between">
                <span className="text-slate-700">{name}</span>
                <span className="text-slate-500">{count} مرة</span>
              </li>
            ))}
            {topFoods.length === 0 && <div className="text-slate-500">لا توجد بيانات</div>}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4">
          <div className="font-bold mb-2">متوسطات يومية</div>
          <div className="text-sm text-slate-700 space-y-1">
            <div>السعرات: {stats?.avgCaloriesPerDay}</div>
            <div>البروتين: {stats?.avgProteinPerDay}</div>
            <div>الكربوهيدرات: {stats?.avgCarbsPerDay}</div>
            <div>الدهون: {stats?.avgFatPerDay}</div>
            <div className="text-xs text-slate-500 mt-2">عدد الوجبات: {stats?.totalMeals}</div>
          </div>
        </div>
        <div className="card p-4 lg:col-span-2">
          <div className="font-bold mb-2">نسبة التصنيفات (بالوزن)</div>
          <div className="h-64 mb-4">
            <DonutChart
              labels={Object.keys(stats?.categoryBreakdown || {})}
              data={Object.values(stats?.categoryBreakdown || {})}
              colors={["#a855f7", "#ec4899", "#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#22c55e", "#06b6d4", "#8b5cf6", "#14b8a6", "#64748b"]}
              enhanced={false}
              showLegend={false}
            />
          </div>
          
          {/* Custom Enhanced Legend */}
          <div className="space-y-2">
            {Object.entries(stats?.categoryBreakdown || {}).map(([category, value], index) => {
              const values = Object.values(stats?.categoryBreakdown || {});
              const total = Array.isArray(values) ? values.reduce((sum, val) => sum + val, 0) : 0;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              const colors = ["#a855f7", "#ec4899", "#38bdf8", "#10b981", "#f59e0b", "#ef4444", "#22c55e", "#06b6d4", "#8b5cf6", "#14b8a6", "#64748b"];
              const color = colors[index % colors.length];
              
              return (
                <div 
                  key={category} 
                  className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
                    borderLeft: `4px solid ${color}`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div 
                        className="w-5 h-5 rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform duration-200"
                        style={{ backgroundColor: color }}
                      ></div>
                      <div 
                        className="absolute inset-0 w-5 h-5 rounded-full opacity-30 animate-pulse"
                        style={{ backgroundColor: color }}
                      ></div>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 text-sm group-hover:text-slate-900 transition-colors">
                        {category}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span>📊</span>
                        <span>تصنيف غذائي</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-lg group-hover:text-slate-900 transition-colors">
                      {value.toFixed(1)} <span className="text-sm font-normal text-slate-600">جم</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div 
                        className="px-2 py-1 rounded-full text-white font-medium"
                        style={{ backgroundColor: color }}
                      >
                        {percentage}%
                      </div>
                      <span>من الإجمالي</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(stats?.categoryBreakdown || {}).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">📊</div>
                <div>لا توجد بيانات للعرض</div>
              </div>
            )}
            
            {/* Summary Section */}
            {Object.keys(stats?.categoryBreakdown || {}).length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full"></div>
                    <span className="font-semibold text-slate-700 text-sm">إجمالي الوزن</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800 text-lg">
                      {(() => {
                        const values = Object.values(stats?.categoryBreakdown || {});
                        return Array.isArray(values) ? values.reduce((sum, val) => sum + val, 0).toFixed(1) : '0.0';
                      })()} 
                      <span className="text-sm font-normal text-slate-600 ml-1">جم</span>
                    </div>
                    <div className="text-xs text-slate-500">جميع التصنيفات</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
