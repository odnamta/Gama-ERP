import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/permissions-server';
import { fetchFinancialAnalyticsData } from '@/lib/financial-analytics-actions';
import { FinancialAnalyticsClient } from '@/components/financial-analytics/financial-analytics-client';
import { Skeleton } from '@/components/ui/skeleton';

// =====================================================
// v0.62: Financial Analytics Page (Server Component)
// Route: /dashboard/executive/finance
// Requirements: 2.1 - Cash Flow tab access
// =====================================================

export const metadata = {
  title: 'Financial Analytics | Executive Dashboard',
  description: 'Deep-dive financial analytics with cash flow tracking and profitability reports',
};

// Roles allowed to access Financial Analytics
const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'finance'] as const;

export default async function FinancialAnalyticsPage() {
  // Fetch user profile for role-based access control
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect('/login');
  }

  const userRole = profile.role || 'viewer';

  // Check if user has permission to access Financial Analytics
  if (!ALLOWED_ROLES.includes(userRole as typeof ALLOWED_ROLES[number])) {
    redirect('/dashboard');
  }

  // Default to current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Fetch initial data
  const initialData = await fetchFinancialAnalyticsData(year, month);

  return (
    <Suspense fallback={<FinancialAnalyticsSkeleton />}>
      <div className="container mx-auto py-6">
        <FinancialAnalyticsClient
          initialData={initialData}
          initialYear={year}
          initialMonth={month}
        />
      </div>
    </Suspense>
  );
}

function FinancialAnalyticsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}
