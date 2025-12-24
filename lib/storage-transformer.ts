// =====================================================
// v0.69: STORAGE TRANSFORMER FOR GOOGLE DRIVE
// =====================================================
// Transforms document data for Google Drive synchronization
// Requirements: 5.3, 5.5

import { format } from 'date-fns';

// =====================================================
// GAMA ERP INPUT TYPES
// =====================================================

/**
 * Document from Gama ERP
 */
export interface GamaDocument {
  id: string;
  document_type: DocumentType;
  document_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  local_path: string;
  folder_path: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  uploaded_by: string | null;
  uploaded_at: string;
  description?: string;
  tags?: string[];
}

/**
 * Document types in Gama ERP
 */
export type DocumentType =
  | 'invoice'
  | 'quotation'
  | 'pjo'
  | 'job_order'
  | 'surat_jalan'
  | 'berita_acara'
  | 'contract'
  | 'permit'
  | 'certificate'
  | 'photo'
  | 'report'
  | 'other';

/**
 * Entity types that documents can be attached to
 */
export type EntityType =
  | 'customer'
  | 'project'
  | 'quotation'
  | 'pjo'
  | 'job_order'
  | 'invoice'
  | 'asset'
  | 'employee'
  | 'vendor';

/**
 * Folder structure configuration
 */
export interface FolderStructureConfig {
  root_folder_id: string;
  root_folder_name: string;
  use_year_folders: boolean;
  use_month_folders: boolean;
  use_entity_folders: boolean;
  folder_naming_pattern: FolderNamingPattern;
}

/**
 * Folder naming patterns
 */
export type FolderNamingPattern = 'entity_name' | 'entity_id' | 'entity_code' | 'date_entity';

// =====================================================
// GOOGLE DRIVE OUTPUT TYPES
// =====================================================

/**
 * Google Drive file metadata
 */
export interface DriveFileMetadata {
  name: string;
  mimeType: string;
  parents: string[];
  description?: string;
  properties?: Record<string, string>;
}

/**
 * Google Drive folder metadata
 */
export interface DriveFolderMetadata {
  name: string;
  mimeType: 'application/vnd.google-apps.folder';
  parents: string[];
  description?: string;
}

/**
 * Synced document record
 */
export interface SyncedDocument {
  local_id: string;
  drive_file_id: string;
  drive_folder_id: string;
  drive_web_link: string;
  drive_download_link: string;
  sync_status: SyncStatus;
  synced_at: string;
  version: number;
}

/**
 * Sync status for documents
 */
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'outdated';

/**
 * Folder path result
 */
export interface FolderPathResult {
  full_path: string;
  path_segments: string[];
  folder_ids: string[];
}

// =====================================================
// TRANSFORMATION FUNCTIONS
// =====================================================

/**
 * Generates a folder path for a document based on its metadata.
 * Requirements: 5.3
 * 
 * @param document - Gama document
 * @param config - Folder structure configuration
 * @returns Generated folder path
 */
export function generateFolderPath(
  document: GamaDocument,
  config: FolderStructureConfig
): string {
  const segments: string[] = [config.root_folder_name];

  // Add entity type folder
  if (config.use_entity_folders) {
    segments.push(formatEntityTypeFolder(document.entity_type));
  }

  // Add year folder
  if (config.use_year_folders) {
    const year = new Date(document.uploaded_at).getFullYear().toString();
    segments.push(year);
  }

  // Add month folder
  if (config.use_month_folders) {
    const month = format(new Date(document.uploaded_at), 'MM-MMMM');
    segments.push(month);
  }

  // Add entity-specific folder based on naming pattern
  const entityFolder = generateEntityFolderName(document, config.folder_naming_pattern);
  if (entityFolder) {
    segments.push(entityFolder);
  }

  // Add document type folder
  segments.push(formatDocumentTypeFolder(document.document_type));

  return segments.join('/');
}

/**
 * Generates folder path segments as an array.
 * Requirements: 5.3
 * 
 * @param document - Gama document
 * @param config - Folder structure configuration
 * @returns Array of folder path segments
 */
export function generateFolderPathSegments(
  document: GamaDocument,
  config: FolderStructureConfig
): string[] {
  const fullPath = generateFolderPath(document, config);
  return fullPath.split('/').filter(s => s.length > 0);
}

/**
 * Transforms document metadata for Google Drive upload.
 * Requirements: 5.5
 * 
 * @param document - Gama document
 * @param parentFolderId - Google Drive parent folder ID
 * @returns Drive file metadata
 */
export function transformDocumentMetadata(
  document: GamaDocument,
  parentFolderId: string
): DriveFileMetadata {
  // Generate a unique file name to avoid conflicts
  const fileName = generateDriveFileName(document);

  return {
    name: fileName,
    mimeType: document.mime_type,
    parents: [parentFolderId],
    description: document.description || `${document.document_type} - ${document.document_name}`,
    properties: {
      gama_document_id: document.id,
      gama_entity_type: document.entity_type,
      gama_entity_id: document.entity_id,
      gama_document_type: document.document_type,
      gama_uploaded_at: document.uploaded_at,
    },
  };
}

/**
 * Creates folder metadata for Google Drive.
 * 
 * @param folderName - Name of the folder
 * @param parentFolderId - Parent folder ID
 * @param description - Optional folder description
 * @returns Drive folder metadata
 */
export function createFolderMetadata(
  folderName: string,
  parentFolderId: string,
  description?: string
): DriveFolderMetadata {
  return {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
    description,
  };
}

