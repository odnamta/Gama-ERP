import { redirect } from 'next/navigation';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

interface AuditEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditEditPage({ params }: AuditEditPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/hse/audits');
  }
  const { id } = await params;
  redirect(`/hse/audits/${id}`);
}
