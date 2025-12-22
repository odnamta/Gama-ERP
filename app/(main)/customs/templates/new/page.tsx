import { Metadata } from 'next';
import { TemplateForm } from '@/components/customs-templates';

export const metadata: Metadata = {
  title: 'New Template | Customs',
  description: 'Create a new customs document template',
};

export default function NewTemplatePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Template</h1>
        <p className="text-muted-foreground">
          Create a new customs document template with placeholders.
        </p>
      </div>
      <TemplateForm />
    </div>
  );
}
