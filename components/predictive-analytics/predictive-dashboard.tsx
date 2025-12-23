'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueForecastTab } from './revenue-forecast-tab';
import { CustomerRiskTab } from './customer-risk-tab';
import { PaymentPredictionTab } from './payment-prediction-tab';
import { TrendingUp, Users, CreditCard, Wrench, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PredictiveDashboard() {
  const [activeTab, setActiveTab] = useState('revenue');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Predictive Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights for revenue forecasting, risk assessment, and operational optimization
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue Forecast</span>
            <span className="sm:hidden">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Customer Risk</span>
            <span className="sm:hidden">Churn</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment Prediction</span>
            <span className="sm:hidden">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
            <span className="sm:hidden">Maint.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueForecastTab />
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <CustomerRiskTab />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentPredictionTab />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Maintenance prediction coming soon</p>
              <p className="text-sm">This feature will predict equipment maintenance needs based on usage patterns</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
