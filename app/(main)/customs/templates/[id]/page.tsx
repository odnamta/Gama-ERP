import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTemplateById } from '@/lib/template-actions';
import { TemplateForm } from '@/components/customs-templates';

export const metadata: Metadata = {
  title: 'Edit Template | Customs',
  description: 'Edit customs document template',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: PageProps) {
  const { id } = await params;
  const { template, error } = await getTemplateById(id);

  if (error || !template) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Template</h1>
        <p className="text-muted-foreground">
          Modify the template settings and content.
        </p>
      </div>
      <TemplateForm template={template} />
    </div>
  );
}
