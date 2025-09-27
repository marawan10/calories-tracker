import React, { useRef, useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function GlassLineChart({ 
  labels = [], 
  datasets = [], 
  height = 300,
  title = '',
  subtitle = '',
  showGrid = true,
  showLegend = true,
  animated = true,
  glassMorphism = true
}) {
  const chartRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Enhanced datasets with glass morphism styling
  const enhancedDatasets = datasets.map((dataset, index) => {
    const colors = [
      { primary: '#06b6d4', secondary: '#0891b2', gradient: 'rgba(6, 182, 212, 0.1)' },
      { primary: '#ef4444', secondary: '#dc2626', gradient: 'rgba(239, 68, 68, 0.1)' },
      { primary: '#f97316', secondary: '#ea580c', gradient: 'rgba(249, 115, 22, 0.1)' },
      { primary: '#8b5cf6', secondary: '#7c3aed', gradient: 'rgba(139, 92, 246, 0.1)' },
      { primary: '#10b981', secondary: '#059669', gradient: 'rgba(16, 185, 129, 0.1)' }
    ]
    
    const colorSet = colors[index % colors.length]
    
    return {
      ...dataset,
      borderColor: dataset.borderColor || colorSet.primary,
      backgroundColor: glassMorphism 
        ? createGradient(chartRef.current?.canvas?.getContext('2d'), colorSet.primary, colorSet.gradient)
        : dataset.backgroundColor || colorSet.gradient,
      borderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8,
      pointBackgroundColor: dataset.borderColor || colorSet.primary,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: dataset.borderColor || colorSet.primary,
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 3,
      tension: 0.4,
      fill: glassMorphism ? 'start' : dataset.fill || false,
      shadowOffsetX: 0,
      shadowOffsetY: 4,
      shadowBlur: 12,
      shadowColor: `${dataset.borderColor || colorSet.primary}40`
    }
  })

  function createGradient(ctx, primaryColor, gradientColor) {
    if (!ctx) return gradientColor
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, primaryColor + '20')
    gradient.addColorStop(0.5, primaryColor + '10')
    gradient.addColorStop(1, primaryColor + '05')
    return gradient
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 12,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#64748b',
          generateLabels: (chart) => {
            const original = ChartJS.defaults.plugins.legend.labels.generateLabels
            const labels = original.call(this, chart)
            
            return labels.map(label => ({
              ...label,
              pointStyle: 'circle',
              borderRadius: 6
            }))
          }
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: true,
        usePointStyle: true,
        titleFont: {
          size: 14,
          weight: '600',
          family: 'Inter, system-ui, sans-serif'
        },
        bodyFont: {
          size: 13,
          weight: '500',
          family: 'Inter, system-ui, sans-serif'
        },
        callbacks: {
          title: (context) => {
            return context[0]?.label || ''
          },
          label: (context) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value.toLocaleString()} ${getUnitFromLabel(label)}`
          }
        },
        external: (context) => {
          // Custom tooltip styling
          const tooltip = context.tooltip
          if (tooltip.opacity === 0) return
          
          // Add shadow effect
          if (context.chart.canvas) {
            context.chart.canvas.style.filter = 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1))'
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 8
        },
        border: {
          display: false
        }
      },
      y: {
        display: true,
        grid: {
          display: showGrid,
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1,
          drawBorder: false
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 11,
            weight: '500',
            family: 'Inter, system-ui, sans-serif'
          },
          padding: 12,
          callback: function(value) {
            return value.toLocaleString()
          }
        },
        border: {
          display: false
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
        hitRadius: 10
      },
      line: {
        borderJoinStyle: 'round',
        borderCapStyle: 'round'
      }
    },
    animation: animated ? {
      duration: 2000,
      easing: 'easeInOutQuart',
      delay: (context) => {
        return context.type === 'data' && context.mode === 'default' 
          ? context.dataIndex * 100 
          : 0
      }
    } : false,
    onHover: (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    }
  }

  function getUnitFromLabel(label) {
    if (label.includes('سعرات') || label.includes('كالوري')) return 'كالوري'
    if (label.includes('بروتين') || label.includes('كربوهيدرات') || label.includes('دهون')) return 'جم'
    return ''
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      className={`relative ${glassMorphism ? 'glass-chart' : ''}`}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
      )}

      {/* Chart Container with Glass Effect */}
      <div 
        className={`relative overflow-hidden rounded-2xl ${
          glassMorphism 
            ? 'bg-white/60 backdrop-blur-xl border border-white/20 shadow-xl' 
            : 'bg-white border border-slate-200 shadow-sm'
        }`}
        style={{ height: `${height}px` }}
      >
        {/* Gradient Overlay */}
        {glassMorphism && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        )}
        
        {/* Chart */}
        <div className="relative p-4 h-full">
          <Line 
            ref={chartRef}
            data={{ labels, datasets: enhancedDatasets }} 
            options={options}
          />
        </div>

        {/* Decorative Elements */}
        {glassMorphism && (
          <>
            <div className="absolute top-4 right-4 w-2 h-2 bg-white/30 rounded-full" />
            <div className="absolute top-6 right-8 w-1 h-1 bg-white/20 rounded-full" />
            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 bg-white/25 rounded-full" />
          </>
        )}
      </div>

      {/* Custom CSS for glass effect */}
      <style>{`
        .glass-chart {
          position: relative;
        }
        
        .glass-chart::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.3) 0%, 
            rgba(255, 255, 255, 0.1) 50%, 
            rgba(255, 255, 255, 0.05) 100%
          );
          border-radius: 1rem;
          z-index: -1;
          filter: blur(0.5px);
        }
      `}</style>
    </motion.div>
  )
}
