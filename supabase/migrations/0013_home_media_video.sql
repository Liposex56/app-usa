-- ============================================================================
-- Havenr — 0013_home_media_video.sql
-- "Meet the home": Haveners who offer boarding show photos AND short videos of
-- the home on their public profile. Photos already worked (the public
-- `sitter-photos` bucket from 0003); this widens that bucket so it also
-- accepts video clips and a larger per-file size.
--
-- Run this once in the Supabase SQL editor. Until it's applied, photo
-- uploads keep working and video uploads are refused with a clear error.
--
-- No new tables: the app lists <havener-id>/home/ in the bucket directly, and
-- the existing storage policies (public read, self write, self delete) already
-- cover that path.
-- ============================================================================

update storage.buckets
set
  file_size_limit = 52428800, -- 50 MB (photos are capped at 10 MB in the app)
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
where id = 'sitter-photos';
