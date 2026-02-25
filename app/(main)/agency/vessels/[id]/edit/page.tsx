import { notFound } from 'next/navigation';
import { getVessel } from '@/app/actions/vessel-tracking-actions';
import { getShippingLines } from '@/app/actions/shipping-line-actions';
import { EditVesselClient } from './edit-vessel-client';

interface EditVesselPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVesselPage({ params }: EditVesselPageProps) {
  const { id } = await params;
  
  const [vessel, shippingLinesResult] = await Promise.all([
    getVessel(id),
    getShippingLines(),
  ]);

  if (!vessel) {
    notFound();
  }

  const shippingLines = shippingLinesResult.success && shippingLinesResult.data 
    ? shippingLinesResult.data 
    : [];

  return <EditVesselClient vessel={vessel} shippingLines={shippingLines} />;
}
