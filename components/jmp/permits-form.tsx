'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { JmpPermit } from '@/types/jmp';
import { getPermitStatus } from '@/lib/jmp-utils';

interface PermitsFormProps {
  permits: JmpPermit[];
  onChange: (permits: JmpPermit[]) => void;
  readonly?: boolean;
}

export function PermitsForm({ permits, onChange, readonly }: PermitsFormProps) {
  const addPermit = () => {
    onChange([
      ...permits,
      { permitType: '', permitNumber: '', issuingAuthority: '', validFrom: '', validTo: '' },
    ]);
  };

  const updatePermit = (index: number, field: keyof JmpPermit, value: string) => {
    const updated = [...permits];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removePermit = (index: number) => {
    onChange(permits.filter((_, i) => i !== index));
  };

  const getStatusBadge = (permit: JmpPermit) => {
    if (!permit.validFrom || !permit.validTo) {
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
    const status = getPermitStatus(permit, new Date().toISOString());
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
      case 'expiring_soon':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Permits & Authorizations</CardTitle>
        {!readonly && (
          <Button type="button" variant="outline" size="sm" onClick={addPermit}>
            <Plus className="h-4 w-4 mr-1" /> Add Permit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {permits.length === 0 ? (
          <p className="text-muted-foreground text-sm">No permits added</p>
        ) : (
          permits.map((permit, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div>
                    <Label>Permit Type</Label>
                    <Input
                      value={permit.permitType}
                      onChange={(e) => updatePermit(idx, 'permitType', e.target.value)}
                      placeholder="Oversized Load Permit"
                      disabled={readonly}
                    />
                  </div>
                  <div>
                    <Label>Permit Number</Label>
                    <Input
                      value={permit.permitNumber}
                      onChange={(e) => updatePermit(idx, 'permitNumber', e.target.value)}
                      placeholder="PERMIT-2025-001"
                      disabled={readonly}
                    />
                  </div>
                  <div>
                    <Label>Issuing Authority</Label>
                    <Input
                      value={permit.issuingAuthority}
                      onChange={(e) => updatePermit(idx, 'issuingAuthority', e.target.value)}
                      placeholder="Dishub Jatim"
                      disabled={readonly}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    {getStatusBadge(permit)}
                  </div>
                  <div>
                    <Label>Valid From</Label>
                    <Input
                      type="date"
                      value={permit.validFrom}
                      onChange={(e) => updatePermit(idx, 'validFrom', e.target.value)}
                      disabled={readonly}
                    />
                  </div>
                  <div>
                    <Label>Valid To</Label>
                    <Input
                      type="date"
                      value={permit.validTo}
                      onChange={(e) => updatePermit(idx, 'validTo', e.target.value)}
                      disabled={readonly}
                    />
                  </div>
                </div>
                {!readonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => removePermit(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
