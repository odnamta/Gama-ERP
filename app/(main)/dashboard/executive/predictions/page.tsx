import { Metadata } from 'next';
import { PredictiveDashboard } from '@/components/predictive-analytics/predictive-dashboard';

export const metadata: Metadata = {
  title: 'Predictive Analytics | Gama ERP',
  description: 'AI-powered predictive analytics for revenue forecasting, risk assessment, and operational optimization',
};

export default function PredictionsPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <PredictiveDashboard />
    </div>
  );
}
