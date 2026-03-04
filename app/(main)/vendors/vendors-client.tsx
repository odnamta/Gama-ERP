'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle } from 'lucide-react';
import { VendorFilters } from '@/components/vendors/vendor-filters';
import { VendorVirtualTable } from '@/components/vendors/vendor-virtual-table';
import { VendorSummaryCards } from '@/components/vendors/vendor-summary-cards';
import { VendorRatingDialog } from '@/components/vendors/vendor-rating-dialog';
import { VendorWithStats, VendorFilterState, VendorSummaryStats, VendorType } from '@/types/vendors';
import { getVendors, getVendorSummaryStats } from './actions';
import { usePermissions } from '@/components/providers/permission-provider';

export function VendorsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAccess } = usePermissions();

  const [vendors, setVendors] = useState<VendorWithStats[]>([]);
  const [stats, setStats] = useState<VendorSummaryStats>({
    total: 0,
    active: 0,
    preferred: 0,
    pendingVerification: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedVendorForRating, setSelectedVendorForRating] = useState<VendorWithStats | null>(null);
  const [filters, setFilters] = useState<VendorFilterState>({
    search: searchParams.get('search') || '',
    type: (searchParams.get('type') as VendorType | 'all') || 'all',
    status: (searchParams.get('status') as 'active' | 'inactive' | 'all') || 'active',
    preferredOnly: searchParams.get('preferred') === 'true',
  });

  const canCreate = canAccess('vendors.create');
  const canEdit = canAccess('vendors.edit');
  const canRate = canAccess('vendors.rate');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsResult, statsResult] = await Promise.all([
        getVendors(filters),
        getVendorSummaryStats(),
      ]);

      if (vendorsResult.error) {
        setError(vendorsResult.error);
      }
      if (vendorsResult.data) {
        setVendors(vendorsResult.data);
      }
      if (statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data vendor');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.type !== 'all') params.set('type', filters.type);
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.preferredOnly) params.set('preferred', 'true');

    const queryString = params.toString();
    const newUrl = queryString ? `/vendors?${queryString}` : '/vendors';
    router.replace(newUrl, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (newFilters: VendorFilterState) => {
    setFilters(newFilters);
  };

  const handleRate = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor) {
      setSelectedVendorForRating(vendor);
      setRatingDialogOpen(true);
    }
  };

  const handleRatingSuccess = () => {
    loadData(); // Reload to get updated ratings
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your vendors and suppliers
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => router.push('/vendors/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <VendorSummaryCards stats={stats} />

      {/* Filters */}
      <VendorFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* Table */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Gagal memuat vendor: {error}</span>
        </div>
      )}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading vendors...
        </div>
      ) : (
        <VendorVirtualTable
          vendors={vendors}
          canEdit={canEdit}
          canRate={canRate}
          onRate={handleRate}
        />
      )}

      {/* Rating Dialog */}
      {selectedVendorForRating && (
        <VendorRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          vendorId={selectedVendorForRating.id}
          vendorName={selectedVendorForRating.vendor_name}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
}
