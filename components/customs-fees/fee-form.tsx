'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeeTypeSelect } from './fee-type-select';
import {
  createFee,
  updateFee,
  getPIBDocuments,
  getPEBDocuments,
  getJobOrders,
  getVendors,
} from '@/lib/fee-actions';
import {
  CustomsFeeWithRelations,
  CustomsFeeFormData,
  CustomsDocumentType,
} from '@/types/customs-fees';
import { Loader2 } from 'lucide-react';

interface FeeFormProps {
  fee?: CustomsFeeWithRelations;
  defaultDocumentType?: CustomsDocumentType;
  defaultDocumentId?: string;
  defaultJobOrderId?: string;
}

export function FeeForm({
  fee,
  defaultDocumentType,
  defaultDocumentId,
  defaultJobOrderId,
}: FeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [documentType, setDocumentType] = useState<CustomsDocumentType>(
    fee?.document_type || defaultDocumentType || 'pib'
  );
  const [pibId, setPibId] = useState(fee?.pib_id || defaultDocumentId || '');
  const [pebId, setPebId] = useState(fee?.peb_id || defaultDocumentId || '');
  const [jobOrderId, setJobOrderId] = useState(fee?.job_order_id || defaultJobOrderId || '');
  const [feeTypeId, setFeeTypeId] = useState(fee?.fee_type_id || '');
  const [description, setDescription] = useState(fee?.description || '');
  const [currency, setCurrency] = useState(fee?.currency || 'IDR');
  const [amount, setAmount] = useState(fee?.amount?.toString() || '');
  const [vendorId, setVendorId] = useState(fee?.vendor_id || '');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState(fee?.vendor_invoice_number || '');
  const [notes, setNotes] = useState(fee?.notes || '');

  // Dropdown data
  const [pibDocuments, setPibDocuments] = useState<{ id: string; internal_ref: string }[]>([]);
  const [pebDocuments, setPebDocuments] = useState<{ id: string; internal_ref: string }[]>([]);
  const [jobOrders, setJobOrders] = useState<{ id: string; jo_number: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; vendor_name: string }[]>([]);

  useEffect(() => {
    async function loadData() {
      const [pibs, pebs, jobs, vends] = await Promise.all([
        getPIBDocuments(),
        getPEBDocuments(),
        getJobOrders(),
        getVendors(),
      ]);
      setPibDocuments(pibs);
      setPebDocuments(pebs);
      setJobOrders(jobs);
      setVendors(vends);
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData: CustomsFeeFormData = {
      document_type: documentType,
      pib_id: documentType === 'pib' ? pibId : undefined,
      peb_id: documentType === 'peb' ? pebId : undefined,
      job_order_id: jobOrderId || undefined,
      fee_type_id: feeTypeId,
      description: description || undefined,
      currency,
      amount: parseFloat(amount),
      vendor_id: vendorId || undefined,
      vendor_invoice_number: vendorInvoiceNumber || undefined,
      notes: notes || undefined,
    };

    const result = fee
      ? await updateFee(fee.id, formData)
      : await createFee(formData);

    if (result.success) {
      router.push('/customs/fees');
      router.refresh();
    } else {
      setError(result.error || 'An error occurred');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{fee ? 'Edit Fee' : 'Add New Fee'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Document Type & Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                value={documentType}
                onValueChange={(v) => setDocumentType(v as CustomsDocumentType)}
                disabled={!!fee}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pib">PIB (Import)</SelectItem>
                  <SelectItem value="peb">PEB (Export)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{documentType === 'pib' ? 'PIB Document' : 'PEB Document'}</Label>
              {documentType === 'pib' ? (
                <Select value={pibId} onValueChange={setPibId} disabled={!!fee}>
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
              ) : (
                <Select value={pebId} onValueChange={setPebId} disabled={!!fee}>
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
              )}
            </div>
          </div>

          {/* Job Order */}
          <div className="space-y-2">
            <Label>Job Order (Optional)</Label>
            <Select value={jobOrderId || '__none__'} onValueChange={(v) => setJobOrderId(v === '__none__' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select job order for cost allocation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {jobOrders.map((jo) => (
                  <SelectItem key={jo.id} value={jo.id}>
                    {jo.jo_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fee Type */}
          <div className="space-y-2">
            <Label>Fee Type</Label>
            <FeeTypeSelect value={feeTypeId} onValueChange={setFeeTypeId} />
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fee description"
            />
          </div>

          {/* Vendor (for service fees) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vendor (Optional)</Label>
              <Select value={vendorId || '__none__'} onValueChange={(v) => setVendorId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.vendor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendor Invoice # (Optional)</Label>
              <Input
                value={vendorInvoiceNumber}
                onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                placeholder="Invoice number"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {fee ? 'Update Fee' : 'Create Fee'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
