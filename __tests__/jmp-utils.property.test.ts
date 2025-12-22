/**
 * Property-based tests for JMP utilities
 * Feature: journey-management-plan
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateRiskLevel,
  isPermitValid,
  getPermitStatus,
  calculateStopDuration,
  sortCheckpointsByDistance,
  validateCheckpointSequence,
  calculateTimeVariance,
  isCheckpointBehindSchedule,
  isValidStatusTransition,
} from '@/lib/jmp-utils';
import {
  Likelihood,
  Consequence,
  RiskLevel,
  JmpPermit,
  JmpCheckpoint,
  JmpStatus,
} from '@/types/jmp';

// Arbitraries
const likelihoodArb = fc.constantFrom<Likelihood>(
  'rare', 'unlikely', 'possible', 'likely', 'almost_certain'
);

const consequenceArb = fc.constantFrom<Consequence>(
  'insignificant', 'minor', 'moderate', 'major', 'catastrophic'
);

const riskLevelArb = fc.constantFrom<RiskLevel>('low', 'medium', 'high', 'extreme');

const jmpStatusArb = fc.constantFrom<JmpStatus>(
  'draft', 'pending_review', 'approved', 'active', 'completed', 'cancelled'
);

const dateStringArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true })
  .map(d => d.toISOString());

const permitArb = fc.record({
  permitType: fc.string({ minLength: 1, maxLength: 50 }),
  permitNumber: fc.string({ minLength: 1, maxLength: 30 }),
  issuingAuthority: fc.string({ minLength: 1, maxLength: 100 }),
  validFrom: dateStringArb,
  validTo: dateStringArb,
}).filter(p => new Date(p.validFrom) <= new Date(p.validTo));

const checkpointArb = fc.record({
  id: fc.uuid(),
  jmpId: fc.uuid(),
  checkpointOrder: fc.integer({ min: 1, max: 100 }),
  locationName: fc.string({ minLength: 1, maxLength: 100 }),
  locationType: fc.constantFrom('departure', 'waypoint', 'rest_stop', 'checkpoint', 'fuel_stop', 'arrival'),
  kmFromStart: fc.option(fc.float({ min: 0, max: 1000, noNaN: true }), { nil: undefined }),
  coordinates: fc.option(fc.string(), { nil: undefined }),
  plannedArrival: fc.option(fc.constant(new Date('2025-06-15T10:00:00Z').toISOString()), { nil: undefined }),
  plannedDeparture: fc.option(fc.constant(new Date('2025-06-15T11:00:00Z').toISOString()), { nil: undefined }),
  stopDurationMinutes: fc.option(fc.integer({ min: 0, max: 480 }), { nil: undefined }),
  actualArrival: fc.option(fc.constant(new Date('2025-06-15T10:30:00Z').toISOString()), { nil: undefined }),
  actualDeparture: fc.option(fc.constant(new Date('2025-06-15T11:30:00Z').toISOString()), { nil: undefined }),
  activities: fc.option(fc.string(), { nil: undefined }),
  reportRequired: fc.boolean(),
  reportTo: fc.option(fc.string(), { nil: undefined }),
  status: fc.constantFrom('pending', 'arrived', 'departed', 'skipped'),
  notes: fc.option(fc.string(), { nil: undefined }),
  createdAt: fc.constant(new Date('2025-01-01T00:00:00Z').toISOString()),
}) as fc.Arbitrary<JmpCheckpoint>;

describe('JMP Utils Property Tests', () => {
  /**
   * Property 8: Risk Level Matrix Calculation
   * For any risk assessment with a given likelihood and consequence,
   * the calculated risk_level SHALL match the standard 5x5 risk matrix
   * Validates: Requirements 8.4
   */
  describe('Property 8: Risk Level Matrix Calculation', () => {
    it('should return a valid risk level for all likelihood/consequence combinations', () => {
      fc.assert(
        fc.property(likelihoodArb, consequenceArb, (likelihood, consequence) => {
          const result = calculateRiskLevel(likelihood, consequence);
          expect(['low', 'medium', 'high', 'extreme']).toContain(result);
        }),
        { numRuns: 100 }
      );
    });

    it('should return extreme for almost_certain + catastrophic', () => {
      expect(calculateRiskLevel('almost_certain', 'catastrophic')).toBe('extreme');
    });

    it('should return low for rare + insignificant', () => {
      expect(calculateRiskLevel('rare', 'insignificant')).toBe('low');
    });

    it('should increase risk level as likelihood increases', () => {
      fc.assert(
        fc.property(consequenceArb, (consequence) => {
          const riskOrder: RiskLevel[] = ['low', 'medium', 'high', 'extreme'];
          const likelihoods: Likelihood[] = ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'];
          
          let prevRiskIndex = -1;
          for (const likelihood of likelihoods) {
            const risk = calculateRiskLevel(likelihood, consequence);
            const riskIndex = riskOrder.indexOf(risk);
            // Risk should not decrease as likelihood increases
            expect(riskIndex).toBeGreaterThanOrEqual(prevRiskIndex);
            prevRiskIndex = riskIndex;
          }
        }),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 9: Permit Validity Determination
   * For any permit and journey date, the permit status SHALL be correctly determined
   * Validates: Requirements 10.2, 10.3
   */
  describe('Property 9: Permit Validity Determination', () => {
    it('should return expired when validTo is before journey date', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 365 }),
          (validTo, daysAfter) => {
            const journeyDate = new Date(validTo);
            journeyDate.setDate(journeyDate.getDate() + daysAfter);
            
            const permit: JmpPermit = {
              permitType: 'test',
              permitNumber: 'TEST-001',
              issuingAuthority: 'Test Authority',
              validFrom: new Date('2020-01-01').toISOString(),
              validTo: validTo.toISOString(),
            };
            
            expect(getPermitStatus(permit, journeyDate.toISOString())).toBe('expired');
            expect(isPermitValid(permit, journeyDate.toISOString())).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid when journey date is within permit validity', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01'), noInvalidDate: true }),
          fc.integer({ min: 30, max: 365 }),
          fc.integer({ min: 10, max: 20 }),
          (validFrom, validityDays, journeyOffset) => {
            const validTo = new Date(validFrom);
            validTo.setDate(validTo.getDate() + validityDays);
            
            const journeyDate = new Date(validFrom);
            journeyDate.setDate(journeyDate.getDate() + journeyOffset);
            
            const permit: JmpPermit = {
              permitType: 'test',
              permitNumber: 'TEST-001',
              issuingAuthority: 'Test Authority',
              validFrom: validFrom.toISOString(),
              validTo: validTo.toISOString(),
            };
            
            expect(isPermitValid(permit, journeyDate.toISOString())).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return expiring_soon when permit expires within 7 days of journey', () => {
      const validFrom = new Date('2025-01-01');
      const validTo = new Date('2025-01-10');
      const journeyDate = new Date('2025-01-05');
      
      const permit: JmpPermit = {
        permitType: 'test',
        permitNumber: 'TEST-001',
        issuingAuthority: 'Test Authority',
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
      };
      
      expect(getPermitStatus(permit, journeyDate.toISOString())).toBe('expiring_soon');
    });
  });

  /**
   * Property 5: Stop Duration Calculation
   * For any checkpoint with both planned_arrival and planned_departure times,
   * the stop_duration_minutes SHALL equal the difference in minutes
   * Validates: Requirements 7.3
   */
  describe('Property 5: Stop Duration Calculation', () => {
    it('should correctly calculate duration between arrival and departure', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 480 }),
          (arrival, durationMinutes) => {
            const departure = new Date(arrival);
            departure.setMinutes(departure.getMinutes() + durationMinutes);
            
            const calculated = calculateStopDuration(
              arrival.toISOString(),
              departure.toISOString()
            );
            
            expect(calculated).toBe(durationMinutes);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for same arrival and departure time', () => {
      const time = new Date('2025-06-15T10:00:00Z').toISOString();
      expect(calculateStopDuration(time, time)).toBe(0);
    });
  });


  /**
   * Property 6: Checkpoint Ordering by Distance
   * For any list of checkpoints returned for a JMP, they SHALL be sorted
   * in ascending order by km_from_start
   * Validates: Requirements 7.6
   */
  describe('Property 6: Checkpoint Ordering by Distance', () => {
    it('should sort checkpoints by km from start in ascending order', () => {
      fc.assert(
        fc.property(
          fc.array(checkpointArb, { minLength: 1, maxLength: 20 }),
          (checkpoints) => {
            const sorted = sortCheckpointsByDistance(checkpoints);
            
            for (let i = 1; i < sorted.length; i++) {
              const prevKm = sorted[i - 1].kmFromStart ?? 0;
              const currKm = sorted[i].kmFromStart ?? 0;
              expect(currKm).toBeGreaterThanOrEqual(prevKm);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify the original array', () => {
      fc.assert(
        fc.property(
          fc.array(checkpointArb, { minLength: 1, maxLength: 10 }),
          (checkpoints) => {
            const original = [...checkpoints];
            sortCheckpointsByDistance(checkpoints);
            expect(checkpoints).toEqual(original);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all checkpoints after sorting', () => {
      fc.assert(
        fc.property(
          fc.array(checkpointArb, { minLength: 1, maxLength: 20 }),
          (checkpoints) => {
            const sorted = sortCheckpointsByDistance(checkpoints);
            expect(sorted.length).toBe(checkpoints.length);
            
            const originalIds = new Set(checkpoints.map(cp => cp.id));
            const sortedIds = new Set(sorted.map(cp => cp.id));
            expect(sortedIds).toEqual(originalIds);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Checkpoint Sequence Validation
   * For any valid JMP checkpoint sequence, there SHALL exist exactly one
   * checkpoint with location_type 'departure' at km_from_start 0, and
   * exactly one checkpoint with location_type 'arrival' at the route end
   * Validates: Requirements 7.7, 7.8
   */
  describe('Property 7: Checkpoint Sequence Validation', () => {
    it('should fail validation when no departure checkpoint exists', () => {
      const checkpoints: JmpCheckpoint[] = [
        {
          id: '1',
          jmpId: 'jmp-1',
          checkpointOrder: 1,
          locationName: 'Waypoint 1',
          locationType: 'waypoint',
          kmFromStart: 10,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          jmpId: 'jmp-1',
          checkpointOrder: 2,
          locationName: 'Arrival',
          locationType: 'arrival',
          kmFromStart: 50,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];
      
      const result = validateCheckpointSequence(checkpoints, 50);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('A departure checkpoint at km 0 is required');
    });

    it('should fail validation when no arrival checkpoint exists', () => {
      const checkpoints: JmpCheckpoint[] = [
        {
          id: '1',
          jmpId: 'jmp-1',
          checkpointOrder: 1,
          locationName: 'Departure',
          locationType: 'departure',
          kmFromStart: 0,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          jmpId: 'jmp-1',
          checkpointOrder: 2,
          locationName: 'Waypoint',
          locationType: 'waypoint',
          kmFromStart: 25,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];
      
      const result = validateCheckpointSequence(checkpoints, 50);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('An arrival checkpoint at the destination is required');
    });

    it('should pass validation with proper departure and arrival checkpoints', () => {
      const checkpoints: JmpCheckpoint[] = [
        {
          id: '1',
          jmpId: 'jmp-1',
          checkpointOrder: 1,
          locationName: 'Departure',
          locationType: 'departure',
          kmFromStart: 0,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          jmpId: 'jmp-1',
          checkpointOrder: 2,
          locationName: 'Arrival',
          locationType: 'arrival',
          kmFromStart: 50,
          reportRequired: false,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];
      
      const result = validateCheckpointSequence(checkpoints, 50);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });


  /**
   * Property 13: Time Variance Calculation
   * For any pair of planned and actual timestamps, the calculated variance
   * SHALL equal (actual - planned) in minutes
   * Validates: Requirements 13.5
   */
  describe('Property 13: Time Variance Calculation', () => {
    it('should calculate positive variance for delays', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 480 }),
          (planned, delayMinutes) => {
            const actual = new Date(planned);
            actual.setMinutes(actual.getMinutes() + delayMinutes);
            
            const variance = calculateTimeVariance(
              planned.toISOString(),
              actual.toISOString()
            );
            
            expect(variance).toBe(delayMinutes);
            expect(variance).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate negative variance for early arrivals', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 480 }),
          (planned, earlyMinutes) => {
            const actual = new Date(planned);
            actual.setMinutes(actual.getMinutes() - earlyMinutes);
            
            const variance = calculateTimeVariance(
              planned.toISOString(),
              actual.toISOString()
            );
            
            expect(variance).toBe(-earlyMinutes);
            expect(variance).toBeLessThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 for on-time arrival', () => {
      const time = new Date('2025-06-15T10:00:00Z').toISOString();
      expect(calculateTimeVariance(time, time)).toBe(0);
    });
  });

  /**
   * Property 14: Schedule Comparison
   * For any checkpoint with both planned_arrival and actual_arrival,
   * the checkpoint SHALL be flagged as behind schedule if actual > planned
   * Validates: Requirements 15.4
   */
  describe('Property 14: Schedule Comparison', () => {
    it('should flag checkpoint as behind schedule when actual is after planned', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31'), noInvalidDate: true }),
          fc.integer({ min: 1, max: 480 }),
          (planned, delayMinutes) => {
            const actual = new Date(planned);
            actual.setMinutes(actual.getMinutes() + delayMinutes);
            
            const checkpoint: JmpCheckpoint = {
              id: '1',
              jmpId: 'jmp-1',
              checkpointOrder: 1,
              locationName: 'Test',
              locationType: 'waypoint',
              plannedArrival: planned.toISOString(),
              actualArrival: actual.toISOString(),
              reportRequired: false,
              status: 'arrived',
              createdAt: new Date().toISOString(),
            };
            
            expect(isCheckpointBehindSchedule(checkpoint)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag checkpoint as behind schedule when actual is before or equal to planned', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31'), noInvalidDate: true }),
          fc.integer({ min: 0, max: 480 }),
          (planned, earlyMinutes) => {
            const actual = new Date(planned);
            actual.setMinutes(actual.getMinutes() - earlyMinutes);
            
            const checkpoint: JmpCheckpoint = {
              id: '1',
              jmpId: 'jmp-1',
              checkpointOrder: 1,
              locationName: 'Test',
              locationType: 'waypoint',
              plannedArrival: planned.toISOString(),
              actualArrival: actual.toISOString(),
              reportRequired: false,
              status: 'arrived',
              createdAt: new Date().toISOString(),
            };
            
            expect(isCheckpointBehindSchedule(checkpoint)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return false when actual arrival is not set', () => {
      const checkpoint: JmpCheckpoint = {
        id: '1',
        jmpId: 'jmp-1',
        checkpointOrder: 1,
        locationName: 'Test',
        locationType: 'waypoint',
        plannedArrival: new Date().toISOString(),
        reportRequired: false,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      expect(isCheckpointBehindSchedule(checkpoint)).toBe(false);
    });
  });

  /**
   * Property 10: Status Transition Validity
   * For any JMP status transition, only valid transitions should be allowed
   * Validates: Requirements 11.1, 11.6, 12.1, 12.5
   */
  describe('Property 10: Status Transition Validity', () => {
    it('should allow valid transitions from draft', () => {
      expect(isValidStatusTransition('draft', 'pending_review')).toBe(true);
      expect(isValidStatusTransition('draft', 'cancelled')).toBe(true);
      expect(isValidStatusTransition('draft', 'approved')).toBe(false);
      expect(isValidStatusTransition('draft', 'active')).toBe(false);
    });

    it('should allow valid transitions from pending_review', () => {
      expect(isValidStatusTransition('pending_review', 'approved')).toBe(true);
      expect(isValidStatusTransition('pending_review', 'draft')).toBe(true);
      expect(isValidStatusTransition('pending_review', 'active')).toBe(false);
    });

    it('should allow valid transitions from approved', () => {
      expect(isValidStatusTransition('approved', 'active')).toBe(true);
      expect(isValidStatusTransition('approved', 'cancelled')).toBe(true);
      expect(isValidStatusTransition('approved', 'draft')).toBe(false);
    });

    it('should allow valid transitions from active', () => {
      expect(isValidStatusTransition('active', 'completed')).toBe(true);
      expect(isValidStatusTransition('active', 'cancelled')).toBe(true);
      expect(isValidStatusTransition('active', 'draft')).toBe(false);
    });

    it('should not allow transitions from completed or cancelled', () => {
      fc.assert(
        fc.property(jmpStatusArb, (targetStatus) => {
          expect(isValidStatusTransition('completed', targetStatus)).toBe(false);
          expect(isValidStatusTransition('cancelled', targetStatus)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