/**
 * Creates a synced document record.
 * Requirements: 5.5
 * 
 * @param localId - Local document ID
 * @param driveFileId - Google Drive file ID
 * @param driveFolderId - Google Drive folder ID
 * @returns Synced document record
 */
export function createSyncedDocumentRecord(
  localId: string,
  driveFileId: string,
  driveFolderId: string
): SyncedDocument {
  return {
    local_id: localId,
    drive_file_id: driveFileId,
    drive_folder_id: driveFolderId,
    drive_web_link: `https://drive.google.com/file/d/${driveFileId}/view`,
    drive_download_link: `https://drive.google.com/uc?export=download&id=${driveFileId}`,
    sync_status: 'synced',
    synced_at: new Date().toISOString(),
    version: 1,
  };
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Formats entity type for folder name.
 */
export function formatEntityTypeFolder(entityType: EntityType): string {
  const typeMap: Record<EntityType, string> = {
    customer: 'Customers',
    project: 'Projects',
    quotation: 'Quotations',
    pjo: 'PJOs',
    job_order: 'Job Orders',
    invoice: 'Invoices',
    asset: 'Assets',
    employee: 'Employees',
    vendor: 'Vendors',
  };
  return typeMap[entityType] || entityType;
}

/**
 * Formats document type for folder name.
 */
export function formatDocumentTypeFolder(documentType: DocumentType): string {
  const typeMap: Record<DocumentType, string> = {
    invoice: 'Invoices',
    quotation: 'Quotations',
    pjo: 'PJOs',
    job_order: 'Job Orders',
    surat_jalan: 'Surat Jalan',
    berita_acara: 'Berita Acara',
    contract: 'Contracts',
    permit: 'Permits',
    certificate: 'Certificates',
    photo: 'Photos',
    report: 'Reports',
    other: 'Other',
  };
  return typeMap[documentType] || documentType;
}

/**
 * Generates entity folder name based on naming pattern.
 */
export function generateEntityFolderName(
  document: GamaDocument,
  pattern: FolderNamingPattern
): string {
  switch (pattern) {
    case 'entity_name':
      return sanitizeFolderName(document.entity_name || document.entity_id);
    case 'entity_id':
      return document.entity_id;
    case 'entity_code':
      return sanitizeFolderName(document.entity_name || document.entity_id);
    case 'date_entity':
      const date = format(new Date(document.uploaded_at), 'yyyy-MM-dd');
      return `${date}_${sanitizeFolderName(document.entity_name || document.entity_id)}`;
    default:
      return document.entity_id;
  }
}

/**
 * Generates a unique file name for Google Drive.
 */
export function generateDriveFileName(document: GamaDocument): string {
  // Extract file extension
  const extension = getFileExtension(document.file_name);
  
  // Create a descriptive name
  const baseName = sanitizeFileName(document.document_name || document.file_name);
  const timestamp = format(new Date(document.uploaded_at), 'yyyyMMdd-HHmmss');
  
  if (extension) {
    return `${baseName}_${timestamp}.${extension}`;
  }
  return `${baseName}_${timestamp}`;
}

/**
 * Sanitizes a folder name for Google Drive.
 * Removes invalid characters and limits length.
 */
export function sanitizeFolderName(name: string): string {
  if (!name) return 'Unknown';
  
  // Remove invalid characters for Google Drive folder names
  let sanitized = name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limit length to 255 characters
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }
  
  return sanitized || 'Unknown';
}

/**
 * Sanitizes a file name for Google Drive.
 */
export function sanitizeFileName(name: string): string {
  if (!name) return 'document';
  
  // Remove extension if present
  const nameWithoutExt = name.replace(/\.[^/.]+$/, '');
  
  // Remove invalid characters
  let sanitized = nameWithoutExt
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  return sanitized || 'document';
}

/**
 * Gets file extension from file name.
 */
export function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.([^/.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Validates document for sync.
 */
export function validateDocumentForSync(document: GamaDocument): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!document.id) {
    errors.push('document id is required');
  }
  if (!document.file_name || document.file_name.trim().length === 0) {
    errors.push('file_name is required');
  }
  if (!document.mime_type || document.mime_type.trim().length === 0) {
    errors.push('mime_type is required');
  }
  if (!document.entity_type) {
    errors.push('entity_type is required');
  }
  if (!document.entity_id) {
    errors.push('entity_id is required');
  }
  if (document.file_size <= 0) {
    errors.push('file_size must be greater than 0');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates folder structure configuration.
 */
export function validateFolderConfig(config: FolderStructureConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.root_folder_id || config.root_folder_id.trim().length === 0) {
    errors.push('root_folder_id is required');
  }
  if (!config.root_folder_name || config.root_folder_name.trim().length === 0) {
    errors.push('root_folder_name is required');
  }

  const validPatterns: FolderNamingPattern[] = ['entity_name', 'entity_id', 'entity_code', 'date_entity'];
  if (!validPatterns.includes(config.folder_naming_pattern)) {
    errors.push('folder_naming_pattern must be one of: entity_name, entity_id, entity_code, date_entity');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets MIME type from file extension.
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    txt: 'text/plain',
    csv: 'text/csv',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
  };
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Formats file size for display.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if a file type is supported for Google Drive preview.
 */
export function isPreviewSupported(mimeType: string): boolean {
  const previewableMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
  ];
  return previewableMimeTypes.includes(mimeType);
}

/**
 * Generates Google Drive web view URL.
 */
export function generateDriveWebViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Generates Google Drive download URL.
 */
export function generateDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Generates Google Drive folder URL.
 */
export function generateDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
