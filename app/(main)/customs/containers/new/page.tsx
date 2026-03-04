import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ContainerForm } from '@/components/customs-fees/container-form';

export default async function NewContainerPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/customs/containers');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Container</h1>
        <p className="text-muted-foreground">
          Track a new container for demurrage calculation
        </p>
      </div>

      <ContainerForm />
    </div>
  );
}
