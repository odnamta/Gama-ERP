'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ConvoyConfiguration, ConvoyVehicle } from '@/types/jmp';

interface ConvoyConfigFormProps {
  config: ConvoyConfiguration | undefined;
  onChange: (config: ConvoyConfiguration) => void;
  readonly?: boolean;
}

const defaultConfig: ConvoyConfiguration = {
  cargoTransport: { type: '', trailerType: '', plateNumber: '', driver: '' },
};

export function ConvoyConfigForm({ config, onChange, readonly }: ConvoyConfigFormProps) {
  const current = config || defaultConfig;

  const updateLead = (field: keyof ConvoyVehicle, value: string) => {
    onChange({
      ...current,
      leadVehicle: { ...current.leadVehicle, [field]: value } as ConvoyVehicle,
    });
  };

  const updateCargo = (field: string, value: string) => {
    onChange({
      ...current,
      cargoTransport: { ...current.cargoTransport, [field]: value },
    });
  };

  const updateChase = (field: keyof ConvoyVehicle, value: string) => {
    onChange({
      ...current,
      chaseVehicle: { ...current.chaseVehicle, [field]: value } as ConvoyVehicle,
    });
  };

  const updateEscort = (field: string, value: string | number) => {
    onChange({
      ...current,
      escortVehicles: { ...current.escortVehicles, [field]: value } as ConvoyConfiguration['escortVehicles'],
    });
  };

  const addSupport = () => {
    onChange({
      ...current,
      supportVehicles: [...(current.supportVehicles || []), { type: '', purpose: '', plateNumber: '' }],
    });
  };

  const updateSupport = (index: number, field: string, value: string) => {
    const updated = [...(current.supportVehicles || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...current, supportVehicles: updated });
  };

  const removeSupport = (index: number) => {
    onChange({
      ...current,
      supportVehicles: (current.supportVehicles || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <Input value={current.leadVehicle?.type || ''} onChange={(e) => updateLead('type', e.target.value)} placeholder="Pickup" disabled={readonly} />
            </div>
            <div>
              <Label>Plate Number</Label>
              <Input value={current.leadVehicle?.plateNumber || ''} onChange={(e) => updateLead('plateNumber', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <Label>Driver</Label>
              <Input value={current.leadVehicle?.driver || ''} onChange={(e) => updateLead('driver', e.target.value)} disabled={readonly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cargo Transport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type *</Label>
              <Input value={current.cargoTransport.type} onChange={(e) => updateCargo('type', e.target.value)} placeholder="Prime Mover + Lowbed" disabled={readonly} />
            </div>
            <div>
              <Label>Trailer Type</Label>
              <Input value={current.cargoTransport.trailerType || ''} onChange={(e) => updateCargo('trailerType', e.target.value)} placeholder="Lowbed 100T" disabled={readonly} />
            </div>
            <div>
              <Label>Plate Number</Label>
              <Input value={current.cargoTransport.plateNumber || ''} onChange={(e) => updateCargo('plateNumber', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <Label>Driver</Label>
              <Input value={current.cargoTransport.driver || ''} onChange={(e) => updateCargo('driver', e.target.value)} disabled={readonly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escort Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Count</Label>
              <Input type="number" value={current.escortVehicles?.count || ''} onChange={(e) => updateEscort('count', parseInt(e.target.value) || 0)} disabled={readonly} />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={current.escortVehicles?.type || ''} onChange={(e) => updateEscort('type', e.target.value)} placeholder="Police/Private" disabled={readonly} />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={current.escortVehicles?.company || ''} onChange={(e) => updateEscort('company', e.target.value)} disabled={readonly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chase Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Type</Label>
              <Input value={current.chaseVehicle?.type || ''} onChange={(e) => updateChase('type', e.target.value)} placeholder="Pickup" disabled={readonly} />
            </div>
            <div>
              <Label>Plate Number</Label>
              <Input value={current.chaseVehicle?.plateNumber || ''} onChange={(e) => updateChase('plateNumber', e.target.value)} disabled={readonly} />
            </div>
            <div>
              <Label>Driver</Label>
              <Input value={current.chaseVehicle?.driver || ''} onChange={(e) => updateChase('driver', e.target.value)} disabled={readonly} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Support Vehicles</CardTitle>
          {!readonly && (
            <Button type="button" variant="outline" size="sm" onClick={addSupport}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {(!current.supportVehicles || current.supportVehicles.length === 0) ? (
            <p className="text-muted-foreground text-sm">No support vehicles</p>
          ) : (
            current.supportVehicles.map((v, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label>Type</Label>
                  <Input value={v.type} onChange={(e) => updateSupport(idx, 'type', e.target.value)} disabled={readonly} />
                </div>
                <div>
                  <Label>Purpose</Label>
                  <Input value={v.purpose} onChange={(e) => updateSupport(idx, 'purpose', e.target.value)} disabled={readonly} />
                </div>
                <div>
                  <Label>Plate</Label>
                  <Input value={v.plateNumber || ''} onChange={(e) => updateSupport(idx, 'plateNumber', e.target.value)} disabled={readonly} />
                </div>
                {!readonly && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSupport(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
