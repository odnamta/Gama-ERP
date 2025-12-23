'use client';

// =====================================================
// v0.61: Trend Chart Component (Line Chart)
// Requirements: 12.1, 12.2, 12.3, 12.4
// - 12.1: Display 12-month trend chart for revenue and profit
// - 12.2: Show monthly data points
// - 12.3: Support line charts for trend visualization
// - 12.4: Display legend identifying each data series
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendDataPoint } from '@/types/executive-dashboard';
import { cn } from '@/lib/utils';

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  secondaryData?: TrendDataPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function TrendChart({
  title,
  data,
  secondaryData,
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
  formatValue = (v) => v.toLocaleString(),
  className,
}: TrendChartProps) {
  // Find max value for scaling
  const allValues = [
    ...data.map(d => d.value),
    ...(secondaryData?.map(d => d.value) || []),
  ];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;

  // Chart dimensions
  const chartWidth = 100; // percentage
  const chartHeight = 160; // pixels
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };
  const plotWidth = chartWidth;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate Y position (inverted because SVG Y starts from top)
  const getY = (value: number) => {
    const normalized = (value - minValue) / range;
    return padding.top + plotHeight * (1 - normalized);
  };

  // Calculate X position
  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (data.length - 1)) * (plotWidth - padding.left - padding.right);
  };

  // Generate SVG path for line chart
  const generatePath = (points: TrendDataPoint[]) => {
    if (points.length === 0) return '';
    
    return points
      .map((point, index) => {
        const x = getX(index);
        const y = getY(point.value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Format large numbers for Y-axis
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  // Y-axis tick values
  const yTicks = [minValue, (maxValue + minValue) / 2, maxValue];

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Legend (Requirement 12.4) */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500 rounded" />
            <span>{primaryLabel}</span>
          </div>
          {secondaryData && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-green-500 rounded" />
              <span>{secondaryLabel}</span>
            </div>
          )}
        </div>

        {/* Line Chart (Requirements 12.2, 12.3) */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-40 w-12 flex flex-col justify-between text-xs text-muted-foreground">
            {yTicks.reverse().map((tick, i) => (
              <span key={i}>{formatLargeNumber(tick)}</span>
            ))}
          </div>

          {/* SVG Chart */}
          <div className="ml-12">
            <svg
              viewBox={`0 0 ${chartWidth + padding.left + padding.right} ${chartHeight}`}
              className="w-full h-48"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {yTicks.map((tick, i) => (
                <line
                  key={i}
                  x1={padding.left}
                  y1={getY(tick)}
                  x2={chartWidth}
                  y2={getY(tick)}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="4 4"
                />
              ))}

              {/* Primary line */}
              <path
                d={generatePath(data)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Primary data points */}
              {data.map((point, index) => (
                <g key={`primary-${index}`}>
                  <circle
                    cx={getX(index)}
                    cy={getY(point.value)}
                    r="4"
                    fill="#3b82f6"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                  <title>{`${primaryLabel}: ${formatValue(point.value)} (${point.month})`}</title>
                </g>
              ))}

              {/* Secondary line */}
              {secondaryData && (
                <>
                  <path
                    d={generatePath(secondaryData)}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Secondary data points */}
                  {secondaryData.map((point, index) => (
                    <g key={`secondary-${index}`}>
                      <circle
                        cx={getX(index)}
                        cy={getY(point.value)}
                        r="4"
                        fill="#22c55e"
                        className="hover:r-6 transition-all cursor-pointer"
                      />
                      <title>{`${secondaryLabel}: ${formatValue(point.value)} (${point.month})`}</title>
                    </g>
                  ))}
                </>
              )}
            </svg>

            {/* X-axis labels (Requirement 12.2 - monthly data points) */}
            <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
              {data.map((point, index) => (
                <span
                  key={index}
                  className="text-center"
                  style={{ width: `${100 / data.length}%` }}
                >
                  {point.month}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TrendChart;
