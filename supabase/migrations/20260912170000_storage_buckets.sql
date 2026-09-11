-- The storage buckets, in code rather than in a dashboard.
--
-- Three buckets have had row-level policies since the first migration and not
-- one of them was ever created. Whoever deployed this was expected to make them
-- by hand in the Supabase dashboard, and nothing said so — DEPLOYMENT.md never
-- mentioned storage at all. That leaves three settings nobody chose:
--
--   * public or private. A public bucket is served over a CDN path that does
--     not consult storage.objects policies at all, so the toggle decides who
--     can read the files and the policies below only govern the API path. Set
--     it wrong on `review-images` and customers' photographs are readable by
--     anyone holding a URL.
--   * the file size limit, which defaults to the project-wide setting.
--   * the allowed MIME types, which default to "anything". An upload path that
--     accepts text/html or image/svg+xml puts attacker-authored markup on a
--     domain that belongs to this shop's Supabase project.
--
-- So they are declared here. A bucket that already exists is updated rather
-- than duplicated, and the settings are the ones the policies were written to
-- assume.
--
-- Note that nothing in the application uploads yet: the admin sets image URLs
-- rather than transferring files. These buckets and their policies are the
-- groundwork for that, and getting the limits right before the first upload is
-- cheaper than after.

-- SVG is excluded from all three on purpose. It is a document format that can
-- carry script, and it is served from the project's own storage domain — a
-- convincing address to host a phishing page on, even though it cannot reach
-- this shop's cookies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Product photography is shown to anonymous visitors on the storefront, so
  -- this one is public by design. Writes stay restricted to catalogue managers
  -- by the policies below.
  ('product-images', 'product-images', true, 10485760,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),

  -- A photograph a customer attached to a review, or to a return. Private:
  -- these are pictures taken in someone's home, and a URL is not an
  -- authorisation. 5 MB covers a phone photo.
  ('review-images', 'review-images', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif']),
  ('return-images', 'return-images', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET
  public            = EXCLUDED.public,
  file_size_limit   = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Reading product images
-- ---------------------------------------------------------------------------
--
-- The existing policy allowed only catalogue managers to read this bucket,
-- which contradicts what the bucket is for: a product photograph is the most
-- public thing in the shop. As long as the bucket is public the policy never
-- fired for a storefront visitor — reads went down the CDN path — so this was
-- not protecting anything, it was only making the intent unreadable. Worse, it
-- meant that turning the bucket private (a single toggle) would silently blank
-- every product image instead of failing loudly.
--
-- Stated plainly instead. This is not a widening: the bucket's `public` flag
-- above already decides this, and writes are untouched.
DROP POLICY IF EXISTS "catalog managers read product images" ON storage.objects;
DROP POLICY IF EXISTS "product images readable" ON storage.objects;
CREATE POLICY "product images readable" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- A check anyone can run against a live project
-- ---------------------------------------------------------------------------
--
-- The bucket settings live in a table the application never writes to, so they
-- can be changed in the dashboard afterwards without anything noticing. This
-- reports the state rather than assuming the migration is still the truth.
CREATE OR REPLACE FUNCTION public.audit_storage_buckets()
RETURNS TABLE (bucket text, problem text)
LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  WITH expected(id, should_be_public, max_bytes) AS (
    VALUES ('product-images', true,  10485760::bigint),
           ('review-images',  false,  5242880::bigint),
           ('return-images',  false,  5242880::bigint)
  )
  SELECT e.id,
         CASE
           WHEN b.id IS NULL THEN 'bucket ontbreekt'
           WHEN b.public IS DISTINCT FROM e.should_be_public
             THEN 'public staat op ' || COALESCE(b.public::text, 'null')
                  || ' en moet ' || e.should_be_public::text || ' zijn'
           WHEN b.file_size_limit IS NULL OR b.file_size_limit > e.max_bytes
             THEN 'geen of te hoge bestandslimiet'
           WHEN b.allowed_mime_types IS NULL
             THEN 'elk bestandstype is toegestaan'
           WHEN EXISTS (
             SELECT 1 FROM unnest(b.allowed_mime_types) t
             WHERE t NOT LIKE 'image/%' OR t = 'image/svg+xml'
           ) THEN 'staat een niet-afbeeldingstype of SVG toe'
         END
  FROM expected e
  LEFT JOIN storage.buckets b ON b.id = e.id
  WHERE CASE
    WHEN b.id IS NULL THEN true
    WHEN b.public IS DISTINCT FROM e.should_be_public THEN true
    WHEN b.file_size_limit IS NULL OR b.file_size_limit > e.max_bytes THEN true
    WHEN b.allowed_mime_types IS NULL THEN true
    WHEN EXISTS (
      SELECT 1 FROM unnest(b.allowed_mime_types) t
      WHERE t NOT LIKE 'image/%' OR t = 'image/svg+xml'
    ) THEN true
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.audit_storage_buckets() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.audit_storage_buckets() TO service_role;
