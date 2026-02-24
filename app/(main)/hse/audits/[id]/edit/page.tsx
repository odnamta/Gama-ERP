import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface AuditEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AuditEditPage({ params }: AuditEditPageProps) {
  const { id } = await params;
  redirect(`/hse/audits/${id}`);
}
