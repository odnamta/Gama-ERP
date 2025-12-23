// lib/phone-validation-utils.ts
// Indonesian phone number validation utilities for n8n Notification Workflows (v0.67)

import type { PhoneValidationResult } from '@/types/notification-workflows';

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validate and normalize Indonesian phone numbers
 * Supports +62 and 08 prefixes
 * Returns normalized +62 format
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, normalized: null, error: 'Phone number is required' };
  }

  // Remove all whitespace, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.length === 0) {
    return { valid: false, normalized: null, error: 'Phone number is required' };
  }

  // Check for valid Indonesian phone number patterns
  let normalized: string;

  // Pattern 1: +62xxxxxxxxxx (international format)
  if (cleaned.startsWith('+62')) {
    const digits = cleaned.slice(3);
    if (!isValidIndonesianDigits(digits)) {
      return { valid: false, normalized: null, error: 'Invalid Indonesian phone number format' };
    }
    normalized = '+62' + digits;
  }
  // Pattern 2: 62xxxxxxxxxx (international without +)
  else if (cleaned.startsWith('62') && cleaned.length >= 11) {
    const digits = cleaned.slice(2);
    if (!isValidIndonesianDigits(digits)) {
      return { valid: false, normalized: null, error: 'Invalid Indonesian phone number format' };
    }
    normalized = '+62' + digits;
  }
  // Pattern 3: 08xxxxxxxxxx (local format)
  else if (cleaned.startsWith('08')) {
    const digits = cleaned.slice(1); // Remove leading 0
    if (!isValidIndonesianDigits(digits)) {
      return { valid: false, normalized: null, error: 'Invalid Indonesian phone number format' };
    }
    normalized = '+62' + digits;
  }
  // Pattern 4: 8xxxxxxxxxx (without leading 0)
  else if (cleaned.startsWith('8') && cleaned.length >= 9) {
    if (!isValidIndonesianDigits(cleaned)) {
      return { valid: false, normalized: null, error: 'Invalid Indonesian phone number format' };
    }
    normalized = '+62' + cleaned;
  }
  else {
    return { valid: false, normalized: null, error: 'Phone number must start with +62, 62, 08, or 8' };
  }

  // Final validation of normalized number
  const finalDigits = normalized.slice(3);
  if (finalDigits.length < 9 || finalDigits.length > 12) {
    return { valid: false, normalized: null, error: 'Phone number must be 9-12 digits after country code' };
  }

  return { valid: true, normalized };
}

/**
 * Check if digits are valid Indonesian mobile number digits
 * Must start with 8 and contain only digits
 */
function isValidIndonesianDigits(digits: string): boolean {
  // Must contain only digits
  if (!/^\d+$/.test(digits)) {
    return false;
  }

  // Must start with 8 (Indonesian mobile numbers)
  if (!digits.startsWith('8')) {
    return false;
  }

  // Length check (9-12 digits for Indonesian mobile)
  if (digits.length < 9 || digits.length > 12) {
    return false;
  }

  return true;
}

// ============================================================================
// Phone Number Formatting
// ============================================================================

/**
 * Format phone number for display
 * Returns formatted string like +62 812-3456-7890
 */
export function formatPhoneNumber(phone: string): string {
  const result = validatePhoneNumber(phone);
  if (!result.valid || !result.normalized) {
    return phone; // Return original if invalid
  }

  const normalized = result.normalized;
  const digits = normalized.slice(3); // Remove +62

  // Format as +62 XXX-XXXX-XXXX or +62 XXX-XXXX-XXX
  if (digits.length >= 10) {
    return `+62 ${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else if (digits.length >= 9) {
    return `+62 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return normalized;
}

/**
 * Format phone number for WhatsApp API
 * Returns number without + prefix (e.g., 6281234567890)
 */
export function formatForWhatsApp(phone: string): string | null {
  const result = validatePhoneNumber(phone);
  if (!result.valid || !result.normalized) {
    return null;
  }

  // Remove + prefix for WhatsApp API
  return result.normalized.slice(1);
}

// ============================================================================
// Phone Number Utilities
// ============================================================================

/**
 * Check if a phone number is valid Indonesian number
 */
export function isValidIndonesianPhone(phone: string): boolean {
  return validatePhoneNumber(phone).valid;
}

/**
 * Extract country code from phone number
 */
export function getCountryCode(phone: string): string | null {
  const result = validatePhoneNumber(phone);
  if (!result.valid || !result.normalized) {
    return null;
  }
  return '+62';
}

/**
 * Get phone number without country code
 */
export function getLocalNumber(phone: string): string | null {
  const result = validatePhoneNumber(phone);
  if (!result.valid || !result.normalized) {
    return null;
  }
  return '0' + result.normalized.slice(3);
}

/**
 * Compare two phone numbers (normalized comparison)
 */
export function phoneNumbersEqual(phone1: string, phone2: string): boolean {
  const result1 = validatePhoneNumber(phone1);
  const result2 = validatePhoneNumber(phone2);

  if (!result1.valid || !result2.valid) {
    return false;
  }

  return result1.normalized === result2.normalized;
}

// ============================================================================
// Indonesian Carrier Detection (Optional)
// ============================================================================

type IndonesianCarrier = 'Telkomsel' | 'Indosat' | 'XL' | 'Tri' | 'Smartfren' | 'Unknown';

/**
 * Detect Indonesian mobile carrier from phone number
 * Based on prefix patterns
 */
export function detectCarrier(phone: string): IndonesianCarrier {
  const result = validatePhoneNumber(phone);
  if (!result.valid || !result.normalized) {
    return 'Unknown';
  }

  const digits = result.normalized.slice(3); // Remove +62
  const prefix = digits.slice(0, 3);

  // Telkomsel prefixes
  if (['811', '812', '813', '821', '822', '823', '851', '852', '853'].includes(prefix)) {
    return 'Telkomsel';
  }

  // Indosat prefixes
  if (['814', '815', '816', '855', '856', '857', '858'].includes(prefix)) {
    return 'Indosat';
  }

  // XL prefixes
  if (['817', '818', '819', '859', '877', '878'].includes(prefix)) {
    return 'XL';
  }

  // Tri prefixes
  if (['895', '896', '897', '898', '899'].includes(prefix)) {
    return 'Tri';
  }

  // Smartfren prefixes
  if (['881', '882', '883', '884', '885', '886', '887', '888', '889'].includes(prefix)) {
    return 'Smartfren';
  }

  return 'Unknown';
}
