import { Suspense } from 'react';
import { NewPermitClient } from './new-permit-client';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Buat Izin Kerja Baru - HSE',
  description: 'Buat izin kerja (PTW) baru',
};

export default async function NewPermitPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.permits.create')
  );

  const supabase = await createClient();

  // Fetch active job orders for linking
  const { data: jobOrders } = await supabase
    .from('job_orders')
    .select('id, jo_number')
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false });

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <NewPermitClient jobOrders={jobOrders || []} readOnly={explorerReadOnly} />
    </Suspense>
  );
}
