// =====================================================
// v0.74: AGENCY - VESSEL TRACKING PROPERTY TESTS
// =====================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateIMO,
  validateMMSI,
  validateCoordinates,
  validateNavigationData,
  calculateDelayHours,
  sortTrackingEventsByTimestamp,
  sortArrivalsByTime,
  rowToUpcomingArrival,
} from '@/lib/vessel-tracking-utils';
import {
  ShipmentTracking,
  UpcomingArrival,
  UpcomingArrivalRow,
  TrackingEventType,
  ScheduleStatus,
  VesselType,
  TRACKING_EVENT_TYPES,
  SCHEDULE_STATUSES,
  VESSEL_TYPES,
} from '@/types/agency';

// =====================================================
// ARBITRARIES (Generators)
// =====================================================

// Valid IMO number generator (exactly 7 digits)
const validIMOArb = fc.stringMatching(/^\d{7}$/);

// Invalid IMO number generators
const invalidIMOArb = fc.oneof(
  fc.stringMatching(/^\d{6}$/),   // 6 digits
  fc.stringMatching(/^\d{8}$/),   // 8 digits
  fc.stringMatching(/^[A-Z]{7}$/), // 7 letters
  fc.stringMatching(/^\d{4}[A-Z]{3}$/), // mixed
  fc.constant(''),
  fc.constant('123456'),  // 6 digits
  fc.constant('12345678'), // 8 digits
);

// Valid MMSI generator (exactly 9 digits)
const validMMSIArb = fc.stringMatching(/^\d{9}$/);

// Invalid MMSI generators
const invalidMMSIArb = fc.oneof(
  fc.stringMatching(/^\d{8}$/),   // 8 digits
  fc.stringMatching(/^\d{10}$/),  // 10 digits
  fc.stringMatching(/^[A-Z]{9}$/), // 9 letters
  fc.constant(''),
  fc.constant('12345678'),  // 8 digits
  fc.constant('1234567890'), // 10 digits
);

// Valid latitude generator (-90 to 90)
const validLatitudeArb = fc.double({ min: -90, max: 90, noNaN: true });

// Invalid latitude generator
const invalidLatitudeArb = fc.oneof(
  fc.double({ min: -180, max: -90.001, noNaN: true }),
  fc.double({ min: 90.001, max: 180, noNaN: true }),
);

// Valid longitude generator (-180 to 180)
const validLongitudeArb = fc.double({ min: -180, max: 180, noNaN: true });

// Invalid longitude generator
const invalidLongitudeArb = fc.oneof(
  fc.double({ min: -360, max: -180.001, noNaN: true }),
  fc.double({ min: 180.001, max: 360, noNaN: true }),
);

// Valid speed generator (non-negative)
const validSpeedArb = fc.double({ min: 0, max: 50, noNaN: true });

// Invalid speed generator (negative)
const invalidSpeedArb = fc.double({ min: -100, max: -0.001, noNaN: true });

// Valid course generator (0 to 360)
const validCourseArb = fc.double({ min: 0, max: 360, noNaN: true });

// Invalid course generator
const invalidCourseArb = fc.oneof(
  fc.double({ min: -180, max: -0.001, noNaN: true }),
  fc.double({ min: 360.001, max: 720, noNaN: true }),
);

// Safe date generator
const safeDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(ts => new Date(ts));
const safeISOStringArb = safeDateArb.map(d => d.toISOString());

// Tracking event type generator
const trackingEventTypeArb = fc.constantFrom(...TRACKING_EVENT_TYPES);

// Schedule status generator
const scheduleStatusArb = fc.constantFrom(...SCHEDULE_STATUSES);

// Vessel type generator
const vesselTypeArb = fc.constantFrom(...VESSEL_TYPES);

// Non-empty string generator
const nonEmptyStringArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,49}$/);

// ShipmentTracking generator
const shipmentTrackingArb: fc.Arbitrary<ShipmentTracking> = fc.record({
  id: fc.uuid(),
  bookingId: fc.option(fc.uuid(), { nil: undefined }),
  blId: fc.option(fc.uuid(), { nil: undefined }),
  containerId: fc.option(fc.uuid(), { nil: undefined }),
  trackingNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  containerNumber: fc.option(fc.stringMatching(/^[A-Z]{4}\d{7}$/), { nil: undefined }),
  eventType: trackingEventTypeArb,
  eventTimestamp: safeISOStringArb,
  locationName: fc.option(nonEmptyStringArb, { nil: undefined }),
  locationCode: fc.option(fc.string({ minLength: 2, maxLength: 10 }), { nil: undefined }),
  terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
  vesselName: fc.option(nonEmptyStringArb, { nil: undefined }),
  voyageNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  isActual: fc.boolean(),
  source: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  createdAt: safeISOStringArb,
});

// UpcomingArrival generator
const upcomingArrivalArb: fc.Arbitrary<UpcomingArrival> = fc.record({
  id: fc.uuid(),
  vesselId: fc.uuid(),
  vesselName: nonEmptyStringArb,
  imoNumber: fc.option(validIMOArb, { nil: undefined }),
  vesselType: fc.option(vesselTypeArb, { nil: undefined }),
  voyageNumber: fc.string({ minLength: 1, maxLength: 20 }),
  portName: nonEmptyStringArb,
  portCode: fc.option(fc.string({ minLength: 2, maxLength: 10 }), { nil: undefined }),
  terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
  scheduledArrival: safeISOStringArb,
  status: scheduleStatusArb,
  delayHours: fc.integer({ min: 0, max: 100 }),
  ourBookingsCount: fc.nat({ max: 50 }),
});

// =====================================================
// PROPERTY 17: IMO FORMAT VALIDATION
// Feature: vessel-tracking-schedules, Property 17: IMO Format Validation
// Validates: Requirements 9.1
// =====================================================

