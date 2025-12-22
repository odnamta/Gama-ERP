'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { DriverAssignment, EscortDetails } from '@/types/jmp';

interface TeamAssignmentFormProps {
  convoyCommanderId?: string;
  drivers: DriverAssignment[];
  escortDetails?: EscortDetails;
  employees: { id: string; full_name: string; phone?: string }[];
  onChange: (data: {
    convoyCommanderId?: string;
    drivers: DriverAssignment[];
    escortDetails?: EscortDetails;
  }) => void;
  readonly?: boolean;
}

export function TeamAssignmentForm({
  convoyCommanderId,
  drivers,
  escortDetails,
  employees,
  onChange,
  readonly,
}: TeamAssignmentFormProps) {
  const addDriver = () => {
    onChange({
      convoyCommanderId,
      drivers: [...drivers, { name: '', vehicle: '', role: '', phone: '' }],
      escortDetails,
    });
  };

  const updateDriver = (index: number, field: keyof DriverAssignment, value: string) => {
    const updated = [...drivers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ convoyCommanderId, drivers: updated, escortDetails });
  };

  const removeDriver = (index: number) => {
    onChange({
      convoyCommanderId,
      drivers: drivers.filter((_, i) => i !== index),
      escortDetails,
    });
  };

  const updateEscort = (field: keyof EscortDetails, value: string | number) => {
    onChange({
      convoyCommanderId,
      drivers,
      escortDetails: { ...escortDetails, [field]: value } as EscortDetails,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convoy Commander</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={convoyCommanderId || ''}
            onValueChange={(value) => onChange({ convoyCommanderId: value, drivers, escortDetails })}
            disabled={readonly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select convoy commander" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name} {emp.phone && `(${emp.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Required for JMP approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Drivers</CardTitle>
          {!readonly && (
            <Button type="button" variant="outline" size="sm" onClick={addDriver}>
              <Plus className="h-4 w-4 mr-1" /> Add Driver
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {drivers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No drivers assigned</p>
          ) : (
            drivers.map((driver, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={driver.name}
                    onChange={(e) => updateDriver(idx, 'name', e.target.value)}
                    placeholder="Driver name"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label>Vehicle</Label>
                  <Input
                    value={driver.vehicle}
                    onChange={(e) => updateDriver(idx, 'vehicle', e.target.value)}
                    placeholder="Prime Mover"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={driver.role}
                    onChange={(e) => updateDriver(idx, 'role', e.target.value)}
                    placeholder="Main/Relief"
                    disabled={readonly}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={driver.phone}
                    onChange={(e) => updateDriver(idx, 'phone', e.target.value)}
                    placeholder="08xxx"
                    disabled={readonly}
                  />
                </div>
                {!readonly && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeDriver(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Escort Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Input
                value={escortDetails?.type || ''}
                onChange={(e) => updateEscort('type', e.target.value)}
                placeholder="Police / Private"
                disabled={readonly}
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={escortDetails?.company || ''}
                onChange={(e) => updateEscort('company', e.target.value)}
                placeholder="Escort company name"
                disabled={readonly}
              />
            </div>
            <div>
              <Label>Contact</Label>
              <Input
                value={escortDetails?.contact || ''}
                onChange={(e) => updateEscort('contact', e.target.value)}
                placeholder="Contact person & phone"
                disabled={readonly}
              />
            </div>
            <div>
              <Label>Vehicles Count</Label>
              <Input
                type="number"
                value={escortDetails?.vehiclesCount || ''}
                onChange={(e) => updateEscort('vehiclesCount', parseInt(e.target.value) || 0)}
                disabled={readonly}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
