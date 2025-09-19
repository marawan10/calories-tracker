import React, { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export default function AnimatedCounter({ 
  value, 
  duration = 1000, 
  suffix = '', 
  prefix = '',
  className = '',
  decimals = 0 
}) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let startTime = null
    let startValue = displayValue
    const endValue = value || 0
    
    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  const formatValue = (val) => {
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val)
  }
  
  return (
    <motion.span 
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </motion.span>
  )
}
