// =====================================================
// v0.70: MAINTENANCE CHECK UTILS PROPERTY TESTS
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateDaysUntilDue,
  isMaintenanceOverdue,
  isMaintenanceUpcoming,
  getUpcomingMaintenanceItems,
  getOverdueMaintenanceItems,
  classifyMaintenancePriority,
  classifyMaintenanceItemPriority,
  groupMaintenanceItems,
  createMaintenanceItem,
  generateMaintenanceCheckSummary,
  sortMaintenanceItemsByPriority,
  getPriorityLabel,
  getPriorityBadgeVariant,
  isValidMaintenanceItem,
} from '@/lib/maintenance-check-utils';
import {
  MaintenancePriority,
  MaintenanceItem,
  MAINTENANCE_PRIORITY_THRESHOLDS,
  DEFAULT_MAINTENANCE_LOOKAHEAD_DAYS,
} from '@/types/maintenance-check';

// =====================================================
// GENERATORS
// =====================================================

/**
 * Generator for maintenance priority
 */
const maintenancePriorityArb = fc.constantFrom<MaintenancePriority>('critical', 'high', 'normal');

/**
 * Generator for days until due (can be negative for overdue items)
 */
const daysUntilDueArb = fc.integer({ min: -365, max: 365 });

/**
 * Generator for days within maintenance window
 */
const daysWithinWindowArb = fc.integer({ min: -30, max: 30 });

/**
 * Generator for trigger types
 */
const triggerTypeArb = fc.constantFrom('km', 'hours', 'days', 'date');

/**
 * Generator for ISO date strings based on days offset
 */
const futureDateArb = (daysAhead: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
};

/**
 * Generator for maintenance items with consistent priority
 */
const consistentMaintenanceItemArb = daysWithinWindowArb.chain(days => {
  let priority: MaintenancePriority;
  let isOverdue: boolean;
  
  if (days < 0) {
    priority = 'critical';
    isOverdue = true;
  } else if (days <= MAINTENANCE_PRIORITY_THRESHOLDS.high) {
    priority = 'high';
    isOverdue = false;
  } else {
    priority = 'normal';
    isOverdue = false;
  }
  
  return fc.record({
    id: fc.uuid(),
    equipment_id: fc.uuid(),
    equipment_name: fc.string({ minLength: 1, maxLength: 100 }),
    equipment_code: fc.stringMatching(/^[A-Z]{2,4}-\d{4}$/),
    maintenance_type: fc.string({ minLength: 1, maxLength: 50 }),
    maintenance_type_id: fc.uuid(),
    due_date: fc.constant(futureDateArb(days)),
    days_until_due: fc.constant(days),
    is_overdue: fc.constant(isOverdue),
    priority: fc.constant(priority),
    trigger_type: triggerTypeArb,
    current_reading: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: null }),
    due_reading: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: null }),
  });
});

/**
 * Generator for raw maintenance data (for createMaintenanceItem)
 */
