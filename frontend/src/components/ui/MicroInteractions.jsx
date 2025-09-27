import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Star, Heart, Zap, TrendingUp, Award, Target, Sparkles } from 'lucide-react'

// Success Celebration Animation
export const SuccessCelebration = ({ show, onComplete, type = 'default' }) => {
  const celebrations = {
    default: { icon: Check, color: 'text-green-500', bg: 'bg-green-100' },
    achievement: { icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    goal: { icon: Target, color: 'text-blue-500', bg: 'bg-blue-100' },
    streak: { icon: Zap, color: 'text-orange-500', bg: 'bg-orange-100' },
    milestone: { icon: Star, color: 'text-purple-500', bg: 'bg-purple-100' }
  }

  const { icon: Icon, color, bg } = celebrations[type]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => onComplete?.()}
        >
          {/* Confetti particles */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                scale: [0, 1, 0],
                rotate: 360
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
          
          {/* Main success icon */}
          <motion.div
            className={`w-24 h-24 ${bg} rounded-full flex items-center justify-center shadow-2xl`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: [0, 1.2, 1], rotate: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Icon className={`w-12 h-12 ${color}`} />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Floating Action Feedback
export const FloatingFeedback = ({ children, feedback, show }) => {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-3 py-1 rounded-full text-sm font-medium pointer-events-none z-10"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {feedback}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Progress Ring Animation
export const ProgressRing = ({ progress, size = 60, strokeWidth = 4, color = 'text-blue-500' }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-200 dark:text-slate-700"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          className={color}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
      </svg>
      
      {/* Progress text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-sm font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  )
}

// Pulse Animation for Important Elements
export const PulseHighlight = ({ children, active = false, color = 'ring-blue-500' }) => {
  return (
    <motion.div
      className={`relative ${active ? `ring-2 ${color} ring-opacity-50` : ''}`}
      animate={active ? {
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0.4)',
          '0 0 0 10px rgba(59, 130, 246, 0)',
          '0 0 0 0 rgba(59, 130, 246, 0)'
        ]
      } : {}}
      transition={{
        duration: 2,
        repeat: active ? Infinity : 0,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Shake Animation for Errors
export const ShakeAnimation = ({ children, trigger }) => {
  return (
    <motion.div
      animate={trigger ? {
        x: [-10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// Bounce Animation for Buttons
export const BounceButton = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <motion.button
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onClick}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={disabled}
    >
      {children}
    </motion.button>
  )
}

// Number Counter Animation
export const AnimatedCounter = ({ value, duration = 1, suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime
    let startValue = displayValue

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (value - startValue) * easeOutQuart
      
      setDisplayValue(Math.round(currentValue))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <motion.span
      key={value}
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      {displayValue.toLocaleString()}{suffix}
    </motion.span>
  )
}

// Sparkle Effect
export const SparkleEffect = ({ children, active = false }) => {
  return (
    <div className="relative">
      {children}
      <AnimatePresence>
        {active && Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            initial={{
              opacity: 0,
              scale: 0,
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: 360,
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              ease: "easeOut"
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
