/**
 * Attachment Utility Functions Tests
 * Property-based tests for file validation, path generation, and display helpers
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateStoragePath,
  validateFile,
  validateFiles,
  getFileIcon,
  formatFileSize,
  isImageType,
  isPdfType,
} from '@/lib/attachments/attachment-utils';
import { FileText, Image } from 'lucide-react';
import type { AttachmentEntityType } from '@/types/attachments';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_MB } from '@/types/attachments';

// Arbitrary for entity types
const entityTypeArb = fc.constantFrom<AttachmentEntityType>('pjo', 'jo', 'invoice', 'customer', 'project');

// Arbitrary for UUIDs
const uuidArb = fc.uuid();

// Arbitrary for filenames with extensions
const fileNameArb = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,50}$/),
  fc.constantFrom('pdf', 'jpg', 'jpeg', 'png', 'doc', 'txt')
).map(([name, ext]) => `${name}.${ext}`);

// Arbitrary for allowed MIME types
const allowedMimeTypeArb = fc.constantFrom(...ALLOWED_MIME_TYPES);

// Arbitrary for disallowed MIME types
const disallowedMimeTypeArb = fc.constantFrom(
  'text/plain',
  'application/json',
  'application/xml',
  'video/mp4',
  'audio/mpeg',
  'application/zip'
);

// Helper to create a mock File object
function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], name, { type });
}

describe('Attachment Utils', () => {
  /**
   * **Feature: document-attachments, Property 1: Storage path generation follows consistent format**
   * **Validates: Requirements 1.4, 2.3, 2.4, 3.3, 3.4**
   * 
   * For any entity type, entity ID, and filename, the generated storage path
   * SHALL follow the format `{entity_type}/{entity_id}/{filename}`.
   */
  describe('Property 1: Storage path generation follows consistent format', () => {
    it('should generate path in format {entityType}/{entityId}/{filename}', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          uuidArb,
          fileNameArb,
          (entityType, entityId, fileName) => {
            const path = generateStoragePath(entityType, entityId, fileName);
            
            // Path should start with entity type
            expect(path.startsWith(`${entityType}/`)).toBe(true);
            
            // Path should contain entity ID
            expect(path.includes(`/${entityId}/`)).toBe(true);
            
            // Path should have exactly 2 slashes (3 parts)
            const parts = path.split('/');
            expect(parts.length).toBe(3);
            expect(parts[0]).toBe(entityType);
            expect(parts[1]).toBe(entityId);
            
            // Filename part should exist and have an extension
            expect(parts[2].length).toBeGreaterThan(0);
            expect(parts[2].includes('.')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sanitize special characters in filename', () => {
      fc.assert(
        fc.property(
          entityTypeArb,
          uuidArb,
          fc.string({ minLength: 1, maxLength: 50 }),
          (entityType, entityId, rawName) => {
            const fileName = `${rawName}.pdf`;
            const path = generateStoragePath(entityType, entityId, fileName);
            const parts = path.split('/');
            const generatedFileName = parts[2];
            
            // Generated filename should not contain problematic characters
            expect(generatedFileName).not.toMatch(/[<>:"|?*\\]/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: document-attachments, Property 2: File type validation correctly identifies allowed types**
   * **Validates: Requirements 4.1, 4.2**
   * 
   * For any file, the validation function SHALL return valid=true if and only if
   * the file's MIME type is in the allowed types list.
   */
  describe('Property 2: File type validation correctly identifies allowed types', () => {
    it('should accept files with allowed MIME types', () => {
      fc.assert(
        fc.property(
          allowedMimeTypeArb,
          fileNameArb,
          fc.integer({ min: 1, max: 10000 }), // Small files for fast tests
          (mimeType, fileName, size) => {
            const file = createMockFile(fileName, mimeType, size);
            const result = validateFile(file);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files with disallowed MIME types', () => {
      fc.assert(
        fc.property(
          disallowedMimeTypeArb,
          fileNameArb,
          fc.integer({ min: 1, max: 1000 }),
          (mimeType, fileName, size) => {
            const file = createMockFile(fileName, mimeType, size);
            const result = validateFile(file);
            
            expect(result.valid).toBe(false);
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('File type not allowed');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: document-attachments, Property 3: File size validation correctly enforces limits**
   * **Validates: Requirements 4.3, 4.4**
   * 
   * For any file, the validation function SHALL return valid=true if and only if
   * the file size is less than or equal to the maximum allowed size.
   */
  describe('Property 3: File size validation correctly enforces limits', () => {
    // Use a smaller custom limit for testing to avoid creating large files
    const testMaxMB = 1; // 1MB for testing
    const testMaxBytes = testMaxMB * 1024 * 1024;

    it('should accept files within size limit', () => {
      fc.assert(
        fc.property(
          allowedMimeTypeArb,
          fileNameArb,
          fc.integer({ min: 1, max: 10000 }), // Small files for fast tests
          (mimeType, fileName, size) => {
            const file = createMockFile(fileName, mimeType, size);
            const result = validateFile(file, ALLOWED_MIME_TYPES, testMaxMB);
            
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files exceeding size limit', () => {
      fc.assert(
        fc.property(
          allowedMimeTypeArb,
          fileNameArb,
          // Generate sizes just over the limit
          fc.integer({ min: testMaxBytes + 1, max: testMaxBytes + 10000 }),
          (mimeType, fileName, size) => {
            const file = createMockFile(fileName, mimeType, size);
            const result = validateFile(file, ALLOWED_MIME_TYPES, testMaxMB);
            
            expect(result.valid).toBe(false);
            expect(result.error).not.toBeNull();
            expect(result.error).toContain('exceeds');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify boundary cases', () => {
      // Exactly at limit should pass
      const atLimitFile = createMockFile('test.pdf', 'application/pdf', testMaxBytes);
      expect(validateFile(atLimitFile, ALLOWED_MIME_TYPES, testMaxMB).valid).toBe(true);
      
      // One byte over should fail
      const overLimitFile = createMockFile('test.pdf', 'application/pdf', testMaxBytes + 1);
      expect(validateFile(overLimitFile, ALLOWED_MIME_TYPES, testMaxMB).valid).toBe(false);
    });
  });


  /**
   * **Feature: document-attachments, Property 4: Batch validation validates each file independently**
   * **Validates: Requirements 4.6**
   * 
   * For any array of files, the batch validation result SHALL be the conjunction
   * of individual file validations, with errors mapped to each invalid file.
   */
  describe('Property 4: Batch validation validates each file independently', () => {
    it('should validate each file and map errors correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.oneof(allowedMimeTypeArb, disallowedMimeTypeArb),
              fileNameArb,
              fc.integer({ min: 1, max: 10000 }) // Small files for fast tests
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (fileSpecs) => {
            const files = fileSpecs.map(([type, name, size]) => 
              createMockFile(name, type, size)
            );
            
            const batchResult = validateFiles(files);
            
            // Check each file individually
            let expectedValid = true;
            for (const file of files) {
              const individualResult = validateFile(file);
              if (!individualResult.valid) {
                expectedValid = false;
                // Error should be in the batch errors map
                expect(batchResult.errors.has(file.name)).toBe(true);
              }
            }
            
            expect(batchResult.valid).toBe(expectedValid);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid=true when all files are valid', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              allowedMimeTypeArb,
              fileNameArb,
              fc.integer({ min: 1, max: 10000 }) // Small files for fast tests
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (fileSpecs) => {
            const files = fileSpecs.map(([type, name, size]) => 
              createMockFile(name, type, size)
            );
            
            const result = validateFiles(files);
            
            expect(result.valid).toBe(true);
            expect(result.errors.size).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: document-attachments, Property 5: File icon selection returns correct icon for MIME type**
   * **Validates: Requirements 5.3, 5.4**
   * 
   * For any MIME type, the icon selection function SHALL return a document icon
   * for PDFs and an image icon for image types.
   */
  describe('Property 5: File icon selection returns correct icon for MIME type', () => {
    it('should return Image icon for image MIME types', () => {
      const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...imageMimeTypes),
          (mimeType) => {
            const icon = getFileIcon(mimeType);
            expect(icon).toBe(Image);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return FileText icon for PDF and other types', () => {
      const nonImageTypes = ['application/pdf', 'text/plain', 'application/json', null];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...nonImageTypes),
          (mimeType) => {
            const icon = getFileIcon(mimeType);
            expect(icon).toBe(FileText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Additional unit tests for helper functions
  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(2621440)).toBe('2.5 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });
  });

  describe('isImageType', () => {
    it('should return true for image MIME types', () => {
      expect(isImageType('image/jpeg')).toBe(true);
      expect(isImageType('image/png')).toBe(true);
      expect(isImageType('image/gif')).toBe(true);
    });

    it('should return false for non-image MIME types', () => {
      expect(isImageType('application/pdf')).toBe(false);
      expect(isImageType('text/plain')).toBe(false);
      expect(isImageType(null)).toBe(false);
    });
  });

  describe('isPdfType', () => {
    it('should return true for PDF MIME type', () => {
      expect(isPdfType('application/pdf')).toBe(true);
    });

    it('should return false for non-PDF MIME types', () => {
      expect(isPdfType('image/jpeg')).toBe(false);
      expect(isPdfType('text/plain')).toBe(false);
      expect(isPdfType(null)).toBe(false);
    });
  });
});
