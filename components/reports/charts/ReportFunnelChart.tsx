'use client'

import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts'

interface FunnelChartData {
  stage: string
  value: number
  count: number
  fill?: string
}

interface ReportFunnelChartProps {
  data: FunnelChartData[]
  title?: string
  showPercentages?: boolean
  height?: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ReportFunnelChart({
  data,
  title,
  height = 300,
}: ReportFunnelChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.fill || COLORS[index % COLORS.length],
  }))

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <FunnelChart>
          <Tooltip
            formatter={(value, name) => [formatValue(Number(value) || 0), String(name)]}
            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
          />
          <Funnel
            dataKey="value"
            data={chartData}
            isAnimationActive
          >
            <LabelList position="right" fill="#000" stroke="none" dataKey="stage" />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  )
}
