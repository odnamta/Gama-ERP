import { notFound } from 'next/navigation';
import { getJmpById } from '@/lib/jmp-actions';
import { JmpDetailView } from '@/components/jmp/jmp-detail-view';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JmpDetailPage({ params }: PageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  const jmp = await getJmpById(id);

  if (!jmp) {
    notFound();
  }

  // Get current user ID
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || '';

  return (
    <div className="container mx-auto py-6">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <JmpDetailView jmp={jmp} currentUserId={currentUserId} />
    </div>
  );
}
