// __tests__/assessment-utils.property.test.ts
// Property-based tests for Engineering Technical Assessments module (v0.58)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateTotalLiftedWeight,
  calculateUtilizationPercentage,
  isUtilizationSafe,
  requiresAdditionalReview,
  calculateAxleLoads,
  calculateTotalWeight,
  isWithinLegalLimits,
  determinePermitRequired,
  isValidConclusion,
  isValidStatus,
  canTransitionTo,
  validateAssessmentData,
  validateLiftingPlan,
  validateAxleCalculation,
  filterAssessments,
  calculateStatusCounts,
  sortAssessments,
  getNextLiftNumber,
} from '@/lib/assessment-utils';
import {
  VALID_CONCLUSIONS,
  VALID_STATUSES,
  STATUS_TRANSITIONS,
  AXLE_LIMITS,
  AssessmentStatus,
  ConclusionType,
  TechnicalAssessment,
} from '@/types/assessment';

describe('Assessment Utils Property Tests', () => {
  // ============================================
  // Property 6: Lifting Plan Calculations
  // Validates: Requirements 6.2, 6.4, 6.5
  // ============================================
  describe('Property 6: Lifting Plan Calculations', () => {
    it('total lifted weight equals load weight plus rigging weight for all positive values', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          (loadWeight, riggingWeight) => {
            const total = calculateTotalLiftedWeight(loadWeight, riggingWeight);
            expect(total).toBeCloseTo(loadWeight + riggingWeight, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('utilization percentage equals (total / capacity) * 100 for positive capacity', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
          fc.float({ min: Math.fround(0.1), max: Math.fround(1000), noNaN: true }),
          (totalWeight, capacity) => {
            const utilization = calculateUtilizationPercentage(totalWeight, capacity);
            const expected = (totalWeight / capacity) * 100;
            expect(utilization).toBeCloseTo(expected, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('utilization is safe when <= 80% and unsafe when > 80%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
          (utilization) => {
            const isSafe = isUtilizationSafe(utilization);
            if (utilization <= 80) {
              expect(isSafe).toBe(true);
            } else {
              expect(isSafe).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('requires additional review when utilization > 80%', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
          (utilization) => {
            const needsReview = requiresAdditionalReview(utilization);
            expect(needsReview).toBe(utilization > 80);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('utilization percentage is 0 when capacity is 0 or negative', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
          fc.float({ min: Math.fround(-100), max: Math.fround(0), noNaN: true }),
          (totalWeight, capacity) => {
            const utilization = calculateUtilizationPercentage(totalWeight, capacity);
            expect(utilization).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // Property 7: Axle Load Calculations
  // Validates: Requirements 7.5, 7.6, 7.7, 7.8
  // ============================================
  describe('Property 7: Axle Load Calculations', () => {
    it('total weight equals sum of cargo, trailer, and prime mover weights', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(500), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
          fc.float({ min: Math.fround(0), max: Math.fround(50), noNaN: true }),
          (cargo, trailer, primeMover) => {
            const total = calculateTotalWeight(cargo, trailer, primeMover);
            expect(total).toBeCloseTo(cargo + trailer + primeMover, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('axle loads array has correct number of axles', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(10), max: Math.fround(200), noNaN: true }),
          fc.float({ min: Math.fround(5), max: Math.fround(30), noNaN: true }),
          fc.float({ min: Math.fround(5), max: Math.fround(20), noNaN: true }),
          fc.integer({ min: 1, max: 6 }),
          fc.integer({ min: 2, max: 4 }),
          (cargo, trailer, primeMover, trailerAxles, primeMoverAxles) => {
            const axleLoads = calculateAxleLoads({
              cargoWeightTons: cargo,
              trailerTareWeightTons: trailer,
              primeMoverWeightTons: primeMover,
              trailerAxleCount: trailerAxles,
              primeMoverAxleCount: primeMoverAxles,
            });
            expect(axleLoads.length).toBe(trailerAxles + primeMoverAxles);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('within legal limits is true when all axles are under their max', () => {
      // Create axle loads that are all within limits
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              axle_number: fc.integer({ min: 1, max: 10 }),
              axle_type: fc.constantFrom('single', 'tandem', 'tridem'),
              load_tons: fc.float({ min: Math.fround(1), max: Math.fround(7), noNaN: true }), // Under single axle limit
              max_allowed_tons: fc.constant(AXLE_LIMITS.single),
              utilization_pct: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
            }),
            { minLength: 1, maxLength: 6 }
          ),
          (axleLoads) => {
            // Ensure all loads are under max
            const safeLoads = axleLoads.map(a => ({
              ...a,
              load_tons: Math.min(a.load_tons, a.max_allowed_tons - 0.1),
            }));
            expect(isWithinLegalLimits(safeLoads)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('permit required when any axle exceeds its limit', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              axle_number: fc.integer({ min: 1, max: 10 }),
              axle_type: fc.constantFrom('single', 'tandem', 'tridem'),
              load_tons: fc.float({ min: Math.fround(1), max: Math.fround(30), noNaN: true }),
              max_allowed_tons: fc.float({ min: Math.fround(5), max: Math.fround(25), noNaN: true }),
              utilization_pct: fc.float({ min: Math.fround(0), max: Math.fround(200), noNaN: true }),
            }),
            { minLength: 1, maxLength: 6 }
          ),
          (axleLoads) => {
            const hasOverload = axleLoads.some(a => a.load_tons > a.max_allowed_tons);
            const permitRequired = determinePermitRequired(axleLoads);
            expect(permitRequired).toBe(hasOverload);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 9: Conclusion Value Validation
  // Validates: Requirements 3.1
  // ============================================
  describe('Property 9: Conclusion Value Validation', () => {
    it('valid conclusions are accepted', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_CONCLUSIONS),
          (conclusion) => {
            expect(isValidConclusion(conclusion)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid conclusions are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !VALID_CONCLUSIONS.includes(s as ConclusionType)
          ),
          (invalidConclusion) => {
            expect(isValidConclusion(invalidConclusion)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('valid statuses are accepted', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_STATUSES),
          (status) => {
            expect(isValidStatus(status)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid statuses are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(
            s => !VALID_STATUSES.includes(s as AssessmentStatus)
          ),
          (invalidStatus) => {
            expect(isValidStatus(invalidStatus)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // ============================================
  // Property 3: Required Field Validation
  // Validates: Requirements 2.3, 6.1, 7.1
  // ============================================
  describe('Property 3: Required Field Validation', () => {
    it('assessment validation fails without assessment_type_id', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (title) => {
            const result = validateAssessmentData({
              assessment_type_id: '',
              title,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'assessment_type_id')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('assessment validation fails without title', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (typeId) => {
            const result = validateAssessmentData({
              assessment_type_id: typeId,
              title: '',
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'title')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('assessment validation passes with required fields', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (typeId, title) => {
            const result = validateAssessmentData({
              assessment_type_id: typeId,
              title,
            });
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('lifting plan validation fails without assessment_id', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }),
          (loadWeight) => {
            const result = validateLiftingPlan({
              assessment_id: '',
              load_weight_tons: loadWeight,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'assessment_id')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('lifting plan validation fails without load_weight_tons', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (assessmentId) => {
            const result = validateLiftingPlan({
              assessment_id: assessmentId,
              load_weight_tons: 0,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'load_weight_tons')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('axle calculation validation fails without assessment_id', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }),
          (cargoWeight) => {
            const result = validateAxleCalculation({
              assessment_id: '',
              cargo_weight_tons: cargoWeight,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'assessment_id')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('axle calculation validation fails without cargo_weight_tons', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (assessmentId) => {
            const result = validateAxleCalculation({
              assessment_id: assessmentId,
              cargo_weight_tons: 0,
            });
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.field === 'cargo_weight_tons')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 4: Workflow State Transitions
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
  // ============================================
  describe('Property 4: Workflow State Transitions', () => {
    it('valid transitions are allowed according to STATUS_TRANSITIONS', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_STATUSES),
          (currentStatus) => {
            const allowedTargets = STATUS_TRANSITIONS[currentStatus];
            allowedTargets.forEach(targetStatus => {
              expect(canTransitionTo(currentStatus, targetStatus)).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('invalid transitions are rejected', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VALID_STATUSES),
          fc.constantFrom(...VALID_STATUSES),
          (currentStatus, targetStatus) => {
            const allowedTargets = STATUS_TRANSITIONS[currentStatus];
            const shouldBeAllowed = allowedTargets.includes(targetStatus);
            expect(canTransitionTo(currentStatus, targetStatus)).toBe(shouldBeAllowed);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('superseded status has no valid transitions', () => {
      VALID_STATUSES.forEach(targetStatus => {
        expect(canTransitionTo('superseded', targetStatus)).toBe(false);
      });
    });

    it('draft can transition to in_progress or pending_review', () => {
      expect(canTransitionTo('draft', 'in_progress')).toBe(true);
      expect(canTransitionTo('draft', 'pending_review')).toBe(true);
      expect(canTransitionTo('draft', 'approved')).toBe(false);
    });

    it('pending_review can transition to approved or rejected', () => {
      expect(canTransitionTo('pending_review', 'approved')).toBe(true);
      expect(canTransitionTo('pending_review', 'rejected')).toBe(true);
    });
  });


  // ============================================
  // Property 5: Revision Tracking Invariants
  // Validates: Requirements 5.1, 5.2, 5.3, 5.4
  // ============================================
  describe('Property 5: Revision Tracking Invariants', () => {
    it('next lift number is always greater than existing max', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({ lift_number: fc.integer({ min: 1, max: 100 }) }),
            { minLength: 0, maxLength: 10 }
          ),
          (existingPlans) => {
            const nextNumber = getNextLiftNumber(existingPlans);
            if (existingPlans.length === 0) {
              expect(nextNumber).toBe(1);
            } else {
              const maxExisting = Math.max(...existingPlans.map(p => p.lift_number));
              expect(nextNumber).toBe(maxExisting + 1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('first lift number is always 1 for empty plans', () => {
      const nextNumber = getNextLiftNumber([]);
      expect(nextNumber).toBe(1);
    });
  });

  // ============================================
  // Property 8: Filter Results Correctness
  // Validates: Requirements 9.2, 9.3, 9.4
  // ============================================
  describe('Property 8: Filter Results Correctness', () => {
    // Generator for mock assessments with fixed dates to avoid date parsing issues
    const assessmentArb = fc.record({
      id: fc.uuid(),
      assessment_number: fc.string({ minLength: 10, maxLength: 20 }),
      assessment_type_id: fc.uuid(),
      quotation_id: fc.option(fc.uuid(), { nil: null }),
      project_id: fc.option(fc.uuid(), { nil: null }),
      job_order_id: fc.option(fc.uuid(), { nil: null }),
      route_survey_id: fc.option(fc.uuid(), { nil: null }),
      customer_id: fc.option(fc.uuid(), { nil: null }),
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
      cargo_description: fc.option(fc.string(), { nil: null }),
      cargo_weight_tons: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(500), noNaN: true }), { nil: null }),
      cargo_dimensions: fc.constant(null),
      assessment_data: fc.constant({}),
      calculations: fc.constant([]),
      equipment_recommended: fc.constant([]),
      recommendations: fc.constant(null),
      limitations: fc.constant(null),
      assumptions: fc.constant(null),
      conclusion: fc.option(fc.constantFrom(...VALID_CONCLUSIONS), { nil: null }),
      conclusion_notes: fc.constant(null),
      prepared_by: fc.constant(null),
      prepared_at: fc.constant(null),
      reviewed_by: fc.constant(null),
      reviewed_at: fc.constant(null),
      approved_by: fc.constant(null),
      approved_at: fc.constant(null),
      status: fc.constantFrom(...VALID_STATUSES),
      revision_number: fc.integer({ min: 1, max: 10 }),
      previous_revision_id: fc.constant(null),
      revision_notes: fc.constant(null),
      documents: fc.constant([]),
      drawings: fc.constant([]),
      created_at: fc.integer({ min: 1704067200000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
      updated_at: fc.integer({ min: 1704067200000, max: 1735689600000 }).map(ts => new Date(ts).toISOString()),
    }) as fc.Arbitrary<TechnicalAssessment>;

    it('filtering by status returns only matching assessments', () => {
      fc.assert(
        fc.property(
          fc.array(assessmentArb, { minLength: 0, maxLength: 20 }),
          fc.constantFrom(...VALID_STATUSES),
          (assessments, filterStatus) => {
            const filtered = filterAssessments(assessments, { status: filterStatus });
            filtered.forEach(a => {
              expect(a.status).toBe(filterStatus);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('filtering by assessment_type_id returns only matching assessments', () => {
      fc.assert(
        fc.property(
          fc.array(assessmentArb, { minLength: 0, maxLength: 20 }),
          fc.uuid(),
          (assessments, filterTypeId) => {
            const filtered = filterAssessments(assessments, { assessment_type_id: filterTypeId });
            filtered.forEach(a => {
              expect(a.assessment_type_id).toBe(filterTypeId);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('status counts sum equals total count', () => {
      fc.assert(
        fc.property(
          fc.array(assessmentArb, { minLength: 0, maxLength: 50 }),
          (assessments) => {
            const counts = calculateStatusCounts(assessments);
            const sum = counts.draft + counts.in_progress + counts.pending_review +
                       counts.approved + counts.rejected + counts.superseded;
            expect(sum).toBe(counts.total);
            expect(counts.total).toBe(assessments.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('sorting by created_at produces correctly ordered results', () => {
      fc.assert(
        fc.property(
          fc.array(assessmentArb, { minLength: 2, maxLength: 20 }),
          fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>,
          (assessments, order) => {
            const sorted = sortAssessments(assessments, 'created_at', order);
            for (let i = 1; i < sorted.length; i++) {
              const prev = new Date(sorted[i - 1].created_at).getTime();
              const curr = new Date(sorted[i].created_at).getTime();
              if (order === 'asc') {
                expect(prev).toBeLessThanOrEqual(curr);
              } else {
                expect(prev).toBeGreaterThanOrEqual(curr);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // ============================================
  // Property 10: Multiple Lifting Plans Per Assessment
  // Validates: Requirements 6.9
  // ============================================
  describe('Property 10: Multiple Lifting Plans Per Assessment', () => {
    it('getNextLiftNumber returns sequential numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (planCount) => {
            const plans = Array.from({ length: planCount }, (_, i) => ({
              lift_number: i + 1,
            }));
            const nextNumber = getNextLiftNumber(plans);
            expect(nextNumber).toBe(planCount + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('getNextLiftNumber handles non-sequential existing numbers', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 1, maxLength: 10 }),
          (liftNumbers) => {
            const plans = liftNumbers.map(n => ({ lift_number: n }));
            const nextNumber = getNextLiftNumber(plans);
            const maxExisting = Math.max(...liftNumbers);
            expect(nextNumber).toBe(maxExisting + 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
