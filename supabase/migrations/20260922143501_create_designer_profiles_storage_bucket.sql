/*
# Create designer-profiles storage bucket

## Summary
The designer registration form uploads profile images to a Supabase Storage
bucket named `designer-profiles`, but that bucket was never created in the
live database (only one bucket, `databaseupload`, currently exists). This
causes the "Bucket not found" error during designer registration and profile
editing.

## Changes
1. Creates the `designer-profiles` storage bucket (public, 2 MB limit,
   images only).
2. Adds storage policies so authenticated designers can upload, update, and
   delete their own profile image (scoped to a folder matching their
   `auth.uid()`), and anyone can view profile images publicly.

## Notes
- The bucket id and name are both `designer-profiles`, matching the bucket
  name already used in `DesignerRegistration.tsx`.
- Policies use `storage.foldername(name)[1]` to enforce per-user folder
  isolation, so a designer can only manage files inside their own folder.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'designer-profiles',
  'designer-profiles',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Designers can upload own profile image" ON storage.objects;
CREATE POLICY "Designers can upload own profile image"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'designer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Designers can update own profile image" ON storage.objects;
CREATE POLICY "Designers can update own profile image"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'designer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'designer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Designers can delete own profile image" ON storage.objects;
CREATE POLICY "Designers can delete own profile image"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'designer-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
CREATE POLICY "Public can view profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'designer-profiles');
