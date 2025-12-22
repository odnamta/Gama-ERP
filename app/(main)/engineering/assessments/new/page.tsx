// app/(main)/engineering/assessments/new/page.tsx
// New Technical Assessment page (v0.58)

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AssessmentForm } from '@/components/assessments/assessment-form';
import { getAssessmentTypes } from '@/lib/assessment-actions';

export default async function NewAssessmentPage() {
  const assessmentTypes = await getAssessmentTypes();

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/engineering/assessments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Technical Assessment</h1>
        <p className="text-muted-foreground">
          Create a new lifting study, load calculation, or equipment specification
        </p>
      </div>

      {/* Form */}
      <AssessmentForm assessmentTypes={assessmentTypes} />
    </div>
  );
}
