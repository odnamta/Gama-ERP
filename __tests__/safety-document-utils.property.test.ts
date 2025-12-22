// =====================================================
// v0.47: HSE - SAFETY DOCUMENTATION PROPERTY TESTS
// =====================================================

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateDocumentInput,
  validatePermitInput,
  validateJSAHazardInput,
  calculateExpiryDate,
  getValidityStatus,
  getDaysUntilExpiry,
  isExpiringSoon,
  getDocumentStatusColor,
  getDocumentStatusLabel,
  getPermitStatusColor,
  getPermitStatusLabel,
  getRiskLevelColor,
  getRiskLevelLabel,
  countByStatus,
  countByCategory,
  countExpiringDocuments,
  countPermitsByStatus,
  countPermitsByType,
  calculateAcknowledgmentRate,
  calculateDocumentStatistics,
  calculatePermitStatistics,
  canSubmitForReview,
  canApproveDocument,
  getNextDocumentStatuses,
  getNextPermitStatuses,
} from '@/lib/safety-document-utils';
import {
  DocumentStatus,
  PermitStatus,
  PermitType,
  RiskLevel,
  SafetyDocument,
  SafetyPermit,
  CreateDocumentInput,
  CreatePermitInput,
  JSAHazardInput,
  DocumentCategory,
} from '@/types/safety-document';

// =====================================================
// ARBITRARIES
// =====================================================

// Safe date arbitrary to avoid NaN issues
const safeDate = fc.integer({ min: 0, max: 3650 }).map(days => {
  const d = new Date('2024-01-01');
  d.setDate(d.getDate() + days);
  return d;
});

const safeDateString = safeDate.map(d => d.toISOString().split('T')[0]);

const documentStatusArb = fc.constantFrom<DocumentStatus>(
  'draft', 'pending_review', 'approved', 'expired', 'superseded', 'archived'
);

const permitStatusArb = fc.constantFrom<PermitStatus>(
  'pending', 'approved', 'active', 'completed', 'cancelled', 'expired'
);

const permitTypeArb = fc.constantFrom<PermitType>(
  'hot_work', 'confined_space', 'height_work', 'excavation', 'electrical', 'lifting'
);

const riskLevelArb = fc.constantFrom<RiskLevel>('low', 'medium', 'high', 'extreme');

const categoryArb: fc.Arbitrary<DocumentCategory> = fc.record({
  id: fc.uuid(),
  categoryCode: fc.stringMatching(/^[a-z_]+$/),
  categoryName: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.option(fc.string(), { nil: undefined }),
  requiresExpiry: fc.boolean(),
  defaultValidityDays: fc.option(fc.integer({ min: 1, max: 1095 }), { nil: undefined }),
  requiresApproval: fc.boolean(),
  isActive: fc.boolean(),
  displayOrder: fc.integer({ min: 0, max: 100 }),
  createdAt: safeDateString.map(d => d + 'T00:00:00Z'),
  updatedAt: safeDateString.map(d => d + 'T00:00:00Z'),
});

const documentArb: fc.Arbitrary<SafetyDocument> = fc.record({
  id: fc.uuid(),
  documentNumber: fc.stringMatching(/^[A-Z]+-\d{4}-\d{4}$/),
  categoryId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 255 }),
  description: fc.option(fc.string(), { nil: undefined }),
  version: fc.constant('1.0'),
  revisionNumber: fc.integer({ min: 1, max: 100 }),
  previousVersionId: fc.option(fc.uuid(), { nil: undefined }),
  content: fc.option(fc.string(), { nil: undefined }),
  fileUrl: fc.option(fc.webUrl(), { nil: undefined }),
  fileName: fc.option(fc.string(), { nil: undefined }),
  fileType: fc.option(fc.string(), { nil: undefined }),
  applicableLocations: fc.array(fc.string(), { maxLength: 5 }),
  applicableDepartments: fc.array(fc.string(), { maxLength: 5 }),
  applicableJobTypes: fc.array(fc.string(), { maxLength: 5 }),
  effectiveDate: safeDateString,
  expiryDate: fc.option(safeDateString, { nil: undefined }),
  status: documentStatusArb,
  preparedBy: fc.option(fc.uuid(), { nil: undefined }),
  preparedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  reviewedBy: fc.option(fc.uuid(), { nil: undefined }),
  reviewedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  approvedBy: fc.option(fc.uuid(), { nil: undefined }),
  approvedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  relatedDocuments: fc.array(fc.uuid(), { maxLength: 3 }),
  requiresAcknowledgment: fc.boolean(),
  createdBy: fc.option(fc.uuid(), { nil: undefined }),
  createdAt: safeDateString.map(d => d + 'T00:00:00Z'),
  updatedAt: safeDateString.map(d => d + 'T00:00:00Z'),
  categoryCode: fc.option(fc.stringMatching(/^[a-z_]+$/), { nil: undefined }),
  categoryName: fc.option(fc.string(), { nil: undefined }),
});

