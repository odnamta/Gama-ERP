import { Suspense } from 'react';
import { NewDocumentClient } from './new-document-client';
import { getDocumentCategories } from '@/lib/safety-document-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Buat Dokumen Baru - HSE',
  description: 'Buat dokumen keselamatan baru',
};

export default async function NewDocumentPage() {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/hse/documents');
  }
  const categoriesResult = await getDocumentCategories();

  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <NewDocumentClient categories={categoriesResult.data || []} />
    </Suspense>
  );
}
