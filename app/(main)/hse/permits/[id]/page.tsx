import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PermitDetailClient } from './permit-detail-client';
import { getSafetyPermit } from '@/lib/safety-permit-actions';

export const metadata = {
  title: 'Detail Izin Kerja - HSE',
  description: 'Detail izin kerja (PTW)',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PermitDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  const permitResult = await getSafetyPermit(id);

  if (!permitResult.success || !permitResult.data) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <PermitDetailClient permit={permitResult.data} />
    </Suspense>
  );
}
