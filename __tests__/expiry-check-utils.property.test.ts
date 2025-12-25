// =====================================================
// v0.70: EXPIRY CHECK UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateDaysUntilExpiry,
  isWithinExpiryWindow,
  classifyExpiryUrgency,
  groupExpiringItems,
  filterExpiringDocuments,
  filterExpiringPermits,
  filterExpiringCertifications,
  generateExpirySummary,
  hasExpiredItems,
  hasItemsExpiringThisWeek,
  getMostUrgentItems,
  filterByItemType,
  combineExpiryResults,
} from '@/lib/expiry-check-utils';
import {
  ExpiryUrgency,
  ExpiryItemType,
  ExpiringItem,
  ExpiryCheckResult,
  EXPIRY_URGENCY_THRESHOLDS,
  DEFAULT_EXPIRY_LOOKAHEAD_DAYS,
} from '@/types/expiry-check';

// =====================================================
// GENERATORS
// =====================================================

/**
 * Generator for expiry urgency
 */
const expiryUrgencyArb = fc.constantFrom<ExpiryUrgency>('expired', 'expiring_this_week', 'expiring_this_month');

/**
 * Generator for expiry item type
 */
const expiryItemTypeArb = fc.constantFrom<ExpiryItemType>('document', 'permit', 'certification');

/**
 * Generator for days until expiry (can be negative for expired items)
 */
const daysUntilExpiryArb = fc.integer({ min: -365, max: 365 });

/**
 * Generator for days until expiry within lookahead window
 */
const daysWithinWindowArb = fc.integer({ min: -30, max: 30 });

/**
 * Generator for ISO date strings
 */
const futureDateArb = (daysAhead: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
};

/**
 * Generator for expiring items
 */
const expiringItemArb = fc.record({
  id: fc.uuid(),
  item_type: expiryItemTypeArb,
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
  expiry_date: daysWithinWindowArb.map(days => futureDateArb(days)),
  days_until_expiry: daysWithinWindowArb,
  urgency: expiryUrgencyArb,
  responsible_user_id: fc.option(fc.uuid(), { nil: null }),
  responsible_user_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  parent_id: fc.option(fc.uuid(), { nil: null }),
  parent_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
});

/**
 * Generator for consistent expiring items (urgency matches days_until_expiry)
 */
const consistentExpiringItemArb = daysWithinWindowArb.chain(days => {
  let urgency: ExpiryUrgency;
  if (days < 0) {
    urgency = 'expired';
  } else if (days <= EXPIRY_URGENCY_THRESHOLDS.expiring_this_week) {
    urgency = 'expiring_this_week';
  } else {
    urgency = 'expiring_this_month';
  }
  
  return fc.record({
    id: fc.uuid(),
    item_type: expiryItemTypeArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null }),
    expiry_date: fc.constant(futureDateArb(days)),
    days_until_expiry: fc.constant(days),
    urgency: fc.constant(urgency),
    responsible_user_id: fc.option(fc.uuid(), { nil: null }),
    responsible_user_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
    parent_id: fc.option(fc.uuid(), { nil: null }),
    parent_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  });
});

/**
 * Generator for raw document data
 */
const rawDocumentArb = fc.record({
  id: fc.uuid(),
  document_name: fc.string({ minLength: 1, maxLength: 100 }),
  document_type: fc.constantFrom('registration', 'insurance', 'kir', 'permit'),
  expiry_date: fc.option(daysWithinWindowArb.map(days => futureDateArb(days)), { nil: null }),
  asset_id: fc.option(fc.uuid(), { nil: null }),
  asset_code: fc.option(fc.stringMatching(/^[A-Z]+-\d{4}$/), { nil: null }),
  asset_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  uploaded_by: fc.option(fc.uuid(), { nil: null }),
});

/**
 * Generator for raw permit data
 */
const rawPermitArb = fc.record({
  id: fc.uuid(),
  permit_number: fc.option(fc.stringMatching(/^PTW-\d{4}-\d{4}$/), { nil: null }),
  permit_type: fc.constantFrom('hot_work', 'confined_space', 'height_work', 'excavation'),
  work_description: fc.string({ minLength: 1, maxLength: 200 }),
  work_location: fc.string({ minLength: 1, maxLength: 100 }),
  valid_to: daysWithinWindowArb.map(days => futureDateArb(days)),
  status: fc.constantFrom('active', 'approved', 'pending', 'completed', 'cancelled'),
  requested_by: fc.option(fc.uuid(), { nil: null }),
  requester_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
});

/**
 * Generator for raw certification data
 */
