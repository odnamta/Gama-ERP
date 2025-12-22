import { Suspense } from 'react';
import { NewPermitClient } from './new-permit-client';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Buat Izin Kerja Baru - HSE',
  description: 'Buat izin kerja (PTW) baru',
};

export default async function NewPermitPage() {
  const supabase = await createClient();
  
  // Fetch active job orders for linking
  const { data: jobOrders } = await supabase
    .from('job_orders')
    .select('id, jo_number')
    .in('status', ['active', 'in_progress'])
    .order('created_at', { ascending: false });

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <NewPermitClient jobOrders={jobOrders || []} />
    </Suspense>
  );
}
