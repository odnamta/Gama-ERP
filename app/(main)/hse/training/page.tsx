import { TrainingDashboardClient } from './training-client';
import {
  getTrainingStatistics,
  getComplianceMatrix,
  getExpiringTraining,
  getUpcomingSessions,
} from '@/lib/training-actions';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { canAccessFeature } from '@/lib/permissions';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export default async function TrainingDashboardPage() {
  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(
    canAccessFeature(profile, 'hse.training.view')
  );
  const [statistics, complianceEntries, expiringTraining, upcomingSessions] = await Promise.all([
    getTrainingStatistics(),
    getComplianceMatrix(),
    getExpiringTraining(60),
    getUpcomingSessions(),
  ]);

  return (
    <>
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
      <TrainingDashboardClient
        statistics={statistics}
        complianceEntries={complianceEntries}
        expiringTraining={expiringTraining}
        upcomingSessions={upcomingSessions}
      />
    </>
  );
}
