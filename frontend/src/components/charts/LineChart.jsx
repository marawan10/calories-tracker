import React from 'react'
import { Line } from 'react-chartjs-2'

export default function LineChart({ labels = [], datasets = [], height = 120 }) {
  const data = { labels, datasets }
  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: 'rgba(148, 163, 184, .2)' } }
    }
  }
  return <Line data={data} options={options} height={height} />
}
