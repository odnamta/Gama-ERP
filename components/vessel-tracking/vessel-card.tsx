'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Vessel,
  VESSEL_TYPE_LABELS,
  VESSEL_STATUS_LABELS,
  VESSEL_STATUS_COLORS,
} from '@/types/agency';
import { calculateTimeSinceUpdate } from '@/lib/vessel-tracking-utils';
import { Ship, MapPin, Anchor, Navigation, Eye, Edit, Flag, Hash } from 'lucide-react';
import Link from 'next/link';

interface VesselCardProps {
  vessel: Vessel;
  onView?: (vessel: Vessel) => void;
  onEdit?: (vessel: Vessel) => void;
}

/**
 * Summary card for Vessel list display.
 * Shows vessel name, IMO, type, status, and current position if available.
 * 
 * **Requirements: 1.1, 1.6**
 */
export function VesselCard({ vessel, onView, onEdit }: VesselCardProps) {
  // Format position for display
  const formatPosition = () => {
    if (!vessel.currentPosition) return null;
    const { lat, lng } = vessel.currentPosition;
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
  };

  // Get time since last position update
  const getPositionAge = () => {
    if (!vessel.currentPosition?.updatedAt) return null;
    return calculateTimeSinceUpdate(vessel.currentPosition.updatedAt);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{vessel.vesselName}</h3>
              {vessel.currentStatus && (
                <Badge className={VESSEL_STATUS_COLORS[vessel.currentStatus]}>
                  {VESSEL_STATUS_LABELS[vessel.currentStatus]}
                </Badge>
              )}
              {!vessel.isActive && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {vessel.imoNumber && (
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                IMO: {vessel.imoNumber}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {onView ? (
              <Button variant="ghost" size="icon" title="View details" onClick={() => onView(vessel)}>
                <Eye className="h-4 w-4" />
              </Button>
            ) : (
              <Link href={`/agency/vessels/${vessel.id}`}>
                <Button variant="ghost" size="icon" title="View details">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {onEdit ? (
              <Button variant="ghost" size="icon" title="Edit vessel" onClick={() => onEdit(vessel)}>
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <Link href={`/agency/vessels/${vessel.id}/edit`}>
                <Button variant="ghost" size="icon" title="Edit vessel">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vessel Type */}
        {vessel.vesselType && (
          <div className="flex items-center gap-2 text-sm">
            <Ship className="h-4 w-4 text-muted-foreground" />
            <span>{VESSEL_TYPE_LABELS[vessel.vesselType]}</span>
          </div>
        )}

        {/* Flag & Call Sign */}
        {(vessel.flag || vessel.callSign) && (
          <div className="flex items-center gap-4 text-sm">
            {vessel.flag && (
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>{vessel.flag}</span>
              </div>
            )}
            {vessel.callSign && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{vessel.callSign}</span>
              </div>
            )}
          </div>
        )}

        {/* MMSI */}
        {vessel.mmsi && (
          <div className="flex items-center gap-2 text-sm">
            <Anchor className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">MMSI: {vessel.mmsi}</span>
          </div>
        )}

        {/* Current Position */}
        {vessel.currentPosition && (
          <div className="flex items-start gap-2 text-sm">
            <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-mono text-xs">{formatPosition()}</p>
              {vessel.currentPosition.course !== undefined && vessel.currentPosition.speed !== undefined && (
                <p className="text-muted-foreground text-xs">
                  Course: {vessel.currentPosition.course}° | Speed: {vessel.currentPosition.speed} kn
                </p>
              )}
              {getPositionAge() && (
                <p className="text-muted-foreground text-xs">
                  Updated: {getPositionAge()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Last/Next Port */}
        {(vessel.lastPort || vessel.nextPort) && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {vessel.lastPort && <span>{vessel.lastPort}</span>}
              {vessel.lastPort && vessel.nextPort && ' → '}
              {vessel.nextPort && <span className="font-medium">{vessel.nextPort}</span>}
            </span>
          </div>
        )}

        {/* Vessel Specs Summary */}
        {(vessel.grossTonnage || vessel.teuCapacity || vessel.deadweightTons) && (
          <div className="pt-2 border-t flex items-center gap-4 text-sm flex-wrap">
            {vessel.grossTonnage && (
              <span>
                <span className="font-medium">{vessel.grossTonnage.toLocaleString()}</span>
                <span className="text-muted-foreground"> GT</span>
              </span>
            )}
            {vessel.deadweightTons && (
              <span>
                <span className="font-medium">{vessel.deadweightTons.toLocaleString()}</span>
                <span className="text-muted-foreground"> DWT</span>
              </span>
            )}
            {vessel.teuCapacity && (
              <span>
                <span className="font-medium">{vessel.teuCapacity.toLocaleString()}</span>
                <span className="text-muted-foreground"> TEU</span>
              </span>
            )}
          </div>
        )}

        {/* Shipping Line */}
        {vessel.shippingLine && (
          <div className="text-xs text-muted-foreground">
            {vessel.shippingLine.lineName}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
