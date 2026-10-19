/*
# Drop old overloaded register_designer_profile function

## Purpose
The previous migration recreated `register_designer_profile` without the
`p_instagram_url` parameter. However, `CREATE OR REPLACE` cannot change
a function's parameter signature — it created a new overloaded function
instead of replacing the old one. This migration drops the old overload
that still accepts `p_instagram_url`.

## Changes
- Drops the function overload with signature:
  register_designer_profile(uuid, text, text, text, text, text, integer,
  text, text, text, text, text, text, text, text[], text[], text[])
  (the 17-parameter version that includes p_instagram_url as 11th param)

## Safety
- The new 16-parameter version (without p_instagram_url) remains intact.
- No data is affected — this only removes a function definition.
*/

DROP FUNCTION IF EXISTS public.register_designer_profile(
  uuid, text, text, text, text, text, integer, text, text, text, text,
  text, text, text, text[], text[], text[]
);