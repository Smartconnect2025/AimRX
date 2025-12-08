-- Custom SQL migration file, put your code below! --

-- Create medication-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medication-images',
  'medication-images',
  true,
  3145728, -- 3MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for medication-images bucket

-- Allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads to medication-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'medication-images');

-- Allow everyone to view images (public bucket)
CREATE POLICY IF NOT EXISTS "Allow public read access to medication-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'medication-images');

-- Allow authenticated users to update their uploads
CREATE POLICY IF NOT EXISTS "Allow authenticated updates to medication-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'medication-images')
WITH CHECK (bucket_id = 'medication-images');

-- Allow authenticated users to delete images
CREATE POLICY IF NOT EXISTS "Allow authenticated deletes from medication-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'medication-images');