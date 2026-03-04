import { notFound } from 'next/navigation';
import { ContainerForm } from '@/components/customs-fees/container-form';
import { getContainer } from '@/lib/fee-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';

interface EditContainerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditContainerPage({ params }: EditContainerPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  if (explorerReadOnly) {
    const { redirect } = await import('next/navigation');
    redirect('/customs/containers');
  }
  const { id } = await params;
  const container = await getContainer(id);

  if (!container) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Container</h1>
        <p className="text-muted-foreground">
          Update details for {container.container_number}
        </p>
      </div>

      <ContainerForm container={container} />
    </div>
  );
}
