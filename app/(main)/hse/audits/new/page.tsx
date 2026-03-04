'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuditForm } from '@/components/hse/audits/audit-form';

export default function NewAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeId = searchParams.get('type') || undefined;

  useEffect(() => {
    if (document.cookie.includes('gama-explorer-mode=true')) {
      router.replace('/hse/audits');
    }
  }, [router]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">New Audit</h1>
      <AuditForm preselectedTypeId={typeId} />
    </div>
  );
}