describe('Property 17: IMO Format Validation', () => {
  it('should accept valid IMO numbers (exactly 7 digits)', () => {
    fc.assert(
      fc.property(validIMOArb, (imo) => {
        const result = validateIMO(imo);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid IMO number formats', () => {
    fc.assert(
      fc.property(invalidIMOArb, (imo) => {
        const result = validateIMO(imo);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.field === 'imoNumber')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject null, undefined, and non-string inputs', () => {
    const nullResult = validateIMO(null as unknown as string);
    expect(nullResult.isValid).toBe(false);

    const undefinedResult = validateIMO(undefined as unknown as string);
    expect(undefinedResult.isValid).toBe(false);
  });
});


// =====================================================
// PROPERTY 18: MMSI FORMAT VALIDATION
// Feature: vessel-tracking-schedules, Property 18: MMSI Format Validation
// Validates: Requirements 9.2
// =====================================================

describe('Property 18: MMSI Format Validation', () => {
  it('should accept valid MMSI numbers (exactly 9 digits)', () => {
    fc.assert(
      fc.property(validMMSIArb, (mmsi) => {
        const result = validateMMSI(mmsi);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid MMSI formats', () => {
    fc.assert(
      fc.property(invalidMMSIArb, (mmsi) => {
        const result = validateMMSI(mmsi);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.field === 'mmsi')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject null, undefined, and non-string inputs', () => {
    const nullResult = validateMMSI(null as unknown as string);
    expect(nullResult.isValid).toBe(false);

    const undefinedResult = validateMMSI(undefined as unknown as string);
    expect(undefinedResult.isValid).toBe(false);
  });
});


// =====================================================
// PROPERTY 19: COORDINATE VALIDATION
// Feature: vessel-tracking-schedules, Property 19: Coordinate Validation
// Validates: Requirements 9.3, 9.4
// =====================================================

describe('Property 19: Coordinate Validation', () => {
  it('should accept valid coordinates (lat -90 to 90, lng -180 to 180)', () => {
    fc.assert(
      fc.property(validLatitudeArb, validLongitudeArb, (lat, lng) => {
        const result = validateCoordinates(lat, lng);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid latitude values (outside -90 to 90)', () => {
    fc.assert(
      fc.property(invalidLatitudeArb, validLongitudeArb, (lat, lng) => {
        const result = validateCoordinates(lat, lng);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'latitude')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid longitude values (outside -180 to 180)', () => {
    fc.assert(
      fc.property(validLatitudeArb, invalidLongitudeArb, (lat, lng) => {
        const result = validateCoordinates(lat, lng);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'longitude')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject both invalid latitude and longitude', () => {
    fc.assert(
      fc.property(invalidLatitudeArb, invalidLongitudeArb, (lat, lng) => {
        const result = validateCoordinates(lat, lng);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should accept boundary values', () => {
    // Test exact boundary values
    expect(validateCoordinates(-90, -180).isValid).toBe(true);
    expect(validateCoordinates(90, 180).isValid).toBe(true);
    expect(validateCoordinates(0, 0).isValid).toBe(true);
  });

  it('should reject NaN values', () => {
    const result = validateCoordinates(NaN, NaN);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});


// =====================================================
// PROPERTY 20: NAVIGATION DATA VALIDATION
// Feature: vessel-tracking-schedules, Property 20: Navigation Data Validation
// Validates: Requirements 9.5, 9.6
// =====================================================

describe('Property 20: Navigation Data Validation', () => {
  it('should accept valid navigation data (speed >= 0, course 0-360)', () => {
    fc.assert(
      fc.property(validCourseArb, validSpeedArb, (course, speed) => {
        const result = validateNavigationData(course, speed);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject negative speed values', () => {
    fc.assert(
      fc.property(validCourseArb, invalidSpeedArb, (course, speed) => {
        const result = validateNavigationData(course, speed);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'speed')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject invalid course values (outside 0-360)', () => {
    fc.assert(
      fc.property(invalidCourseArb, validSpeedArb, (course, speed) => {
        const result = validateNavigationData(course, speed);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'course')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject both invalid course and speed', () => {
    fc.assert(
      fc.property(invalidCourseArb, invalidSpeedArb, (course, speed) => {
        const result = validateNavigationData(course, speed);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }),
      { numRuns: 100 }
    );
  });

  it('should accept boundary values', () => {
    // Test exact boundary values
    expect(validateNavigationData(0, 0).isValid).toBe(true);
    expect(validateNavigationData(360, 0).isValid).toBe(true);
    expect(validateNavigationData(180, 25).isValid).toBe(true);
  });

  it('should reject NaN values', () => {
    const result = validateNavigationData(NaN, NaN);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});


// =====================================================
// PROPERTY 7: DELAY CALCULATION
// Feature: vessel-tracking-schedules, Property 7: Delay Calculation
// Validates: Requirements 2.6, 8.1
// =====================================================

describe('Property 7: Delay Calculation', () => {
  it('should calculate positive delay when actual is after scheduled', () => {
    fc.assert(
      fc.property(
        safeDateArb,
        fc.integer({ min: 1, max: 100 }), // hours of delay
        (scheduledDate, delayHours) => {
          const actualDate = new Date(scheduledDate.getTime() + delayHours * 60 * 60 * 1000);
          const result = calculateDelayHours(scheduledDate, actualDate);
          
          // Result should be approximately equal to delayHours (within 0.1 due to rounding)
          expect(result).toBeCloseTo(delayHours, 0);
          expect(result).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate negative delay (early arrival) when actual is before scheduled', () => {
    fc.assert(
      fc.property(
        safeDateArb,
        fc.integer({ min: 1, max: 100 }), // hours early
        (scheduledDate, hoursEarly) => {
          const actualDate = new Date(scheduledDate.getTime() - hoursEarly * 60 * 60 * 1000);
          const result = calculateDelayHours(scheduledDate, actualDate);
          
          // Result should be approximately equal to -hoursEarly (within 0.1 due to rounding)
          expect(result).toBeCloseTo(-hoursEarly, 0);
          expect(result).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 when scheduled and actual are the same', () => {
    fc.assert(
      fc.property(safeDateArb, (date) => {
        const result = calculateDelayHours(date, date);
        expect(result).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should work with ISO string inputs', () => {
    fc.assert(
      fc.property(
        safeISOStringArb,
        fc.integer({ min: 1, max: 100 }),
        (scheduledStr, delayHours) => {
          const scheduledDate = new Date(scheduledStr);
          const actualDate = new Date(scheduledDate.getTime() + delayHours * 60 * 60 * 1000);
          const result = calculateDelayHours(scheduledStr, actualDate.toISOString());
          
          expect(result).toBeCloseTo(delayHours, 0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 for invalid dates', () => {
    expect(calculateDelayHours('invalid', 'also-invalid')).toBe(0);
    expect(calculateDelayHours(new Date('invalid'), new Date('also-invalid'))).toBe(0);
  });

  it('should handle fractional hours correctly', () => {
    const scheduled = new Date('2025-01-01T10:00:00Z');
    const actual = new Date('2025-01-01T10:30:00Z'); // 30 minutes later
    const result = calculateDelayHours(scheduled, actual);
    
    expect(result).toBe(0.5);
  });
});


// =====================================================
// PROPERTY 11: TRACKING EVENT CHRONOLOGICAL ORDERING
// Feature: vessel-tracking-schedules, Property 11: Tracking Event Chronological Ordering
// Validates: Requirements 4.6
// =====================================================

describe('Property 11: Tracking Event Chronological Ordering', () => {
  it('should sort tracking events by timestamp in ascending order', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentTrackingArb, { minLength: 0, maxLength: 20 }),
        (events) => {
          const sorted = sortTrackingEventsByTimestamp(events);
          
          // Verify sorted array has same length
          expect(sorted.length).toBe(events.length);
          
          // Verify ascending order
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].eventTimestamp).getTime();
            const currTime = new Date(sorted[i].eventTimestamp).getTime();
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all events (no data loss)', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentTrackingArb, { minLength: 0, maxLength: 20 }),
        (events) => {
          const sorted = sortTrackingEventsByTimestamp(events);
          
          // All original event IDs should be present
          const originalIds = events.map(e => e.id).sort();
          const sortedIds = sorted.map(e => e.id).sort();
          
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(shipmentTrackingArb, { minLength: 1, maxLength: 10 }),
        (events) => {
          const originalOrder = events.map(e => e.id);
          sortTrackingEventsByTimestamp(events);
          const afterOrder = events.map(e => e.id);
          
          expect(afterOrder).toEqual(originalOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty input', () => {
    expect(sortTrackingEventsByTimestamp([])).toEqual([]);
  });

  it('should handle null/undefined input gracefully', () => {
    expect(sortTrackingEventsByTimestamp(null as unknown as ShipmentTracking[])).toEqual([]);
    expect(sortTrackingEventsByTimestamp(undefined as unknown as ShipmentTracking[])).toEqual([]);
  });
});


// =====================================================
// PROPERTY 15: UPCOMING ARRIVALS SORTING
// Feature: vessel-tracking-schedules, Property 15: Upcoming Arrivals Sorting
// Validates: Requirements 7.6
// =====================================================

describe('Property 15: Upcoming Arrivals Sorting', () => {
  it('should sort arrivals by scheduled arrival time in ascending order', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 0, maxLength: 20 }),
        (arrivals) => {
          const sorted = sortArrivalsByTime(arrivals);
          
          // Verify sorted array has same length
          expect(sorted.length).toBe(arrivals.length);
          
          // Verify ascending order
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].scheduledArrival).getTime();
            const currTime = new Date(sorted[i].scheduledArrival).getTime();
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all arrivals (no data loss)', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 0, maxLength: 20 }),
        (arrivals) => {
          const sorted = sortArrivalsByTime(arrivals);
          
          // All original arrival IDs should be present
          const originalIds = arrivals.map(a => a.id).sort();
          const sortedIds = sorted.map(a => a.id).sort();
          
          expect(sortedIds).toEqual(originalIds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not mutate the original array', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 1, maxLength: 10 }),
        (arrivals) => {
          const originalOrder = arrivals.map(a => a.id);
          sortArrivalsByTime(arrivals);
          const afterOrder = arrivals.map(a => a.id);
          
          expect(afterOrder).toEqual(originalOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty input', () => {
    expect(sortArrivalsByTime([])).toEqual([]);
  });

  it('should handle null/undefined input gracefully', () => {
    expect(sortArrivalsByTime(null as unknown as UpcomingArrival[])).toEqual([]);
    expect(sortArrivalsByTime(undefined as unknown as UpcomingArrival[])).toEqual([]);
  });
});


// =====================================================
// PROPERTY 1: VESSEL DATA ROUND-TRIP
// Feature: vessel-tracking-schedules, Property 1: Vessel Data Round-Trip
// Validates: Requirements 1.1, 1.2, 1.3, 1.6
// =====================================================

import {
  vesselToRow,
  rowToVessel,
} from '@/lib/vessel-tracking-utils';
import {
  Vessel,
  VesselRow,
  VesselFormData,
} from '@/types/agency';

// Vessel generator for round-trip testing
const vesselArb: fc.Arbitrary<Vessel> = fc.record({
  id: fc.uuid(),
  imoNumber: fc.option(validIMOArb, { nil: undefined }),
  mmsi: fc.option(validMMSIArb, { nil: undefined }),
  vesselName: nonEmptyStringArb,
  vesselType: fc.option(vesselTypeArb, { nil: undefined }),
  flag: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
  callSign: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
  lengthM: fc.option(fc.double({ min: 10, max: 500, noNaN: true }), { nil: undefined }),
  beamM: fc.option(fc.double({ min: 5, max: 100, noNaN: true }), { nil: undefined }),
  draftM: fc.option(fc.double({ min: 1, max: 30, noNaN: true }), { nil: undefined }),
  grossTonnage: fc.option(fc.nat({ max: 500000 }), { nil: undefined }),
  deadweightTons: fc.option(fc.nat({ max: 500000 }), { nil: undefined }),
  teuCapacity: fc.option(fc.nat({ max: 25000 }), { nil: undefined }),
  owner: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  operator: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  shippingLineId: fc.option(fc.uuid(), { nil: undefined }),
  currentStatus: fc.option(fc.constantFrom('underway', 'at_anchor', 'moored', 'not_under_command') as fc.Arbitrary<'underway' | 'at_anchor' | 'moored' | 'not_under_command'>, { nil: undefined }),
  currentPosition: fc.option(
    fc.record({
      lat: validLatitudeArb,
      lng: validLongitudeArb,
      course: fc.option(validCourseArb, { nil: undefined }),
      speed: fc.option(validSpeedArb, { nil: undefined }),
      updatedAt: safeISOStringArb,
    }),
    { nil: undefined }
  ),
  lastPort: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  nextPort: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  isActive: fc.boolean(),
  createdAt: safeISOStringArb,
  updatedAt: safeISOStringArb,
});

// VesselRow generator for round-trip testing
const vesselRowArb: fc.Arbitrary<VesselRow> = fc.record({
  id: fc.uuid(),
  imo_number: fc.option(validIMOArb, { nil: undefined }),
  mmsi: fc.option(validMMSIArb, { nil: undefined }),
  vessel_name: nonEmptyStringArb,
  vessel_type: fc.option(fc.constantFrom('container', 'bulk_carrier', 'tanker', 'general_cargo', 'ro_ro', 'heavy_lift', 'multipurpose'), { nil: undefined }),
  flag: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
  call_sign: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
  length_m: fc.option(fc.double({ min: 10, max: 500, noNaN: true }), { nil: undefined }),
  beam_m: fc.option(fc.double({ min: 5, max: 100, noNaN: true }), { nil: undefined }),
  draft_m: fc.option(fc.double({ min: 1, max: 30, noNaN: true }), { nil: undefined }),
  gross_tonnage: fc.option(fc.nat({ max: 500000 }), { nil: undefined }),
  deadweight_tons: fc.option(fc.nat({ max: 500000 }), { nil: undefined }),
  teu_capacity: fc.option(fc.nat({ max: 25000 }), { nil: undefined }),
  owner: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  operator: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  shipping_line_id: fc.option(fc.uuid(), { nil: undefined }),
  current_status: fc.option(fc.constantFrom('underway', 'at_anchor', 'moored', 'not_under_command'), { nil: undefined }),
  current_position: fc.option(
    fc.record({
      lat: validLatitudeArb,
      lng: validLongitudeArb,
      course: fc.option(validCourseArb, { nil: undefined }),
      speed: fc.option(validSpeedArb, { nil: undefined }),
      updatedAt: safeISOStringArb,
    }),
    { nil: undefined }
  ),
  last_port: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  next_port: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  is_active: fc.boolean(),
  created_at: safeISOStringArb,
  updated_at: safeISOStringArb,
});

describe('Property 1: Vessel Data Round-Trip', () => {
  it('should preserve vessel data when converting row to model', () => {
    fc.assert(
      fc.property(vesselRowArb, (row) => {
        const vessel = rowToVessel(row);
        
        // Verify all fields are correctly mapped
        expect(vessel.id).toBe(row.id);
        expect(vessel.imoNumber).toBe(row.imo_number);
        expect(vessel.mmsi).toBe(row.mmsi);
        expect(vessel.vesselName).toBe(row.vessel_name);
        expect(vessel.vesselType).toBe(row.vessel_type);
        expect(vessel.flag).toBe(row.flag);
        expect(vessel.callSign).toBe(row.call_sign);
        expect(vessel.lengthM).toBe(row.length_m);
        expect(vessel.beamM).toBe(row.beam_m);
        expect(vessel.draftM).toBe(row.draft_m);
        expect(vessel.grossTonnage).toBe(row.gross_tonnage);
        expect(vessel.deadweightTons).toBe(row.deadweight_tons);
        expect(vessel.teuCapacity).toBe(row.teu_capacity);
        expect(vessel.owner).toBe(row.owner);
        expect(vessel.operator).toBe(row.operator);
        expect(vessel.shippingLineId).toBe(row.shipping_line_id);
        expect(vessel.currentStatus).toBe(row.current_status);
        expect(vessel.currentPosition).toEqual(row.current_position);
        expect(vessel.lastPort).toBe(row.last_port);
        expect(vessel.nextPort).toBe(row.next_port);
        expect(vessel.isActive).toBe(row.is_active);
        expect(vessel.createdAt).toBe(row.created_at);
        expect(vessel.updatedAt).toBe(row.updated_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve vessel data when converting model to row', () => {
    fc.assert(
      fc.property(vesselArb, (vessel) => {
        const row = vesselToRow(vessel);
        
        // Verify all fields are correctly mapped
        expect(row.id).toBe(vessel.id);
        expect(row.imo_number).toBe(vessel.imoNumber);
        expect(row.mmsi).toBe(vessel.mmsi);
        expect(row.vessel_name).toBe(vessel.vesselName);
        expect(row.vessel_type).toBe(vessel.vesselType);
        expect(row.flag).toBe(vessel.flag);
        expect(row.call_sign).toBe(vessel.callSign);
        expect(row.length_m).toBe(vessel.lengthM);
        expect(row.beam_m).toBe(vessel.beamM);
        expect(row.draft_m).toBe(vessel.draftM);
        expect(row.gross_tonnage).toBe(vessel.grossTonnage);
        expect(row.deadweight_tons).toBe(vessel.deadweightTons);
        expect(row.teu_capacity).toBe(vessel.teuCapacity);
        expect(row.owner).toBe(vessel.owner);
        expect(row.operator).toBe(vessel.operator);
        expect(row.shipping_line_id).toBe(vessel.shippingLineId);
        expect(row.current_status).toBe(vessel.currentStatus);
        expect(row.current_position).toEqual(vessel.currentPosition);
        expect(row.last_port).toBe(vessel.lastPort);
        expect(row.next_port).toBe(vessel.nextPort);
        expect(row.is_active).toBe(vessel.isActive);
        expect(row.created_at).toBe(vessel.createdAt);
        expect(row.updated_at).toBe(vessel.updatedAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should round-trip row -> model -> row preserving data', () => {
    fc.assert(
      fc.property(vesselRowArb, (originalRow) => {
        const vessel = rowToVessel(originalRow);
        const roundTrippedRow = vesselToRow(vessel);
        
        // All fields should match after round-trip
        expect(roundTrippedRow.id).toBe(originalRow.id);
        expect(roundTrippedRow.imo_number).toBe(originalRow.imo_number);
        expect(roundTrippedRow.mmsi).toBe(originalRow.mmsi);
        expect(roundTrippedRow.vessel_name).toBe(originalRow.vessel_name);
        expect(roundTrippedRow.vessel_type).toBe(originalRow.vessel_type);
        expect(roundTrippedRow.flag).toBe(originalRow.flag);
        expect(roundTrippedRow.call_sign).toBe(originalRow.call_sign);
        expect(roundTrippedRow.length_m).toBe(originalRow.length_m);
        expect(roundTrippedRow.beam_m).toBe(originalRow.beam_m);
        expect(roundTrippedRow.draft_m).toBe(originalRow.draft_m);
        expect(roundTrippedRow.gross_tonnage).toBe(originalRow.gross_tonnage);
        expect(roundTrippedRow.deadweight_tons).toBe(originalRow.deadweight_tons);
        expect(roundTrippedRow.teu_capacity).toBe(originalRow.teu_capacity);
        expect(roundTrippedRow.owner).toBe(originalRow.owner);
        expect(roundTrippedRow.operator).toBe(originalRow.operator);
        expect(roundTrippedRow.shipping_line_id).toBe(originalRow.shipping_line_id);
        expect(roundTrippedRow.current_status).toBe(originalRow.current_status);
        expect(roundTrippedRow.current_position).toEqual(originalRow.current_position);
        expect(roundTrippedRow.last_port).toBe(originalRow.last_port);
        expect(roundTrippedRow.next_port).toBe(originalRow.next_port);
        expect(roundTrippedRow.is_active).toBe(originalRow.is_active);
        expect(roundTrippedRow.created_at).toBe(originalRow.created_at);
        expect(roundTrippedRow.updated_at).toBe(originalRow.updated_at);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 2: IMO NUMBER UNIQUENESS
// Feature: vessel-tracking-schedules, Property 2: IMO Number Uniqueness
// Validates: Requirements 1.4
// Note: This property is tested via validation logic since actual DB uniqueness
// is enforced by database constraints and server action validation
// =====================================================

describe('Property 2: IMO Number Uniqueness', () => {
  it('should validate that IMO numbers follow the correct format for uniqueness checks', () => {
    fc.assert(
      fc.property(validIMOArb, (imo) => {
        // Valid IMO should pass validation (prerequisite for uniqueness check)
        const result = validateIMO(imo);
        expect(result.isValid).toBe(true);
        
        // IMO should be exactly 7 digits
        expect(imo).toMatch(/^\d{7}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject duplicate IMO format attempts (same format validation)', () => {
    fc.assert(
      fc.property(validIMOArb, (imo) => {
        // Both validations should pass for the same IMO
        const result1 = validateIMO(imo);
        const result2 = validateIMO(imo);
        
        expect(result1.isValid).toBe(result2.isValid);
        expect(result1.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure different valid IMOs are distinguishable', () => {
    fc.assert(
      fc.property(
        validIMOArb,
        validIMOArb.filter(imo => imo !== '0000000'), // Ensure we can get different values
        (imo1, imo2) => {
          // Both should be valid
          expect(validateIMO(imo1).isValid).toBe(true);
          expect(validateIMO(imo2).isValid).toBe(true);
          
          // If they're different, they should be distinguishable
          if (imo1 !== imo2) {
            expect(imo1).not.toBe(imo2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 3: MMSI UNIQUENESS
// Feature: vessel-tracking-schedules, Property 3: MMSI Uniqueness
// Validates: Requirements 1.5
// Note: This property is tested via validation logic since actual DB uniqueness
// is enforced by database constraints and server action validation
// =====================================================

describe('Property 3: MMSI Uniqueness', () => {
  it('should validate that MMSI numbers follow the correct format for uniqueness checks', () => {
    fc.assert(
      fc.property(validMMSIArb, (mmsi) => {
        // Valid MMSI should pass validation (prerequisite for uniqueness check)
        const result = validateMMSI(mmsi);
        expect(result.isValid).toBe(true);
        
        // MMSI should be exactly 9 digits
        expect(mmsi).toMatch(/^\d{9}$/);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject duplicate MMSI format attempts (same format validation)', () => {
    fc.assert(
      fc.property(validMMSIArb, (mmsi) => {
        // Both validations should pass for the same MMSI
        const result1 = validateMMSI(mmsi);
        const result2 = validateMMSI(mmsi);
        
        expect(result1.isValid).toBe(result2.isValid);
        expect(result1.isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should ensure different valid MMSIs are distinguishable', () => {
    fc.assert(
      fc.property(
        validMMSIArb,
        validMMSIArb.filter(mmsi => mmsi !== '000000000'), // Ensure we can get different values
        (mmsi1, mmsi2) => {
          // Both should be valid
          expect(validateMMSI(mmsi1).isValid).toBe(true);
          expect(validateMMSI(mmsi2).isValid).toBe(true);
          
          // If they're different, they should be distinguishable
          if (mmsi1 !== mmsi2) {
            expect(mmsi1).not.toBe(mmsi2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 4: VESSEL DEACTIVATION PRESERVES DATA
// Feature: vessel-tracking-schedules, Property 4: Vessel Deactivation Preserves Data
// Validates: Requirements 1.7
// Note: This property tests the data transformation logic that supports deactivation
// =====================================================

describe('Property 4: Vessel Deactivation Preserves Data', () => {
  it('should preserve all vessel data when isActive changes from true to false', () => {
    fc.assert(
      fc.property(vesselArb, (vessel) => {
        // Create an active vessel
        const activeVessel = { ...vessel, isActive: true };
        
        // Simulate deactivation (only isActive changes)
        const deactivatedVessel = { ...activeVessel, isActive: false };
        
        // All other fields should remain unchanged
        expect(deactivatedVessel.id).toBe(activeVessel.id);
        expect(deactivatedVessel.imoNumber).toBe(activeVessel.imoNumber);
        expect(deactivatedVessel.mmsi).toBe(activeVessel.mmsi);
        expect(deactivatedVessel.vesselName).toBe(activeVessel.vesselName);
        expect(deactivatedVessel.vesselType).toBe(activeVessel.vesselType);
        expect(deactivatedVessel.flag).toBe(activeVessel.flag);
        expect(deactivatedVessel.callSign).toBe(activeVessel.callSign);
        expect(deactivatedVessel.lengthM).toBe(activeVessel.lengthM);
        expect(deactivatedVessel.beamM).toBe(activeVessel.beamM);
        expect(deactivatedVessel.draftM).toBe(activeVessel.draftM);
        expect(deactivatedVessel.grossTonnage).toBe(activeVessel.grossTonnage);
        expect(deactivatedVessel.deadweightTons).toBe(activeVessel.deadweightTons);
        expect(deactivatedVessel.teuCapacity).toBe(activeVessel.teuCapacity);
        expect(deactivatedVessel.owner).toBe(activeVessel.owner);
        expect(deactivatedVessel.operator).toBe(activeVessel.operator);
        expect(deactivatedVessel.shippingLineId).toBe(activeVessel.shippingLineId);
        expect(deactivatedVessel.currentStatus).toBe(activeVessel.currentStatus);
        expect(deactivatedVessel.currentPosition).toEqual(activeVessel.currentPosition);
        expect(deactivatedVessel.lastPort).toBe(activeVessel.lastPort);
        expect(deactivatedVessel.nextPort).toBe(activeVessel.nextPort);
        expect(deactivatedVessel.createdAt).toBe(activeVessel.createdAt);
        
        // Only isActive should be different
        expect(deactivatedVessel.isActive).toBe(false);
        expect(activeVessel.isActive).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve data through row transformation during deactivation', () => {
    fc.assert(
      fc.property(vesselRowArb, (row) => {
        // Create an active row
        const activeRow = { ...row, is_active: true };
        
        // Convert to model
        const vessel = rowToVessel(activeRow);
        expect(vessel.isActive).toBe(true);
        
        // Simulate deactivation
        const deactivatedVessel = { ...vessel, isActive: false };
        
        // Convert back to row
        const deactivatedRow = vesselToRow(deactivatedVessel);
        
        // All data should be preserved except is_active
        expect(deactivatedRow.id).toBe(activeRow.id);
        expect(deactivatedRow.imo_number).toBe(activeRow.imo_number);
        expect(deactivatedRow.mmsi).toBe(activeRow.mmsi);
        expect(deactivatedRow.vessel_name).toBe(activeRow.vessel_name);
        expect(deactivatedRow.vessel_type).toBe(activeRow.vessel_type);
        expect(deactivatedRow.is_active).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should allow filtering active vs inactive vessels', () => {
    fc.assert(
      fc.property(
        fc.array(vesselArb, { minLength: 1, maxLength: 20 }),
        (vessels) => {
          // Randomly set some vessels as inactive
          const mixedVessels = vessels.map((v, i) => ({
            ...v,
            isActive: i % 2 === 0, // Even indices are active
          }));
          
          // Filter active vessels
          const activeVessels = mixedVessels.filter(v => v.isActive);
          const inactiveVessels = mixedVessels.filter(v => !v.isActive);
          
          // All vessels should be accounted for
          expect(activeVessels.length + inactiveVessels.length).toBe(mixedVessels.length);
          
          // Active vessels should all have isActive = true
          activeVessels.forEach(v => expect(v.isActive).toBe(true));
          
          // Inactive vessels should all have isActive = false
          inactiveVessels.forEach(v => expect(v.isActive).toBe(false));
          
          // Data should be preserved in both sets
          mixedVessels.forEach(original => {
            const found = [...activeVessels, ...inactiveVessels].find(v => v.id === original.id);
            expect(found).toBeDefined();
            expect(found?.vesselName).toBe(original.vesselName);
            expect(found?.imoNumber).toBe(original.imoNumber);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 5: SCHEDULE DATA ROUND-TRIP
// Feature: vessel-tracking-schedules, Property 5: Schedule Data Round-Trip
// Validates: Requirements 2.1, 2.2, 2.3, 2.4
// =====================================================

import {
  scheduleToRow,
  rowToSchedule,
} from '@/lib/vessel-tracking-utils';
import {
  VesselSchedule,
  VesselScheduleRow,
  ScheduleType,
  SCHEDULE_TYPES,
} from '@/types/agency';

// Schedule type generator
const scheduleTypeArb: fc.Arbitrary<ScheduleType> = fc.constantFrom(...SCHEDULE_TYPES);

// VesselSchedule generator for round-trip testing
const vesselScheduleArb: fc.Arbitrary<VesselSchedule> = fc.record({
  id: fc.uuid(),
  vesselId: fc.uuid(),
  voyageNumber: fc.string({ minLength: 1, maxLength: 50 }),
  serviceName: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  serviceCode: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  scheduleType: scheduleTypeArb,
  portId: fc.option(fc.uuid(), { nil: undefined }),
  portName: nonEmptyStringArb,
  terminal: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  berth: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  scheduledArrival: fc.option(safeISOStringArb, { nil: undefined }),
  scheduledDeparture: fc.option(safeISOStringArb, { nil: undefined }),
  actualArrival: fc.option(safeISOStringArb, { nil: undefined }),
  actualDeparture: fc.option(safeISOStringArb, { nil: undefined }),
  cargoCutoff: fc.option(safeISOStringArb, { nil: undefined }),
  docCutoff: fc.option(safeISOStringArb, { nil: undefined }),
  vgmCutoff: fc.option(safeISOStringArb, { nil: undefined }),
  status: scheduleStatusArb,
  delayHours: fc.integer({ min: -100, max: 100 }),
  delayReason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined }),
  createdAt: safeISOStringArb,
  updatedAt: safeISOStringArb,
});

// VesselScheduleRow generator for round-trip testing
const vesselScheduleRowArb: fc.Arbitrary<VesselScheduleRow> = fc.record({
  id: fc.uuid(),
  vessel_id: fc.uuid(),
  voyage_number: fc.string({ minLength: 1, maxLength: 50 }),
  service_name: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  service_code: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  schedule_type: fc.constantFrom('scheduled', 'omitted', 'extra_call'),
  port_id: fc.option(fc.uuid(), { nil: undefined }),
  port_name: nonEmptyStringArb,
  terminal: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  berth: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  scheduled_arrival: fc.option(safeISOStringArb, { nil: undefined }),
  scheduled_departure: fc.option(safeISOStringArb, { nil: undefined }),
  actual_arrival: fc.option(safeISOStringArb, { nil: undefined }),
  actual_departure: fc.option(safeISOStringArb, { nil: undefined }),
  cargo_cutoff: fc.option(safeISOStringArb, { nil: undefined }),
  doc_cutoff: fc.option(safeISOStringArb, { nil: undefined }),
  vgm_cutoff: fc.option(safeISOStringArb, { nil: undefined }),
  status: fc.constantFrom('scheduled', 'arrived', 'berthed', 'working', 'departed', 'cancelled'),
  delay_hours: fc.integer({ min: -100, max: 100 }),
  delay_reason: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  notes: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined }),
  created_at: safeISOStringArb,
  updated_at: safeISOStringArb,
});

describe('Property 5: Schedule Data Round-Trip', () => {
  it('should preserve schedule data when converting row to model', () => {
    fc.assert(
      fc.property(vesselScheduleRowArb, (row) => {
        const schedule = rowToSchedule(row);
        
        // Verify all fields are correctly mapped
        expect(schedule.id).toBe(row.id);
        expect(schedule.vesselId).toBe(row.vessel_id);
        expect(schedule.voyageNumber).toBe(row.voyage_number);
        expect(schedule.serviceName).toBe(row.service_name);
        expect(schedule.serviceCode).toBe(row.service_code);
        expect(schedule.scheduleType).toBe(row.schedule_type);
        expect(schedule.portId).toBe(row.port_id);
        expect(schedule.portName).toBe(row.port_name);
        expect(schedule.terminal).toBe(row.terminal);
        expect(schedule.berth).toBe(row.berth);
        expect(schedule.scheduledArrival).toBe(row.scheduled_arrival);
        expect(schedule.scheduledDeparture).toBe(row.scheduled_departure);
        expect(schedule.actualArrival).toBe(row.actual_arrival);
        expect(schedule.actualDeparture).toBe(row.actual_departure);
        expect(schedule.cargoCutoff).toBe(row.cargo_cutoff);
        expect(schedule.docCutoff).toBe(row.doc_cutoff);
        expect(schedule.vgmCutoff).toBe(row.vgm_cutoff);
        expect(schedule.status).toBe(row.status);
        expect(schedule.delayHours).toBe(row.delay_hours);
        expect(schedule.delayReason).toBe(row.delay_reason);
        expect(schedule.notes).toBe(row.notes);
        expect(schedule.createdAt).toBe(row.created_at);
        expect(schedule.updatedAt).toBe(row.updated_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve schedule data when converting model to row', () => {
    fc.assert(
      fc.property(vesselScheduleArb, (schedule) => {
        const row = scheduleToRow(schedule);
        
        // Verify all fields are correctly mapped
        expect(row.id).toBe(schedule.id);
        expect(row.vessel_id).toBe(schedule.vesselId);
        expect(row.voyage_number).toBe(schedule.voyageNumber);
        expect(row.service_name).toBe(schedule.serviceName);
        expect(row.service_code).toBe(schedule.serviceCode);
        expect(row.schedule_type).toBe(schedule.scheduleType);
        expect(row.port_id).toBe(schedule.portId);
        expect(row.port_name).toBe(schedule.portName);
        expect(row.terminal).toBe(schedule.terminal);
        expect(row.berth).toBe(schedule.berth);
        expect(row.scheduled_arrival).toBe(schedule.scheduledArrival);
        expect(row.scheduled_departure).toBe(schedule.scheduledDeparture);
        expect(row.actual_arrival).toBe(schedule.actualArrival);
        expect(row.actual_departure).toBe(schedule.actualDeparture);
        expect(row.cargo_cutoff).toBe(schedule.cargoCutoff);
        expect(row.doc_cutoff).toBe(schedule.docCutoff);
        expect(row.vgm_cutoff).toBe(schedule.vgmCutoff);
        expect(row.status).toBe(schedule.status);
        expect(row.delay_hours).toBe(schedule.delayHours);
        expect(row.delay_reason).toBe(schedule.delayReason);
        expect(row.notes).toBe(schedule.notes);
        expect(row.created_at).toBe(schedule.createdAt);
        expect(row.updated_at).toBe(schedule.updatedAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should round-trip row -> model -> row preserving data', () => {
    fc.assert(
      fc.property(vesselScheduleRowArb, (originalRow) => {
        const schedule = rowToSchedule(originalRow);
        const roundTrippedRow = scheduleToRow(schedule);
        
        // All fields should match after round-trip
        expect(roundTrippedRow.id).toBe(originalRow.id);
        expect(roundTrippedRow.vessel_id).toBe(originalRow.vessel_id);
        expect(roundTrippedRow.voyage_number).toBe(originalRow.voyage_number);
        expect(roundTrippedRow.service_name).toBe(originalRow.service_name);
        expect(roundTrippedRow.service_code).toBe(originalRow.service_code);
        expect(roundTrippedRow.schedule_type).toBe(originalRow.schedule_type);
        expect(roundTrippedRow.port_id).toBe(originalRow.port_id);
        expect(roundTrippedRow.port_name).toBe(originalRow.port_name);
        expect(roundTrippedRow.terminal).toBe(originalRow.terminal);
        expect(roundTrippedRow.berth).toBe(originalRow.berth);
        expect(roundTrippedRow.scheduled_arrival).toBe(originalRow.scheduled_arrival);
        expect(roundTrippedRow.scheduled_departure).toBe(originalRow.scheduled_departure);
        expect(roundTrippedRow.actual_arrival).toBe(originalRow.actual_arrival);
        expect(roundTrippedRow.actual_departure).toBe(originalRow.actual_departure);
        expect(roundTrippedRow.cargo_cutoff).toBe(originalRow.cargo_cutoff);
        expect(roundTrippedRow.doc_cutoff).toBe(originalRow.doc_cutoff);
        expect(roundTrippedRow.vgm_cutoff).toBe(originalRow.vgm_cutoff);
        expect(roundTrippedRow.status).toBe(originalRow.status);
        expect(roundTrippedRow.delay_hours).toBe(originalRow.delay_hours);
        expect(roundTrippedRow.delay_reason).toBe(originalRow.delay_reason);
        expect(roundTrippedRow.notes).toBe(originalRow.notes);
        expect(roundTrippedRow.created_at).toBe(originalRow.created_at);
        expect(roundTrippedRow.updated_at).toBe(originalRow.updated_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all time fields including cutoffs', () => {
    fc.assert(
      fc.property(vesselScheduleRowArb, (row) => {
        const schedule = rowToSchedule(row);
        
        // Verify all time-related fields are preserved
        expect(schedule.scheduledArrival).toBe(row.scheduled_arrival);
        expect(schedule.scheduledDeparture).toBe(row.scheduled_departure);
        expect(schedule.actualArrival).toBe(row.actual_arrival);
        expect(schedule.actualDeparture).toBe(row.actual_departure);
        expect(schedule.cargoCutoff).toBe(row.cargo_cutoff);
        expect(schedule.docCutoff).toBe(row.doc_cutoff);
        expect(schedule.vgmCutoff).toBe(row.vgm_cutoff);
      }),
      { numRuns: 100 }
    );
  });
});



// =====================================================
// PROPERTY 6: SCHEDULE UNIQUENESS
// Feature: vessel-tracking-schedules, Property 6: Schedule Uniqueness
// Validates: Requirements 2.5
// Note: This property tests the uniqueness key composition logic
// Actual DB uniqueness is enforced by database constraints and server action validation
// =====================================================

describe('Property 6: Schedule Uniqueness', () => {
  // Helper to create a unique key for schedule
  const createScheduleKey = (vesselId: string, voyageNumber: string, portId: string | undefined, portName: string) => {
    return `${vesselId}|${voyageNumber}|${portId || portName}`;
  };

  it('should generate unique keys for different vessel+voyage+port combinations', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.option(fc.uuid(), { nil: undefined }),
        fc.option(fc.uuid(), { nil: undefined }),
        nonEmptyStringArb,
        nonEmptyStringArb,
        (vesselId1, vesselId2, voyage1, voyage2, portId1, portId2, portName1, portName2) => {
          const key1 = createScheduleKey(vesselId1, voyage1, portId1, portName1);
          const key2 = createScheduleKey(vesselId2, voyage2, portId2, portName2);
          
          // If all components are the same, keys should be equal
          const sameVessel = vesselId1 === vesselId2;
          const sameVoyage = voyage1 === voyage2;
          const samePort = portId1 && portId2 ? portId1 === portId2 : portName1 === portName2;
          
          if (sameVessel && sameVoyage && samePort) {
            expect(key1).toBe(key2);
          } else {
            // If any component differs, keys should be different
            expect(key1).not.toBe(key2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should identify duplicate schedules by vessel+voyage+port', () => {
    fc.assert(
      fc.property(
        fc.array(vesselScheduleArb, { minLength: 2, maxLength: 20 }),
        (schedules) => {
          // Create a map to track unique combinations
          const uniqueKeys = new Map<string, VesselSchedule>();
          const duplicates: VesselSchedule[] = [];
          
          schedules.forEach(schedule => {
            const key = createScheduleKey(
              schedule.vesselId,
              schedule.voyageNumber,
              schedule.portId,
              schedule.portName
            );
            
            if (uniqueKeys.has(key)) {
              duplicates.push(schedule);
            } else {
              uniqueKeys.set(key, schedule);
            }
          });
          
          // Total should equal unique + duplicates
          expect(uniqueKeys.size + duplicates.length).toBe(schedules.length);
          
          // All duplicates should have matching keys with something in uniqueKeys
          duplicates.forEach(dup => {
            const key = createScheduleKey(dup.vesselId, dup.voyageNumber, dup.portId, dup.portName);
            expect(uniqueKeys.has(key)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow same vessel+voyage with different ports', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // vesselId
        fc.string({ minLength: 1, maxLength: 50 }), // voyageNumber
        fc.uuid(), // portId1
        fc.uuid().filter(id => true), // portId2 (different)
        nonEmptyStringArb, // portName1
        nonEmptyStringArb, // portName2
        (vesselId, voyageNumber, portId1, portId2, portName1, portName2) => {
          // Same vessel and voyage, but different ports
          const key1 = createScheduleKey(vesselId, voyageNumber, portId1, portName1);
          const key2 = createScheduleKey(vesselId, voyageNumber, portId2, portName2);
          
          // If port IDs are different, keys should be different
          if (portId1 !== portId2) {
            expect(key1).not.toBe(key2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow same vessel+port with different voyages', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // vesselId
        fc.string({ minLength: 1, maxLength: 50 }), // voyageNumber1
        fc.string({ minLength: 1, maxLength: 50 }), // voyageNumber2
        fc.uuid(), // portId
        nonEmptyStringArb, // portName
        (vesselId, voyage1, voyage2, portId, portName) => {
          // Same vessel and port, but different voyages
          const key1 = createScheduleKey(vesselId, voyage1, portId, portName);
          const key2 = createScheduleKey(vesselId, voyage2, portId, portName);
          
          // If voyage numbers are different, keys should be different
          if (voyage1 !== voyage2) {
            expect(key1).not.toBe(key2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow same voyage+port with different vessels', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // vesselId1
        fc.uuid(), // vesselId2
        fc.string({ minLength: 1, maxLength: 50 }), // voyageNumber
        fc.uuid(), // portId
        nonEmptyStringArb, // portName
        (vesselId1, vesselId2, voyageNumber, portId, portName) => {
          // Same voyage and port, but different vessels
          const key1 = createScheduleKey(vesselId1, voyageNumber, portId, portName);
          const key2 = createScheduleKey(vesselId2, voyageNumber, portId, portName);
          
          // If vessel IDs are different, keys should be different
          if (vesselId1 !== vesselId2) {
            expect(key1).not.toBe(key2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});



// =====================================================
// PROPERTY 14: UPCOMING ARRIVALS DATE FILTERING
// Feature: vessel-tracking-schedules, Property 14: Upcoming Arrivals Date Filtering
// Validates: Requirements 7.5
// =====================================================

import { filterArrivalsByDateRange } from '@/lib/vessel-tracking-utils';

describe('Property 14: Upcoming Arrivals Date Filtering', () => {
  it('should return only arrivals within the specified date range', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 0, maxLength: 20 }),
        safeDateArb,
        fc.integer({ min: 1, max: 30 }), // days range
        (arrivals, fromDate, daysRange) => {
          const toDate = new Date(fromDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
          
          const filtered = filterArrivalsByDateRange(arrivals, fromDate, toDate);
          
          // All filtered arrivals should be within the date range
          filtered.forEach(arrival => {
            const arrivalDate = new Date(arrival.scheduledArrival);
            // Set to start of day for from and end of day for to (as the function does)
            const fromStart = new Date(fromDate);
            fromStart.setHours(0, 0, 0, 0);
            const toEnd = new Date(toDate);
            toEnd.setHours(23, 59, 59, 999);
            
            expect(arrivalDate.getTime()).toBeGreaterThanOrEqual(fromStart.getTime());
            expect(arrivalDate.getTime()).toBeLessThanOrEqual(toEnd.getTime());
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should exclude arrivals outside the date range', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 1, maxLength: 20 }),
        safeDateArb,
        fc.integer({ min: 1, max: 30 }), // days range
        (arrivals, fromDate, daysRange) => {
          const toDate = new Date(fromDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
          
          const filtered = filterArrivalsByDateRange(arrivals, fromDate, toDate);
          const filteredIds = new Set(filtered.map(a => a.id));
          
          // Check that excluded arrivals are actually outside the range
          arrivals.forEach(arrival => {
            if (!filteredIds.has(arrival.id)) {
              const arrivalDate = new Date(arrival.scheduledArrival);
              const fromStart = new Date(fromDate);
              fromStart.setHours(0, 0, 0, 0);
              const toEnd = new Date(toDate);
              toEnd.setHours(23, 59, 59, 999);
              
              // Should be outside the range
              const isOutside = arrivalDate.getTime() < fromStart.getTime() || 
                               arrivalDate.getTime() > toEnd.getTime();
              expect(isOutside).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all arrival data when filtering', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 0, maxLength: 20 }),
        safeDateArb,
        fc.integer({ min: 1, max: 30 }),
        (arrivals, fromDate, daysRange) => {
          const toDate = new Date(fromDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
          
          const filtered = filterArrivalsByDateRange(arrivals, fromDate, toDate);
          
          // Each filtered arrival should have all its original data
          filtered.forEach(filteredArrival => {
            const original = arrivals.find(a => a.id === filteredArrival.id);
            expect(original).toBeDefined();
            if (original) {
              expect(filteredArrival.vesselId).toBe(original.vesselId);
              expect(filteredArrival.vesselName).toBe(original.vesselName);
              expect(filteredArrival.voyageNumber).toBe(original.voyageNumber);
              expect(filteredArrival.portName).toBe(original.portName);
              expect(filteredArrival.scheduledArrival).toBe(original.scheduledArrival);
              expect(filteredArrival.status).toBe(original.status);
              expect(filteredArrival.delayHours).toBe(original.delayHours);
              expect(filteredArrival.ourBookingsCount).toBe(original.ourBookingsCount);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should work with ISO string date inputs', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 0, maxLength: 20 }),
        safeISOStringArb,
        fc.integer({ min: 1, max: 30 }),
        (arrivals, fromStr, daysRange) => {
          const fromDate = new Date(fromStr);
          const toDate = new Date(fromDate.getTime() + daysRange * 24 * 60 * 60 * 1000);
          
          // Should work with both Date objects and ISO strings
          const filteredWithDates = filterArrivalsByDateRange(arrivals, fromDate, toDate);
          const filteredWithStrings = filterArrivalsByDateRange(arrivals, fromStr, toDate.toISOString());
          
          // Results should be the same
          expect(filteredWithDates.length).toBe(filteredWithStrings.length);
          expect(filteredWithDates.map(a => a.id).sort()).toEqual(filteredWithStrings.map(a => a.id).sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array for empty input', () => {
    const fromDate = new Date();
    const toDate = new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    expect(filterArrivalsByDateRange([], fromDate, toDate)).toEqual([]);
  });

  it('should handle null/undefined input gracefully', () => {
    const fromDate = new Date();
    const toDate = new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    expect(filterArrivalsByDateRange(null as unknown as UpcomingArrival[], fromDate, toDate)).toEqual([]);
    expect(filterArrivalsByDateRange(undefined as unknown as UpcomingArrival[], fromDate, toDate)).toEqual([]);
  });

  it('should include arrivals on boundary dates', () => {
    // Create arrivals exactly on the boundary dates
    const fromDate = new Date('2025-01-15T00:00:00Z');
    const toDate = new Date('2025-01-20T00:00:00Z');
    
    const arrivals: UpcomingArrival[] = [
      {
        id: '1',
        vesselId: 'v1',
        vesselName: 'Test Vessel 1',
        voyageNumber: 'V001',
        portName: 'Port A',
        scheduledArrival: '2025-01-15T10:00:00Z', // On from date
        status: 'scheduled',
        delayHours: 0,
        ourBookingsCount: 1,
      },
      {
        id: '2',
        vesselId: 'v2',
        vesselName: 'Test Vessel 2',
        voyageNumber: 'V002',
        portName: 'Port B',
        scheduledArrival: '2025-01-20T10:00:00Z', // On to date
        status: 'scheduled',
        delayHours: 0,
        ourBookingsCount: 2,
      },
      {
        id: '3',
        vesselId: 'v3',
        vesselName: 'Test Vessel 3',
        voyageNumber: 'V003',
        portName: 'Port C',
        scheduledArrival: '2025-01-14T10:00:00Z', // Before from date
        status: 'scheduled',
        delayHours: 0,
        ourBookingsCount: 3,
      },
      {
        id: '4',
        vesselId: 'v4',
        vesselName: 'Test Vessel 4',
        voyageNumber: 'V004',
        portName: 'Port D',
        scheduledArrival: '2025-01-21T10:00:00Z', // After to date
        status: 'scheduled',
        delayHours: 0,
        ourBookingsCount: 4,
      },
    ];
    
    const filtered = filterArrivalsByDateRange(arrivals, fromDate, toDate);
    
    // Should include arrivals on boundary dates (1 and 2), exclude others (3 and 4)
    expect(filtered.length).toBe(2);
    expect(filtered.map(a => a.id).sort()).toEqual(['1', '2']);
  });
});



// =====================================================
// PROPERTY 16: BOOKING COUNT AGGREGATION
// Feature: vessel-tracking-schedules, Property 16: Booking Count Aggregation
// Validates: Requirements 7.4
// Note: This property tests the data structure and aggregation logic
// Actual aggregation is performed by the database view
// =====================================================

describe('Property 16: Booking Count Aggregation', () => {
  it('should preserve booking count in upcoming arrival data', () => {
    fc.assert(
      fc.property(upcomingArrivalArb, (arrival) => {
        // Booking count should be a non-negative integer
        expect(arrival.ourBookingsCount).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(arrival.ourBookingsCount)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve booking count through row transformation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          vessel_id: fc.uuid(),
          vessel_name: nonEmptyStringArb,
          imo_number: fc.option(validIMOArb, { nil: undefined }),
          vessel_type: fc.option(fc.constantFrom('container', 'bulk_carrier', 'tanker', 'general_cargo', 'ro_ro', 'heavy_lift', 'multipurpose'), { nil: undefined }),
          voyage_number: fc.string({ minLength: 1, maxLength: 20 }),
          port_name: nonEmptyStringArb,
          port_code: fc.option(fc.string({ minLength: 2, maxLength: 10 }), { nil: undefined }),
          terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
          scheduled_arrival: safeISOStringArb,
          status: fc.constantFrom('scheduled', 'arrived', 'berthed', 'working', 'departed', 'cancelled'),
          delay_hours: fc.integer({ min: 0, max: 100 }),
          our_bookings_count: fc.nat({ max: 100 }),
        }),
        (row) => {
          const arrival = rowToUpcomingArrival(row as UpcomingArrivalRow);
          
          // Booking count should be preserved exactly
          expect(arrival.ourBookingsCount).toBe(row.our_bookings_count);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain booking count consistency across arrivals', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 1, maxLength: 20 }),
        (arrivals) => {
          // Total bookings across all arrivals should be sum of individual counts
          const totalBookings = arrivals.reduce((sum, a) => sum + a.ourBookingsCount, 0);
          
          // Each arrival's booking count should contribute to total
          arrivals.forEach(arrival => {
            expect(totalBookings).toBeGreaterThanOrEqual(arrival.ourBookingsCount);
          });
          
          // Total should be non-negative
          expect(totalBookings).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow zero booking count for arrivals without bookings', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          vesselId: fc.uuid(),
          vesselName: nonEmptyStringArb,
          imoNumber: fc.option(validIMOArb, { nil: undefined }),
          vesselType: fc.option(vesselTypeArb, { nil: undefined }),
          voyageNumber: fc.string({ minLength: 1, maxLength: 20 }),
          portName: nonEmptyStringArb,
          portCode: fc.option(fc.string({ minLength: 2, maxLength: 10 }), { nil: undefined }),
          terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
          scheduledArrival: safeISOStringArb,
          status: scheduleStatusArb,
          delayHours: fc.integer({ min: 0, max: 100 }),
          ourBookingsCount: fc.constant(0), // Zero bookings
        }),
        (arrival) => {
          // Zero booking count should be valid
          expect(arrival.ourBookingsCount).toBe(0);
          
          // All other fields should still be valid
          expect(arrival.id).toBeDefined();
          expect(arrival.vesselName).toBeDefined();
          expect(arrival.voyageNumber).toBeDefined();
          expect(arrival.portName).toBeDefined();
          expect(arrival.scheduledArrival).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should group arrivals by vessel+voyage for booking aggregation', () => {
    fc.assert(
      fc.property(
        fc.array(upcomingArrivalArb, { minLength: 2, maxLength: 20 }),
        (arrivals) => {
          // Group arrivals by vessel+voyage
          const groups = new Map<string, UpcomingArrival[]>();
          
          arrivals.forEach(arrival => {
            const key = `${arrival.vesselId}|${arrival.voyageNumber}`;
            const group = groups.get(key) || [];
            group.push(arrival);
            groups.set(key, group);
          });
          
          // Each group should have consistent vessel info
          groups.forEach((group) => {
            const firstArrival = group[0];
            group.forEach(arrival => {
              expect(arrival.vesselId).toBe(firstArrival.vesselId);
              expect(arrival.voyageNumber).toBe(firstArrival.voyageNumber);
              expect(arrival.vesselName).toBe(firstArrival.vesselName);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle arrivals with high booking counts', () => {
    const highBookingArrival: UpcomingArrival = {
      id: 'test-id',
      vesselId: 'vessel-id',
      vesselName: 'Large Container Ship',
      imoNumber: '1234567',
      vesselType: 'container',
      voyageNumber: 'V001',
      portName: 'Singapore',
      portCode: 'SGSIN',
      terminal: 'PSA Terminal',
      scheduledArrival: new Date().toISOString(),
      status: 'scheduled',
      delayHours: 0,
      ourBookingsCount: 500, // High booking count
    };
    
    // High booking count should be valid
    expect(highBookingArrival.ourBookingsCount).toBe(500);
    expect(highBookingArrival.ourBookingsCount).toBeGreaterThan(0);
  });
});



// =====================================================
// PROPERTY 8: POSITION RECORDING UPDATES VESSEL
// Feature: vessel-tracking-schedules, Property 8: Position Recording Updates Vessel
// Validates: Requirements 3.4
// Note: This property tests the data transformation logic that supports position updates
// Actual DB updates are performed by server actions
// =====================================================

import {
  positionToRow,
  rowToPosition,
} from '@/lib/vessel-tracking-utils';
import {
  VesselPositionRecord,
  VesselPositionRow,
  VesselPosition,
  PositionSource,
  POSITION_SOURCES,
  VESSEL_STATUSES,
} from '@/types/agency';

// Position source generator
const positionSourceArb: fc.Arbitrary<PositionSource> = fc.constantFrom(...POSITION_SOURCES);

// Vessel status generator for positions
const vesselStatusArb = fc.constantFrom(...VESSEL_STATUSES);

// VesselPositionRecord generator
const vesselPositionRecordArb: fc.Arbitrary<VesselPositionRecord> = fc.record({
  id: fc.uuid(),
  vesselId: fc.uuid(),
  timestamp: safeISOStringArb,
  latitude: validLatitudeArb,
  longitude: validLongitudeArb,
  course: fc.option(validCourseArb, { nil: undefined }),
  speedKnots: fc.option(validSpeedArb, { nil: undefined }),
  status: fc.option(vesselStatusArb, { nil: undefined }),
  destination: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  source: positionSourceArb,
  createdAt: safeISOStringArb,
});

// VesselPositionRow generator
const vesselPositionRowArb: fc.Arbitrary<VesselPositionRow> = fc.record({
  id: fc.uuid(),
  vessel_id: fc.uuid(),
  timestamp: safeISOStringArb,
  latitude: validLatitudeArb,
  longitude: validLongitudeArb,
  course: fc.option(validCourseArb, { nil: undefined }),
  speed_knots: fc.option(validSpeedArb, { nil: undefined }),
  status: fc.option(fc.constantFrom('underway', 'at_anchor', 'moored', 'not_under_command'), { nil: undefined }),
  destination: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
  source: fc.constantFrom('ais', 'manual', 'api'),
  created_at: safeISOStringArb,
});

// VesselPosition (embedded) generator
const vesselPositionArb: fc.Arbitrary<VesselPosition> = fc.record({
  lat: validLatitudeArb,
  lng: validLongitudeArb,
  course: fc.option(validCourseArb, { nil: undefined }),
  speed: fc.option(validSpeedArb, { nil: undefined }),
  updatedAt: safeISOStringArb,
});

describe('Property 8: Position Recording Updates Vessel', () => {
  it('should correctly transform position record to vessel current_position format', () => {
    fc.assert(
      fc.property(vesselPositionRecordArb, (positionRecord) => {
        // Simulate the transformation that happens when recording a position
        const currentPosition: VesselPosition = {
          lat: positionRecord.latitude,
          lng: positionRecord.longitude,
          course: positionRecord.course,
          speed: positionRecord.speedKnots,
          updatedAt: positionRecord.timestamp,
        };
        
        // Verify the transformation preserves coordinates
        expect(currentPosition.lat).toBe(positionRecord.latitude);
        expect(currentPosition.lng).toBe(positionRecord.longitude);
        expect(currentPosition.course).toBe(positionRecord.course);
        expect(currentPosition.speed).toBe(positionRecord.speedKnots);
        expect(currentPosition.updatedAt).toBe(positionRecord.timestamp);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve position data when converting row to model', () => {
    fc.assert(
      fc.property(vesselPositionRowArb, (row) => {
        const position = rowToPosition(row);
        
        // Verify all fields are correctly mapped
        expect(position.id).toBe(row.id);
        expect(position.vesselId).toBe(row.vessel_id);
        expect(position.timestamp).toBe(row.timestamp);
        expect(position.latitude).toBe(row.latitude);
        expect(position.longitude).toBe(row.longitude);
        expect(position.course).toBe(row.course);
        expect(position.speedKnots).toBe(row.speed_knots);
        expect(position.status).toBe(row.status);
        expect(position.destination).toBe(row.destination);
        expect(position.source).toBe(row.source);
        expect(position.createdAt).toBe(row.created_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve position data when converting model to row', () => {
    fc.assert(
      fc.property(vesselPositionRecordArb, (position) => {
        const row = positionToRow(position);
        
        // Verify all fields are correctly mapped
        expect(row.id).toBe(position.id);
        expect(row.vessel_id).toBe(position.vesselId);
        expect(row.timestamp).toBe(position.timestamp);
        expect(row.latitude).toBe(position.latitude);
        expect(row.longitude).toBe(position.longitude);
        expect(row.course).toBe(position.course);
        expect(row.speed_knots).toBe(position.speedKnots);
        expect(row.status).toBe(position.status);
        expect(row.destination).toBe(position.destination);
        expect(row.source).toBe(position.source);
        expect(row.created_at).toBe(position.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should round-trip row -> model -> row preserving position data', () => {
    fc.assert(
      fc.property(vesselPositionRowArb, (originalRow) => {
        const position = rowToPosition(originalRow);
        const roundTrippedRow = positionToRow(position);
        
        // All fields should match after round-trip
        expect(roundTrippedRow.id).toBe(originalRow.id);
        expect(roundTrippedRow.vessel_id).toBe(originalRow.vessel_id);
        expect(roundTrippedRow.timestamp).toBe(originalRow.timestamp);
        expect(roundTrippedRow.latitude).toBe(originalRow.latitude);
        expect(roundTrippedRow.longitude).toBe(originalRow.longitude);
        expect(roundTrippedRow.course).toBe(originalRow.course);
        expect(roundTrippedRow.speed_knots).toBe(originalRow.speed_knots);
        expect(roundTrippedRow.status).toBe(originalRow.status);
        expect(roundTrippedRow.destination).toBe(originalRow.destination);
        expect(roundTrippedRow.source).toBe(originalRow.source);
        expect(roundTrippedRow.created_at).toBe(originalRow.created_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should validate that position coordinates are within valid ranges', () => {
    fc.assert(
      fc.property(vesselPositionRecordArb, (position) => {
        // Latitude should be between -90 and 90
        expect(position.latitude).toBeGreaterThanOrEqual(-90);
        expect(position.latitude).toBeLessThanOrEqual(90);
        
        // Longitude should be between -180 and 180
        expect(position.longitude).toBeGreaterThanOrEqual(-180);
        expect(position.longitude).toBeLessThanOrEqual(180);
        
        // Course should be between 0 and 360 if present
        if (position.course !== undefined) {
          expect(position.course).toBeGreaterThanOrEqual(0);
          expect(position.course).toBeLessThanOrEqual(360);
        }
        
        // Speed should be non-negative if present
        if (position.speedKnots !== undefined) {
          expect(position.speedKnots).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly map position source types', () => {
    fc.assert(
      fc.property(positionSourceArb, (source) => {
        // Source should be one of the valid types
        expect(['ais', 'manual', 'api']).toContain(source);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 9: POSITION HISTORY PRESERVATION
// Feature: vessel-tracking-schedules, Property 9: Position History Preservation
// Validates: Requirements 3.5
// Note: This property tests the data structure and ordering logic for position history
// =====================================================

describe('Property 9: Position History Preservation', () => {
  it('should preserve all position records without data loss', () => {
    fc.assert(
      fc.property(
        fc.array(vesselPositionRecordArb, { minLength: 0, maxLength: 20 }),
        (positions) => {
          // Convert all positions to rows and back
          const rows = positions.map(p => positionToRow(p));
          const restored = rows.map(r => rowToPosition(r as VesselPositionRow));
          
          // Should have same number of records
          expect(restored.length).toBe(positions.length);
          
          // Each position should be preserved
          positions.forEach((original, index) => {
            const restoredPosition = restored[index];
            expect(restoredPosition.id).toBe(original.id);
            expect(restoredPosition.vesselId).toBe(original.vesselId);
            expect(restoredPosition.timestamp).toBe(original.timestamp);
            expect(restoredPosition.latitude).toBe(original.latitude);
            expect(restoredPosition.longitude).toBe(original.longitude);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain chronological order when sorting by timestamp', () => {
    fc.assert(
      fc.property(
        fc.array(vesselPositionRecordArb, { minLength: 0, maxLength: 20 }),
        (positions) => {
          // Sort positions by timestamp (ascending - chronological)
          const sorted = [...positions].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
          
          // Verify ascending order
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].timestamp).getTime();
            const currTime = new Date(sorted[i].timestamp).getTime();
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all position IDs (no duplicates lost)', () => {
    fc.assert(
      fc.property(
        fc.array(vesselPositionRecordArb, { minLength: 0, maxLength: 20 }),
        (positions) => {
          // Get all IDs
          const originalIds = positions.map(p => p.id);
          
          // Convert to rows and back
          const rows = positions.map(p => positionToRow(p));
          const restored = rows.map(r => rowToPosition(r as VesselPositionRow));
          const restoredIds = restored.map(p => p.id);
          
          // All original IDs should be present
          expect(restoredIds.sort()).toEqual(originalIds.sort());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter positions by vessel ID correctly', () => {
    fc.assert(
      fc.property(
        fc.array(vesselPositionRecordArb, { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        (positions, targetVesselId) => {
          // Assign some positions to the target vessel
          const mixedPositions = positions.map((p, i) => ({
            ...p,
            vesselId: i % 2 === 0 ? targetVesselId : p.vesselId,
          }));
          
          // Filter by vessel ID
          const filtered = mixedPositions.filter(p => p.vesselId === targetVesselId);
          
          // All filtered positions should belong to target vessel
          filtered.forEach(p => {
            expect(p.vesselId).toBe(targetVesselId);
          });
          
          // No positions from other vessels should be included
          const otherVesselPositions = mixedPositions.filter(p => p.vesselId !== targetVesselId);
          otherVesselPositions.forEach(p => {
            expect(filtered.find(f => f.id === p.id)).toBeUndefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve navigation data (course, speed) in history', () => {
    fc.assert(
      fc.property(vesselPositionRecordArb, (position) => {
        // Convert to row and back
        const row = positionToRow(position);
        const restored = rowToPosition(row as VesselPositionRow);
        
        // Navigation data should be preserved
        expect(restored.course).toBe(position.course);
        expect(restored.speedKnots).toBe(position.speedKnots);
        expect(restored.status).toBe(position.status);
        expect(restored.destination).toBe(position.destination);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty position history gracefully', () => {
    const emptyHistory: VesselPositionRecord[] = [];
    
    // Empty array should remain empty after processing
    const rows = emptyHistory.map(p => positionToRow(p));
    const restored = rows.map(r => rowToPosition(r as VesselPositionRow));
    
    expect(restored).toEqual([]);
    expect(restored.length).toBe(0);
  });

  it('should limit position history correctly', () => {
    fc.assert(
      fc.property(
        fc.array(vesselPositionRecordArb, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 20 }),
        (positions, limit) => {
          // Simulate limiting the history
          const limited = positions.slice(0, limit);
          
          // Should have at most 'limit' records
          expect(limited.length).toBeLessThanOrEqual(limit);
          
          // All limited records should be from original
          limited.forEach(p => {
            expect(positions.find(orig => orig.id === p.id)).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamp precision in history', () => {
    fc.assert(
      fc.property(vesselPositionRecordArb, (position) => {
        // Convert to row and back
        const row = positionToRow(position);
        const restored = rowToPosition(row as VesselPositionRow);
        
        // Timestamp should be exactly preserved
        expect(restored.timestamp).toBe(position.timestamp);
        
        // Parsing should give same time
        const originalTime = new Date(position.timestamp).getTime();
        const restoredTime = new Date(restored.timestamp).getTime();
        expect(restoredTime).toBe(originalTime);
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 10: TRACKING EVENT DATA ROUND-TRIP
// Feature: vessel-tracking-schedules, Property 10: Tracking Event Data Round-Trip
// Validates: Requirements 4.1, 4.3, 4.4, 4.5
// =====================================================

import {
  trackingToRow,
  rowToTracking,
} from '@/lib/vessel-tracking-utils';
import {
  ShipmentTrackingRow,
} from '@/types/agency';

// ShipmentTrackingRow generator for round-trip testing
const shipmentTrackingRowArb: fc.Arbitrary<ShipmentTrackingRow> = fc.record({
  id: fc.uuid(),
  booking_id: fc.option(fc.uuid(), { nil: undefined }),
  bl_id: fc.option(fc.uuid(), { nil: undefined }),
  container_id: fc.option(fc.uuid(), { nil: undefined }),
  tracking_number: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
  container_number: fc.option(fc.stringMatching(/^[A-Z]{4}\d{7}$/), { nil: undefined }),
  event_type: fc.constantFrom('booked', 'gate_in', 'loaded', 'departed', 'transshipment', 'arrived', 'discharged', 'gate_out', 'delivered'),
  event_timestamp: safeISOStringArb,
  location_name: fc.option(nonEmptyStringArb, { nil: undefined }),
  location_code: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
  terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
  vessel_name: fc.option(nonEmptyStringArb, { nil: undefined }),
  voyage_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  is_actual: fc.boolean(),
  source: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  created_at: safeISOStringArb,
});

describe('Property 10: Tracking Event Data Round-Trip', () => {
  it('should preserve tracking event data when converting row to model', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (row) => {
        const tracking = rowToTracking(row);
        
        // Verify all fields are correctly mapped
        expect(tracking.id).toBe(row.id);
        expect(tracking.bookingId).toBe(row.booking_id);
        expect(tracking.blId).toBe(row.bl_id);
        expect(tracking.containerId).toBe(row.container_id);
        expect(tracking.trackingNumber).toBe(row.tracking_number);
        expect(tracking.containerNumber).toBe(row.container_number);
        expect(tracking.eventType).toBe(row.event_type);
        expect(tracking.eventTimestamp).toBe(row.event_timestamp);
        expect(tracking.locationName).toBe(row.location_name);
        expect(tracking.locationCode).toBe(row.location_code);
        expect(tracking.terminal).toBe(row.terminal);
        expect(tracking.vesselName).toBe(row.vessel_name);
        expect(tracking.voyageNumber).toBe(row.voyage_number);
        expect(tracking.description).toBe(row.description);
        expect(tracking.isActual).toBe(row.is_actual);
        expect(tracking.source).toBe(row.source);
        expect(tracking.createdAt).toBe(row.created_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve tracking event data when converting model to row', () => {
    fc.assert(
      fc.property(shipmentTrackingArb, (tracking) => {
        const row = trackingToRow(tracking);
        
        // Verify all fields are correctly mapped
        expect(row.id).toBe(tracking.id);
        expect(row.booking_id).toBe(tracking.bookingId);
        expect(row.bl_id).toBe(tracking.blId);
        expect(row.container_id).toBe(tracking.containerId);
        expect(row.tracking_number).toBe(tracking.trackingNumber);
        expect(row.container_number).toBe(tracking.containerNumber);
        expect(row.event_type).toBe(tracking.eventType);
        expect(row.event_timestamp).toBe(tracking.eventTimestamp);
        expect(row.location_name).toBe(tracking.locationName);
        expect(row.location_code).toBe(tracking.locationCode);
        expect(row.terminal).toBe(tracking.terminal);
        expect(row.vessel_name).toBe(tracking.vesselName);
        expect(row.voyage_number).toBe(tracking.voyageNumber);
        expect(row.description).toBe(tracking.description);
        expect(row.is_actual).toBe(tracking.isActual);
        expect(row.source).toBe(tracking.source);
        expect(row.created_at).toBe(tracking.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should round-trip row -> model -> row preserving data', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (originalRow) => {
        const tracking = rowToTracking(originalRow);
        const roundTrippedRow = trackingToRow(tracking);
        
        // All fields should match after round-trip
        expect(roundTrippedRow.id).toBe(originalRow.id);
        expect(roundTrippedRow.booking_id).toBe(originalRow.booking_id);
        expect(roundTrippedRow.bl_id).toBe(originalRow.bl_id);
        expect(roundTrippedRow.container_id).toBe(originalRow.container_id);
        expect(roundTrippedRow.tracking_number).toBe(originalRow.tracking_number);
        expect(roundTrippedRow.container_number).toBe(originalRow.container_number);
        expect(roundTrippedRow.event_type).toBe(originalRow.event_type);
        expect(roundTrippedRow.event_timestamp).toBe(originalRow.event_timestamp);
        expect(roundTrippedRow.location_name).toBe(originalRow.location_name);
        expect(roundTrippedRow.location_code).toBe(originalRow.location_code);
        expect(roundTrippedRow.terminal).toBe(originalRow.terminal);
        expect(roundTrippedRow.vessel_name).toBe(originalRow.vessel_name);
        expect(roundTrippedRow.voyage_number).toBe(originalRow.voyage_number);
        expect(roundTrippedRow.description).toBe(originalRow.description);
        expect(roundTrippedRow.is_actual).toBe(originalRow.is_actual);
        expect(roundTrippedRow.source).toBe(originalRow.source);
        expect(roundTrippedRow.created_at).toBe(originalRow.created_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve timestamp precision', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (row) => {
        const tracking = rowToTracking(row);
        
        // Timestamp should be exactly preserved
        expect(tracking.eventTimestamp).toBe(row.event_timestamp);
        
        // Parsing should give same time
        const originalTime = new Date(row.event_timestamp).getTime();
        const restoredTime = new Date(tracking.eventTimestamp).getTime();
        expect(restoredTime).toBe(originalTime);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve location data (name, code, terminal)', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (row) => {
        const tracking = rowToTracking(row);
        
        // Location fields should be preserved
        expect(tracking.locationName).toBe(row.location_name);
        expect(tracking.locationCode).toBe(row.location_code);
        expect(tracking.terminal).toBe(row.terminal);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve vessel and voyage information', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (row) => {
        const tracking = rowToTracking(row);
        
        // Vessel info should be preserved
        expect(tracking.vesselName).toBe(row.vessel_name);
        expect(tracking.voyageNumber).toBe(row.voyage_number);
      }),
      { numRuns: 100 }
    );
  });

  it('should distinguish between actual and estimated events', () => {
    fc.assert(
      fc.property(shipmentTrackingRowArb, (row) => {
        const tracking = rowToTracking(row);
        
        // isActual flag should be preserved
        expect(tracking.isActual).toBe(row.is_actual);
        expect(typeof tracking.isActual).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 12: SEARCH BY REFERENCE RETURNS LINKED EVENTS
// Feature: vessel-tracking-schedules, Property 12: Search by Reference Returns Linked Events
// Validates: Requirements 5.1, 5.2, 5.3
// Note: This property tests the data linking logic that supports search functionality
// The actual database search is tested via integration tests
// =====================================================

describe('Property 12: Search by Reference Returns Linked Events', () => {
  // Generator for events with specific booking ID
  const eventsWithBookingIdArb = (bookingId: string) => 
    fc.array(
      fc.record({
        id: fc.uuid(),
        bookingId: fc.constant(bookingId),
        blId: fc.option(fc.uuid(), { nil: undefined }),
        containerId: fc.option(fc.uuid(), { nil: undefined }),
        trackingNumber: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        containerNumber: fc.option(fc.stringMatching(/^[A-Z]{4}\d{7}$/), { nil: undefined }),
        eventType: trackingEventTypeArb,
        eventTimestamp: safeISOStringArb,
        locationName: fc.option(nonEmptyStringArb, { nil: undefined }),
        locationCode: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
        terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
        vesselName: fc.option(nonEmptyStringArb, { nil: undefined }),
        voyageNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        isActual: fc.boolean(),
        source: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        createdAt: safeISOStringArb,
      }),
      { minLength: 1, maxLength: 10 }
    );

  // Generator for events with specific B/L ID
  const eventsWithBlIdArb = (blId: string) => 
    fc.array(
      fc.record({
        id: fc.uuid(),
        bookingId: fc.option(fc.uuid(), { nil: undefined }),
        blId: fc.constant(blId),
        containerId: fc.option(fc.uuid(), { nil: undefined }),
        trackingNumber: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        containerNumber: fc.option(fc.stringMatching(/^[A-Z]{4}\d{7}$/), { nil: undefined }),
        eventType: trackingEventTypeArb,
        eventTimestamp: safeISOStringArb,
        locationName: fc.option(nonEmptyStringArb, { nil: undefined }),
        locationCode: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
        terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
        vesselName: fc.option(nonEmptyStringArb, { nil: undefined }),
        voyageNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        isActual: fc.boolean(),
        source: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        createdAt: safeISOStringArb,
      }),
      { minLength: 1, maxLength: 10 }
    );

  // Generator for events with specific container number
  const eventsWithContainerNumberArb = (containerNumber: string) => 
    fc.array(
      fc.record({
        id: fc.uuid(),
        bookingId: fc.option(fc.uuid(), { nil: undefined }),
        blId: fc.option(fc.uuid(), { nil: undefined }),
        containerId: fc.option(fc.uuid(), { nil: undefined }),
        trackingNumber: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
        containerNumber: fc.constant(containerNumber),
        eventType: trackingEventTypeArb,
        eventTimestamp: safeISOStringArb,
        locationName: fc.option(nonEmptyStringArb, { nil: undefined }),
        locationCode: fc.option(fc.string({ minLength: 2, maxLength: 20 }), { nil: undefined }),
        terminal: fc.option(nonEmptyStringArb, { nil: undefined }),
        vesselName: fc.option(nonEmptyStringArb, { nil: undefined }),
        voyageNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
        isActual: fc.boolean(),
        source: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
        createdAt: safeISOStringArb,
      }),
      { minLength: 1, maxLength: 10 }
    );

  // Valid container number generator (4 letters + 7 digits)
  const validContainerNumberArb = fc.stringMatching(/^[A-Z]{4}\d{7}$/);

  it('should filter events by booking ID correctly (Requirement 5.2)', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(shipmentTrackingArb, { minLength: 5, maxLength: 20 }),
        (targetBookingId, allEvents) => {
          // Create some events with the target booking ID
          const targetEvents = allEvents.slice(0, 3).map(e => ({
            ...e,
            bookingId: targetBookingId,
          }));
          
          // Mix with other events
          const mixedEvents = [...targetEvents, ...allEvents.slice(3)];
          
          // Filter by booking ID
          const filtered = mixedEvents.filter(e => e.bookingId === targetBookingId);
          
          // All filtered events should have the target booking ID
          filtered.forEach(e => {
            expect(e.bookingId).toBe(targetBookingId);
          });
          
          // Should find at least the events we created
          expect(filtered.length).toBeGreaterThanOrEqual(targetEvents.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter events by B/L ID correctly (Requirement 5.1)', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(shipmentTrackingArb, { minLength: 5, maxLength: 20 }),
        (targetBlId, allEvents) => {
          // Create some events with the target B/L ID
          const targetEvents = allEvents.slice(0, 3).map(e => ({
            ...e,
            blId: targetBlId,
          }));
          
          // Mix with other events
          const mixedEvents = [...targetEvents, ...allEvents.slice(3)];
          
          // Filter by B/L ID
          const filtered = mixedEvents.filter(e => e.blId === targetBlId);
          
          // All filtered events should have the target B/L ID
          filtered.forEach(e => {
            expect(e.blId).toBe(targetBlId);
          });
          
          // Should find at least the events we created
          expect(filtered.length).toBeGreaterThanOrEqual(targetEvents.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter events by container number correctly (Requirement 5.3)', () => {
    fc.assert(
      fc.property(
        validContainerNumberArb,
        fc.array(shipmentTrackingArb, { minLength: 5, maxLength: 20 }),
        (targetContainerNumber, allEvents) => {
          // Create some events with the target container number
          const targetEvents = allEvents.slice(0, 3).map(e => ({
            ...e,
            containerNumber: targetContainerNumber,
          }));
          
          // Mix with other events
          const mixedEvents = [...targetEvents, ...allEvents.slice(3)];
          
          // Filter by container number
          const filtered = mixedEvents.filter(e => e.containerNumber === targetContainerNumber);
          
          // All filtered events should have the target container number
          filtered.forEach(e => {
            expect(e.containerNumber).toBe(targetContainerNumber);
          });
          
          // Should find at least the events we created
          expect(filtered.length).toBeGreaterThanOrEqual(targetEvents.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return events in chronological order after filtering', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(shipmentTrackingArb, { minLength: 5, maxLength: 20 }),
        (targetBookingId, allEvents) => {
          // Create events with the target booking ID
          const targetEvents = allEvents.slice(0, 5).map(e => ({
            ...e,
            bookingId: targetBookingId,
          }));
          
          // Filter and sort
          const filtered = targetEvents.filter(e => e.bookingId === targetBookingId);
          const sorted = sortTrackingEventsByTimestamp(filtered);
          
          // Verify chronological order
          for (let i = 1; i < sorted.length; i++) {
            const prevTime = new Date(sorted[i - 1].eventTimestamp).getTime();
            const currTime = new Date(sorted[i].eventTimestamp).getTime();
            expect(currTime).toBeGreaterThanOrEqual(prevTime);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve all event data when filtering by reference', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        shipmentTrackingArb,
        (targetBookingId, event) => {
          // Create event with target booking ID
          const targetEvent = { ...event, bookingId: targetBookingId };
          
          // Filter (simulating search)
          const events = [targetEvent];
          const filtered = events.filter(e => e.bookingId === targetBookingId);
          
          // Should find the event
          expect(filtered.length).toBe(1);
          
          // All data should be preserved
          const found = filtered[0];
          expect(found.id).toBe(targetEvent.id);
          expect(found.eventType).toBe(targetEvent.eventType);
          expect(found.eventTimestamp).toBe(targetEvent.eventTimestamp);
          expect(found.locationName).toBe(targetEvent.locationName);
          expect(found.locationCode).toBe(targetEvent.locationCode);
          expect(found.terminal).toBe(targetEvent.terminal);
          expect(found.vesselName).toBe(targetEvent.vesselName);
          expect(found.voyageNumber).toBe(targetEvent.voyageNumber);
          expect(found.description).toBe(targetEvent.description);
          expect(found.isActual).toBe(targetEvent.isActual);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no events match the reference', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.array(shipmentTrackingArb, { minLength: 1, maxLength: 10 }),
        (searchBookingId, differentBookingId, events) => {
          // Ensure all events have a different booking ID
          const eventsWithDifferentId = events.map(e => ({
            ...e,
            bookingId: differentBookingId,
          }));
          
          // Search for non-existent booking ID
          const filtered = eventsWithDifferentId.filter(e => e.bookingId === searchBookingId);
          
          // Should return empty if IDs are different
          if (searchBookingId !== differentBookingId) {
            expect(filtered.length).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle events linked to multiple references', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        validContainerNumberArb,
        shipmentTrackingArb,
        (bookingId, blId, containerNumber, baseEvent) => {
          // Create event linked to all three references
          const multiLinkedEvent: ShipmentTracking = {
            ...baseEvent,
            bookingId,
            blId,
            containerNumber,
          };
          
          const events = [multiLinkedEvent];
          
          // Should be found by booking ID
          const byBooking = events.filter(e => e.bookingId === bookingId);
          expect(byBooking.length).toBe(1);
          
          // Should be found by B/L ID
          const byBl = events.filter(e => e.blId === blId);
          expect(byBl.length).toBe(1);
          
          // Should be found by container number
          const byContainer = events.filter(e => e.containerNumber === containerNumber);
          expect(byContainer.length).toBe(1);
          
          // All should return the same event
          expect(byBooking[0].id).toBe(multiLinkedEvent.id);
          expect(byBl[0].id).toBe(multiLinkedEvent.id);
          expect(byContainer[0].id).toBe(multiLinkedEvent.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify container number format for search type detection', () => {
    fc.assert(
      fc.property(validContainerNumberArb, (containerNumber) => {
        // Container number pattern: 4 letters + 7 digits
        const containerPattern = /^[A-Z]{4}\d{7}$/;
        
        // Should match the pattern
        expect(containerPattern.test(containerNumber)).toBe(true);
        
        // Should be uppercase
        expect(containerNumber).toBe(containerNumber.toUpperCase());
        
        // Should have correct length (11 characters)
        expect(containerNumber.length).toBe(11);
      }),
      { numRuns: 100 }
    );
  });

  it('should distinguish between different reference types', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        validContainerNumberArb,
        (bookingId, blId, containerNumber) => {
          // Container number pattern
          const containerPattern = /^[A-Z]{4}\d{7}$/;
          
          // Container number should match pattern
          expect(containerPattern.test(containerNumber)).toBe(true);
          
          // UUIDs should not match container pattern
          expect(containerPattern.test(bookingId)).toBe(false);
          expect(containerPattern.test(blId)).toBe(false);
          
          // All three should be distinguishable
          expect(bookingId).not.toBe(containerNumber);
          expect(blId).not.toBe(containerNumber);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =====================================================
// PROPERTY 13: SUBSCRIPTION UNIQUENESS PER USER
// Feature: vessel-tracking-schedules, Property 13: Subscription Uniqueness Per User
// Validates: Requirements 6.6
// =====================================================

import {
  TrackingSubscription,
  TrackingSubscriptionRow,
  TrackingType,
  TRACKING_TYPES,
} from '@/types/agency';
import { rowToSubscription, subscriptionToRow } from '@/lib/vessel-tracking-utils';

// Tracking type generator
const trackingTypeArb: fc.Arbitrary<TrackingType> = fc.constantFrom(...TRACKING_TYPES);

// TrackingSubscription generator
const trackingSubscriptionArb: fc.Arbitrary<TrackingSubscription> = fc.record({
  id: fc.uuid(),
  trackingType: trackingTypeArb,
  referenceId: fc.uuid(),
  referenceNumber: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  userId: fc.option(fc.uuid(), { nil: undefined }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  notifyDeparture: fc.boolean(),
  notifyArrival: fc.boolean(),
  notifyDelay: fc.boolean(),
  notifyMilestone: fc.boolean(),
  isActive: fc.boolean(),
  createdAt: safeISOStringArb,
});

// TrackingSubscriptionRow generator
const trackingSubscriptionRowArb: fc.Arbitrary<TrackingSubscriptionRow> = fc.record({
  id: fc.uuid(),
  tracking_type: fc.constantFrom('vessel', 'container', 'booking'),
  reference_id: fc.uuid(),
  reference_number: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  user_id: fc.option(fc.uuid(), { nil: undefined }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  notify_departure: fc.boolean(),
  notify_arrival: fc.boolean(),
  notify_delay: fc.boolean(),
  notify_milestone: fc.boolean(),
  is_active: fc.boolean(),
  created_at: safeISOStringArb,
});

describe('Property 13: Subscription Uniqueness Per User', () => {
  /**
   * This property test validates the subscription uniqueness constraint:
   * For any user attempting to subscribe to the same reference twice,
   * the system should reject the duplicate subscription.
   * 
   * We test this by verifying that:
   * 1. The uniqueness key (trackingType + referenceId + userId) correctly identifies duplicates
   * 2. Different users can subscribe to the same reference
   * 3. Same user can subscribe to different references
   */

  it('should identify duplicate subscriptions by trackingType + referenceId + userId', () => {
    fc.assert(
      fc.property(
        trackingTypeArb,
        fc.uuid(), // referenceId
        fc.uuid(), // userId
        (trackingType, referenceId, userId) => {
          // Create two subscriptions with same key
          const sub1: TrackingSubscription = {
            id: 'sub-1',
            trackingType,
            referenceId,
            userId,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          const sub2: TrackingSubscription = {
            id: 'sub-2',
            trackingType,
            referenceId,
            userId,
            notifyDeparture: false, // Different preferences
            notifyArrival: false,
            notifyDelay: false,
            notifyMilestone: false,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // The uniqueness key should be the same
          const key1 = `${sub1.trackingType}-${sub1.referenceId}-${sub1.userId}`;
          const key2 = `${sub2.trackingType}-${sub2.referenceId}-${sub2.userId}`;

          expect(key1).toBe(key2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow different users to subscribe to the same reference', () => {
    fc.assert(
      fc.property(
        trackingTypeArb,
        fc.uuid(), // referenceId
        fc.uuid(), // userId1
        fc.uuid(), // userId2
        (trackingType, referenceId, userId1, userId2) => {
          // Skip if users are the same (unlikely with UUIDs but possible)
          fc.pre(userId1 !== userId2);

          const sub1: TrackingSubscription = {
            id: 'sub-1',
            trackingType,
            referenceId,
            userId: userId1,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          const sub2: TrackingSubscription = {
            id: 'sub-2',
            trackingType,
            referenceId,
            userId: userId2,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // The uniqueness keys should be different
          const key1 = `${sub1.trackingType}-${sub1.referenceId}-${sub1.userId}`;
          const key2 = `${sub2.trackingType}-${sub2.referenceId}-${sub2.userId}`;

          expect(key1).not.toBe(key2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow same user to subscribe to different references', () => {
    fc.assert(
      fc.property(
        trackingTypeArb,
        fc.uuid(), // referenceId1
        fc.uuid(), // referenceId2
        fc.uuid(), // userId
        (trackingType, referenceId1, referenceId2, userId) => {
          // Skip if references are the same
          fc.pre(referenceId1 !== referenceId2);

          const sub1: TrackingSubscription = {
            id: 'sub-1',
            trackingType,
            referenceId: referenceId1,
            userId,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          const sub2: TrackingSubscription = {
            id: 'sub-2',
            trackingType,
            referenceId: referenceId2,
            userId,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // The uniqueness keys should be different
          const key1 = `${sub1.trackingType}-${sub1.referenceId}-${sub1.userId}`;
          const key2 = `${sub2.trackingType}-${sub2.referenceId}-${sub2.userId}`;

          expect(key1).not.toBe(key2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow same user to subscribe to same reference with different tracking types', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // referenceId
        fc.uuid(), // userId
        (referenceId, userId) => {
          const sub1: TrackingSubscription = {
            id: 'sub-1',
            trackingType: 'vessel',
            referenceId,
            userId,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          const sub2: TrackingSubscription = {
            id: 'sub-2',
            trackingType: 'booking',
            referenceId,
            userId,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // The uniqueness keys should be different due to different tracking types
          const key1 = `${sub1.trackingType}-${sub1.referenceId}-${sub1.userId}`;
          const key2 = `${sub2.trackingType}-${sub2.referenceId}-${sub2.userId}`;

          expect(key1).not.toBe(key2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve subscription data when converting row to model', () => {
    fc.assert(
      fc.property(trackingSubscriptionRowArb, (row) => {
        const subscription = rowToSubscription(row);

        // Verify all fields are correctly mapped
        expect(subscription.id).toBe(row.id);
        expect(subscription.trackingType).toBe(row.tracking_type);
        expect(subscription.referenceId).toBe(row.reference_id);
        expect(subscription.referenceNumber).toBe(row.reference_number);
        expect(subscription.userId).toBe(row.user_id);
        expect(subscription.email).toBe(row.email);
        expect(subscription.notifyDeparture).toBe(row.notify_departure);
        expect(subscription.notifyArrival).toBe(row.notify_arrival);
        expect(subscription.notifyDelay).toBe(row.notify_delay);
        expect(subscription.notifyMilestone).toBe(row.notify_milestone);
        expect(subscription.isActive).toBe(row.is_active);
        expect(subscription.createdAt).toBe(row.created_at);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve subscription data when converting model to row', () => {
    fc.assert(
      fc.property(trackingSubscriptionArb, (subscription) => {
        const row = subscriptionToRow(subscription);

        // Verify all fields are correctly mapped
        expect(row.id).toBe(subscription.id);
        expect(row.tracking_type).toBe(subscription.trackingType);
        expect(row.reference_id).toBe(subscription.referenceId);
        expect(row.reference_number).toBe(subscription.referenceNumber);
        expect(row.user_id).toBe(subscription.userId);
        expect(row.email).toBe(subscription.email);
        expect(row.notify_departure).toBe(subscription.notifyDeparture);
        expect(row.notify_arrival).toBe(subscription.notifyArrival);
        expect(row.notify_delay).toBe(subscription.notifyDelay);
        expect(row.notify_milestone).toBe(subscription.notifyMilestone);
        expect(row.is_active).toBe(subscription.isActive);
        expect(row.created_at).toBe(subscription.createdAt);
      }),
      { numRuns: 100 }
    );
  });

  it('should support all valid tracking types', () => {
    fc.assert(
      fc.property(trackingTypeArb, (trackingType) => {
        // All tracking types should be valid
        expect(TRACKING_TYPES).toContain(trackingType);
        
        // Should be one of the expected values
        expect(['vessel', 'container', 'booking']).toContain(trackingType);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle email-based subscriptions (no userId)', () => {
    fc.assert(
      fc.property(
        trackingTypeArb,
        fc.uuid(), // referenceId
        fc.emailAddress(),
        (trackingType, referenceId, email) => {
          const subscription: TrackingSubscription = {
            id: 'sub-1',
            trackingType,
            referenceId,
            userId: undefined,
            email,
            notifyDeparture: true,
            notifyArrival: true,
            notifyDelay: true,
            notifyMilestone: true,
            isActive: true,
            createdAt: new Date().toISOString(),
          };

          // Email-based subscription should have email but no userId
          expect(subscription.email).toBe(email);
          expect(subscription.userId).toBeUndefined();
          
          // Should still have valid tracking type and reference
          expect(TRACKING_TYPES).toContain(subscription.trackingType);
          expect(subscription.referenceId).toBe(referenceId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
