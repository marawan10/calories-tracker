import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { formatNutrition } from '../../utils/formatNumber'

export default function DonutChart({ 
  labels = [], 
  data = [], 
  colors = ['#ef4444', '#3b82f6', '#10b981'], 
  goals = [],
  showPercentages = false,
  centerText = null,
  enhanced = false,
  showLegend = true
}) {
  const total = data.reduce((sum, value) => sum + value, 0)
  
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: enhanced ? 3 : 0,
        borderColor: '#ffffff',
        hoverBorderWidth: enhanced ? 4 : 2,
        hoverBorderColor: '#ffffff',
        hoverBackgroundColor: enhanced ? colors.map(color => color + 'dd') : colors,
      },
    ],
  }

  const options = {
    cutout: enhanced ? '70%' : '65%',
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'nearest'
    },
    scales: {},
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: enhanced ? 20 : 10,
          font: {
            size: enhanced ? 14 : 12,
            weight: enhanced ? '600' : '400',
            family: 'Inter, system-ui, sans-serif'
          },
          color: '#374151',
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                const goal = goals[i];
                
                return {
                  text: enhanced 
                    ? `${label}: ${formatNutrition(value)}جم (${percentage}%)${goal ? ` / ${goal}جم` : ''}`
                    : `${label}: ${formatNutrition(value)}جم`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            const goal = goals[context.dataIndex];
            const progress = goal ? ((value / goal) * 100).toFixed(1) : null;
            
            let label = `القيمة: ${formatNutrition(value)} جم`;
            label += `\nالنسبة: ${percentage}%`;
            if (goal) {
              label += `\nالهدف: ${goal} جم`;
              label += `\nالتقدم: ${progress}%`;
            }
            return label.split('\n');
          }
        }
      }
    },
    animation: enhanced ? {
      animateRotate: true,
      animateScale: false,
      duration: 1000,
      easing: 'easeOutQuart'
    } : {
      animateRotate: true,
      animateScale: false,
      duration: 800
    },
    onHover: enhanced ? (event, elements) => {
      event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
    } : undefined
  }

  // Custom plugin for center text
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: function(chart) {
      if (!enhanced || !centerText) return;
      
      const { width, height, ctx, chartArea } = chart;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw main value
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText(centerText.value, centerX, centerY - 10);
      
      // Draw label
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(centerText.label, centerX, centerY + 15);
      
      ctx.restore();
    }
  };

  return (
    <div className="relative h-full">
      <Doughnut 
        data={chartData} 
        options={options} 
        plugins={enhanced && centerText ? [centerTextPlugin] : []}
      />
    </div>
  )
}