const permitArb: fc.Arbitrary<SafetyPermit> = fc.record({
  id: fc.uuid(),
  permitNumber: fc.stringMatching(/^PTW-\d{4}-\d{4}$/),
  documentId: fc.option(fc.uuid(), { nil: undefined }),
  permitType: permitTypeArb,
  workDescription: fc.string({ minLength: 1, maxLength: 500 }),
  workLocation: fc.string({ minLength: 1, maxLength: 255 }),
  jobOrderId: fc.option(fc.uuid(), { nil: undefined }),
  validFrom: safeDateString.map(d => d + 'T08:00:00Z'),
  validTo: safeDateString.map(d => d + 'T17:00:00Z'),
  specialPrecautions: fc.option(fc.string(), { nil: undefined }),
  requiredPPE: fc.array(fc.string(), { maxLength: 5 }),
  emergencyProcedures: fc.option(fc.string(), { nil: undefined }),
  requestedBy: fc.uuid(),
  requestedAt: safeDateString.map(d => d + 'T00:00:00Z'),
  supervisorApprovedBy: fc.option(fc.uuid(), { nil: undefined }),
  supervisorApprovedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  hseApprovedBy: fc.option(fc.uuid(), { nil: undefined }),
  hseApprovedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  status: permitStatusArb,
  closedBy: fc.option(fc.uuid(), { nil: undefined }),
  closedAt: fc.option(safeDateString.map(d => d + 'T00:00:00Z'), { nil: undefined }),
  closureNotes: fc.option(fc.string(), { nil: undefined }),
  createdAt: safeDateString.map(d => d + 'T00:00:00Z'),
  updatedAt: safeDateString.map(d => d + 'T00:00:00Z'),
});

// =====================================================
// PROPERTY 1: CATEGORY SETTINGS ENFORCEMENT
// =====================================================

