// app/(main)/engineering/assessments/[id]/page.tsx
// Technical Assessment detail page (v0.58)

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAssessment, getLiftingPlans, getAxleCalculations } from '@/lib/assessment-actions';
import { AssessmentDetailView } from '@/components/assessments/assessment-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch assessment with related data
  const assessment = await getAssessment(id);
  
  if (!assessment) {
    notFound();
  }

  // Fetch lifting plans and axle calculations
  const [liftingPlans, axleCalculations] = await Promise.all([
    getLiftingPlans(id),
    getAxleCalculations(id),
  ]);

  return (
    <div className="container mx-auto py-6 px-4">
      <AssessmentDetailView
        assessment={assessment}
        liftingPlans={liftingPlans}
        axleCalculations={axleCalculations}
        currentUserId={user?.id}
      />
    </div>
  );
}
