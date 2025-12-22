import { notFound } from 'next/navigation';
import { FeeForm } from '@/components/customs-fees/fee-form';
import { getFee } from '@/lib/fee-actions';

interface FeeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeeDetailPage({ params }: FeeDetailPageProps) {
  const { id } = await params;
  const fee = await getFee(id);

  if (!fee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Customs Fee</h1>
        <p className="text-muted-foreground">
          Update fee details for {fee.fee_type?.fee_name}
        </p>
      </div>

      <FeeForm fee={fee} />
    </div>
  );
}
