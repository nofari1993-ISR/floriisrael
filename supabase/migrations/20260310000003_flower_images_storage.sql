-- Create flower-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flower-images',
  'flower-images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public bucket)
CREATE POLICY IF NOT EXISTS "Public read flower images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flower-images');

-- Allow service role (edge functions) to upload
CREATE POLICY IF NOT EXISTS "Service role upload flower images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'flower-images');

-- Allow service role to update (upsert)
CREATE POLICY IF NOT EXISTS "Service role update flower images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'flower-images');
