'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createContainer,
  updateContainer,
  getPIBDocuments,
  getPEBDocuments,
  getJobOrders,
} from '@/lib/fee-actions';
import {
  ContainerFormData,
  ContainerTracking,
  CustomsDocumentType,
  CONTAINER_SIZES,
  CONTAINER_SIZE_LABELS,
  CONTAINER_TYPES,
  CONTAINER_TYPE_LABELS,
} from '@/types/customs-fees';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContainerFormProps {
  container?: ContainerTracking;
  defaultDocumentType?: CustomsDocumentType;
  defaultDocumentId?: string;
}

interface DocumentOption {
  id: string;
  internal_ref: string;
}

interface JobOption {
  id: string;
  jo_number: string;
}

export function ContainerForm({ container, defaultDocumentType, defaultDocumentId }: ContainerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<CustomsDocumentType>(
    container?.pib_id ? 'pib' : container?.peb_id ? 'peb' : defaultDocumentType || 'pib'
  );
  const [pibDocuments, setPibDocuments] = useState<DocumentOption[]>([]);
  const [pebDocuments, setPebDocuments] = useState<DocumentOption[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOption[]>([]);

  // Form state
  const [pibId, setPibId] = useState(container?.pib_id || defaultDocumentId || '');
  const [pebId, setPebId] = useState(container?.peb_id || '');
  const [jobOrderId, setJobOrderId] = useState(container?.job_order_id || '');
  const [containerNumber, setContainerNumber] = useState(container?.container_number || '');
  const [containerSize, setContainerSize] = useState(container?.container_size || '');
  const [containerType, setContainerType] = useState(container?.container_type || '');
  const [sealNumber, setSealNumber] = useState(container?.seal_number || '');
  const [terminal, setTerminal] = useState(container?.terminal || '');
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(
    container?.arrival_date ? parseISO(container.arrival_date) : undefined
  );
  const [freeTimeDays, setFreeTimeDays] = useState(container?.free_time_days?.toString() || '7');
  const [dailyRate, setDailyRate] = useState(container?.daily_rate?.toString() || '');

  useEffect(() => {
    const loadData = async () => {
      const [pibData, pebData, jobData] = await Promise.all([
        getPIBDocuments(),
        getPEBDocuments(),
        getJobOrders(),
      ]);
      setPibDocuments(pibData);
      setPebDocuments(pebData);
      setJobOrders(jobData);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data: ContainerFormData = {
      pib_id: documentType === 'pib' ? pibId : undefined,
      peb_id: documentType === 'peb' ? pebId : undefined,
      job_order_id: jobOrderId || undefined,
      container_number: containerNumber,
      container_size: containerSize as ContainerFormData['container_size'],
      container_type: containerType as ContainerFormData['container_type'],
      seal_number: sealNumber || undefined,
      terminal: terminal || undefined,
      arrival_date: arrivalDate ? format(arrivalDate, 'yyyy-MM-dd') : undefined,
      free_time_days: parseInt(freeTimeDays) || 7,
      daily_rate: dailyRate ? parseFloat(dailyRate) : undefined,
    };

    let result;
    if (container) {
      result = await updateContainer(container.id, data);
    } else {
      result = await createContainer(data);
    }

    setLoading(false);

    if (result.success) {
      router.push('/customs/containers');
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{container ? 'Edit Container' : 'Add Container'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Link */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={(v) => setDocumentType(v as CustomsDocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pib">PIB (Import)</SelectItem>
                  <SelectItem value="peb">PEB (Export)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {documentType === 'pib' ? (
              <div className="space-y-2">
                <Label>PIB Document</Label>
                <Select value={pibId} onValueChange={setPibId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PIB" />
                  </SelectTrigger>
                  <SelectContent>
                    {pibDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.internal_ref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>PEB Document</Label>
                <Select value={pebId} onValueChange={setPebId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select PEB" />
                  </SelectTrigger>
                  <SelectContent>
                    {pebDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.internal_ref}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Job Order */}
          <div className="space-y-2">
            <Label>Job Order (Optional)</Label>
            <Select value={jobOrderId} onValueChange={setJobOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Job Order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {jobOrders.map((jo) => (
                  <SelectItem key={jo.id} value={jo.id}>
                    {jo.jo_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Container Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Container Number *</Label>
              <Input
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
                placeholder="e.g., MSKU1234567"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Seal Number</Label>
              <Input
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="Enter seal number"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Container Size</Label>
              <Select value={containerSize} onValueChange={setContainerSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {CONTAINER_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {CONTAINER_SIZE_LABELS[size]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Container Type</Label>
              <Select value={containerType} onValueChange={setContainerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTAINER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CONTAINER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="space-y-2">
            <Label>Terminal</Label>
            <Input
              value={terminal}
              onChange={(e) => setTerminal(e.target.value)}
              placeholder="e.g., JICT, TPK Koja"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Arrival Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !arrivalDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate ? format(arrivalDate, 'dd/MM/yyyy') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={arrivalDate}
                    onSelect={setArrivalDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Free Time (Days)</Label>
              <Input
                type="number"
                value={freeTimeDays}
                onChange={(e) => setFreeTimeDays(e.target.value)}
                min="1"
                max="30"
              />
            </div>
          </div>

          {/* Daily Rate */}
          <div className="space-y-2">
            <Label>Daily Storage Rate (IDR)</Label>
            <Input
              type="number"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              placeholder="e.g., 500000"
              min="0"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {container ? 'Update Container' : 'Add Container'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
