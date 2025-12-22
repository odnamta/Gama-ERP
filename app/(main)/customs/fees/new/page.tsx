import { FeeForm } from '@/components/customs-fees/fee-form';

export default function NewFeePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Customs Fee</h1>
        <p className="text-muted-foreground">
          Record a new customs fee or duty payment
        </p>
      </div>

      <FeeForm />
    </div>
  );
}
