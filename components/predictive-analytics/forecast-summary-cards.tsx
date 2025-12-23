'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueForecastSummary } from '@/types/predictive-analytics';
import { formatPredictionCurrency } from '@/lib/predictive-analytics-utils';
import { ConfidenceIndicator } from './confidence-indicator';
import { Calendar, TrendingUp, Target } from 'lucide-react';

interface ForecastSummaryCardsProps {
  summary: RevenueForecastSummary;
}

export function ForecastSummaryCards({ summary }: ForecastSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Monthly Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {summary.monthly.target_month} Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPredictionCurrency(summary.monthly.predicted)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Range: {formatPredictionCurrency(summary.monthly.range_low)} - {formatPredictionCurrency(summary.monthly.range_high)}
          </p>
          <div className="mt-2">
            <ConfidenceIndicator level={summary.monthly.confidence} size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {summary.quarterly.quarter} Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPredictionCurrency(summary.quarterly.predicted)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Range: {formatPredictionCurrency(summary.quarterly.range_low)} - {formatPredictionCurrency(summary.quarterly.range_high)}
          </p>
          <div className="mt-2">
            <ConfidenceIndicator level={summary.quarterly.confidence} size="sm" />
          </div>
        </CardContent>
      </Card>

      {/* Annual Forecast */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Full Year {summary.annual.year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPredictionCurrency(summary.annual.predicted)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Range: {formatPredictionCurrency(summary.annual.range_low)} - {formatPredictionCurrency(summary.annual.range_high)}
          </p>
          <div className="mt-2">
            <ConfidenceIndicator level={summary.annual.confidence} size="sm" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
