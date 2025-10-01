import React from 'react'
import { motion } from 'framer-motion'
import { formatNutrition } from '../../utils/formatNumber'

export default function StatCard({
  title,
  value,
  subtitle,
  gradient = 'from-primary-500 to-secondary-500',
  icon,
  delay = 0,
  suffix = ''
}) {
  return (
    <motion.div
      className="card p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-600 font-medium">{title}</div>
        {icon && (
          <div className="text-primary-500">
            {icon}
          </div>
        )}
      </div>

      <div className={`text-2xl font-extrabold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-1`}>
        {formatNutrition(value)}{suffix}
      </div>

      <div className="text-xs text-slate-500">{subtitle}</div>
    </motion.div>
  )
}
