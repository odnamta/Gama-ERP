import { notFound } from 'next/navigation';
import { getSurveyWithRelations, getWaypoints, getChecklist } from '@/lib/survey-actions';
import { SurveyDetailView } from '@/components/surveys/survey-detail-view';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  
  const [surveyResult, waypointsResult, checklistResult] = await Promise.all([
    getSurveyWithRelations(id),
    getWaypoints(id),
    getChecklist(id),
  ]);

  if (!surveyResult.success || !surveyResult.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <SurveyDetailView
        survey={surveyResult.data}
        waypoints={waypointsResult.data || []}
        checklist={checklistResult.data || []}
      />
    </div>
  );
}
