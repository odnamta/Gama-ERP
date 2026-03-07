'use client'

/**
 * Route Distance & Rate Suggestion Panel
 *
 * Collapsible panel shown in the PJO form after POL/POD are selected.
 * Provides:
 * - Google Maps driving distance & duration calculation
 * - Customer contract rate suggestions matching the route
 * - Vendor rate suggestions for common freight services
 *
 * This is a DECISION SUPPORT tool — user can accept or ignore suggestions.
 */

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Route,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calculator,
  DollarSign,
  TrendingUp,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/format'
import { calculateRouteDistance, calculateRouteDistanceByCoords } from '@/lib/route-distance'
import type { RouteDistanceResult } from '@/lib/route-distance'
import { lookupRouteRates } from '@/lib/route-rate-lookup'
import type { RateSuggestion } from '@/lib/route-rate-lookup'
import { CUSTOMER_SERVICE_TYPE_LABELS } from '@/types/customer-rate'
import { SERVICE_TYPE_LABELS } from '@/types/vendor-rate'
import { UNIT_LABELS } from '@/types/vendor-rate'

interface RouteDistancePanelProps {
  pol: string
  pod: string
  polLat?: number
  polLng?: number
  podLat?: number
  podLng?: number
  customerId: string | null
  disabled?: boolean
  onApplyRevenue?: (description: string, unitPrice: number, unit: string) => void
  onApplyCost?: (description: string, amount: number, category: string) => void
}

