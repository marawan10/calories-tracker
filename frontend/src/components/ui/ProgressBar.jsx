import React from 'react'
import { formatNutrition, formatPercentage } from '../../utils/formatNumber'

export default function ProgressBar({ 
  label, 
  value, 
  max, 
  color = 'from-primary-500 to-secondary-500'
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {formatPercentage(percentage)}%
        </span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="text-xs text-slate-600 flex justify-between">
        <span>{formatNutrition(value)}</span>
        <span>{formatNutrition(max)}</span>
      </div>
    </div>
  )
}
