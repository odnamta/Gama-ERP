'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface LineChartData {
  date: string
  value: number
  label?: string
}

interface ReportLineChartProps {
  data: LineChartData[]
  title?: string
  showArea?: boolean
  height?: number
}

export function ReportLineChart({
  data,
  title,
  showArea = false,
  height = 300,
}: ReportLineChartProps) {
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

  if (showArea) {
    return (
      <div className="w-full">
        {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatValue} />
            <Tooltip formatter={(value) => formatTooltipValue(Number(value) || 0)} />
            <Area type="monotone" dataKey="value" stroke="#0088FE" fill="#0088FE" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={formatValue} />
          <Tooltip formatter={(value) => formatTooltipValue(Number(value) || 0)} />
          <Line type="monotone" dataKey="value" stroke="#0088FE" strokeWidth={2} dot={{ fill: '#0088FE' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
