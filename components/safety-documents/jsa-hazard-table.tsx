'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { JSAHazard } from '@/types/safety-document';
import { RiskLevelBadge } from './risk-level-badge';
import { JSAHazardForm } from './jsa-hazard-form';
import { deleteJSAHazard } from '@/lib/safety-document-actions';
import { useToast } from '@/hooks/use-toast';

interface JSAHazardTableProps {
  documentId: string;
  hazards: JSAHazard[];
  onUpdate: () => void;
  readOnly?: boolean;
}

export function JSAHazardTable({ documentId, hazards, onUpdate, readOnly = false }: JSAHazardTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingHazard, setEditingHazard] = useState<JSAHazard | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (hazardId: string) => {
    if (!confirm('Yakin ingin menghapus langkah ini?')) return;
    
    setDeleting(hazardId);
    const result = await deleteJSAHazard(hazardId);
    setDeleting(null);

    if (result.success) {
      toast({ title: 'Berhasil', description: 'Langkah JSA berhasil dihapus' });
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingHazard(null);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analisis Bahaya</h3>
        {!readOnly && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Langkah
          </Button>
        )}
      </div>

      {(showForm || editingHazard) && (
        <JSAHazardForm
          documentId={documentId}
          hazard={editingHazard || undefined}
          nextStepNumber={hazards.length + 1}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingHazard(null);
          }}
        />
      )}

      {hazards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>Belum ada langkah analisis bahaya</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead>Langkah Kerja</TableHead>
                <TableHead>Bahaya</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Pengendalian</TableHead>
                <TableHead>PIC</TableHead>
                {!readOnly && <TableHead className="w-24">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hazards.map((hazard) => (
                <TableRow key={hazard.id}>
                  <TableCell className="font-medium">{hazard.stepNumber}</TableCell>
                  <TableCell>{hazard.workStep}</TableCell>
                  <TableCell>
                    <div>
                      <p>{hazard.hazards}</p>
                      {hazard.consequences && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Konsekuensi: {hazard.consequences}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {hazard.riskLevel && <RiskLevelBadge level={hazard.riskLevel} />}
                  </TableCell>
                  <TableCell>{hazard.controlMeasures}</TableCell>
                  <TableCell>{hazard.responsible || '-'}</TableCell>
                  {!readOnly && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingHazard(hazard)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(hazard.id)}
                          disabled={deleting === hazard.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
