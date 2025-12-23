'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevenueForecastSummary, ForecastChartData } from '@/types/predictive-analytics';
import { getRevenueForecastSummary, getForecastChartData, generateRevenueForecast } from '@/lib/predictive-analytics-actions';
import { formatPredictionCurrency } from '@/lib/predictive-analytics-utils';
import { ForecastSummaryCards } from './forecast-summary-cards';
import { ForecastChart } from './forecast-chart';
import { RefreshCw, Loader2 } from 'lucide-react';
import { addMonths } from 'date-fns';

export function RevenueForecastTab() {
  const [summary, setSummary] = useState<RevenueForecastSummary | null>(null);
  const [chartData, setChartData] = useState<ForecastChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryResult, chartResult] = await Promise.all([
        getRevenueForecastSummary(),
        getForecastChartData(6),
      ]);

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }
      if (chartResult.success && chartResult.data) {
        setChartData(chartResult.data);
      }
    } catch (error) {
      console.error('Error loading forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateForecast = async () => {
    setGenerating(true);
    try {
      // Generate forecasts for next 6 months
      const now = new Date();
      for (let i = 1; i <= 6; i++) {
        await generateRevenueForecast(addMonths(now, i));
      }
      await loadData();
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={handleGenerateForecast} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Generate Forecast
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && <ForecastSummaryCards summary={summary} />}

      {/* Chart */}
      <ForecastChart data={chartData} title="Next 6 Months Revenue Forecast" />

      {/* Breakdown */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Forecast Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline (confirmed)</p>
                <p className="text-lg font-semibold">
                  {formatPredictionCurrency(summary.breakdown.pipeline_confirmed)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline (probable)</p>
                <p className="text-lg font-semibold">
                  {formatPredictionCurrency(summary.breakdown.pipeline_probable)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recurring estimate</p>
                <p className="text-lg font-semibold">
                  {formatPredictionCurrency(summary.breakdown.recurring_estimate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New business est.</p>
                <p className="text-lg font-semibold">
                  {formatPredictionCurrency(summary.breakdown.new_business_estimate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
