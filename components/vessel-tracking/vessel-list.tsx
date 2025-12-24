'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VesselCard } from './vessel-card';
import {
  Vessel,
  VesselFilters,
  ShippingLine,
  VesselType,
  VesselStatus,
  VESSEL_TYPES,
  VESSEL_TYPE_LABELS,
  VESSEL_STATUSES,
  VESSEL_STATUS_LABELS,
} from '@/types/agency';
import { getVessels } from '@/app/actions/vessel-tracking-actions';
import { Plus, Search, X, Loader2, Ship, Anchor, Navigation } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface VesselStats {
  totalVessels: number;
  activeCount: number;
  underwayCount: number;
  mooredCount: number;
}

interface VesselListProps {
  initialVessels: Vessel[];
  initialStats?: VesselStats;
  shippingLines: ShippingLine[];
}

/**
 * List component for vessels with filters.
 * Supports filtering by type, status, and shipping line.
 * Supports search by name, IMO, and MMSI.
 * 
 * **Requirements: 1.1-1.7**
 */
export function VesselList({
  initialVessels,
  initialStats,
  shippingLines,
}: VesselListProps) {
  const [vessels, setVessels] = useState<Vessel[]>(initialVessels);
  const [stats] = useState<VesselStats | undefined>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<VesselFilters>({
    search: '',
    vesselType: undefined,
    status: undefined,
    shippingLineId: undefined,
    isActive: true,
  });

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await getVessels(filters);
      setVessels(results);
    } catch (error) {
      console.error('Failed to search vessels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key: keyof VesselFilters, value: string | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleClearFilters = async () => {
    const clearedFilters: VesselFilters = {
      search: '',
      vesselType: undefined,
      status: undefined,
      shippingLineId: undefined,
      isActive: true,
    };
    setFilters(clearedFilters);
    setIsLoading(true);
    try {
      const results = await getVessels(clearedFilters);
      setVessels(results);
    } catch (error) {
      console.error('Failed to clear filters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.vesselType ||
    filters.status ||
    filters.shippingLineId ||
    filters.isActive === false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vessels</h1>
          <p className="text-muted-foreground">
            Manage vessel database and track vessel information
          </p>
        </div>
        <Link href="/agency/vessels/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Vessel
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Ship className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vessels</p>
                  <p className="text-2xl font-bold">{stats.totalVessels}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Navigation className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Navigation className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Underway</p>
                  <p className="text-2xl font-bold">{stats.underwayCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Anchor className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moored</p>
                  <p className="text-2xl font-bold">{stats.mooredCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name, IMO, or MMSI..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={filters.vesselType || 'all'}
            onValueChange={(value) =>
              handleFilterChange('vesselType', value === 'all' ? undefined : value as VesselType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {VESSEL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {VESSEL_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[180px]">
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'all' ? undefined : value as VesselStatus)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {VESSEL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {VESSEL_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[200px]">
          <Select
            value={filters.shippingLineId || 'all'}
            onValueChange={(value) =>
              handleFilterChange('shippingLineId', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Shipping Lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shipping Lines</SelectItem>
              {shippingLines.map((line) => (
                <SelectItem key={line.id} value={line.id}>
                  {line.lineName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select
            value={filters.isActive === false ? 'inactive' : 'active'}
            onValueChange={(value) =>
              handleFilterChange('isActive', value === 'active' ? true : false)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Include Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} disabled={isLoading}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : vessels.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <Ship className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No vessels found</p>
          {hasActiveFilters && (
            <Button variant="link" onClick={handleClearFilters} className="mt-2">
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vessels.map((vessel) => (
            <VesselCard key={vessel.id} vessel={vessel} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && vessels.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
