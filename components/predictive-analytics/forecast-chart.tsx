'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForecastChartData } from '@/types/predictive-analytics';
import { formatPredictionCurrency } from '@/lib/predictive-analytics-utils';

interface ForecastChartProps {
  data: ForecastChartData[];
  title?: string;
}

export function ForecastChart({ data, title = 'Revenue Forecast' }: ForecastChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No forecast data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map(d => d.confidence_high || d.predicted));
  const minValue = Math.min(...data.map(d => d.confidence_low || d.predicted));
  const range = maxValue - minValue || 1;

  // Calculate Y position (inverted because SVG Y starts from top)
  const getY = (value: number) => {
    return 200 - ((value - minValue) / range) * 180;
  };

  // Generate path for the main forecast line
  const forecastPath = data
    .map((d, i) => {
      const x = 50 + (i * (500 / (data.length - 1 || 1)));
      const y = getY(d.predicted);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate path for confidence area
  const confidenceAreaPath = [
    ...data.map((d, i) => {
      const x = 50 + (i * (500 / (data.length - 1 || 1)));
      const y = getY(d.confidence_high);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }),
    ...data.slice().reverse().map((d, i) => {
      const x = 50 + ((data.length - 1 - i) * (500 / (data.length - 1 || 1)));
      const y = getY(d.confidence_low);
      return `L ${x} ${y}`;
    }),
    'Z',
  ].join(' ');

  // Generate path for actual values (if available)
  const actualData = data.filter(d => d.actual !== undefined);
  const actualPath = actualData.length > 0
    ? actualData
        .map((d, i) => {
          const originalIndex = data.findIndex(od => od.month === d.month);
          const x = 50 + (originalIndex * (500 / (data.length - 1 || 1)));
          const y = getY(d.actual!);
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ')
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-blue-500"></span>
              Forecast
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-3 bg-blue-100 opacity-50"></span>
              Confidence Range
            </span>
            {actualData.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-0.5 bg-green-500 border-dashed"></span>
                Actual
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 600 250" className="w-full h-64">
          {/* Y-axis labels */}
          <text x="10" y="20" className="text-xs fill-gray-500">
            {formatPredictionCurrency(maxValue)}
          </text>
          <text x="10" y="110" className="text-xs fill-gray-500">
            {formatPredictionCurrency((maxValue + minValue) / 2)}
          </text>
          <text x="10" y="200" className="text-xs fill-gray-500">
            {formatPredictionCurrency(minValue)}
          </text>

          {/* Grid lines */}
          <line x1="50" y1="20" x2="550" y2="20" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="50" y1="110" x2="550" y2="110" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="50" y1="200" x2="550" y2="200" stroke="#e5e7eb" strokeWidth="1" />

          {/* Confidence area */}
          <path d={confidenceAreaPath} fill="rgba(59, 130, 246, 0.1)" />

          {/* Forecast line */}
          <path d={forecastPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Actual line */}
          {actualPath && (
            <path d={actualPath} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,5" />
          )}

          {/* Data points */}
          {data.map((d, i) => {
            const x = 50 + (i * (500 / (data.length - 1 || 1)));
            const y = getY(d.predicted);
            return (
              <g key={d.month}>
                <circle cx={x} cy={y} r="4" fill="#3b82f6" />
                {d.actual !== undefined && (
                  <circle cx={x} cy={getY(d.actual)} r="4" fill="#22c55e" />
                )}
                {/* X-axis label */}
                <text x={x} y="230" textAnchor="middle" className="text-xs fill-gray-500">
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}
