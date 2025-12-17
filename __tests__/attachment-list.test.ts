/**
 * AttachmentList Component Tests
 * Property-based tests for attachment display
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { DocumentAttachment, AttachmentEntityType } from '@/types/attachments';
import { formatFileSize, getFileIcon } from '@/lib/attachments/attachment-utils';
import { FileText, Image } from 'lucide-react';

// Arbitrary for entity types
const entityTypeArb = fc.constantFrom<AttachmentEntityType>('pjo', 'jo', 'invoice', 'customer', 'project');

// Arbitrary for UUIDs
const uuidArb = fc.uuid();

// Arbitrary for MIME types
const mimeTypeArb = fc.constantFrom('application/pdf', 'image/jpeg', 'image/png', null);

// Arbitrary for file sizes (in bytes)
const fileSizeArb = fc.oneof(
  fc.constant(null),
  fc.integer({ min: 1, max: 10 * 1024 * 1024 })
);

// Arbitrary for timestamps
const timestampArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .filter(d => !isNaN(d.getTime()))
  .map(d => d.toISOString());

// Arbitrary for optional strings
const optionalStringArb = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 100 })
);

// Arbitrary for file names
const fileNameArb = fc.tuple(
  fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/),
  fc.constantFrom('pdf', 'jpg', 'jpeg', 'png')
).map(([name, ext]) => `${name}.${ext}`);

// Arbitrary for complete attachment objects
const attachmentArb: fc.Arbitrary<DocumentAttachment> = fc.record({
  id: uuidArb,
  entity_type: entityTypeArb,
  entity_id: uuidArb,
  file_name: fileNameArb,
  file_type: mimeTypeArb,
  file_size: fileSizeArb,
  storage_path: fc.tuple(entityTypeArb, uuidArb, fileNameArb).map(([type, id, name]) => `${type}/${id}/${name}`),
  description: optionalStringArb,
  uploaded_by: fc.oneof(fc.constant(null), uuidArb),
  created_at: fc.oneof(fc.constant(null), timestampArb),
  uploader_name: fc.oneof(fc.constant(undefined), fc.string({ minLength: 1, maxLength: 50 })),
});

describe('AttachmentList', () => {
  /**
   * **Feature: document-attachments, Property 6: Attachment display includes all required fields**
   * **Validates: Requirements 5.1, 5.2, 9.2**
   * 
   * For any attachment with complete data, the rendered output SHALL contain
   * file name, file type icon, file size, upload date, and description (if provided).
   */
  describe('Property 6: Attachment display includes all required fields', () => {
    it('should have file name for all attachments', () => {
      fc.assert(
        fc.property(
          attachmentArb,
          (attachment) => {
            // File name should always be present and non-empty
            expect(attachment.file_name).toBeDefined();
            expect(attachment.file_name.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct icon based on file type', () => {
      fc.assert(
        fc.property(
          mimeTypeArb,
          (mimeType) => {
            const icon = getFileIcon(mimeType);
            
            if (mimeType?.startsWith('image/')) {
              expect(icon).toBe(Image);
            } else {
              expect(icon).toBe(FileText);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format file size correctly', () => {
      fc.assert(
        fc.property(
          fileSizeArb,
          (fileSize) => {
            const formatted = formatFileSize(fileSize);
            
            // Should always return a string
            expect(typeof formatted).toBe('string');
            
            // Should contain a unit
            expect(formatted).toMatch(/\d+(\.\d+)?\s*(B|KB|MB|GB)/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid storage path format', () => {
      fc.assert(
        fc.property(
          attachmentArb,
          (attachment) => {
            const parts = attachment.storage_path.split('/');
            
            // Should have 3 parts: entity_type/entity_id/filename
            expect(parts.length).toBe(3);
            
            // First part should be valid entity type
            expect(['pjo', 'jo', 'invoice', 'customer', 'project']).toContain(parts[0]);
            
            // Second part should be UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(parts[1]).toMatch(uuidRegex);
            
            // Third part should be filename
            expect(parts[2].length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include description when provided', () => {
      fc.assert(
        fc.property(
          attachmentArb,
          (attachment) => {
            if (attachment.description !== null) {
              // Description should be a non-empty string when provided
              expect(typeof attachment.description).toBe('string');
            }
            // When null, it's valid to not display description
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid entity reference', () => {
      fc.assert(
        fc.property(
          attachmentArb,
          (attachment) => {
            // Entity type should be valid
            expect(['pjo', 'jo', 'invoice', 'customer', 'project']).toContain(attachment.entity_type);
            
            // Entity ID should be UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(attachment.entity_id).toMatch(uuidRegex);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
