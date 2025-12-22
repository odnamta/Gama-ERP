import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGeneratedDocumentById } from '@/lib/template-actions';
import { DocumentDetailView } from '@/components/customs-templates';

export const metadata: Metadata = {
  title: 'Document Details | Customs',
  description: 'View generated customs document',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { document, error } = await getGeneratedDocumentById(id);

  if (error || !document) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <DocumentDetailView document={document} />
    </div>
  );
}
