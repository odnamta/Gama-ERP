'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerChurnRisk, ChurnRiskSummary } from '@/types/predictive-analytics';
import { getCustomersAtRisk, getChurnRiskSummary, assessCustomerChurnRisk } from '@/lib/predictive-analytics-actions';
import { ChurnRiskTable } from './churn-risk-table';
import { RefreshCw, Loader2, AlertTriangle, Users } from 'lucide-react';

export function CustomerRiskTab() {
  const [customers, setCustomers] = useState<CustomerChurnRisk[]>([]);
  const [summary, setSummary] = useState<ChurnRiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessing, setAssessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersResult, summaryResult] = await Promise.all([
        getCustomersAtRisk({ minRiskScore: 0, limit: 50 }),
        getChurnRiskSummary(),
      ]);

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      }
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }
    } catch (error) {
      console.error('Error loading churn risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessRisk = async () => {
    setAssessing(true);
    try {
      await assessCustomerChurnRisk();
      await loadData();
    } catch (error) {
      console.error('Error assessing churn risk:', error);
    } finally {
      setAssessing(false);
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
        <Button onClick={handleAssessRisk} disabled={assessing}>
          {assessing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Run Assessment
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_customers}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.critical_count}</div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.high_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                At Risk Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.at_risk_count}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_customers > 0
                  ? `${Math.round((summary.at_risk_count / summary.total_customers) * 100)}% of customers`
                  : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Customers at Risk of Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChurnRiskTable data={customers} onRefresh={loadData} />
        </CardContent>
      </Card>
    </div>
  );
}