const rawCertificationArb = fc.record({
  id: fc.uuid(),
  employee_id: fc.uuid(),
  employee_name: fc.string({ minLength: 1, maxLength: 100 }),
  skill_id: fc.uuid(),
  skill_name: fc.string({ minLength: 1, maxLength: 100 }),
  skill_code: fc.stringMatching(/^SKL-\d{3}$/),
  certification_number: fc.option(fc.stringMatching(/^CERT-\d{6}$/), { nil: null }),
  expiry_date: fc.option(daysWithinWindowArb.map(days => futureDateArb(days)), { nil: null }),
  is_certified: fc.boolean(),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Expiry Check Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 10: Expiry Detection and Classification**
   * *For any* document, permit, or certification with expiry_date within 30 days of today,
   * the item SHALL be identified as expiring with urgency:
   * - 'expired' if expiry_date < today
   * - 'expiring_this_week' if expiry_date <= today + 7 days
   * - 'expiring_this_month' otherwise
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.6**
   */
  describe('Property 10: Expiry Detection and Classification', () => {
    it('should classify expired items correctly (days < 0)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: -1 }),
          (daysUntilExpiry) => {
            const urgency = classifyExpiryUrgency(daysUntilExpiry);
            return urgency === 'expired';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify expiring_this_week for 0-7 days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 7 }),
          (daysUntilExpiry) => {
            const urgency = classifyExpiryUrgency(daysUntilExpiry);
            return urgency === 'expiring_this_week';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify expiring_this_month for 8-30 days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 8, max: 30 }),
          (daysUntilExpiry) => {
            const urgency = classifyExpiryUrgency(daysUntilExpiry);
            return urgency === 'expiring_this_month';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate days until expiry correctly for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + daysAhead);
            expiryDate.setHours(0, 0, 0, 0);
            
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            const calculated = calculateDaysUntilExpiry(expiryDate, referenceDate);
            return calculated === daysAhead;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate negative days for past dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAgo) => {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() - daysAgo);
            expiryDate.setHours(0, 0, 0, 0);
            
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            const calculated = calculateDaysUntilExpiry(expiryDate, referenceDate);
            return calculated === -daysAgo;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify items within expiry window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -30, max: 30 }),
          fc.integer({ min: 1, max: 60 }),
          (daysUntilExpiry, windowDays) => {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
            
            const isWithin = isWithinExpiryWindow(expiryDate, windowDays);
            return isWithin === (daysUntilExpiry <= windowDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should group expiring items correctly by urgency', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const result = groupExpiringItems(items);
            
            // Verify total count
            if (result.total_count !== items.length) {
              return false;
            }
            
            // Verify all items are grouped
            const allGrouped = [
              ...result.expired,
              ...result.expiring_this_week,
              ...result.expiring_this_month,
            ];
            
            if (allGrouped.length !== items.length) {
              return false;
            }
            
            // Verify each item is in the correct group
            for (const item of items) {
              const group = result[item.urgency];
              if (!group.some(i => i.id === item.id)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter documents within expiry window', () => {
      fc.assert(
        fc.property(
          fc.array(rawDocumentArb, { minLength: 0, maxLength: 10 }),
          fc.integer({ min: 1, max: 60 }),
          (documents, withinDays) => {
            const result = filterExpiringDocuments(documents, withinDays);
            
            // All results should be within the window
            for (const doc of result) {
              if (doc.days_until_expiry > withinDays) {
                return false;
              }
            }
            
            // All results should have correct item_type
            for (const doc of result) {
              if (doc.item_type !== 'document') {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter permits within expiry window and active status', () => {
      fc.assert(
        fc.property(
          fc.array(rawPermitArb, { minLength: 0, maxLength: 10 }),
          fc.integer({ min: 1, max: 60 }),
          (permits, withinDays) => {
            const result = filterExpiringPermits(permits, withinDays);
            
            // All results should be within the window
            for (const permit of result) {
              if (permit.days_until_expiry > withinDays) {
                return false;
              }
            }
            
            // All results should have correct item_type
            for (const permit of result) {
              if (permit.item_type !== 'permit') {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter certifications within expiry window and certified', () => {
      fc.assert(
        fc.property(
          fc.array(rawCertificationArb, { minLength: 0, maxLength: 10 }),
          fc.integer({ min: 1, max: 60 }),
          (certifications, withinDays) => {
            const result = filterExpiringCertifications(certifications, withinDays);
            
            // All results should be within the window
            for (const cert of result) {
              if (cert.days_until_expiry > withinDays) {
                return false;
              }
            }
            
            // All results should have correct item_type
            for (const cert of result) {
              if (cert.item_type !== 'certification') {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include documents without expiry date', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              document_name: fc.string({ minLength: 1, maxLength: 100 }),
              document_type: fc.constantFrom('registration', 'insurance'),
              expiry_date: fc.constant(null),
              asset_id: fc.option(fc.uuid(), { nil: null }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (documents) => {
            const result = filterExpiringDocuments(documents);
            return result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not include non-certified certifications', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              employee_id: fc.uuid(),
              employee_name: fc.string({ minLength: 1, maxLength: 100 }),
              skill_id: fc.uuid(),
              skill_name: fc.string({ minLength: 1, maxLength: 100 }),
              skill_code: fc.stringMatching(/^SKL-\d{3}$/),
              certification_number: fc.option(fc.stringMatching(/^CERT-\d{6}$/), { nil: null }),
              expiry_date: fc.constant(futureDateArb(10)),
              is_certified: fc.constant(false),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (certifications) => {
            const result = filterExpiringCertifications(certifications);
            return result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for summary and reporting
   */
  describe('Summary and Reporting', () => {
    it('should generate correct summary from grouped results', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const grouped = groupExpiringItems(items);
            const summary = generateExpirySummary(grouped);
            
            return (
              summary.total_count === grouped.total_count &&
              summary.by_urgency.expired.count === grouped.expired.length &&
              summary.by_urgency.expiring_this_week.count === grouped.expiring_this_week.length &&
              summary.by_urgency.expiring_this_month.count === grouped.expiring_this_month.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect expired items correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const grouped = groupExpiringItems(items);
            const hasExpired = hasExpiredItems(grouped);
            
            return hasExpired === (grouped.expired.length > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect items expiring this week correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const grouped = groupExpiringItems(items);
            const hasThisWeek = hasItemsExpiringThisWeek(grouped);
            
            return hasThisWeek === (grouped.expiring_this_week.length > 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return most urgent items sorted by days until expiry', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 1, max: 10 }),
          (items, limit) => {
            const grouped = groupExpiringItems(items);
            const mostUrgent = getMostUrgentItems(grouped, limit);
            
            // Should not exceed limit
            if (mostUrgent.length > limit) {
              return false;
            }
            
            // Should be sorted by days until expiry ascending (most urgent first)
            for (let i = 0; i < mostUrgent.length - 1; i++) {
              if (mostUrgent[i].days_until_expiry > mostUrgent[i + 1].days_until_expiry) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter by item type correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 20 }),
          expiryItemTypeArb,
          (items, itemType) => {
            const grouped = groupExpiringItems(items);
            const filtered = filterByItemType(grouped, itemType);
            
            // All items in filtered result should be of the specified type
            const allFiltered = [
              ...filtered.expired,
              ...filtered.expiring_this_week,
              ...filtered.expiring_this_month,
            ];
            
            for (const item of allFiltered) {
              if (item.item_type !== itemType) {
                return false;
              }
            }
            
            // Total count should match
            return filtered.total_count === allFiltered.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine expiry results correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.array(consistentExpiringItemArb, { minLength: 0, maxLength: 10 }),
            { minLength: 1, maxLength: 5 }
          ),
          (itemArrays) => {
            const results = itemArrays.map(items => groupExpiringItems(items));
            const combined = combineExpiryResults(results);
            
            // Total count should be sum of all results
            const expectedTotal = results.reduce((sum, r) => sum + r.total_count, 0);
            if (combined.total_count !== expectedTotal) {
              return false;
            }
            
            // Each category should be sum of all results
            const expectedExpired = results.reduce((sum, r) => sum + r.expired.length, 0);
            const expectedThisWeek = results.reduce((sum, r) => sum + r.expiring_this_week.length, 0);
            const expectedThisMonth = results.reduce((sum, r) => sum + r.expiring_this_month.length, 0);
            
            return (
              combined.expired.length === expectedExpired &&
              combined.expiring_this_week.length === expectedThisWeek &&
              combined.expiring_this_month.length === expectedThisMonth
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const result = groupExpiringItems([]);
      expect(result.total_count).toBe(0);
      expect(result.expired).toHaveLength(0);
      expect(result.expiring_this_week).toHaveLength(0);
      expect(result.expiring_this_month).toHaveLength(0);
    });

    it('should handle today as expiry date (0 days)', () => {
      const urgency = classifyExpiryUrgency(0);
      expect(urgency).toBe('expiring_this_week');
    });

    it('should handle exactly 7 days as expiring_this_week', () => {
      const urgency = classifyExpiryUrgency(7);
      expect(urgency).toBe('expiring_this_week');
    });

    it('should handle exactly 8 days as expiring_this_month', () => {
      const urgency = classifyExpiryUrgency(8);
      expect(urgency).toBe('expiring_this_month');
    });

    it('should handle exactly -1 day as expired', () => {
      const urgency = classifyExpiryUrgency(-1);
      expect(urgency).toBe('expired');
    });
  });
});