export function RouteDistancePanel({
  pol,
  pod,
  polLat,
  polLng,
  podLat,
  podLng,
  customerId,
  disabled = false,
  onApplyRevenue,
  onApplyCost,
}: RouteDistancePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [distanceResult, setDistanceResult] = useState<RouteDistanceResult | null>(null)
  const [customerRates, setCustomerRates] = useState<RateSuggestion[]>([])
  const [vendorRates, setVendorRates] = useState<RateSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [appliedRates, setAppliedRates] = useState<Set<string>>(new Set())

  const canCalculate = !!pol && !!pod

  const handleCalculateDistance = useCallback(async () => {
    if (!canCalculate) return
    setIsCalculating(true)
    setError(null)

    try {
      // Prefer coordinates if available (more accurate)
      let result
      if (polLat && polLng && podLat && podLng) {
        result = await calculateRouteDistanceByCoords(
          polLat, polLng, podLat, podLng, pol, pod
        )
      } else {
        result = await calculateRouteDistance(pol, pod)
      }

      if (result.error) {
        setError(result.error)
        setDistanceResult(null)
      } else {
        setDistanceResult(result.data)
        setError(null)
      }
    } catch {
      setError('Gagal menghitung jarak. Coba lagi.')
      setDistanceResult(null)
    } finally {
      setIsCalculating(false)
    }
  }, [pol, pod, polLat, polLng, podLat, podLng, canCalculate])

  const handleLoadRates = useCallback(async () => {
    if (!customerId) return
    setIsLoadingRates(true)

    try {
      const result = await lookupRouteRates(customerId, pol, pod)
      if (result.error) {
        // Non-fatal: just show distance without rates
      }
      setCustomerRates(result.data.customerRates)
      setVendorRates(result.data.vendorRates)
    } catch {
      // Non-fatal
    } finally {
      setIsLoadingRates(false)
    }
  }, [customerId, pol, pod])

  const handleCalculateAll = useCallback(async () => {
    setIsOpen(true)
    await Promise.all([
      handleCalculateDistance(),
      customerId ? handleLoadRates() : Promise.resolve(),
    ])
  }, [handleCalculateDistance, handleLoadRates, customerId])

  const handleApplyRate = useCallback((rate: RateSuggestion) => {
    if (rate.type === 'customer' && onApplyRevenue) {
      onApplyRevenue(rate.description, rate.base_price, rate.unit)
      setAppliedRates(prev => new Set(prev).add(rate.id))
    } else if (rate.type === 'vendor' && onApplyCost) {
      // Map vendor service_type to cost category
      const categoryMap: Record<string, string> = {
        trucking: 'transport',
        equipment_rental: 'equipment',
        labor: 'labor',
        shipping: 'transport',
        port_handling: 'port_charges',
      }
      const category = categoryMap[rate.service_type] || 'other'
      onApplyCost(
        `${rate.source_name} - ${rate.description}`,
        rate.base_price,
        category,
      )
      setAppliedRates(prev => new Set(prev).add(rate.id))
    }
  }, [onApplyRevenue, onApplyCost])

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} menit`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours} jam`
    return `${hours} jam ${mins} menit`
  }

  function getServiceLabel(type: 'customer' | 'vendor', serviceType: string): string {
    if (type === 'customer') {
      return CUSTOMER_SERVICE_TYPE_LABELS[serviceType as keyof typeof CUSTOMER_SERVICE_TYPE_LABELS] || serviceType
    }
    return SERVICE_TYPE_LABELS[serviceType as keyof typeof SERVICE_TYPE_LABELS] || serviceType
  }

  function getUnitLabel(unit: string): string {
    return UNIT_LABELS[unit] || unit
  }

  // Don't render at all if no POL or POD
  if (!pol && !pod) return null

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Kalkulasi Jarak & Referensi Tarif</CardTitle>
              {distanceResult && (
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  {distanceResult.distance_km} km
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!distanceResult && canCalculate && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateAll}
                  disabled={disabled || isCalculating || !canCalculate}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Menghitung...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-1.5 h-3.5 w-3.5" />
                      Hitung Jarak
                    </>
                  )}
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {!canCalculate && (
            <p className="text-xs text-muted-foreground mt-1">
              Isi POL dan POD terlebih dahulu untuk menghitung jarak rute
            </p>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Error State */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md p-3">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCalculateAll}
                  className="ml-auto text-red-600 hover:text-red-800 h-7"
                >
                  Coba Lagi
                </Button>
              </div>
            )}

            {/* Distance Result */}
            {distanceResult && (
              <div className="bg-white rounded-lg border border-emerald-200 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Asal
                    </p>
                    <p className="text-sm font-medium mt-0.5 truncate" title={distanceResult.origin_address}>
                      {distanceResult.origin_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Tujuan
                    </p>
                    <p className="text-sm font-medium mt-0.5 truncate" title={distanceResult.destination_address}>
                      {distanceResult.destination_address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      Jarak Tempuh
                    </p>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      {distanceResult.distance_km} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Estimasi Waktu
                    </p>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      {formatDuration(distanceResult.duration_minutes)}
                    </p>
                  </div>
                </div>

                {/* Recalculate button */}
                <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Jarak dihitung via Google Maps (rute jalan darat)
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCalculateAll}
                    disabled={isCalculating}
                    className="text-emerald-600 hover:text-emerald-800 h-7 text-xs"
                  >
                    {isCalculating ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Calculator className="mr-1 h-3 w-3" />
                    )}
                    Hitung Ulang
                  </Button>
                </div>
              </div>
            )}

            {/* Loading indicator for initial calculation */}
            {isCalculating && !distanceResult && (
              <div className="flex items-center justify-center gap-2 py-6 text-emerald-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Menghitung jarak rute...</span>
              </div>
            )}

            {/* Rate Suggestions */}
            {(customerRates.length > 0 || vendorRates.length > 0) && (
              <>
                <Separator className="bg-emerald-200" />

                <div>
                  <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5 mb-3">
                    <DollarSign className="h-4 w-4" />
                    Referensi Tarif
                  </h4>

                  {/* Customer Contract Rates */}
                  {customerRates.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Tarif Kontrak Customer ({customerRates.length})
                      </p>
                      <div className="space-y-2">
                        {customerRates.map(rate => (
                          <RateCard
                            key={rate.id}
                            rate={rate}
                            isApplied={appliedRates.has(rate.id)}
                            onApply={() => handleApplyRate(rate)}
                            serviceLabel={getServiceLabel('customer', rate.service_type)}
                            unitLabel={getUnitLabel(rate.unit)}
                            canApply={!!onApplyRevenue}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vendor Rates */}
                  {vendorRates.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-emerald-700 mb-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Tarif Vendor Aktif ({vendorRates.length})
                      </p>
                      <div className="space-y-2">
                        {vendorRates.map(rate => (
                          <RateCard
                            key={rate.id}
                            rate={rate}
                            isApplied={appliedRates.has(rate.id)}
                            onApply={() => handleApplyRate(rate)}
                            serviceLabel={getServiceLabel('vendor', rate.service_type)}
                            unitLabel={getUnitLabel(rate.unit)}
                            canApply={!!onApplyCost}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Loading rates */}
            {isLoadingRates && (
              <div className="flex items-center gap-2 py-3 text-emerald-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Memuat referensi tarif...</span>
              </div>
            )}

            {/* No rates found (only show after calculation) */}
            {distanceResult && !isLoadingRates && customerRates.length === 0 && vendorRates.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-3">
                Tidak ada tarif kontrak atau vendor yang cocok ditemukan untuk rute ini
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

/**
 * Individual rate card with apply button
 */
function RateCard({
  rate,
  isApplied,
  onApply,
  serviceLabel,
  unitLabel,
  canApply,
}: {
  rate: RateSuggestion
  isApplied: boolean
  onApply: () => void
  serviceLabel: string
  unitLabel: string
  canApply: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-white rounded-md border p-3',
      isApplied ? 'border-green-300 bg-green-50/50' : 'border-emerald-100'
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            {serviceLabel}
          </Badge>
          {rate.source_name && rate.type === 'vendor' && (
            <span className="text-[10px] text-muted-foreground truncate">
              {rate.source_name}
            </span>
          )}
        </div>
        <p className="text-sm font-medium truncate">{rate.description}</p>
        {rate.route_pattern && (
          <p className="text-xs text-muted-foreground">Rute: {rate.route_pattern}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold">{formatCurrency(rate.base_price)}</p>
        <p className="text-[10px] text-muted-foreground">{unitLabel}</p>
      </div>
      {canApply && (
        <Button
          type="button"
          variant={isApplied ? 'ghost' : 'outline'}
          size="sm"
          onClick={onApply}
          disabled={isApplied}
          className={cn(
            'shrink-0 h-8',
            isApplied ? 'text-green-600' : 'text-emerald-600 hover:bg-emerald-50'
          )}
        >
          {isApplied ? (
            <>
              <Check className="mr-1 h-3.5 w-3.5" />
              Diterapkan
            </>
          ) : (
            'Terapkan'
          )}
        </Button>
      )}
    </div>
  )
}
