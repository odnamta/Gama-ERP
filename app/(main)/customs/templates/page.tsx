import { Metadata } from 'next';
import { getTemplates } from '@/lib/template-actions';
import { TemplateList } from '@/components/customs-templates';

export const metadata: Metadata = {
  title: 'Document Templates | Customs',
  description: 'Manage customs document templates',
};

export default async function TemplatesPage() {
  const { templates } = await getTemplates();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Templates</h1>
        <p className="text-muted-foreground">
          Manage templates for customs documents like packing lists and commercial invoices.
        </p>
      </div>
      <TemplateList templates={templates} />
    </div>
  );
}
