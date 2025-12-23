// __tests__/phone-validation-utils.property.test.ts
// Property-based tests for phone validation utilities (v0.67)

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validatePhoneNumber,
  formatPhoneNumber,
  formatForWhatsApp,
  isValidIndonesianPhone,
  getCountryCode,
  getLocalNumber,
  phoneNumbersEqual,
  detectCarrier,
} from '@/lib/phone-validation-utils';

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

// Valid Indonesian mobile number digits (9-12 digits starting with 8)
const validIndonesianDigitsArb = fc.tuple(
  fc.constantFrom('81', '82', '83', '85', '87', '88', '89'), // Valid prefixes
  fc.stringMatching(/^[0-9]{7,10}$/) // 7-10 more digits
).map(([prefix, rest]) => prefix + rest);

// Valid phone number in +62 format
const validPlus62Arb = validIndonesianDigitsArb.map(digits => '+62' + digits);

// Valid phone number in 62 format (without +)
const valid62Arb = validIndonesianDigitsArb.map(digits => '62' + digits);

// Valid phone number in 08 format
const valid08Arb = validIndonesianDigitsArb.map(digits => '0' + digits);

// Valid phone number in 8 format (without leading 0)
const valid8Arb = validIndonesianDigitsArb;

// Any valid Indonesian phone format
const validPhoneArb = fc.oneof(validPlus62Arb, valid62Arb, valid08Arb, valid8Arb);

// Invalid phone numbers
const invalidPhoneArb = fc.oneof(
  fc.constant(''),
  fc.constant('123'),
  fc.constant('+1234567890'), // Non-Indonesian
  fc.constant('0712345678'), // Wrong prefix (07)
  fc.constant('+62123'), // Too short
  fc.stringMatching(/^[a-zA-Z]+$/), // Letters only
);

// ============================================================================
// Property 9: Phone Validation and Normalization
// ============================================================================

