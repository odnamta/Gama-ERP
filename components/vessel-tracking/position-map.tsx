'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  VesselPosition,
  Vessel,
  VESSEL_STATUS_LABELS,
  VESSEL_STATUS_COLORS,
} from '@/types/agency';
import { calculateTimeSinceUpdate } from '@/lib/vessel-tracking-utils';
import {
  Navigation,
  MapPin,
  Compass,
  Gauge,
  Clock,
  ExternalLink,
  RefreshCw,
  Ship,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PositionMapProps {
  position?: VesselPosition | null;
  vessel?: Vessel | null;
  title?: string;
  showHeader?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

/**
 * Map display for vessel position.
 * Shows course, speed, and position details.
 * Provides a static map view with option to open in external map service.
 * 
 * **Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.5**
 */
export function PositionMap({
  position,
  vessel,
  title = 'Vessel Position',
  showHeader = true,
  onRefresh,
  isRefreshing = false,
  className,
}: PositionMapProps) {
  // Format coordinates for display
  const formatCoordinate = (value: number, isLatitude: boolean) => {
    const direction = isLatitude
      ? value >= 0 ? 'N' : 'S'
      : value >= 0 ? 'E' : 'W';
    const degrees = Math.floor(Math.abs(value));
    const minutes = ((Math.abs(value) - degrees) * 60).toFixed(3);
    return `${degrees}° ${minutes}' ${direction}`;
  };

  // Format decimal coordinates
  const formatDecimalCoordinate = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lng).toFixed(5)}°${lngDir}`;
  };

  // Get time since last update
  const getPositionAge = () => {
    if (!position?.updatedAt) return null;
    return calculateTimeSinceUpdate(position.updatedAt);
  };

  // Generate external map URL (Google Maps)
  const getExternalMapUrl = () => {
    if (!position) return null;
    return `https://www.google.com/maps?q=${position.lat},${position.lng}`;
  };

  // Generate MarineTraffic URL if vessel has IMO
  const getMarineTrafficUrl = () => {
    if (!vessel?.imoNumber) return null;
    return `https://www.marinetraffic.com/en/ais/details/ships/imo:${vessel.imoNumber}`;
  };

  if (!position) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No position data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title="Refresh position"
                >
                  <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                </Button>
              )}
              {getExternalMapUrl() && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title="Open in Google Maps"
                >
                  <a href={getExternalMapUrl()!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Map Placeholder */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {/* Static map background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full" style={{
                backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />
            </div>
          </div>

          {/* Vessel marker */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Course indicator */}
              {position.course !== undefined && (
                <div
                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-primary"
                  style={{ transform: `translateX(-50%) rotate(${position.course}deg)` }}
                >
                  <Navigation className="h-6 w-6" />
                </div>
              )}
              
              {/* Vessel icon */}
              <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Ship className="h-6 w-6" />
              </div>
              
              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            </div>
          </div>

          {/* Coordinates overlay */}
          <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-mono">
            {formatDecimalCoordinate(position.lat, position.lng)}
          </div>
        </div>

        {/* Vessel Info */}
        {vessel && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{vessel.vesselName}</span>
            </div>
            {vessel.currentStatus && (
              <Badge className={VESSEL_STATUS_COLORS[vessel.currentStatus]}>
                {VESSEL_STATUS_LABELS[vessel.currentStatus]}
              </Badge>
            )}
          </div>
        )}

        {/* Position Details */}
        <div className="grid grid-cols-2 gap-4">
          {/* Coordinates */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Latitude</p>
            <p className="font-mono text-sm">{formatCoordinate(position.lat, true)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Longitude</p>
            <p className="font-mono text-sm">{formatCoordinate(position.lng, false)}</p>
          </div>

          {/* Course */}
          {position.course !== undefined && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Compass className="h-3 w-3" />
                Course
              </p>
              <p className="font-medium">{position.course}°</p>
            </div>
          )}

          {/* Speed */}
          {position.speed !== undefined && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                Speed
              </p>
              <p className="font-medium">{position.speed} knots</p>
            </div>
          )}
        </div>

        {/* Last Update */}
        {getPositionAge() && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Clock className="h-4 w-4" />
            <span>Last updated: {getPositionAge()}</span>
          </div>
        )}

        {/* External Links */}
        {(getExternalMapUrl() || getMarineTrafficUrl()) && (
          <div className="flex gap-2 pt-2 border-t">
            {getExternalMapUrl() && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={getExternalMapUrl()!} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4 mr-2" />
                  Google Maps
                </a>
              </Button>
            )}
            {getMarineTrafficUrl() && (
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={getMarineTrafficUrl()!} target="_blank" rel="noopener noreferrer">
                  <Anchor className="h-4 w-4 mr-2" />
                  MarineTraffic
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact position display for list views
 */
interface CompactPositionProps {
  position?: VesselPosition | null;
  className?: string;
}

export function CompactPosition({ position, className }: CompactPositionProps) {
  if (!position) {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        No position
      </span>
    );
  }

  const formatPosition = () => {
    const latDir = position.lat >= 0 ? 'N' : 'S';
    const lngDir = position.lng >= 0 ? 'E' : 'W';
    return `${Math.abs(position.lat).toFixed(2)}°${latDir}, ${Math.abs(position.lng).toFixed(2)}°${lngDir}`;
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Navigation className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono text-xs">{formatPosition()}</span>
      {position.speed !== undefined && (
        <span className="text-muted-foreground">
          {position.speed} kn
        </span>
      )}
    </div>
  );
}

/**
 * Position badge for inline display
 */
interface PositionBadgeProps {
  position?: VesselPosition | null;
  className?: string;
}

export function PositionBadge({ position, className }: PositionBadgeProps) {
  if (!position) return null;

  const formatPosition = () => {
    const latDir = position.lat >= 0 ? 'N' : 'S';
    const lngDir = position.lng >= 0 ? 'E' : 'W';
    return `${Math.abs(position.lat).toFixed(1)}°${latDir} ${Math.abs(position.lng).toFixed(1)}°${lngDir}`;
  };

  return (
    <Badge variant="outline" className={cn('font-mono text-xs', className)}>
      <Navigation className="h-3 w-3 mr-1" />
      {formatPosition()}
    </Badge>
  );
}

/**
 * Navigation data display
 */
interface NavigationDataProps {
  course?: number;
  speed?: number;
  className?: string;
}

export function NavigationData({ course, speed, className }: NavigationDataProps) {
  if (course === undefined && speed === undefined) return null;

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      {course !== undefined && (
        <div className="flex items-center gap-1">
          <Compass className="h-4 w-4 text-muted-foreground" />
          <span>{course}°</span>
        </div>
      )}
      {speed !== undefined && (
        <div className="flex items-center gap-1">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span>{speed} kn</span>
        </div>
      )}
    </div>
  );
}

/**
 * Position history mini-map placeholder
 */
interface PositionHistoryMapProps {
  positions: Array<{ lat: number; lng: number; timestamp: string }>;
  className?: string;
}

export function PositionHistoryMap({ positions, className }: PositionHistoryMapProps) {
  if (positions.length === 0) {
    return (
      <div className={cn('text-center py-4 text-muted-foreground', className)}>
        No position history
      </div>
    );
  }

  // Get bounds
  const lats = positions.map(p => p.lat);
  const lngs = positions.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Normalize positions to 0-100 range for SVG
  const normalizePosition = (lat: number, lng: number) => {
    const x = maxLng === minLng ? 50 : ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    const y = maxLat === minLat ? 50 : ((maxLat - lat) / (maxLat - minLat)) * 80 + 10;
    return { x, y };
  };

  // Generate path
  const pathPoints = positions.map(p => normalizePosition(p.lat, p.lng));
  const pathD = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className={cn('relative aspect-video bg-muted rounded-lg overflow-hidden', className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Track line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
          strokeDasharray="2 2"
        />
        
        {/* Position points */}
        {pathPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === pathPoints.length - 1 ? 3 : 1.5}
            className={i === pathPoints.length - 1 ? 'fill-primary' : 'fill-muted-foreground'}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-1 left-1 text-xs text-muted-foreground">
        {positions.length} positions
      </div>
    </div>
  );
}
