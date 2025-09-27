import React from 'react'
import { motion } from 'framer-motion'

const EnhancedSkeleton = ({ 
  className = '', 
  variant = 'default',
  animate = true,
  children 
}) => {
  const baseClasses = 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded'
  
  const variants = {
    default: 'h-4',
    text: 'h-4',
    title: 'h-6',
    button: 'h-10',
    avatar: 'w-10 h-10 rounded-full',
    card: 'h-32',
    chart: 'h-64'
  }

  const skeletonClasses = `${baseClasses} ${variants[variant]} ${className}`

  if (!animate) {
    return <div className={skeletonClasses}>{children}</div>
  }

  return (
    <motion.div
      className={skeletonClasses}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
      }}
      style={{
        backgroundSize: '200% 100%',
      }}
    >
      {children}
    </motion.div>
  )
}

// Specialized skeleton components
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <EnhancedSkeleton
        key={i}
        variant="text"
        className={i === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 ${className}`}>
    <div className="flex items-center gap-4 mb-4">
      <EnhancedSkeleton variant="avatar" />
      <div className="flex-1 space-y-2">
        <EnhancedSkeleton variant="title" className="w-1/2" />
        <EnhancedSkeleton variant="text" className="w-3/4" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
)

export const SkeletonStats = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <EnhancedSkeleton className="w-8 h-8 rounded-lg" />
          <EnhancedSkeleton variant="text" className="w-24" />
        </div>
        <EnhancedSkeleton variant="title" className="w-16 mb-2" />
        <EnhancedSkeleton variant="text" className="w-20" />
      </div>
    ))}
  </div>
)

export const SkeletonChart = ({ className = '' }) => (
  <div className={`p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <div>
        <EnhancedSkeleton variant="title" className="w-32 mb-2" />
        <EnhancedSkeleton variant="text" className="w-48" />
      </div>
      <EnhancedSkeleton className="w-20 h-8 rounded-lg" />
    </div>
    <EnhancedSkeleton variant="chart" />
  </div>
)

export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 overflow-hidden ${className}`}>
    {/* Header */}
    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <EnhancedSkeleton key={i} variant="text" className="w-20" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <EnhancedSkeleton key={j} variant="text" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export const SkeletonForm = ({ fields = 3, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <EnhancedSkeleton variant="text" className="w-24" />
        <EnhancedSkeleton variant="button" className="w-full" />
      </div>
    ))}
    <EnhancedSkeleton variant="button" className="w-32" />
  </div>
)

export default EnhancedSkeleton
