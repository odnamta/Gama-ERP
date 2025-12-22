'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDutyAmount } from '@/lib/pib-utils'
import { Calculator, ArrowRight } from 'lucide-react'

interface DutiesSummaryProps {
  fobValue: number
  freightValue: number
  insuranceValue: number
  cifValue: number
  exchangeRate: number | null
  cifValueIdr: number | null
  beaMasuk: number
  ppn: number
  pphImport: number
  totalDuties: number
  currency: string
}

export function DutiesSummary({
  fobValue,
  freightValue,
  insuranceValue,
  cifValue,
  exchangeRate,
  cifValueIdr,
  beaMasuk,
  ppn,
  pphImport,
  totalDuties,
  currency,
}: DutiesSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Duties Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CIF Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            CIF Calculation
          </h4>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">FOB Value</div>
              <div className="text-lg font-semibold">
                {formatCurrency(fobValue, currency)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Freight</div>
              <div className="text-lg font-semibold">
                {formatCurrency(freightValue, currency)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Insurance</div>
              <div className="text-lg font-semibold">
                {formatCurrency(insuranceValue, currency)}
              </div>
            </div>
            <div className="rounded-md border bg-primary/5 p-3">
              <div className="text-xs text-muted-foreground">CIF Value</div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(cifValue, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate & IDR Value */}
        {exchangeRate && cifValueIdr && (
          <div className="flex items-center gap-4 rounded-md bg-muted/50 p-4">
            <div>
              <div className="text-xs text-muted-foreground">Exchange Rate</div>
              <div className="font-medium">
                1 {currency} = {formatCurrency(exchangeRate, 'IDR')}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">CIF in IDR</div>
              <div className="font-semibold text-lg">
                {formatDutyAmount(cifValueIdr)}
              </div>
            </div>
          </div>
        )}

        {/* Duty Components */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Duty Components
          </h4>
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">Bea Masuk (BM)</div>
              <div className="text-lg font-semibold">
                {formatCurrency(beaMasuk, currency)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">PPN</div>
              <div className="text-lg font-semibold">
                {formatCurrency(ppn, currency)}
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">PPh Import</div>
              <div className="text-lg font-semibold">
                {formatCurrency(pphImport, currency)}
              </div>
            </div>
            <div className="rounded-md border bg-amber-50 border-amber-200 p-3">
              <div className="text-xs text-amber-700">Total Duties</div>
              <div className="text-lg font-bold text-amber-700">
                {formatCurrency(totalDuties, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Total Payable */}
        <div className="rounded-md bg-primary p-4 text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Total Amount Payable</div>
              <div className="text-xs opacity-75">(CIF + Total Duties)</div>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(cifValue + totalDuties, currency)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
