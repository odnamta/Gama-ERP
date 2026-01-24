'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { SafetyPermit } from '@/types/safety-document';
import { approveBySupervisor, approveByHSE, activatePermit, cancelPermit } from '@/lib/safety-permit-actions';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils/format';

interface PermitApprovalPanelProps {
  permit: SafetyPermit;
  userRole?: string;
  onUpdate: () => void;
}

export function PermitApprovalPanel({ permit, userRole, onUpdate }: PermitApprovalPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSupervisorApprove = async () => {
    setLoading('supervisor');
    const result = await approveBySupervisor(permit.id);
    setLoading(null);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Izin disetujui oleh supervisor' });
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleHSEApprove = async () => {
    setLoading('hse');
    const result = await approveByHSE(permit.id);
    setLoading(null);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Izin disetujui oleh HSE' });
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleActivate = async () => {
    setLoading('activate');
    const result = await activatePermit(permit.id);
    setLoading(null);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Izin kerja diaktifkan' });
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Alasan pembatalan:');
    if (!reason) return;

    setLoading('cancel');
    const result = await cancelPermit(permit.id, reason);
    setLoading(null);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Izin kerja dibatalkan' });
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const canApproveAsSupervisor = permit.status === 'pending' && !permit.supervisorApprovedBy;
  const canApproveAsHSE = permit.status === 'pending' && permit.supervisorApprovedBy && !permit.hseApprovedBy;
  const canActivate = permit.status === 'approved';
  const canCancel = ['pending', 'approved', 'active'].includes(permit.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status Persetujuan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Supervisor Approval */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {permit.supervisorApprovedBy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
            <div>
              <p className="font-medium">Persetujuan Supervisor</p>
              {permit.supervisorApprovedBy ? (
                <p className="text-sm text-muted-foreground">
                  {permit.supervisorApprovedByName} - {formatDate(permit.supervisorApprovedAt!)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Menunggu persetujuan</p>
              )}
            </div>
          </div>
          {canApproveAsSupervisor && (
            <Button 
              size="sm" 
              onClick={handleSupervisorApprove}
              disabled={loading === 'supervisor'}
            >
              {loading === 'supervisor' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Setujui'}
            </Button>
          )}
        </div>

        {/* HSE Approval */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            {permit.hseApprovedBy ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : permit.supervisorApprovedBy ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : (
              <XCircle className="h-5 w-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">Persetujuan HSE</p>
              {permit.hseApprovedBy ? (
                <p className="text-sm text-muted-foreground">
                  {permit.hseApprovedByName} - {formatDate(permit.hseApprovedAt!)}
                </p>
              ) : permit.supervisorApprovedBy ? (
                <p className="text-sm text-muted-foreground">Menunggu persetujuan HSE</p>
              ) : (
                <p className="text-sm text-muted-foreground">Menunggu persetujuan supervisor</p>
              )}
            </div>
          </div>
          {canApproveAsHSE && (
            <Button 
              size="sm" 
              onClick={handleHSEApprove}
              disabled={loading === 'hse'}
            >
              {loading === 'hse' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Setujui'}
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canActivate && (
            <Button 
              onClick={handleActivate}
              disabled={loading === 'activate'}
              className="flex-1"
            >
              {loading === 'activate' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Aktifkan Izin
            </Button>
          )}
          {canCancel && (
            <Button 
              variant="destructive"
              onClick={handleCancel}
              disabled={loading === 'cancel'}
            >
              {loading === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Batalkan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