describe('Property 9: Phone Validation and Normalization', () => {
  it('valid +62 format returns valid=true and normalizes correctly', () => {
    fc.assert(
      fc.property(validPlus62Arb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        expect(result.valid).toBe(true);
        expect(result.normalized).not.toBeNull();
        expect(result.normalized).toMatch(/^\+62/);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('valid 62 format (without +) normalizes to +62', () => {
    fc.assert(
      fc.property(valid62Arb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        expect(result.valid).toBe(true);
        expect(result.normalized).not.toBeNull();
        expect(result.normalized).toMatch(/^\+62/);
      }),
      { numRuns: 100 }
    );
  });

  it('valid 08 format normalizes to +62', () => {
    fc.assert(
      fc.property(valid08Arb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        expect(result.valid).toBe(true);
        expect(result.normalized).not.toBeNull();
        expect(result.normalized).toMatch(/^\+62/);
        // Should not contain leading 0 after +62
        expect(result.normalized).not.toMatch(/^\+620/);
      }),
      { numRuns: 100 }
    );
  });

  it('valid 8 format (without 0) normalizes to +62', () => {
    fc.assert(
      fc.property(valid8Arb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        expect(result.valid).toBe(true);
        expect(result.normalized).not.toBeNull();
        expect(result.normalized).toMatch(/^\+62/);
      }),
      { numRuns: 100 }
    );
  });

  it('invalid phone numbers return valid=false with error message', () => {
    fc.assert(
      fc.property(invalidPhoneArb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        expect(result.valid).toBe(false);
        expect(result.normalized).toBeNull();
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }),
      { numRuns: 50 }
    );
  });

  it('all valid formats normalize to the same result', () => {
    fc.assert(
      fc.property(validIndonesianDigitsArb, (digits) => {
        const plus62 = validatePhoneNumber('+62' + digits);
        const just62 = validatePhoneNumber('62' + digits);
        const with08 = validatePhoneNumber('0' + digits);
        const just8 = validatePhoneNumber(digits);

        // All should be valid
        expect(plus62.valid).toBe(true);
        expect(just62.valid).toBe(true);
        expect(with08.valid).toBe(true);
        expect(just8.valid).toBe(true);

        // All should normalize to the same value
        expect(plus62.normalized).toBe(just62.normalized);
        expect(plus62.normalized).toBe(with08.normalized);
        expect(plus62.normalized).toBe(just8.normalized);
      }),
      { numRuns: 100 }
    );
  });

  it('normalized number has correct length (12-15 chars including +62)', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const result = validatePhoneNumber(phone);
        
        if (result.valid && result.normalized) {
          // +62 (3 chars) + 9-12 digits = 12-15 total
          expect(result.normalized.length).toBeGreaterThanOrEqual(12);
          expect(result.normalized.length).toBeLessThanOrEqual(15);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Phone Number Formatting Tests
// ============================================================================

describe('Phone Number Formatting', () => {
  it('formatPhoneNumber returns formatted string for valid numbers', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const formatted = formatPhoneNumber(phone);
        
        // Should contain +62
        expect(formatted).toContain('+62');
        // Should contain dashes for formatting
        expect(formatted).toContain('-');
      }),
      { numRuns: 100 }
    );
  });

  it('formatPhoneNumber returns original for invalid numbers', () => {
    fc.assert(
      fc.property(invalidPhoneArb, (phone) => {
        const formatted = formatPhoneNumber(phone);
        expect(formatted).toBe(phone);
      }),
      { numRuns: 50 }
    );
  });

  it('formatForWhatsApp returns number without + prefix', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const waFormat = formatForWhatsApp(phone);
        
        expect(waFormat).not.toBeNull();
        if (waFormat) {
          expect(waFormat).toMatch(/^62/);
          expect(waFormat).not.toContain('+');
          // Should be all digits
          expect(waFormat).toMatch(/^\d+$/);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('formatForWhatsApp returns null for invalid numbers', () => {
    fc.assert(
      fc.property(invalidPhoneArb, (phone) => {
        const waFormat = formatForWhatsApp(phone);
        expect(waFormat).toBeNull();
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Phone Number Utility Tests
// ============================================================================

describe('Phone Number Utilities', () => {
  it('isValidIndonesianPhone matches validatePhoneNumber.valid', () => {
    fc.assert(
      fc.property(fc.oneof(validPhoneArb, invalidPhoneArb), (phone) => {
        const isValid = isValidIndonesianPhone(phone);
        const result = validatePhoneNumber(phone);
        
        expect(isValid).toBe(result.valid);
      }),
      { numRuns: 100 }
    );
  });

  it('getCountryCode returns +62 for valid Indonesian numbers', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const countryCode = getCountryCode(phone);
        expect(countryCode).toBe('+62');
      }),
      { numRuns: 100 }
    );
  });

  it('getCountryCode returns null for invalid numbers', () => {
    fc.assert(
      fc.property(invalidPhoneArb, (phone) => {
        const countryCode = getCountryCode(phone);
        expect(countryCode).toBeNull();
      }),
      { numRuns: 50 }
    );
  });

  it('getLocalNumber returns 0-prefixed number', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const localNumber = getLocalNumber(phone);
        
        expect(localNumber).not.toBeNull();
        if (localNumber) {
          expect(localNumber).toMatch(/^0/);
          expect(localNumber).toMatch(/^0\d+$/);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('phoneNumbersEqual returns true for same number in different formats', () => {
    fc.assert(
      fc.property(validIndonesianDigitsArb, (digits) => {
        const plus62 = '+62' + digits;
        const just62 = '62' + digits;
        const with08 = '0' + digits;
        const just8 = digits;

        // All combinations should be equal
        expect(phoneNumbersEqual(plus62, just62)).toBe(true);
        expect(phoneNumbersEqual(plus62, with08)).toBe(true);
        expect(phoneNumbersEqual(plus62, just8)).toBe(true);
        expect(phoneNumbersEqual(just62, with08)).toBe(true);
        expect(phoneNumbersEqual(just62, just8)).toBe(true);
        expect(phoneNumbersEqual(with08, just8)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('phoneNumbersEqual returns false for different numbers', () => {
    fc.assert(
      fc.property(
        validIndonesianDigitsArb,
        validIndonesianDigitsArb,
        (digits1, digits2) => {
          // Only test if digits are actually different
          if (digits1 !== digits2) {
            expect(phoneNumbersEqual('+62' + digits1, '+62' + digits2)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('phoneNumbersEqual returns false when either number is invalid', () => {
    fc.assert(
      fc.property(validPhoneArb, invalidPhoneArb, (valid, invalid) => {
        expect(phoneNumbersEqual(valid, invalid)).toBe(false);
        expect(phoneNumbersEqual(invalid, valid)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });
});

// ============================================================================
// Carrier Detection Tests
// ============================================================================

describe('Carrier Detection', () => {
  it('detectCarrier returns valid carrier for valid numbers', () => {
    fc.assert(
      fc.property(validPhoneArb, (phone) => {
        const carrier = detectCarrier(phone);
        
        expect(['Telkomsel', 'Indosat', 'XL', 'Tri', 'Smartfren', 'Unknown']).toContain(carrier);
      }),
      { numRuns: 100 }
    );
  });

  it('detectCarrier returns Unknown for invalid numbers', () => {
    fc.assert(
      fc.property(invalidPhoneArb, (phone) => {
        const carrier = detectCarrier(phone);
        expect(carrier).toBe('Unknown');
      }),
      { numRuns: 50 }
    );
  });

  it('Telkomsel prefixes detected correctly', () => {
    const telkomselPrefixes = ['811', '812', '813', '821', '822', '823', '851', '852', '853'];
    for (const prefix of telkomselPrefixes) {
      const phone = '+62' + prefix + '1234567';
      expect(detectCarrier(phone)).toBe('Telkomsel');
    }
  });

  it('Indosat prefixes detected correctly', () => {
    const indosatPrefixes = ['814', '815', '816', '855', '856', '857', '858'];
    for (const prefix of indosatPrefixes) {
      const phone = '+62' + prefix + '1234567';
      expect(detectCarrier(phone)).toBe('Indosat');
    }
  });

  it('XL prefixes detected correctly', () => {
    const xlPrefixes = ['817', '818', '819', '859', '877', '878'];
    for (const prefix of xlPrefixes) {
      const phone = '+62' + prefix + '1234567';
      expect(detectCarrier(phone)).toBe('XL');
    }
  });

  it('Tri prefixes detected correctly', () => {
    const triPrefixes = ['895', '896', '897', '898', '899'];
    for (const prefix of triPrefixes) {
      const phone = '+62' + prefix + '1234567';
      expect(detectCarrier(phone)).toBe('Tri');
    }
  });

  it('Smartfren prefixes detected correctly', () => {
    const smartfrenPrefixes = ['881', '882', '883', '884', '885', '886', '887', '888', '889'];
    for (const prefix of smartfrenPrefixes) {
      const phone = '+62' + prefix + '1234567';
      expect(detectCarrier(phone)).toBe('Smartfren');
    }
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('handles phone numbers with spaces and dashes', () => {
    const variations = [
      '+62 812 3456 7890',
      '+62-812-3456-7890',
      '+62 812-3456-7890',
      '0812 3456 7890',
      '0812-3456-7890',
    ];

    for (const phone of variations) {
      const result = validatePhoneNumber(phone);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('+628123456789' + '0');
    }
  });

  it('handles phone numbers with parentheses', () => {
    const result = validatePhoneNumber('(+62) 812 3456 7890');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+6281234567890');
  });

  it('rejects null and undefined', () => {
    expect(validatePhoneNumber(null as unknown as string).valid).toBe(false);
    expect(validatePhoneNumber(undefined as unknown as string).valid).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(validatePhoneNumber(12345 as unknown as string).valid).toBe(false);
    expect(validatePhoneNumber({} as unknown as string).valid).toBe(false);
  });

  it('rejects numbers that are too short', () => {
    expect(validatePhoneNumber('+6281234').valid).toBe(false);
    expect(validatePhoneNumber('081234').valid).toBe(false);
  });

  it('rejects numbers that are too long', () => {
    expect(validatePhoneNumber('+6281234567890123').valid).toBe(false);
  });

  it('rejects non-mobile prefixes', () => {
    // Landline prefix (021 for Jakarta)
    expect(validatePhoneNumber('+62211234567').valid).toBe(false);
    // Invalid mobile prefix
    expect(validatePhoneNumber('+62712345678').valid).toBe(false);
  });
});
