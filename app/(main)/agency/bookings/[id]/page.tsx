import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { BookingDetail } from './booking-detail';
import {
  getBooking,
  getBookingContainers,
  getBookingAmendments,
  getStatusHistory,
} from '@/app/actions/booking-actions';
import { getBookingFinancialSummary } from '@/app/actions/profitability-actions';
import { Loader2 } from 'lucide-react';
import { getCurrentUserProfile, guardPage } from '@/lib/auth-utils';
import { ExplorerReadOnlyBanner } from '@/components/layout/explorer-read-only-banner';

export const dynamic = 'force-dynamic';

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {

  const profile = await getCurrentUserProfile();
  const { explorerReadOnly } = await guardPage(!!profile);
  const { id } = await params;
  
  const [booking, containers, amendments, statusHistory, financialSummaryResult] = await Promise.all([
    getBooking(id),
    getBookingContainers(id),
    getBookingAmendments(id),
    getStatusHistory(id),
    getBookingFinancialSummary(id),
  ]);

  if (!booking) {
    notFound();
  }

  const financialSummary = financialSummaryResult.success ? financialSummaryResult.data : undefined;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
      {explorerReadOnly && <ExplorerReadOnlyBanner />}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BookingDetail
        booking={booking}
        containers={containers}
        amendments={amendments}
        statusHistory={statusHistory}
        financialSummary={financialSummary}
      />
    </Suspense>
  );
}
