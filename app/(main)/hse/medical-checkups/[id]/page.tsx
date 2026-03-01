import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';
import { MedicalCheckupForm } from '@/components/medical-checkup/medical-checkup-form';
import { McuDeleteButton } from '@/components/medical-checkup/mcu-delete-button';
import { getMedicalCheckup } from '@/lib/medical-checkup-actions';

interface MedicalCheckupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MedicalCheckupDetailPage({ params }: MedicalCheckupDetailPageProps) {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.medical_checkups.view')
  );

  const { id } = await params;
  const supabase = await createClient();

  const record = await getMedicalCheckup(id);

  if (!record) {
    notFound();
  }

  const { data: employees } = await supabase
    .from('employees')
    .select('id, employee_code, full_name')
    .eq('status', 'active')
    .order('full_name');

  return (
    <div className="space-y-6">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Medical Checkup</h1>
          <p className="text-muted-foreground">
            {record.employee_name} - {record.clinic_name}
          </p>
        </div>
        {!explorerReadOnly && (
          <McuDeleteButton checkupId={record.id} employeeName={record.employee_name || ''} />
        )}
      </div>

      <MedicalCheckupForm record={record} employees={employees || []} />
    </div>
  );
}
