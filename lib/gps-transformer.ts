// =====================================================
// v0.69: GPS TRANSFORMER FOR LOCATION DATA
// =====================================================
// Transforms GPS tracking data for asset location updates
// Requirements: 4.2, 4.3, 4.4

import { format } from 'date-fns';

// =====================================================
// GPS INPUT TYPES (from external tracking systems)
// =====================================================

/**
 * Raw GPS data from tracking device/API
 */
export interface RawGPSData {
  device_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number; // km/h
  heading?: number; // degrees (0-360)
  accuracy?: number; // meters
  satellites?: number;
  battery_level?: number;
  ignition?: boolean;
  odometer?: number; // km
  fuel_level?: number; // percentage
  engine_hours?: number;
  raw_data?: Record<string, unknown>;
}

/**
 * GPS tracking provider response
 */
export interface GPSProviderResponse {
  success: boolean;
  data: RawGPSData[];
  error?: string;
  timestamp: string;
}

// =====================================================
// GAMA ERP OUTPUT TYPES
// =====================================================

/**
 * Transformed location data for Gama ERP
 */
export interface GamaLocationData {
  asset_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed_kmh: number | null;
  heading_degrees: number | null;
  accuracy_meters: number | null;
  recorded_at: string;
  metadata: LocationMetadata;
}

/**
 * Location metadata for additional tracking info
 */
export interface LocationMetadata {
  satellites?: number;
  battery_level?: number;
  ignition?: boolean;
  odometer_km?: number;
  fuel_level_percent?: number;
  engine_hours?: number;
  address?: string;
  geofence_status?: 'inside' | 'outside' | 'unknown';
}

/**
 * Asset location update payload
 */
export interface AssetLocationUpdate {
  asset_id: string;
  current_latitude: number;
  current_longitude: number;
  current_speed_kmh: number | null;
  current_heading: number | null;
  last_location_update: string;
  odometer_km: number | null;
  engine_hours: number | null;
}

/**
 * Location history record
 */
export interface LocationHistoryRecord {
  id?: string;
  asset_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed_kmh: number | null;
  heading_degrees: number | null;
  accuracy_meters: number | null;
  recorded_at: string;
  metadata: Record<string, unknown>;
  created_at?: string;
}

/**
 * Journey segment for trip tracking
 */
export interface JourneySegment {
  start_location: { latitude: number; longitude: number };
  end_location: { latitude: number; longitude: number };
  start_time: string;
  end_time: string;
  distance_km: number;
  duration_minutes: number;
  average_speed_kmh: number;
  max_speed_kmh: number;
}

// =====================================================
// DEVICE MAPPING TYPES
// =====================================================

/**
 * Mapping between GPS device and Gama asset
 */
export interface DeviceAssetMapping {
  device_id: string;
  asset_id: string;
  asset_code: string;
  asset_name: string;
  is_active: boolean;
}

// =====================================================
// TRANSFORMATION FUNCTIONS
// =====================================================

/**
 * Transforms raw GPS data to Gama location format.
 * Requirements: 4.2
 * 
 * @param rawData - Raw GPS data from tracking device
 * @param assetId - Gama asset ID
 * @returns Transformed location data
 */
export function transformLocationData(
  rawData: RawGPSData,
  assetId: string
): GamaLocationData {
  return {
    asset_id: assetId,
    device_id: rawData.device_id,
    latitude: rawData.latitude,
    longitude: rawData.longitude,
    altitude: rawData.altitude ?? null,
    speed_kmh: rawData.speed ?? null,
    heading_degrees: rawData.heading ?? null,
    accuracy_meters: rawData.accuracy ?? null,
    recorded_at: rawData.timestamp,
    metadata: {
      satellites: rawData.satellites,
      battery_level: rawData.battery_level,
      ignition: rawData.ignition,
      odometer_km: rawData.odometer,
      fuel_level_percent: rawData.fuel_level,
      engine_hours: rawData.engine_hours,
    },
  };
}

/**
 * Creates an asset location update payload from GPS data.
 * Requirements: 4.2
 * 
 * @param locationData - Transformed location data
 * @returns Asset location update payload
 */
export function createAssetLocationUpdate(
  locationData: GamaLocationData
): AssetLocationUpdate {
  return {
    asset_id: locationData.asset_id,
    current_latitude: locationData.latitude,
    current_longitude: locationData.longitude,
    current_speed_kmh: locationData.speed_kmh,
    current_heading: locationData.heading_degrees,
    last_location_update: locationData.recorded_at,
    odometer_km: locationData.metadata.odometer_km ?? null,
    engine_hours: locationData.metadata.engine_hours ?? null,
  };
}

/**
 * Updates asset location with new GPS data.
 * This is a pure function that returns the update payload.
 * Requirements: 4.2
 * 
 * @param rawData - Raw GPS data
 * @param assetId - Asset ID to update
 * @returns Asset location update payload
 */
export function updateAssetLocation(
  rawData: RawGPSData,
  assetId: string
): AssetLocationUpdate {
  const locationData = transformLocationData(rawData, assetId);
  return createAssetLocationUpdate(locationData);
}

/**
 * Creates a location history record from GPS data.
 * Requirements: 4.3
 * 
 * @param rawData - Raw GPS data
 * @param assetId - Asset ID
 * @returns Location history record
 */
