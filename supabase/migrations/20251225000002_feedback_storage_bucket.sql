-- Migration: Feedback Storage Bucket
-- Feature: v0.81 Bug Report & Improvement Request System
-- Description: Creates storage bucket for feedback screenshots

-- Create storage bucket for feedback screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback',
  'feedback',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public can view feedback screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own feedback screenshots" ON storage.objects;

-- Allow authenticated users to upload screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback');

-- Allow public read access to screenshots
CREATE POLICY "Public can view feedback screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback');

-- Allow users to delete their own screenshots (organized by user_id folder)
CREATE POLICY "Users can delete own feedback screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'feedback' AND auth.uid()::text = (storage.foldername(name))[1]);
