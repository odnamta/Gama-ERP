import { Metadata } from 'next';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { TemplateForm } from '@/components/customs-templates';

export const metadata: Metadata = {
  title: 'New Template | Customs',
  description: 'Create a new customs document template',
};

export default async function NewTemplatePage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/customs/templates');
  }

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
