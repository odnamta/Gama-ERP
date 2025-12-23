import { Suspense } from 'react';
import { getUserProfile } from '@/lib/permissions-server';
import { redirect } from 'next/navigation';
import { ExecutiveDashboardClient } from './executive-dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

// =====================================================
// v0.61: Executive Dashboard Page (Server Component)
// Route: /dashboard/executive
// Requirements: 11.1, 11.4, 13.1, 15.1
// =====================================================

export default async function ExecutiveDashboardPage() {
  // Fetch user profile for role-based KPI filtering (Requirement 13.1)
  const profile = await getUserProfile();
  
  if (!profile) {
    redirect('/login');
  }

  const userRole = profile.role || 'viewer';
  const userId = profile.id || '';

  return (
    <Suspense fallback={<ExecutiveDashboardSkeleton />}>
      <ExecutiveDashboardClient 
        userRole={userRole} 
        userId={userId}
      />
    </Suspense>
  );
}

function ExecutiveDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
