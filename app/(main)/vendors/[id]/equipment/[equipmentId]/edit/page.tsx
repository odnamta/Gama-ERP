'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EquipmentForm } from '@/components/vendors/equipment-form';
import { EquipmentFormData } from '@/types/vendors';
import { getEquipmentById, updateEquipment } from '../../../../equipment-actions';
import { useToast } from '@/hooks/use-toast';

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [equipment, setEquipment] = useState<EquipmentFormData | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const vendorId = params.id as string;
  const equipmentId = params.equipmentId as string;

  useEffect(() => {
    if (document.cookie.includes('gama-explorer-mode=true')) {
      router.replace('/vendors');
      return;
    }

    async function loadEquipment() {
      const result = await getEquipmentById(equipmentId);
      if (result.error || !result.data) {
        toast({
          title: 'Error',
          description: result.error || 'Equipment tidak ditemukan',
          variant: 'destructive',
        });
        router.push(`/vendors/${vendorId}`);
        return;
      }
      setEquipment(result.data as unknown as EquipmentFormData);
      setIsFetching(false);
    }

    loadEquipment();
  }, [equipmentId, vendorId, router, toast]);

  const handleSubmit = async (data: EquipmentFormData) => {
    setIsLoading(true);
    try {
      const result = await updateEquipment(equipmentId, vendorId, data);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Equipment berhasil diperbarui',
        });
        router.push(`/vendors/${vendorId}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Equipment</h1>
          <p className="text-muted-foreground">
            {equipment?.plate_number
              ? `Edit ${equipment.plate_number}`
              : 'Edit equipment details'}
          </p>
        </div>
      </div>

      <EquipmentForm
        equipment={equipment}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        mode="edit"
      />
    </div>
  );
}
