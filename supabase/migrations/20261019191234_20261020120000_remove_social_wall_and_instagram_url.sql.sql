/*
# Remove Social Wall feature and Instagram URL from designers

## Purpose
This migration removes the Social Wall feature's database table and the
Instagram URL field from the designers table, completing the removal of
these features from TheHomeDesigners.in. The Social Wall page, photo upload
form, routes, and navigation links have already been removed from the
frontend application code.

## Changes

### 1. Drop `shared_gallery_items` table
- This table was used exclusively by the Social Wall feature to store
  community-shared design photos.
- The table contained 0 rows at time of removal (verified).
- No RLS policies existed on this table.
- No database functions referenced this table.
- No storage buckets were associated with it.
- The table has a single FK constraint `shared_gallery_items_designer_id_fkey`
  referencing `designers(id)`, which is dropped automatically with the table.

### 2. Drop `designers.instagram_url` column
- This column was used to store a designer's Instagram profile URL.
- It was displayed on the designer detail page and the Social Wall page,
  and collected during designer registration.
- The column is being dropped because the Instagram URL feature is being
  removed entirely.
- **WARNING**: This is a destructive column drop. Any existing data in
  this column will be lost. Verified that the column only contained
  Instagram URLs which are no longer needed.

### 3. Recreate `register_designer_profile` function
- The SECURITY DEFINER function `register_designer_profile` previously
  accepted a `p_instagram_url` parameter and inserted it into the
  `designers.instagram_url` column.
- The function is recreated WITHOUT the `p_instagram_url` parameter and
  without the `instagram_url` column in the INSERT statement.
- All other parameters and logic remain unchanged.

## Data Safety
- The `shared_gallery_items` table had 0 rows — no data loss.
- The `designers.instagram_url` column contained only Instagram URLs which
  are no longer needed by any feature.
- No users, designer profiles, portfolios, quotations, subscriptions, or
  other shared data are affected.
- The `designers` table and all its other columns are preserved.

## Security
- No RLS policies are added or modified (the dropped table had none).
- The recreated `register_designer_profile` function retains its
  SECURITY DEFINER attribute and search_path setting.
*/

-- 1. Drop the shared_gallery_items table (Social Wall feature, 0 rows)
DROP TABLE IF EXISTS public.shared_gallery_items CASCADE;

-- 2. Drop the instagram_url column from designers
ALTER TABLE public.designers DROP COLUMN IF EXISTS instagram_url;

-- 3. Recreate register_designer_profile without p_instagram_url parameter
CREATE OR REPLACE FUNCTION public.register_designer_profile(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_specialization text,
  p_location text,
  p_phone text DEFAULT NULL::text,
  p_experience integer DEFAULT 0,
  p_bio text DEFAULT NULL::text,
  p_website text DEFAULT NULL::text,
  p_starting_price text DEFAULT NULL::text,
  p_profile_image text DEFAULT NULL::text,
  p_business_type text DEFAULT NULL::text,
  p_google_location_url text DEFAULT NULL::text,
  p_services text[] DEFAULT '{}'::text[],
  p_materials_expertise text[] DEFAULT '{}'::text[],
  p_awards text[] DEFAULT '{}'::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
new_id uuid;
BEGIN
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
RAISE EXCEPTION 'Auth account not found for user_id %', p_user_id;
END IF;

IF EXISTS (SELECT 1 FROM designers WHERE user_id = p_user_id) THEN
RAISE EXCEPTION 'Designer profile already exists for this user';
END IF;

INSERT INTO designers (
user_id, name, email, phone, specialization, experience, location,
bio, website, starting_price, profile_image,
business_type, google_location_url, services, materials_expertise,
awards, verification_status, is_verified, is_active
)
VALUES (
p_user_id, p_name, p_email, p_phone, p_specialization, p_experience,
p_location, p_bio, p_website, p_starting_price,
p_profile_image, p_business_type, p_google_location_url, p_services,
p_materials_expertise, p_awards, 'pending', false, true
)
RETURNING id INTO new_id;

RETURN new_id;
END;
$function$;