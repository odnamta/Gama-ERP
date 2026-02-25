'use server';

/**
 * Attachment Server Actions
 * Server-side functions for uploading, deleting, and fetching attachments
 */

import { createClient } from '@/lib/supabase/server';
import type {
  AttachmentEntityType,
  DocumentAttachment,
  AttachmentUploadResult,
  AttachmentDeleteResult,
  AttachmentFetchResult,
  SignedUrlResult,
} from '@/types/attachments';
import {
  STORAGE_BUCKET,
  SIGNED_URL_EXPIRY_SECONDS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/types/attachments';

/**
 * Upload a file attachment to an entity
 * 
 * @param entityType - The type of entity (pjo, jo, invoice, customer, project)
 * @param entityId - The UUID of the entity
 * @param formData - FormData containing the file and optional description
 * @returns Upload result with attachment data or error
 */
export async function uploadAttachment(
  entityType: AttachmentEntityType,
  entityId: string,
  formData: FormData
): Promise<AttachmentUploadResult> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: 'Authentication required' };
    }

    // Get user profile for uploaded_by
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file) {
      return { data: null, error: 'No file provided' };
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return { data: null, error: 'File type not allowed. Please upload PDF, JPEG, or PNG files.' };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { data: null, error: 'File exceeds 10MB limit. Please choose a smaller file.' };
    }

    // Generate unique storage path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = sanitizedFileName.split('.').pop() || '';
    const baseName = sanitizedFileName.replace(/\.[^/.]+$/, '');
    const uniqueFileName = `${baseName}_${timestamp}.${extension}`;
    const storagePath = `${entityType}/${entityId}/${uniqueFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file);

    if (uploadError) {
      return { data: null, error: 'Failed to upload file. Please try again.' };
    }

    // Create database record
    const { data: attachment, error: dbError } = await supabase
      .from('document_attachments')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
        description: description || null,
        uploaded_by: profile?.id || null,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return { data: null, error: 'Failed to save attachment. Please try again.' };
    }

    return { data: attachment as DocumentAttachment, error: null };
  } catch (error) {
    return { data: null, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete an attachment
 * 
 * @param attachmentId - The UUID of the attachment to delete
 * @returns Delete result with success flag or error
 */
export async function deleteAttachment(
  attachmentId: string
): Promise<AttachmentDeleteResult> {
  try {
    const supabase = await createClient();

    // Get the attachment to find the storage path
    const { data: attachment, error: fetchError } = await supabase
      .from('document_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError || !attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([attachment.storage_path]);

    if (storageError) {
      return { success: false, error: 'Failed to delete file. Please try again.' };
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('document_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      return { success: false, error: 'Failed to remove attachment record.' };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all attachments for an entity
 * 
 * @param entityType - The type of entity
 * @param entityId - The UUID of the entity
 * @returns Fetch result with attachments array or error
 */
export async function getAttachments(
  entityType: AttachmentEntityType,
  entityId: string
): Promise<AttachmentFetchResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('document_attachments')
      .select(`
        *,
        user_profiles:uploaded_by (
          full_name
        )
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: 'Failed to load attachments' };
    }

    // Transform to include uploader_name
    const attachments: DocumentAttachment[] = (data || []).map((item) => ({
      id: item.id,
      entity_type: item.entity_type as AttachmentEntityType,
      entity_id: item.entity_id,
      file_name: item.file_name,
      file_type: item.file_type,
      file_size: item.file_size,
      storage_path: item.storage_path,
      description: item.description,
      uploaded_by: item.uploaded_by,
      created_at: item.created_at,
      uploader_name: item.user_profiles?.full_name || undefined,
    }));

    return { data: attachments, error: null };
  } catch (error) {
    return { data: [], error: 'An unexpected error occurred' };
  }
}

/**
 * Generate a signed URL for file access
 * 
 * @param storagePath - The path in Supabase Storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL result with URL or error
 */
export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS
): Promise<SignedUrlResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return { url: null, error: 'Unable to access file. Please try again.' };
    }

    return { url: data.signedUrl, error: null };
  } catch (error) {
    return { url: null, error: 'An unexpected error occurred' };
  }
}
