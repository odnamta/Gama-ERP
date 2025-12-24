// =====================================================
// v0.69: GPS TRANSFORMER PROPERTY TESTS
// Property 7: Location Data Handling
// Validates: Requirements 4.2, 4.3, 4.4, 4.5
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  transformLocationData,
  updateAssetLocation,
  recordLocationHistory,
  transformBatchLocationData,
  validateCoordinates,
  validateHeading,
  validateSpeed,
  validateRawGPSData,
  calculateDistance,
  calculateJourneySegment,
  formatGPSTimestamp,
  formatCoordinates,
  formatSpeed,
  formatHeading,
  filterValidGPSData,
  getLatestGPSData,
  isGPSDataStale,
  type RawGPSData,
  type LocationHistoryRecord,
} from '@/lib/gps-transformer';

// =====================================================
// ARBITRARIES (Test Data Generators)
// =====================================================

// UUID generator
const uuidArb = fc.uuid();

// Valid latitude (-90 to 90)
const latitudeArb = fc.integer({ min: -9000000, max: 9000000 }).map(n => n / 100000);

// Valid longitude (-180 to 180)
const longitudeArb = fc.integer({ min: -18000000, max: 18000000 }).map(n => n / 100000);

// Valid heading (0-360)
const headingArb = fc.integer({ min: 0, max: 360 });

// Valid speed (0-300 km/h)
const speedArb = fc.integer({ min: 0, max: 30000 }).map(n => n / 100);

// Timestamp generator
const timestampArb = fc.integer({ min: 1577836800000, max: 1924905600000 })
  .map(ts => new Date(ts).toISOString());

// Device ID generator
const deviceIdArb = fc.stringMatching(/^[A-Z0-9]{8,16}$/);

// Raw GPS data generator
const rawGPSDataArb: fc.Arbitrary<RawGPSData> = fc.record({
  device_id: deviceIdArb,
  timestamp: timestampArb,
  latitude: latitudeArb,
  longitude: longitudeArb,
  altitude: fc.option(fc.integer({ min: -500, max: 10000 }), { nil: undefined }),
  speed: fc.option(speedArb, { nil: undefined }),
  heading: fc.option(headingArb, { nil: undefined }),
  accuracy: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  satellites: fc.option(fc.integer({ min: 0, max: 24 }), { nil: undefined }),
  battery_level: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  ignition: fc.option(fc.boolean(), { nil: undefined }),
  odometer: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
  fuel_level: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  engine_hours: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
});

// Invalid GPS data generators
const invalidLatitudeArb = fc.oneof(
  fc.integer({ min: 91, max: 1000 }),
  fc.integer({ min: -1000, max: -91 })
);

