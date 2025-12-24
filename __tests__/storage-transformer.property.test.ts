// =====================================================
// v0.69: STORAGE TRANSFORMER PROPERTY TESTS
// Property 8: Folder Structure Generation
// Validates: Requirements 5.3, 5.5
// =====================================================
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateFolderPath,
  generateFolderPathSegments,
  transformDocumentMetadata,
  createFolderMetadata,
  createSyncedDocumentRecord,
  formatEntityTypeFolder,
  formatDocumentTypeFolder,
  generateEntityFolderName,
  generateDriveFileName,
  sanitizeFolderName,
  sanitizeFileName,
  getFileExtension,
  validateDocumentForSync,
  validateFolderConfig,
  getMimeTypeFromExtension,
  formatFileSize,
  isPreviewSupported,
  generateDriveWebViewUrl,
  generateDriveDownloadUrl,
  generateDriveFolderUrl,
  type GamaDocument,
  type DocumentType,
  type EntityType,
  type FolderStructureConfig,
  type FolderNamingPattern,
} from '@/lib/storage-transformer';

// =====================================================
// ARBITRARIES (Test Data Generators)
// =====================================================

// UUID generator
const uuidArb = fc.uuid();

// Timestamp generator
const timestampArb = fc.integer({ min: 1577836800000, max: 1924905600000 })
  .map(ts => new Date(ts).toISOString());

// Document type generator
const documentTypeArb: fc.Arbitrary<DocumentType> = fc.constantFrom(
  'invoice', 'quotation', 'pjo', 'job_order', 'surat_jalan',
  'berita_acara', 'contract', 'permit', 'certificate', 'photo', 'report', 'other'
);

// Entity type generator
const entityTypeArb: fc.Arbitrary<EntityType> = fc.constantFrom(
  'customer', 'project', 'quotation', 'pjo', 'job_order',
  'invoice', 'asset', 'employee', 'vendor'
);

// Folder naming pattern generator
const folderNamingPatternArb: fc.Arbitrary<FolderNamingPattern> = fc.constantFrom(
  'entity_name', 'entity_id', 'entity_code', 'date_entity'
);

// MIME type generator
const mimeTypeArb = fc.constantFrom(
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
);

// File name generator
const fileNameArb = fc.tuple(
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0 && !/[<>:"/\\|?*]/.test(s)),
  fc.constantFrom('.pdf', '.jpg', '.png', '.docx', '.xlsx', '.txt')
).map(([name, ext]) => `${name}${ext}`);

// Gama document generator
const gamaDocumentArb: fc.Arbitrary<GamaDocument> = fc.record({
  id: uuidArb,
  document_type: documentTypeArb,
  document_name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  file_name: fileNameArb,
  file_size: fc.integer({ min: 1, max: 100000000 }),
  mime_type: mimeTypeArb,
  local_path: fc.string({ minLength: 1, maxLength: 200 }),
  folder_path: fc.string({ minLength: 1, maxLength: 200 }),
  entity_type: entityTypeArb,
  entity_id: uuidArb,
  entity_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { nil: undefined }),
  uploaded_by: fc.option(uuidArb, { nil: null }),
  uploaded_at: timestampArb,
  description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
  tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }), { nil: undefined }),
});

// Folder structure config generator
const folderConfigArb: fc.Arbitrary<FolderStructureConfig> = fc.record({
  root_folder_id: uuidArb,
  root_folder_name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  use_year_folders: fc.boolean(),
  use_month_folders: fc.boolean(),
  use_entity_folders: fc.boolean(),
  folder_naming_pattern: folderNamingPatternArb,
});

// =====================================================
// PROPERTY TESTS
// =====================================================