describe('Property 1: Category Settings Enforcement', () => {
  it('should enforce expiry date when category requires it', () => {
    fc.assert(
      fc.property(
        fc.record({
          categoryId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }),
          effectiveDate: safeDateString,
        }),
        categoryArb.filter(c => c.requiresExpiry),
        (input, category) => {
          const docInput: CreateDocumentInput = {
            categoryId: input.categoryId,
            title: input.title,
            effectiveDate: input.effectiveDate,
            // No expiry date provided
          };
          
          const result = validateDocumentInput(docInput, category);
          
          // Should fail validation when category requires expiry but none provided
          expect(result.valid).toBe(false);
          expect(result.error).toContain('kadaluarsa');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate correct expiry date from effective date and validity days', () => {
    fc.assert(
      fc.property(
        safeDate,
        fc.integer({ min: 1, max: 1095 }),
        (effectiveDate, validityDays) => {
          const expiryDate = calculateExpiryDate(effectiveDate, validityDays);
          
          const expectedExpiry = new Date(effectiveDate);
          expectedExpiry.setDate(expectedExpiry.getDate() + validityDays);
          
          expect(expiryDate.getTime()).toBe(expectedExpiry.getTime());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should pass validation when expiry is provided for category that requires it', () => {
    fc.assert(
      fc.property(
        fc.record({
          categoryId: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          effectiveDate: safeDateString,
        }),
        fc.integer({ min: 30, max: 365 }),
        categoryArb.filter(c => c.requiresExpiry),
        (input, daysToAdd, category) => {
          const effectiveDate = new Date(input.effectiveDate);
          const expiryDate = new Date(effectiveDate);
          expiryDate.setDate(expiryDate.getDate() + daysToAdd);
          
          const docInput: CreateDocumentInput = {
            categoryId: input.categoryId,
            title: input.title,
            effectiveDate: input.effectiveDate,
            expiryDate: expiryDate.toISOString().split('T')[0],
          };
          
          const result = validateDocumentInput(docInput, category);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// PROPERTY 3: DOCUMENT CREATION VALIDATION
// =====================================================

describe('Property 3: Document Creation Validation', () => {
  it('should reject documents with missing title', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        safeDateString,
        (categoryId, effectiveDate) => {
          const input: CreateDocumentInput = {
            categoryId,
            title: '',
            effectiveDate,
          };
          
          const result = validateDocumentInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Judul');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject documents with missing categoryId', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        safeDateString,
        (title, effectiveDate) => {
          const input: CreateDocumentInput = {
            categoryId: '',
            title,
            effectiveDate,
          };
          
          const result = validateDocumentInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Kategori');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject documents with missing effectiveDate', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (categoryId, title) => {
          const input: CreateDocumentInput = {
            categoryId,
            title,
            effectiveDate: '',
          };
          
          const result = validateDocumentInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('efektif');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid document input', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        safeDateString,
        (categoryId, title, effectiveDate) => {
          const input: CreateDocumentInput = {
            categoryId,
            title,
            effectiveDate,
          };
          
          // Without category context, basic validation should pass
          const result = validateDocumentInput(input);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// PROPERTY 6: EXPIRY TRACKING ACCURACY
// =====================================================

describe('Property 6: Expiry Tracking Accuracy', () => {
  it('should return expired for dates in the past', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAgo) => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - daysAgo);
          
          const status = getValidityStatus(pastDate);
          expect(status).toBe('expired');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return expiring_soon for dates within 30 days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 29 }),
        (daysUntil) => {
          const futureDate = new Date();
          futureDate.setHours(0, 0, 0, 0);
          futureDate.setDate(futureDate.getDate() + daysUntil);
          
          const status = getValidityStatus(futureDate);
          expect(status).toBe('expiring_soon');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid for dates more than 30 days away', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 31, max: 365 }),
        (daysUntil) => {
          const futureDate = new Date();
          futureDate.setHours(0, 0, 0, 0);
          futureDate.setDate(futureDate.getDate() + daysUntil);
          
          const status = getValidityStatus(futureDate);
          expect(status).toBe('valid');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return valid for null expiry date', () => {
    const status = getValidityStatus(null);
    expect(status).toBe('valid');
  });

  it('should calculate correct days until expiry', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -365, max: 365 }),
        (daysOffset) => {
          const targetDate = new Date();
          targetDate.setHours(0, 0, 0, 0);
          targetDate.setDate(targetDate.getDate() + daysOffset);
          
          const days = getDaysUntilExpiry(targetDate);
          
          expect(days).toBe(daysOffset);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify expiring soon documents', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 60 }),
        fc.integer({ min: 1, max: 60 }),
        (daysUntil, threshold) => {
          const futureDate = new Date();
          futureDate.setHours(0, 0, 0, 0);
          futureDate.setDate(futureDate.getDate() + daysUntil);
          
          const result = isExpiringSoon(futureDate, threshold);
          
          expect(result).toBe(daysUntil <= threshold);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// PROPERTY 8: JSA HAZARD MANAGEMENT
// =====================================================

describe('Property 8: JSA Hazard Management', () => {
  it('should reject hazards with invalid step number', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (stepNumber, workStep, hazards, controlMeasures) => {
          const input: JSAHazardInput = {
            stepNumber,
            workStep,
            hazards,
            controlMeasures,
          };
          
          const result = validateJSAHazardInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('langkah');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject hazards with empty work step', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (stepNumber, hazards, controlMeasures) => {
          const input: JSAHazardInput = {
            stepNumber,
            workStep: '',
            hazards,
            controlMeasures,
          };
          
          const result = validateJSAHazardInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Langkah kerja');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject hazards with empty hazards field', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (stepNumber, workStep, controlMeasures) => {
          const input: JSAHazardInput = {
            stepNumber,
            workStep,
            hazards: '',
            controlMeasures,
          };
          
          const result = validateJSAHazardInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Bahaya');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject hazards with empty control measures', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        (stepNumber, workStep, hazards) => {
          const input: JSAHazardInput = {
            stepNumber,
            workStep,
            hazards,
            controlMeasures: '',
          };
          
          const result = validateJSAHazardInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('pengendalian');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid risk levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        riskLevelArb,
        (stepNumber, workStep, hazards, controlMeasures, riskLevel) => {
          const input: JSAHazardInput = {
            stepNumber,
            workStep,
            hazards,
            controlMeasures,
            riskLevel,
          };
          
          const result = validateJSAHazardInput(input);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// PROPERTY 9: PERMIT LIFECYCLE MANAGEMENT
// =====================================================

describe('Property 9: Permit Lifecycle Management', () => {
  it('should validate permit type is one of allowed values', () => {
    fc.assert(
      fc.property(
        permitTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        safeDateString,
        fc.integer({ min: 1, max: 24 }),
        (permitType, workDescription, workLocation, validFromDate, hoursValid) => {
          const validFrom = new Date(validFromDate);
          validFrom.setHours(8, 0, 0, 0);
          const validTo = new Date(validFrom);
          validTo.setHours(validFrom.getHours() + hoursValid);
          
          const input: CreatePermitInput = {
            permitType,
            workDescription,
            workLocation,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
          };
          
          const result = validatePermitInput(input);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject permits with empty work description', () => {
    fc.assert(
      fc.property(
        permitTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }),
        safeDateString,
        (permitType, workLocation, validFromDate) => {
          const validFrom = new Date(validFromDate);
          const validTo = new Date(validFrom);
          validTo.setHours(validTo.getHours() + 8);
          
          const input: CreatePermitInput = {
            permitType,
            workDescription: '',
            workLocation,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
          };
          
          const result = validatePermitInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Deskripsi');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject permits with empty work location', () => {
    fc.assert(
      fc.property(
        permitTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        safeDateString,
        (permitType, workDescription, validFromDate) => {
          const validFrom = new Date(validFromDate);
          const validTo = new Date(validFrom);
          validTo.setHours(validTo.getHours() + 8);
          
          const input: CreatePermitInput = {
            permitType,
            workDescription,
            workLocation: '',
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
          };
          
          const result = validatePermitInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Lokasi');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject permits where validTo is before validFrom', () => {
    fc.assert(
      fc.property(
        permitTypeArb,
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
        safeDateString,
        fc.integer({ min: 1, max: 24 }),
        (permitType, workDescription, workLocation, validFromDate, hoursBefore) => {
          const validFrom = new Date(validFromDate);
          validFrom.setHours(12, 0, 0, 0);
          const validTo = new Date(validFrom);
          validTo.setHours(validFrom.getHours() - hoursBefore);
          
          const input: CreatePermitInput = {
            permitType,
            workDescription,
            workLocation,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
          };
          
          const result = validatePermitInput(input);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('berakhir');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// PROPERTY 10: DASHBOARD STATISTICS ACCURACY
// =====================================================

describe('Property 10: Dashboard Statistics Accuracy', () => {
  it('should count total documents equal to sum of counts by status', () => {
    fc.assert(
      fc.property(
        fc.array(documentArb, { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculateDocumentStatistics(documents);
          const sumByStatus = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
          
          expect(stats.totalDocuments).toBe(documents.length);
          expect(sumByStatus).toBe(documents.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count approved documents correctly', () => {
    fc.assert(
      fc.property(
        fc.array(documentArb, { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculateDocumentStatistics(documents);
          const expectedApproved = documents.filter(d => d.status === 'approved').length;
          
          expect(stats.approvedDocuments).toBe(expectedApproved);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count pending review documents correctly', () => {
    fc.assert(
      fc.property(
        fc.array(documentArb, { minLength: 0, maxLength: 50 }),
        (documents) => {
          const stats = calculateDocumentStatistics(documents);
          const expectedPending = documents.filter(d => d.status === 'pending_review').length;
          
          expect(stats.pendingReview).toBe(expectedPending);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count permits by status correctly', () => {
    fc.assert(
      fc.property(
        fc.array(permitArb, { minLength: 0, maxLength: 50 }),
        (permits) => {
          const stats = calculatePermitStatistics(permits);
          const sumByStatus = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
          
          expect(stats.totalPermits).toBe(permits.length);
          expect(sumByStatus).toBe(permits.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should count active permits correctly', () => {
    fc.assert(
      fc.property(
        fc.array(permitArb, { minLength: 0, maxLength: 50 }),
        (permits) => {
          const stats = calculatePermitStatistics(permits);
          const expectedActive = permits.filter(p => p.status === 'active').length;
          
          expect(stats.activePermits).toBe(expectedActive);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate acknowledgment rate correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 1000 }),
        (total, acknowledged) => {
          const rate = calculateAcknowledgmentRate(total, acknowledged);
          
          // Rate should be between 0 and 100
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
          
          // Rate should be correct percentage
          const expectedRate = Math.min(100, Math.max(0, Math.round((acknowledged / total) * 10000) / 100));
          expect(rate).toBe(expectedRate);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return 0 acknowledgment rate for zero total', () => {
    const rate = calculateAcknowledgmentRate(0, 0);
    expect(rate).toBe(0);
  });
});

// =====================================================
// STATUS HELPER TESTS
// =====================================================

describe('Status Helper Functions', () => {
  it('should return valid color for all document statuses', () => {
    fc.assert(
      fc.property(documentStatusArb, (status) => {
        const color = getDocumentStatusColor(status);
        expect(color).toBeTruthy();
        expect(color).toContain('bg-');
        expect(color).toContain('text-');
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid label for all document statuses', () => {
    fc.assert(
      fc.property(documentStatusArb, (status) => {
        const label = getDocumentStatusLabel(status);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid color for all permit statuses', () => {
    fc.assert(
      fc.property(permitStatusArb, (status) => {
        const color = getPermitStatusColor(status);
        expect(color).toBeTruthy();
        expect(color).toContain('bg-');
        expect(color).toContain('text-');
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid label for all permit statuses', () => {
    fc.assert(
      fc.property(permitStatusArb, (status) => {
        const label = getPermitStatusLabel(status);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid color for all risk levels', () => {
    fc.assert(
      fc.property(riskLevelArb, (level) => {
        const color = getRiskLevelColor(level);
        expect(color).toBeTruthy();
        expect(color).toContain('bg-');
        expect(color).toContain('text-');
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid label for all risk levels', () => {
    fc.assert(
      fc.property(riskLevelArb, (level) => {
        const label = getRiskLevelLabel(level);
        expect(label).toBeTruthy();
        expect(label.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// =====================================================
// WORKFLOW HELPER TESTS
// =====================================================

describe('Workflow Helper Functions', () => {
  it('should only allow draft documents to be submitted for review', () => {
    fc.assert(
      fc.property(documentArb, (document) => {
        const canSubmit = canSubmitForReview(document);
        expect(canSubmit).toBe(document.status === 'draft');
      }),
      { numRuns: 100 }
    );
  });

  it('should only allow pending_review documents to be approved', () => {
    fc.assert(
      fc.property(documentArb, (document) => {
        const canApprove = canApproveDocument(document);
        expect(canApprove).toBe(document.status === 'pending_review');
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid next statuses for documents', () => {
    fc.assert(
      fc.property(documentStatusArb, (status) => {
        const nextStatuses = getNextDocumentStatuses(status);
        expect(Array.isArray(nextStatuses)).toBe(true);
        
        // Archived should have no next statuses
        if (status === 'archived') {
          expect(nextStatuses.length).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should return valid next statuses for permits', () => {
    fc.assert(
      fc.property(permitStatusArb, (status) => {
        const nextStatuses = getNextPermitStatuses(status);
        expect(Array.isArray(nextStatuses)).toBe(true);
        
        // Completed, cancelled, expired should have no next statuses
        if (['completed', 'cancelled', 'expired'].includes(status)) {
          expect(nextStatuses.length).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