const invalidLongitudeArb = fc.oneof(
  fc.integer({ min: 181, max: 1000 }),
  fc.integer({ min: -1000, max: -181 })
);

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('GPS Transformer Property Tests', () => {
  describe('Property 7: Location Data Handling', () => {
    /**
     * Property: For any valid GPS location data received, the corresponding
     * asset's location SHALL be updated with latitude, longitude, speed, and heading.
     * Validates: Requirements 4.2
     */
    it('transforms GPS data to asset location update with all required fields', () => {
      fc.assert(
        fc.property(rawGPSDataArb, uuidArb, (gpsData, assetId) => {
          const result = updateAssetLocation(gpsData, assetId);

          // Verify all required fields are present
          expect(result).toHaveProperty('asset_id');
          expect(result).toHaveProperty('current_latitude');
          expect(result).toHaveProperty('current_longitude');
          expect(result).toHaveProperty('current_speed_kmh');
          expect(result).toHaveProperty('current_heading');
          expect(result).toHaveProperty('last_location_update');

          // Verify asset_id matches
          expect(result.asset_id).toBe(assetId);

          // Verify coordinates are preserved
          expect(result.current_latitude).toBe(gpsData.latitude);
          expect(result.current_longitude).toBe(gpsData.longitude);

          // Verify speed and heading are preserved (or null if not provided)
          expect(result.current_speed_kmh).toBe(gpsData.speed ?? null);
          expect(result.current_heading).toBe(gpsData.heading ?? null);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Location history SHALL include timestamp.
     * Validates: Requirements 4.3
     */
    it('records location history with timestamp', () => {
      fc.assert(
        fc.property(rawGPSDataArb, uuidArb, (gpsData, assetId) => {
          const result = recordLocationHistory(gpsData, assetId);

          // Verify timestamp is preserved
          expect(result.recorded_at).toBe(gpsData.timestamp);

          // Verify all location fields are present
          expect(result).toHaveProperty('asset_id');
          expect(result).toHaveProperty('device_id');
          expect(result).toHaveProperty('latitude');
          expect(result).toHaveProperty('longitude');
          expect(result).toHaveProperty('recorded_at');
          expect(result).toHaveProperty('metadata');

          return true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: When speed and heading are provided, they SHALL be stored with the location.
     * Validates: Requirements 4.4
     */
    it('stores speed and heading when provided', () => {
      fc.assert(
        fc.property(
          rawGPSDataArb.filter(d => d.speed !== undefined && d.heading !== undefined),
          uuidArb,
          (gpsData, assetId) => {
            const result = transformLocationData(gpsData, assetId);

            // Verify speed and heading are stored
            expect(result.speed_kmh).toBe(gpsData.speed);
            expect(result.heading_degrees).toBe(gpsData.heading);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Batch transformation preserves all data points.
     * Validates: Requirements 4.3
     */
    it('batch transforms all GPS data points', () => {
      fc.assert(
        fc.property(
          fc.array(rawGPSDataArb, { minLength: 1, maxLength: 20 }),
          uuidArb,
          (dataPoints, assetId) => {
            const results = transformBatchLocationData(dataPoints, assetId);

            // Verify count matches
            expect(results.length).toBe(dataPoints.length);

            // Verify each result has correct asset_id
            results.forEach(result => {
              expect(result.asset_id).toBe(assetId);
            });

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Coordinate Validation', () => {
    it('accepts valid coordinates', () => {
      fc.assert(
        fc.property(latitudeArb, longitudeArb, (lat, lon) => {
          return validateCoordinates(lat, lon) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects invalid latitudes', () => {
      fc.assert(
        fc.property(invalidLatitudeArb, longitudeArb, (lat, lon) => {
          return validateCoordinates(lat, lon) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects invalid longitudes', () => {
      fc.assert(
        fc.property(latitudeArb, invalidLongitudeArb, (lat, lon) => {
          return validateCoordinates(lat, lon) === false;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Heading Validation', () => {
    it('accepts valid headings (0-360)', () => {
      fc.assert(
        fc.property(headingArb, (heading) => {
          return validateHeading(heading) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('accepts undefined heading', () => {
      expect(validateHeading(undefined)).toBe(true);
    });

    it('rejects negative headings', () => {
      fc.assert(
        fc.property(fc.integer({ min: -360, max: -1 }), (heading) => {
          return validateHeading(heading) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects headings over 360', () => {
      fc.assert(
        fc.property(fc.integer({ min: 361, max: 720 }), (heading) => {
          return validateHeading(heading) === false;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Speed Validation', () => {
    it('accepts valid speeds (non-negative)', () => {
      fc.assert(
        fc.property(speedArb, (speed) => {
          return validateSpeed(speed) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('accepts undefined speed', () => {
      expect(validateSpeed(undefined)).toBe(true);
    });

    it('rejects negative speeds', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (speed) => {
          return validateSpeed(speed) === false;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Raw GPS Data Validation', () => {
    it('validates valid GPS data', () => {
      fc.assert(
        fc.property(rawGPSDataArb, (gpsData) => {
          const result = validateRawGPSData(gpsData);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects GPS data without device_id', () => {
      const invalidData: RawGPSData = {
        device_id: '',
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
      };
      const result = validateRawGPSData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('device_id is required');
    });

    it('rejects GPS data with invalid coordinates', () => {
      const invalidData: RawGPSData = {
        device_id: 'TEST123',
        timestamp: new Date().toISOString(),
        latitude: 100, // Invalid
        longitude: 0,
      };
      const result = validateRawGPSData(invalidData);
      expect(result.valid).toBe(false);
    });
  });

  describe('Distance Calculation', () => {
    it('returns 0 for same coordinates', () => {
      fc.assert(
        fc.property(latitudeArb, longitudeArb, (lat, lon) => {
          const distance = calculateDistance(lat, lon, lat, lon);
          return distance === 0;
        }),
        { numRuns: 100 }
      );
    });

    it('returns positive distance for different coordinates', () => {
      fc.assert(
        fc.property(
          latitudeArb,
          longitudeArb,
          latitudeArb,
          longitudeArb,
          (lat1, lon1, lat2, lon2) => {
            const distance = calculateDistance(lat1, lon1, lat2, lon2);
            // Distance should be non-negative
            return distance >= 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('is symmetric (A to B = B to A)', () => {
      fc.assert(
        fc.property(
          latitudeArb,
          longitudeArb,
          latitudeArb,
          longitudeArb,
          (lat1, lon1, lat2, lon2) => {
            const d1 = calculateDistance(lat1, lon1, lat2, lon2);
            const d2 = calculateDistance(lat2, lon2, lat1, lon1);
            // Allow small floating point differences
            return Math.abs(d1 - d2) < 0.0001;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Journey Segment Calculation', () => {
    it('calculates journey segment with correct structure', () => {
      fc.assert(
        fc.property(
          rawGPSDataArb,
          rawGPSDataArb,
          uuidArb,
          (startData, endData, assetId) => {
            const start = recordLocationHistory(startData, assetId);
            const end = recordLocationHistory(endData, assetId);
            
            const segment = calculateJourneySegment(start, end);

            expect(segment).toHaveProperty('start_location');
            expect(segment).toHaveProperty('end_location');
            expect(segment).toHaveProperty('start_time');
            expect(segment).toHaveProperty('end_time');
            expect(segment).toHaveProperty('distance_km');
            expect(segment).toHaveProperty('duration_minutes');
            expect(segment).toHaveProperty('average_speed_kmh');
            expect(segment).toHaveProperty('max_speed_kmh');

            // Distance should be non-negative
            expect(segment.distance_km).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Formatting Functions', () => {
    it('formats timestamps correctly', () => {
      fc.assert(
        fc.property(timestampArb, (timestamp) => {
          const formatted = formatGPSTimestamp(timestamp);
          // Should return a non-empty string
          return typeof formatted === 'string' && formatted.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('formats coordinates with direction indicators', () => {
      fc.assert(
        fc.property(latitudeArb, longitudeArb, (lat, lon) => {
          const formatted = formatCoordinates(lat, lon);
          // Should contain N/S and E/W indicators
          return (
            (formatted.includes('N') || formatted.includes('S')) &&
            (formatted.includes('E') || formatted.includes('W'))
          );
        }),
        { numRuns: 100 }
      );
    });

    it('formats speed with unit', () => {
      fc.assert(
        fc.property(speedArb, (speed) => {
          const formatted = formatSpeed(speed);
          return formatted.includes('km/h');
        }),
        { numRuns: 100 }
      );
    });

    it('formats heading with cardinal direction', () => {
      fc.assert(
        fc.property(headingArb, (heading) => {
          const formatted = formatHeading(heading);
          // Should contain a cardinal direction
          const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          return directions.some(d => formatted.includes(d));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Data Filtering', () => {
    it('filters out invalid GPS data', () => {
      const validData: RawGPSData = {
        device_id: 'TEST123',
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
      };
      const invalidData: RawGPSData = {
        device_id: '',
        timestamp: new Date().toISOString(),
        latitude: 100, // Invalid
        longitude: 0,
      };

      const result = filterValidGPSData([validData, invalidData]);
      expect(result.length).toBe(1);
      expect(result[0].device_id).toBe('TEST123');
    });

    it('returns all valid data points', () => {
      fc.assert(
        fc.property(
          fc.array(rawGPSDataArb, { minLength: 1, maxLength: 10 }),
          (dataPoints) => {
            const filtered = filterValidGPSData(dataPoints);
            // All filtered points should be valid
            return filtered.every(d => validateRawGPSData(d).valid);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Latest Data Selection', () => {
    it('returns null for empty array', () => {
      expect(getLatestGPSData([])).toBeNull();
    });

    it('returns the data point with latest timestamp', () => {
      fc.assert(
        fc.property(
          fc.array(rawGPSDataArb, { minLength: 1, maxLength: 10 }),
          (dataPoints) => {
            const latest = getLatestGPSData(dataPoints);
            if (!latest) return false;

            // Verify it's actually the latest
            const latestTime = new Date(latest.timestamp).getTime();
            return dataPoints.every(d => new Date(d.timestamp).getTime() <= latestTime);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Staleness Check', () => {
    it('returns true for old timestamps', () => {
      const oldTimestamp = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 min ago
      expect(isGPSDataStale(oldTimestamp, 15)).toBe(true);
    });

    it('returns false for recent timestamps', () => {
      const recentTimestamp = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
      expect(isGPSDataStale(recentTimestamp, 15)).toBe(false);
    });
  });
});
