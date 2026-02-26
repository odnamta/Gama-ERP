import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getIncidentCategories } from '@/lib/incident-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { ReportClient } from './report-client';

export const dynamic = 'force-dynamic';

export default async function ReportIncidentPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.incidents.create')
  );

  const supabase = await createClient();

  const [categoriesResult, employeesResult, jobOrdersResult, assetsResult] = await Promise.all([
    getIncidentCategories(),
    supabase.from('employees').select('id, full_name').eq('status', 'active').order('full_name'),
    supabase.from('job_orders').select('id, jo_number').in('status', ['active', 'completed']).order('created_at', { ascending: false }).limit(50),
    supabase.from('assets').select('id, asset_code, asset_name').eq('status', 'active').order('asset_code'),
  ]);

  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <ReportClient
        categories={categoriesResult.data || []}
        employees={employeesResult.data || []}
        jobOrders={jobOrdersResult.data || []}
        assets={assetsResult.data || []}
        readOnly={explorerReadOnly}
      />
    </Suspense>
  );
}