describe('Storage Transformer Property Tests', () => {
  describe('Property 8: Folder Structure Generation', () => {
    /**
     * Property: For any document with a local folder path, the generated Google Drive path
     * SHALL match the local organization structure.
     * Validates: Requirements 5.3
     */
    it('generates folder path starting with root folder name', () => {
      fc.assert(
        fc.property(gamaDocumentArb, folderConfigArb, (document, config) => {
          const path = generateFolderPath(document, config);

          // Path should start with root folder name
          expect(path.startsWith(config.root_folder_name)).toBe(true);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('generates folder path with year folder when configured', () => {
      fc.assert(
        fc.property(
          gamaDocumentArb,
          folderConfigArb.map(c => ({ ...c, use_year_folders: true })),
          (document, config) => {
            const path = generateFolderPath(document, config);
            const year = new Date(document.uploaded_at).getFullYear().toString();

            // Path should contain the year
            expect(path).toContain(year);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates folder path with entity type folder when configured', () => {
      fc.assert(
        fc.property(
          gamaDocumentArb,
          folderConfigArb.map(c => ({ ...c, use_entity_folders: true })),
          (document, config) => {
            const path = generateFolderPath(document, config);
            const entityFolder = formatEntityTypeFolder(document.entity_type);

            // Path should contain the entity type folder
            expect(path).toContain(entityFolder);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('generates folder path with document type folder', () => {
      fc.assert(
        fc.property(gamaDocumentArb, folderConfigArb, (document, config) => {
          const path = generateFolderPath(document, config);
          const docTypeFolder = formatDocumentTypeFolder(document.document_type);

          // Path should contain the document type folder
          expect(path).toContain(docTypeFolder);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('generates path segments as array', () => {
      fc.assert(
        fc.property(gamaDocumentArb, folderConfigArb, (document, config) => {
          const segments = generateFolderPathSegments(document, config);

          // Should return non-empty array
          expect(Array.isArray(segments)).toBe(true);
          expect(segments.length).toBeGreaterThan(0);

          // First segment should contain root folder name (may be trimmed/sanitized)
          // The path is split by '/', so if root_folder_name contains '/', it will be split
          const fullPath = generateFolderPath(document, config);
          const expectedSegments = fullPath.split('/').filter(s => s.length > 0);
          expect(segments).toEqual(expectedSegments);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Document Metadata Transformation', () => {
    /**
     * Property: Synced documents SHALL include sync_status and external_file_link fields.
     * Validates: Requirements 5.5
     */
    it('transforms document metadata with all required fields', () => {
      fc.assert(
        fc.property(gamaDocumentArb, uuidArb, (document, parentFolderId) => {
          const metadata = transformDocumentMetadata(document, parentFolderId);

          // Verify all required fields
          expect(metadata).toHaveProperty('name');
          expect(metadata).toHaveProperty('mimeType');
          expect(metadata).toHaveProperty('parents');
          expect(metadata).toHaveProperty('properties');

          // Verify parent folder is set
          expect(metadata.parents).toContain(parentFolderId);

          // Verify MIME type is preserved
          expect(metadata.mimeType).toBe(document.mime_type);

          // Verify properties contain Gama document info
          expect(metadata.properties?.gama_document_id).toBe(document.id);
          expect(metadata.properties?.gama_entity_type).toBe(document.entity_type);
          expect(metadata.properties?.gama_entity_id).toBe(document.entity_id);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('creates synced document record with links', () => {
      fc.assert(
        fc.property(uuidArb, uuidArb, uuidArb, (localId, driveFileId, driveFolderId) => {
          const record = createSyncedDocumentRecord(localId, driveFileId, driveFolderId);

          // Verify all required fields
          expect(record.local_id).toBe(localId);
          expect(record.drive_file_id).toBe(driveFileId);
          expect(record.drive_folder_id).toBe(driveFolderId);
          expect(record.sync_status).toBe('synced');

          // Verify links are generated
          expect(record.drive_web_link).toContain(driveFileId);
          expect(record.drive_download_link).toContain(driveFileId);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Folder Metadata Creation', () => {
    it('creates folder metadata with correct MIME type', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          uuidArb,
          (folderName, parentId) => {
            const metadata = createFolderMetadata(folderName, parentId);

            expect(metadata.name).toBe(folderName);
            expect(metadata.mimeType).toBe('application/vnd.google-apps.folder');
            expect(metadata.parents).toContain(parentId);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Entity Type Formatting', () => {
    it('formats all entity types to human-readable names', () => {
      const entityTypes: EntityType[] = [
        'customer', 'project', 'quotation', 'pjo', 'job_order',
        'invoice', 'asset', 'employee', 'vendor'
      ];

      entityTypes.forEach(type => {
        const formatted = formatEntityTypeFolder(type);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
        // Should be capitalized
        expect(formatted[0]).toBe(formatted[0].toUpperCase());
      });
    });
  });

  describe('Document Type Formatting', () => {
    it('formats all document types to human-readable names', () => {
      const documentTypes: DocumentType[] = [
        'invoice', 'quotation', 'pjo', 'job_order', 'surat_jalan',
        'berita_acara', 'contract', 'permit', 'certificate', 'photo', 'report', 'other'
      ];

      documentTypes.forEach(type => {
        const formatted = formatDocumentTypeFolder(type);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File Name Generation', () => {
    it('generates unique file names with timestamp', () => {
      fc.assert(
        fc.property(gamaDocumentArb, (document) => {
          const fileName = generateDriveFileName(document);

          // Should contain timestamp pattern (yyyyMMdd-HHmmss)
          expect(fileName).toMatch(/\d{8}-\d{6}/);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('preserves file extension', () => {
      fc.assert(
        fc.property(gamaDocumentArb, (document) => {
          const originalExt = getFileExtension(document.file_name);
          const generatedName = generateDriveFileName(document);
          const generatedExt = getFileExtension(generatedName);

          // Extension should be preserved
          expect(generatedExt).toBe(originalExt);

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Name Sanitization', () => {
    it('sanitizes folder names by removing invalid characters', () => {
      const invalidChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
      
      invalidChars.forEach(char => {
        const sanitized = sanitizeFolderName(`test${char}folder`);
        expect(sanitized).not.toContain(char);
      });
    });

    it('limits folder name length to 255 characters', () => {
      const longName = 'a'.repeat(300);
      const sanitized = sanitizeFolderName(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it('returns "Unknown" for empty names', () => {
      expect(sanitizeFolderName('')).toBe('Unknown');
      expect(sanitizeFolderName('   ')).toBe('Unknown');
    });

    it('sanitizes file names by removing invalid characters', () => {
      const invalidChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
      
      invalidChars.forEach(char => {
        const sanitized = sanitizeFileName(`test${char}file.pdf`);
        expect(sanitized).not.toContain(char);
      });
    });
  });

  describe('File Extension Extraction', () => {
    it('extracts file extensions correctly', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.JPG')).toBe('jpg');
      expect(getFileExtension('file.name.with.dots.txt')).toBe('txt');
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('Document Validation', () => {
    it('validates valid documents', () => {
      fc.assert(
        fc.property(gamaDocumentArb, (document) => {
          const result = validateDocumentForSync(document);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects documents without id', () => {
      const invalidDoc: GamaDocument = {
        id: '',
        document_type: 'invoice',
        document_name: 'Test',
        file_name: 'test.pdf',
        file_size: 1000,
        mime_type: 'application/pdf',
        local_path: '/path',
        folder_path: '/folder',
        entity_type: 'invoice',
        entity_id: '123',
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
      };
      const result = validateDocumentForSync(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('document id is required');
    });

    it('rejects documents with zero file size', () => {
      const invalidDoc: GamaDocument = {
        id: '123',
        document_type: 'invoice',
        document_name: 'Test',
        file_name: 'test.pdf',
        file_size: 0,
        mime_type: 'application/pdf',
        local_path: '/path',
        folder_path: '/folder',
        entity_type: 'invoice',
        entity_id: '123',
        uploaded_by: null,
        uploaded_at: new Date().toISOString(),
      };
      const result = validateDocumentForSync(invalidDoc);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('file_size must be greater than 0');
    });
  });

  describe('Folder Config Validation', () => {
    it('validates valid folder configs', () => {
      fc.assert(
        fc.property(folderConfigArb, (config) => {
          const result = validateFolderConfig(config);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('rejects configs without root_folder_id', () => {
      const invalidConfig: FolderStructureConfig = {
        root_folder_id: '',
        root_folder_name: 'Test',
        use_year_folders: true,
        use_month_folders: false,
        use_entity_folders: true,
        folder_naming_pattern: 'entity_name',
      };
      const result = validateFolderConfig(invalidConfig);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('root_folder_id is required');
    });
  });

  describe('MIME Type Detection', () => {
    it('returns correct MIME types for common extensions', () => {
      expect(getMimeTypeFromExtension('pdf')).toBe('application/pdf');
      expect(getMimeTypeFromExtension('jpg')).toBe('image/jpeg');
      expect(getMimeTypeFromExtension('png')).toBe('image/png');
      expect(getMimeTypeFromExtension('docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(getMimeTypeFromExtension('xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('returns octet-stream for unknown extensions', () => {
      expect(getMimeTypeFromExtension('xyz')).toBe('application/octet-stream');
      expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream');
    });
  });

  describe('File Size Formatting', () => {
    it('formats file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('Preview Support Detection', () => {
    it('identifies previewable MIME types', () => {
      expect(isPreviewSupported('application/pdf')).toBe(true);
      expect(isPreviewSupported('image/jpeg')).toBe(true);
      expect(isPreviewSupported('image/png')).toBe(true);
      expect(isPreviewSupported('text/plain')).toBe(true);
    });

    it('identifies non-previewable MIME types', () => {
      expect(isPreviewSupported('application/zip')).toBe(false);
      expect(isPreviewSupported('application/octet-stream')).toBe(false);
    });
  });

  describe('URL Generation', () => {
    it('generates correct web view URLs', () => {
      fc.assert(
        fc.property(uuidArb, (fileId) => {
          const url = generateDriveWebViewUrl(fileId);
          expect(url).toContain('drive.google.com');
          expect(url).toContain(fileId);
          expect(url).toContain('/view');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('generates correct download URLs', () => {
      fc.assert(
        fc.property(uuidArb, (fileId) => {
          const url = generateDriveDownloadUrl(fileId);
          expect(url).toContain('drive.google.com');
          expect(url).toContain(fileId);
          expect(url).toContain('export=download');
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('generates correct folder URLs', () => {
      fc.assert(
        fc.property(uuidArb, (folderId) => {
          const url = generateDriveFolderUrl(folderId);
          expect(url).toContain('drive.google.com');
          expect(url).toContain(folderId);
          expect(url).toContain('/folders/');
          return true;
        }),
        { numRuns: 100 }
      );
    });
  });
});
