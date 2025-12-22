'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Filter } from 'lucide-react';
import { SafetyPermit, PermitType, PermitStatus } from '@/types/safety-document';
import { PermitCard } from './permit-card';
import { getPermitTypeLabel } from '@/lib/safety-document-utils';
import Link from 'next/link';

interface PermitListProps {
  permits: SafetyPermit[];
}

export function PermitList({ permits }: PermitListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPermits = permits.filter((permit) => {
    const matchesSearch = search === '' || 
      permit.workDescription.toLowerCase().includes(search.toLowerCase()) ||
      permit.permitNumber.toLowerCase().includes(search.toLowerCase()) ||
      permit.workLocation.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || permit.permitType === typeFilter;
    const matchesStatus = statusFilter === 'all' || permit.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const permitTypes: { value: PermitType | 'all'; label: string }[] = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'hot_work', label: getPermitTypeLabel('hot_work') },
    { value: 'confined_space', label: getPermitTypeLabel('confined_space') },
    { value: 'height_work', label: getPermitTypeLabel('height_work') },
    { value: 'excavation', label: getPermitTypeLabel('excavation') },
    { value: 'electrical', label: getPermitTypeLabel('electrical') },
    { value: 'lifting', label: getPermitTypeLabel('lifting') },
  ];

  const statuses: { value: PermitStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu Persetujuan' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'active', label: 'Aktif' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
    { value: 'expired', label: 'Kadaluarsa' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari izin kerja..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              {permitTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link href="/hse/permits/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Izin
            </Button>
          </Link>
        </div>
      </div>

      {filteredPermits.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Tidak ada izin kerja ditemukan</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPermits.map((permit) => (
            <PermitCard key={permit.id} permit={permit} />
          ))}
        </div>
      )}
    </div>
  );
}