const rawMaintenanceDataArb = fc.record({
  id: fc.uuid(),
  equipment_id: fc.uuid(),
  equipment_name: fc.string({ minLength: 1, maxLength: 100 }),
  equipment_code: fc.stringMatching(/^[A-Z]{2,4}-\d{4}$/),
  maintenance_type: fc.string({ minLength: 1, maxLength: 50 }),
  maintenance_type_id: fc.uuid(),
  due_date: daysWithinWindowArb.map(days => futureDateArb(days)),
  trigger_type: triggerTypeArb,
  current_reading: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: null }),
  due_reading: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: null }),
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Maintenance Check Utils Property Tests', () => {
  /**
   * **Feature: n8n-scheduled-tasks, Property 11: Maintenance Detection and Prioritization**
   * *For any* equipment with maintenance due_date within 7 days or overdue,
   * the item SHALL be identified with priority:
   * - 'critical' if overdue
   * - 'high' if due within 3 days
   * - 'normal' otherwise
   * **Validates: Requirements 5.2, 5.3, 5.5**
   */
  describe('Property 11: Maintenance Detection and Prioritization', () => {
    it('should classify overdue items as critical (days < 0)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: -1 }),
          (daysUntilDue) => {
            const priority = classifyMaintenancePriority(daysUntilDue);
            return priority === 'critical';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify high priority for 0-3 days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }),
          (daysUntilDue) => {
            const priority = classifyMaintenancePriority(daysUntilDue);
            return priority === 'high';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify normal priority for 4+ days', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 365 }),
          (daysUntilDue) => {
            const priority = classifyMaintenancePriority(daysUntilDue);
            return priority === 'normal';
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate days until due correctly for future dates', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 365 }),
          (daysAhead) => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + daysAhead);
            dueDate.setHours(0, 0, 0, 0);
            
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            const calculated = calculateDaysUntilDue(dueDate.toISOString(), referenceDate);
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
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() - daysAgo);
            dueDate.setHours(0, 0, 0, 0);
            
            const referenceDate = new Date();
            referenceDate.setHours(0, 0, 0, 0);
            
            const calculated = calculateDaysUntilDue(dueDate.toISOString(), referenceDate);
            return calculated === -daysAgo;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify overdue items', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -365, max: 365 }),
          (daysUntilDue) => {
            const isOverdue = isMaintenanceOverdue(daysUntilDue);
            return isOverdue === (daysUntilDue < 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify upcoming items within window', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -30, max: 30 }),
          fc.integer({ min: 1, max: 30 }),
          (daysUntilDue, withinDays) => {
            const isUpcoming = isMaintenanceUpcoming(daysUntilDue, withinDays);
            return isUpcoming === (daysUntilDue >= 0 && daysUntilDue <= withinDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should group maintenance items correctly by status', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const result = groupMaintenanceItems(items);
            
            // Verify total count
            if (result.maintenance_items_found !== items.length) {
              return false;
            }
            
            // Verify all items are grouped
            const allGrouped = [...result.overdue, ...result.upcoming];
            if (allGrouped.length !== items.length) {
              return false;
            }
            
            // Verify overdue items are in overdue group
            for (const item of result.overdue) {
              if (!item.is_overdue && item.days_until_due >= 0) {
                return false;
              }
            }
            
            // Verify upcoming items are not overdue
            for (const item of result.upcoming) {
              if (item.is_overdue || item.days_until_due < 0) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should count unique equipment correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const result = groupMaintenanceItems(items);
            const uniqueEquipmentIds = new Set(items.map(i => i.equipment_id));
            return result.equipment_count === uniqueEquipmentIds.size;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter upcoming maintenance items correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          fc.integer({ min: 1, max: 30 }),
          (items, withinDays) => {
            const upcoming = getUpcomingMaintenanceItems(items, withinDays);
            
            // All results should be within the window and not overdue
            for (const item of upcoming) {
              if (item.is_overdue || item.days_until_due < 0 || item.days_until_due > withinDays) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should filter overdue maintenance items correctly', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const overdue = getOverdueMaintenanceItems(items);
            
            // All results should be overdue
            for (const item of overdue) {
              if (!item.is_overdue) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should classify item priority based on is_overdue flag', () => {
      fc.assert(
        fc.property(
          consistentMaintenanceItemArb,
          (item) => {
            const priority = classifyMaintenanceItemPriority(item);
            
            if (item.is_overdue) {
              return priority === 'critical';
            }
            
            return priority === classifyMaintenancePriority(item.days_until_due);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for createMaintenanceItem function
   */
  describe('Create Maintenance Item', () => {
    it('should create valid maintenance items from raw data', () => {
      fc.assert(
        fc.property(
          rawMaintenanceDataArb,
          (rawData) => {
            const item = createMaintenanceItem(rawData);
            
            // Verify all required fields are present
            return (
              item.id === rawData.id &&
              item.equipment_id === rawData.equipment_id &&
              item.equipment_name === rawData.equipment_name &&
              item.equipment_code === rawData.equipment_code &&
              item.maintenance_type === rawData.maintenance_type &&
              item.maintenance_type_id === rawData.maintenance_type_id &&
              item.due_date === rawData.due_date &&
              item.trigger_type === rawData.trigger_type &&
              typeof item.days_until_due === 'number' &&
              typeof item.is_overdue === 'boolean' &&
              ['critical', 'high', 'normal'].includes(item.priority)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set is_overdue correctly based on days_until_due', () => {
      fc.assert(
        fc.property(
          rawMaintenanceDataArb,
          (rawData) => {
            const item = createMaintenanceItem(rawData);
            return item.is_overdue === (item.days_until_due < 0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set priority correctly based on days_until_due', () => {
      fc.assert(
        fc.property(
          rawMaintenanceDataArb,
          (rawData) => {
            const item = createMaintenanceItem(rawData);
            const expectedPriority = classifyMaintenancePriority(item.days_until_due);
            return item.priority === expectedPriority;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for summary generation
   */
  describe('Summary Generation', () => {
    it('should generate correct summary from grouped results', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const grouped = groupMaintenanceItems(items);
            const summary = generateMaintenanceCheckSummary(grouped);
            
            return (
              summary.equipment_count === grouped.equipment_count &&
              summary.maintenance_items_found === grouped.maintenance_items_found &&
              summary.overdue_count === grouped.overdue.length &&
              summary.upcoming_count === grouped.upcoming.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should count priorities correctly in summary', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 0, maxLength: 20 }),
          (items) => {
            const grouped = groupMaintenanceItems(items);
            const summary = generateMaintenanceCheckSummary(grouped);
            
            const allItems = [...grouped.overdue, ...grouped.upcoming];
            const criticalCount = allItems.filter(i => i.priority === 'critical').length;
            const highCount = allItems.filter(i => i.priority === 'high').length;
            const normalCount = allItems.filter(i => i.priority === 'normal').length;
            
            return (
              summary.by_priority.critical.count === criticalCount &&
              summary.by_priority.high.count === highCount &&
              summary.by_priority.normal.count === normalCount
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for sorting
   */
  describe('Sorting', () => {
    it('should sort items by priority (critical first)', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 2, maxLength: 20 }),
          (items) => {
            const sorted = sortMaintenanceItemsByPriority(items);
            
            const priorityOrder: Record<MaintenancePriority, number> = {
              critical: 0,
              high: 1,
              normal: 2,
            };
            
            for (let i = 0; i < sorted.length - 1; i++) {
              const currentOrder = priorityOrder[sorted[i].priority];
              const nextOrder = priorityOrder[sorted[i + 1].priority];
              
              // If same priority, check days_until_due
              if (currentOrder === nextOrder) {
                if (sorted[i].days_until_due > sorted[i + 1].days_until_due) {
                  return false;
                }
              } else if (currentOrder > nextOrder) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify original array when sorting', () => {
      fc.assert(
        fc.property(
          fc.array(consistentMaintenanceItemArb, { minLength: 1, maxLength: 10 }),
          (items) => {
            const originalIds = items.map(i => i.id);
            sortMaintenanceItemsByPriority(items);
            const afterIds = items.map(i => i.id);
            
            return originalIds.every((id, index) => id === afterIds[index]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Tests for utility functions
   */
  describe('Utility Functions', () => {
    it('should return correct priority labels', () => {
      expect(getPriorityLabel('critical')).toBe('Critical');
      expect(getPriorityLabel('high')).toBe('High');
      expect(getPriorityLabel('normal')).toBe('Normal');
    });

    it('should return correct badge variants', () => {
      expect(getPriorityBadgeVariant('critical')).toBe('destructive');
      expect(getPriorityBadgeVariant('high')).toBe('warning');
      expect(getPriorityBadgeVariant('normal')).toBe('secondary');
    });

    it('should validate maintenance items correctly', () => {
      fc.assert(
        fc.property(
          consistentMaintenanceItemArb,
          (item) => {
            return isValidMaintenanceItem(item) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid maintenance items', () => {
      const invalidItem = {
        id: '',
        equipment_id: 'test',
        equipment_name: 'Test',
        equipment_code: 'TEST-001',
        maintenance_type: 'Oil Change',
        maintenance_type_id: 'type-1',
        due_date: '2025-01-01',
        days_until_due: 5,
        is_overdue: false,
        priority: 'normal' as MaintenancePriority,
        trigger_type: 'days',
        current_reading: null,
        due_reading: null,
      };
      
      expect(isValidMaintenanceItem(invalidItem)).toBe(false);
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const result = groupMaintenanceItems([]);
      expect(result.maintenance_items_found).toBe(0);
      expect(result.equipment_count).toBe(0);
      expect(result.overdue).toHaveLength(0);
      expect(result.upcoming).toHaveLength(0);
    });

    it('should handle today as due date (0 days)', () => {
      const priority = classifyMaintenancePriority(0);
      expect(priority).toBe('high');
    });

    it('should handle exactly 3 days as high priority', () => {
      const priority = classifyMaintenancePriority(3);
      expect(priority).toBe('high');
    });

    it('should handle exactly 4 days as normal priority', () => {
      const priority = classifyMaintenancePriority(4);
      expect(priority).toBe('normal');
    });

    it('should handle exactly -1 day as critical', () => {
      const priority = classifyMaintenancePriority(-1);
      expect(priority).toBe('critical');
    });

    it('should use default lookahead days when not specified', () => {
      const items: MaintenanceItem[] = [
        {
          id: '1',
          equipment_id: 'eq-1',
          equipment_name: 'Truck 1',
          equipment_code: 'TRK-0001',
          maintenance_type: 'Oil Change',
          maintenance_type_id: 'type-1',
          due_date: futureDateArb(5),
          days_until_due: 5,
          is_overdue: false,
          priority: 'normal',
          trigger_type: 'days',
          current_reading: null,
          due_reading: null,
        },
        {
          id: '2',
          equipment_id: 'eq-2',
          equipment_name: 'Truck 2',
          equipment_code: 'TRK-0002',
          maintenance_type: 'Tire Rotation',
          maintenance_type_id: 'type-2',
          due_date: futureDateArb(10),
          days_until_due: 10,
          is_overdue: false,
          priority: 'normal',
          trigger_type: 'days',
          current_reading: null,
          due_reading: null,
        },
      ];
      
      const upcoming = getUpcomingMaintenanceItems(items);
      // Default is 7 days, so only the first item should be included
      expect(upcoming).toHaveLength(1);
      expect(upcoming[0].id).toBe('1');
    });
  });
});
