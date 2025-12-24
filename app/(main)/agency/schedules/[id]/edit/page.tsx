import { notFound } from 'next/navigation';
import { getSchedule, getVessels } from '@/app/actions/vessel-tracking-actions';
import { getPorts } from '@/app/actions/agency-actions';
import { EditScheduleClient } from './edit-schedule-client';

interface EditSchedulePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit schedule form page.
 * Allows updating schedule information including times and cutoffs.
 * 
 * **Requirements: 2.1-2.5**
 */
export default async function EditSchedulePage({ params }: EditSchedulePageProps) {
  const { id } = await params;
  
  const [schedule, vessels, portsResult] = await Promise.all([
    getSchedule(id),
    getVessels({ isActive: true }),
    getPorts(),
  ]);

  if (!schedule) {
    notFound();
  }

  const ports = portsResult.success && portsResult.data ? portsResult.data : [];

  return (
    <EditScheduleClient 
      schedule={schedule} 
      vessels={vessels}
      ports={ports}
    />
  );
}
