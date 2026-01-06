-- Create storage bucket for feedback screenshots
-- Migration: 20251225000002_feedback_storage_bucket.sql

-- Create the feedback bucket for storing screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feedback',
  'feedback',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for feedback bucket
-- Allow authenticated users to upload screenshots
CREATE POLICY "Users can upload feedback screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback');

-- Allow public read access to feedback screenshots
CREATE POLICY "Public can view feedback screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feedback');

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete own feedback screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'feedback' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
