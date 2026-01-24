'use client'

import Link from 'next/link'
import { Truck, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeliveryItem } from '@/lib/ops-dashboard-enhanced-utils'
import { formatDate } from '@/lib/utils/format'

interface DeliveryScheduleCardProps {
  deliveries: DeliveryItem[]
}

export function DeliveryScheduleCard({ deliveries }: DeliveryScheduleCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
      case 'issued':
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Group deliveries by date
  const today = new Date().toISOString().split('T')[0]
  const todayDeliveries = deliveries.filter(
    (d) => d.departureDate === today
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Delivery Schedule
        </CardTitle>
        <Link href="/job-orders">
          <Button variant="link" size="sm">View Full Schedule →</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Truck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No scheduled deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayDeliveries.length > 0 && (
              <div className="text-sm font-medium text-muted-foreground mb-2">
                TODAY ({todayDeliveries.length} deliveries)
              </div>
            )}
            {deliveries.slice(0, 5).map((delivery) => (
              <div
                key={delivery.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{delivery.sjNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {delivery.origin} → {delivery.destination}
                    </div>
                    {delivery.driverName && (
                      <div className="text-xs text-muted-foreground">
                        Driver: {delivery.driverName}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(delivery.status)}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(delivery.departureDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
