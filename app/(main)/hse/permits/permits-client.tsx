'use client';

import { SafetyPermit, PermitStatistics } from '@/types/safety-document';
import { PermitSummaryCards, PermitList } from '@/components/safety-permits';

interface PermitsClientProps {
  permits: SafetyPermit[];
  statistics: PermitStatistics;
  readOnly?: boolean;
}

export function PermitsClient({ permits, statistics, readOnly }: PermitsClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Izin Kerja (PTW)</h1>
        <p className="text-muted-foreground">
          Kelola permit to work untuk pekerjaan berbahaya
        </p>
      </div>

      <PermitSummaryCards statistics={statistics} />

      <PermitList permits={permits} readOnly={readOnly} />
    </div>
  );
}