export function recordLocationHistory(
  rawData: RawGPSData,
  assetId: string
): LocationHistoryRecord {
  const locationData = transformLocationData(rawData, assetId);
  
  return {
    asset_id: locationData.asset_id,
    device_id: locationData.device_id,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    altitude: locationData.altitude,
    speed_kmh: locationData.speed_kmh,
    heading_degrees: locationData.heading_degrees,
    accuracy_meters: locationData.accuracy_meters,
    recorded_at: locationData.recorded_at,
    metadata: locationData.metadata as Record<string, unknown>,
  };
}

/**
 * Transforms multiple GPS data points to location history records.
 * Requirements: 4.3
 * 
 * @param dataPoints - Array of raw GPS data
 * @param assetId - Asset ID
 * @returns Array of location history records
 */
export function transformBatchLocationData(
  dataPoints: RawGPSData[],
  assetId: string
): LocationHistoryRecord[] {
  return dataPoints.map(data => recordLocationHistory(data, assetId));
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Validates GPS coordinates.
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns True if coordinates are valid
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Validates heading value (0-360 degrees).
 * @param heading - Heading in degrees
 * @returns True if heading is valid
 */
export function validateHeading(heading: number | undefined): boolean {
  if (heading === undefined) return true;
  return typeof heading === 'number' && !isNaN(heading) && heading >= 0 && heading <= 360;
}

/**
 * Validates speed value (non-negative).
 * @param speed - Speed in km/h
 * @returns True if speed is valid
 */
export function validateSpeed(speed: number | undefined): boolean {
  if (speed === undefined) return true;
  return typeof speed === 'number' && !isNaN(speed) && speed >= 0;
}

/**
 * Validates raw GPS data.
 * @param data - Raw GPS data to validate
 * @returns Validation result with errors if any
 */
export function validateRawGPSData(data: RawGPSData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.device_id || data.device_id.trim().length === 0) {
    errors.push('device_id is required');
  }

  if (!data.timestamp) {
    errors.push('timestamp is required');
  }

  if (!validateCoordinates(data.latitude, data.longitude)) {
    errors.push('Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180');
  }

  if (!validateHeading(data.heading)) {
    errors.push('Invalid heading: must be 0 to 360 degrees');
  }

  if (!validateSpeed(data.speed)) {
    errors.push('Invalid speed: must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates distance between two GPS coordinates using Haversine formula.
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates journey segment from two location points.
 * @param start - Start location record
 * @param end - End location record
 * @returns Journey segment data
 */
export function calculateJourneySegment(
  start: LocationHistoryRecord,
  end: LocationHistoryRecord
): JourneySegment {
  const distance = calculateDistance(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude
  );

  const startTime = new Date(start.recorded_at);
  const endTime = new Date(end.recorded_at);
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = durationMs / (1000 * 60);

  const averageSpeed = durationMinutes > 0 ? (distance / durationMinutes) * 60 : 0;
  const maxSpeed = Math.max(start.speed_kmh ?? 0, end.speed_kmh ?? 0);

  return {
    start_location: { latitude: start.latitude, longitude: start.longitude },
    end_location: { latitude: end.latitude, longitude: end.longitude },
    start_time: start.recorded_at,
    end_time: end.recorded_at,
    distance_km: Math.round(distance * 100) / 100,
    duration_minutes: Math.round(durationMinutes * 100) / 100,
    average_speed_kmh: Math.round(averageSpeed * 100) / 100,
    max_speed_kmh: maxSpeed,
  };
}

/**
 * Formats GPS timestamp for display.
 * @param timestamp - ISO timestamp string
 * @returns Formatted date string
 */
export function formatGPSTimestamp(timestamp: string): string {
  try {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  } catch {
    return timestamp;
  }
}

/**
 * Formats coordinates for display.
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns Formatted coordinate string
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lonDir = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(6)}°${latDir}, ${Math.abs(longitude).toFixed(6)}°${lonDir}`;
}

/**
 * Formats speed for display.
 * @param speedKmh - Speed in km/h
 * @returns Formatted speed string
 */
export function formatSpeed(speedKmh: number | null): string {
  if (speedKmh === null || speedKmh === undefined) return '-';
  return `${speedKmh.toFixed(1)} km/h`;
}

/**
 * Formats heading for display.
 * @param heading - Heading in degrees
 * @returns Formatted heading string with cardinal direction
 */
export function formatHeading(heading: number | null): string {
  if (heading === null || heading === undefined) return '-';
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return `${heading.toFixed(0)}° ${directions[index]}`;
}

/**
 * Filters out invalid GPS data points.
 * @param dataPoints - Array of raw GPS data
 * @returns Array of valid GPS data points
 */
export function filterValidGPSData(dataPoints: RawGPSData[]): RawGPSData[] {
  return dataPoints.filter(data => validateRawGPSData(data).valid);
}

/**
 * Gets the latest GPS data point from an array.
 * @param dataPoints - Array of raw GPS data
 * @returns Latest GPS data point or null
 */
export function getLatestGPSData(dataPoints: RawGPSData[]): RawGPSData | null {
  if (dataPoints.length === 0) return null;
  
  return dataPoints.reduce((latest, current) => {
    const latestTime = new Date(latest.timestamp).getTime();
    const currentTime = new Date(current.timestamp).getTime();
    return currentTime > latestTime ? current : latest;
  });
}

/**
 * Checks if GPS data is stale (older than threshold).
 * @param timestamp - GPS timestamp
 * @param thresholdMinutes - Staleness threshold in minutes (default: 15)
 * @returns True if data is stale
 */
export function isGPSDataStale(timestamp: string, thresholdMinutes: number = 15): boolean {
  const dataTime = new Date(timestamp).getTime();
  const now = Date.now();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return now - dataTime > thresholdMs;
}
