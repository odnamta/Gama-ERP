/**
 * Property-based tests for survey-utils.ts
 * Feature: route-survey-management
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidSurveyNumber,
  parseSurveyNumber,
  formatSurveyNumber,
  calculateStatusCounts,
  filterSurveys,
  searchSurveys,
  assessWaypointPassability,
  getNextWaypointOrder,
  sortWaypointsByOrder,
  validateSurveyData,
  validateChecklistStatus,
  validateFeasibilityData,
  VERTICAL_CLEARANCE_MARGIN,
  HORIZONTAL_CLEARANCE_MARGIN,
} from '@/lib/survey-utils';
import {
  RouteSurvey,
  RouteWaypoint,
  SurveyStatus,
  TransportDimensions,
  SurveyFilters,
  WaypointType,
} from '@/types/survey';

// Arbitraries for generating test data
const surveyStatusArb = fc.constantFrom<SurveyStatus>(
  'requested',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

const waypointTypeArb = fc.constantFrom<WaypointType>(
  'start',
  'checkpoint',
  'obstacle',
  'bridge',
  'intersection',
  'underpass',
  'overhead',
  'turn',
  'rest_point',
  'destination'
);

const surveyArb = fc.record({
  id: fc.uuid(),
  surveyNumber: fc.integer({ min: 1, max: 9999 }).map((seq) => `RSV-2025-${seq.toString().padStart(4, '0')}`),
  cargoDescription: fc.string({ minLength: 1, maxLength: 200 }),
  originLocation: fc.string({ minLength: 1, maxLength: 200 }),
  destinationLocation: fc.string({ minLength: 1, maxLength: 200 }),
  status: surveyStatusArb,
  surveyorId: fc.option(fc.uuid(), { nil: undefined }),
  escortRequired: fc.boolean(),
  requestedAt: fc.constant(new Date().toISOString()),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
}) as fc.Arbitrary<RouteSurvey>;

const waypointArb = fc.record({
  id: fc.uuid(),
  surveyId: fc.uuid(),
  waypointOrder: fc.integer({ min: 1, max: 100 }),
  waypointType: waypointTypeArb,
  locationName: fc.string({ minLength: 1, maxLength: 200 }),
  isPassable: fc.boolean(),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31'), noInvalidDate: true }).map((d) => d.toISOString()),
  verticalClearanceM: fc.option(fc.integer({ min: 1, max: 20 }).map(n => n * 0.5), { nil: undefined }),
  horizontalClearanceM: fc.option(fc.integer({ min: 1, max: 20 }).map(n => n * 0.5), { nil: undefined }),
  bridgeCapacityTons: fc.option(fc.integer({ min: 10, max: 500 }), { nil: undefined }),
  turnRadiusAvailableM: fc.option(fc.integer({ min: 5, max: 100 }), { nil: undefined }),
}) as fc.Arbitrary<RouteWaypoint>;

const transportDimensionsArb = fc.record({
  height: fc.integer({ min: 2, max: 10 }),
  width: fc.integer({ min: 2, max: 10 }),
  weight: fc.integer({ min: 10, max: 300 }),
  turnRadius: fc.integer({ min: 10, max: 50 }),
}) as fc.Arbitrary<TransportDimensions>;

describe('Survey Utils Property Tests', () => {
  /**
   * Property 1: Survey Number Format Validity
   * For any route survey created, the generated survey number SHALL match
   * the format RSV-YYYY-NNNN where YYYY is the current year and NNNN is
   * a zero-padded sequential number.
   * Validates: Requirements 1.1
   */
  describe('Property 1: Survey Number Format Validity', () => {
    it('should validate correctly formatted survey numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 9999 }),
          (year, sequence) => {
            const surveyNumber = formatSurveyNumber(year, sequence);
            expect(isValidSurveyNumber(surveyNumber)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid survey number formats', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }).filter(
            (s) => !s.match(/^RSV-\d{4}-\d{4}$/)
          ),
          (invalidNumber) => {
            expect(isValidSurveyNumber(invalidNumber)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round-trip format and parse survey numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2030 }),
          fc.integer({ min: 1, max: 9999 }),
          (year, sequence) => {
            const surveyNumber = formatSurveyNumber(year, sequence);
            const parsed = parseSurveyNumber(surveyNumber);
            expect(parsed).not.toBeNull();
            expect(parsed?.year).toBe(year);
            expect(parsed?.sequence).toBe(sequence);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 9: Survey Status Count Accuracy
   * For any list of surveys, the status counts SHALL equal the actual count
   * of surveys in each status category.
   * Validates: Requirements 7.1
   */
  describe('Property 9: Survey Status Count Accuracy', () => {
    it('should accurately count surveys by status', () => {
      fc.assert(
        fc.property(fc.array(surveyArb, { minLength: 0, maxLength: 50 }), (surveys) => {
          const counts = calculateStatusCounts(surveys);

          // Manually count each status
          const expectedRequested = surveys.filter((s) => s.status === 'requested').length;
          const expectedScheduled = surveys.filter((s) => s.status === 'scheduled').length;
          const expectedInProgress = surveys.filter((s) => s.status === 'in_progress').length;
          const expectedCompleted = surveys.filter((s) => s.status === 'completed').length;

          expect(counts.requested).toBe(expectedRequested);
          expect(counts.scheduled).toBe(expectedScheduled);
          expect(counts.in_progress).toBe(expectedInProgress);
          expect(counts.completed).toBe(expectedCompleted);
        }),
        { numRuns: 100 }
      );
    });

    it('should return zero counts for empty survey list', () => {
      const counts = calculateStatusCounts([]);
      expect(counts.requested).toBe(0);
      expect(counts.scheduled).toBe(0);
      expect(counts.in_progress).toBe(0);
      expect(counts.completed).toBe(0);
    });
  });

  /**
   * Property 10: Survey Filtering Correctness
   * For any filter criteria (status, surveyor) applied to a survey list,
   * all returned surveys SHALL match the filter criteria, and no matching
   * surveys SHALL be excluded.
   * Validates: Requirements 7.3, 7.4
   */
  describe('Property 10: Survey Filtering Correctness', () => {
    it('should filter by status correctly', () => {
      fc.assert(
        fc.property(
          fc.array(surveyArb, { minLength: 0, maxLength: 50 }),
          surveyStatusArb,
          (surveys, status) => {
            const filters: SurveyFilters = { status, surveyorId: 'all', search: '' };
            const filtered = filterSurveys(surveys, filters);

            // All filtered surveys should have the specified status
            expect(filtered.every((s) => s.status === status)).toBe(true);

            // Count should match manual filter
            const expectedCount = surveys.filter((s) => s.status === status).length;
            expect(filtered.length).toBe(expectedCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by surveyor correctly', () => {
      fc.assert(
        fc.property(
          fc.array(surveyArb, { minLength: 1, maxLength: 50 }),
          (surveys) => {
            // Pick a surveyor from the surveys
            const surveysWithSurveyor = surveys.filter((s) => s.surveyorId);
            if (surveysWithSurveyor.length === 0) return true;

            const surveyorId = surveysWithSurveyor[0].surveyorId!;
            const filters: SurveyFilters = { status: 'all', surveyorId, search: '' };
            const filtered = filterSurveys(surveys, filters);

            // All filtered surveys should have the specified surveyor
            expect(filtered.every((s) => s.surveyorId === surveyorId)).toBe(true);

            // Count should match manual filter
            const expectedCount = surveys.filter((s) => s.surveyorId === surveyorId).length;
            expect(filtered.length).toBe(expectedCount);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all surveys when filter is "all"', () => {
      fc.assert(
        fc.property(fc.array(surveyArb, { minLength: 0, maxLength: 50 }), (surveys) => {
          const filters: SurveyFilters = { status: 'all', surveyorId: 'all', search: '' };
          const filtered = filterSurveys(surveys, filters);
          expect(filtered.length).toBe(surveys.length);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: Survey Search Correctness
   * For any search query, all returned surveys SHALL contain the search term
   * in survey number, customer name, or cargo description.
   * Validates: Requirements 7.5
   */
  describe('Property 11: Survey Search Correctness', () => {
    it('should return surveys matching search query', () => {
      // Generate non-whitespace queries to test actual search functionality
      const nonWhitespaceString = fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0);
      
      fc.assert(
        fc.property(
          fc.array(surveyArb, { minLength: 1, maxLength: 50 }),
          nonWhitespaceString,
          (surveys, query) => {
            const results = searchSurveys(surveys, query);
            const queryLower = query.toLowerCase();

            // All results should contain the query in searchable fields
            results.forEach((survey) => {
              const matchesSurveyNumber = survey.surveyNumber.toLowerCase().includes(queryLower);
              const matchesCargo = survey.cargoDescription.toLowerCase().includes(queryLower);
              const matchesOrigin = survey.originLocation.toLowerCase().includes(queryLower);
              const matchesDestination = survey.destinationLocation.toLowerCase().includes(queryLower);

              expect(
                matchesSurveyNumber || matchesCargo || matchesOrigin || matchesDestination
              ).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all surveys for empty or whitespace-only search query', () => {
      fc.assert(
        fc.property(
          fc.array(surveyArb, { minLength: 0, maxLength: 50 }),
          fc.constantFrom('', ' ', '  ', '\t', '\n'),
          (surveys, query) => {
            const results = searchSurveys(surveys, query);
            expect(results.length).toBe(surveys.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Waypoint Order Sequentiality
   * For any survey with multiple waypoints, the waypoint order numbers SHALL
   * be sequential starting from 1 with no gaps, and adding a new waypoint
   * SHALL assign the next sequential order number.
   * Validates: Requirements 3.9
   */
  describe('Property 5: Waypoint Order Sequentiality', () => {
    it('should return next sequential order number', () => {
      fc.assert(
        fc.property(
          fc.array(waypointArb, { minLength: 0, maxLength: 20 }),
          (waypoints) => {
            const nextOrder = getNextWaypointOrder(waypoints);

            if (waypoints.length === 0) {
              expect(nextOrder).toBe(1);
            } else {
              const maxOrder = Math.max(...waypoints.map((w) => w.waypointOrder));
              expect(nextOrder).toBe(maxOrder + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sort waypoints by order correctly', () => {
      fc.assert(
        fc.property(fc.array(waypointArb, { minLength: 0, maxLength: 20 }), (waypoints) => {
          const sorted = sortWaypointsByOrder(waypoints);

          // Check that sorted array is in ascending order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].waypointOrder).toBeGreaterThanOrEqual(sorted[i - 1].waypointOrder);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Passability Assessment Correctness
   * For any waypoint with clearance measurements and any transport dimensions,
   * the passability assessment SHALL correctly identify issues based on safety margins.
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   */
  describe('Property 6: Passability Assessment Correctness', () => {
    it('should flag insufficient vertical clearance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 1, max: 20 }).map(n => n * 0.5),
          (transportHeight, clearance) => {
            const waypoint: RouteWaypoint = {
              id: 'test',
              surveyId: 'test',
              waypointOrder: 1,
              waypointType: 'underpass',
              locationName: 'Test',
              isPassable: true,
              createdAt: new Date().toISOString(),
              verticalClearanceM: clearance,
            };

            const dimensions: TransportDimensions = {
              height: transportHeight,
              width: 3,
              weight: 50,
              turnRadius: 15,
            };

            const result = assessWaypointPassability(waypoint, dimensions);
            const requiredClearance = transportHeight + VERTICAL_CLEARANCE_MARGIN;

            if (clearance < requiredClearance) {
              expect(result.passable).toBe(false);
              expect(result.issues.some((i) => i.includes('vertical clearance'))).toBe(true);
            } else {
              expect(result.issues.some((i) => i.includes('vertical clearance'))).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should flag insufficient horizontal clearance', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fc.integer({ min: 1, max: 20 }).map(n => n * 0.5),
          (transportWidth, clearance) => {
            const waypoint: RouteWaypoint = {
              id: 'test',
              surveyId: 'test',
              waypointOrder: 1,
              waypointType: 'obstacle',
              locationName: 'Test',
              isPassable: true,
              createdAt: new Date().toISOString(),
              horizontalClearanceM: clearance,
            };

            const dimensions: TransportDimensions = {
              height: 4,
              width: transportWidth,
              weight: 50,
              turnRadius: 15,
            };

            const result = assessWaypointPassability(waypoint, dimensions);
            const requiredClearance = transportWidth + HORIZONTAL_CLEARANCE_MARGIN;

            if (clearance < requiredClearance) {
              expect(result.passable).toBe(false);
              expect(result.issues.some((i) => i.includes('horizontal clearance'))).toBe(true);
            } else {
              expect(result.issues.some((i) => i.includes('horizontal clearance'))).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should flag exceeded bridge capacity', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 300 }),
          fc.integer({ min: 10, max: 300 }),
          (transportWeight, bridgeCapacity) => {
            const waypoint: RouteWaypoint = {
              id: 'test',
              surveyId: 'test',
              waypointOrder: 1,
              waypointType: 'bridge',
              locationName: 'Test Bridge',
              isPassable: true,
              createdAt: new Date().toISOString(),
              bridgeCapacityTons: bridgeCapacity,
            };

            const dimensions: TransportDimensions = {
              height: 4,
              width: 3,
              weight: transportWeight,
              turnRadius: 15,
            };

            const result = assessWaypointPassability(waypoint, dimensions);

            if (bridgeCapacity < transportWeight) {
              expect(result.passable).toBe(false);
              expect(result.issues.some((i) => i.includes('Bridge capacity'))).toBe(true);
            } else {
              expect(result.issues.some((i) => i.includes('Bridge capacity'))).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should flag insufficient turn radius', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 10, max: 50 }),
          (requiredRadius, availableRadius) => {
            const waypoint: RouteWaypoint = {
              id: 'test',
              surveyId: 'test',
              waypointOrder: 1,
              waypointType: 'turn',
              locationName: 'Test Turn',
              isPassable: true,
              createdAt: new Date().toISOString(),
              turnRadiusAvailableM: availableRadius,
            };

            const dimensions: TransportDimensions = {
              height: 4,
              width: 3,
              weight: 50,
              turnRadius: requiredRadius,
            };

            const result = assessWaypointPassability(waypoint, dimensions);

            if (availableRadius < requiredRadius) {
              expect(result.passable).toBe(false);
              expect(result.issues.some((i) => i.includes('turn radius'))).toBe(true);
            } else {
              expect(result.issues.some((i) => i.includes('turn radius'))).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark waypoint as passable when all clearances are adequate', () => {
      fc.assert(
        fc.property(transportDimensionsArb, (dimensions) => {
          const waypoint: RouteWaypoint = {
            id: 'test',
            surveyId: 'test',
            waypointOrder: 1,
            waypointType: 'bridge',
            locationName: 'Test',
            isPassable: true,
            createdAt: new Date().toISOString(),
            verticalClearanceM: dimensions.height + VERTICAL_CLEARANCE_MARGIN + 1,
            horizontalClearanceM: dimensions.width + HORIZONTAL_CLEARANCE_MARGIN + 1,
            bridgeCapacityTons: dimensions.weight + 50,
            turnRadiusAvailableM: dimensions.turnRadius + 5,
          };

          const result = assessWaypointPassability(waypoint, dimensions);
          expect(result.passable).toBe(true);
          expect(result.issues.length).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Checklist Status Validity
   * For any checklist item update, the status SHALL be one of 'pending', 'ok',
   * 'warning', or 'fail'.
   * Validates: Requirements 5.3, 5.4, 5.5
   */
  describe('Property 7: Checklist Status Validity', () => {
    it('should validate correct checklist statuses', () => {
      const validStatuses = ['pending', 'ok', 'warning', 'fail'];
      validStatuses.forEach((status) => {
        expect(validateChecklistStatus(status)).toBe(true);
      });
    });

    it('should reject invalid checklist statuses', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => !['pending', 'ok', 'warning', 'fail'].includes(s)),
          (invalidStatus) => {
            expect(validateChecklistStatus(invalidStatus)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 12: Survey Validation Completeness
   * For any survey creation attempt, the system SHALL reject surveys missing
   * cargo description, origin location, or destination location, and SHALL
   * reject surveys with negative numeric measurements.
   * Validates: Requirements 10.1, 10.2
   */
  describe('Property 12: Survey Validation Completeness', () => {
    it('should reject surveys missing required fields', () => {
      // Missing cargo description
      expect(validateSurveyData({ originLocation: 'A', destinationLocation: 'B' }).valid).toBe(false);

      // Missing origin location
      expect(validateSurveyData({ cargoDescription: 'Test', destinationLocation: 'B' }).valid).toBe(false);

      // Missing destination location
      expect(validateSurveyData({ cargoDescription: 'Test', originLocation: 'A' }).valid).toBe(false);
    });

    it('should accept surveys with all required fields', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
          (cargoDescription, originLocation, destinationLocation) => {
            const result = validateSurveyData({
              cargoDescription,
              originLocation,
              destinationLocation,
            });
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject surveys with negative numeric values', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000, max: -1 }), (negativeValue) => {
          const result = validateSurveyData({
            cargoDescription: 'Test',
            originLocation: 'A',
            destinationLocation: 'B',
            cargoLengthM: negativeValue,
          });
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Survey Completion Validation
   * For any survey being completed, the completion SHALL require a valid
   * feasibility value.
   * Validates: Requirements 6.1, 6.8
   */
  describe('Property 8: Survey Completion Validation', () => {
    it('should require feasibility for completion', () => {
      const result = validateFeasibilityData({
        routeDistanceKm: 100,
        estimatedTravelTimeHours: 5,
        totalRouteCostEstimate: 50000000,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Feasibility'))).toBe(true);
    });

    it('should accept valid feasibility values', () => {
      const validFeasibilities = ['feasible', 'feasible_with_conditions', 'not_feasible'] as const;
      validFeasibilities.forEach((feasibility) => {
        const result = validateFeasibilityData({
          feasibility,
          feasibilityNotes: 'Test notes',
          routeDistanceKm: 100,
          estimatedTravelTimeHours: 5,
          permitsRequired: [],
          escortRequired: false,
          totalRouteCostEstimate: 50000000,
        });
        expect(result.valid).toBe(true);
      });
    });

    it('should reject negative cost estimates', () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000000, max: -1 }), (negativeCost) => {
          const result = validateFeasibilityData({
            feasibility: 'feasible',
            feasibilityNotes: 'Test',
            routeDistanceKm: 100,
            estimatedTravelTimeHours: 5,
            permitsRequired: [],
            escortRequired: false,
            totalRouteCostEstimate: negativeCost,
          });
          expect(result.valid).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
