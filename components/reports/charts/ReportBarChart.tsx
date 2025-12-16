'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BarChartData {
  category: string
  value: number
  previousValue?: number
}

interface ReportBarChartProps {
  data: BarChartData[]
  title?: string
  showComparison?: boolean
  orientation?: 'horizontal' | 'vertical'
  height?: number
}

export function ReportBarChart({
  data,
  title,
  showComparison = false,
  orientation = 'vertical',
  height = 300,
}: ReportBarChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (orientation === 'horizontal') {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatValue} />
            <YAxis type="category" dataKey="category" width={90} />
            <Tooltip formatter={(value) => formatTooltipValue(Number(value) || 0)} />
            <Bar dataKey="value" fill="#0088FE" name="Current" />
            {showComparison && <Bar dataKey="previousValue" fill="#82CA9D" name="Previous" />}
            {showComparison && <Legend />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis tickFormatter={formatValue} />
          <Tooltip formatter={(value) => formatTooltipValue(Number(value) || 0)} />
          <Bar dataKey="value" fill="#0088FE" name="Current" />
          {showComparison && <Bar dataKey="previousValue" fill="#82CA9D" name="Previous" />}
          {showComparison && <Legend />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
