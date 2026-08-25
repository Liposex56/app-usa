-- ============================================================================
-- Havenr — 0003_storage.sql
-- Storage buckets and their policies.
--
-- Path convention for every bucket: <user-uuid>/<filename>
-- The policies below read that first folder segment with
-- storage.foldername(name)[1] and compare it to auth.uid().
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- Public: profile pictures are shown on search results.
  ('avatars', 'avatars', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),

  -- Public: the Havener gallery and "meet my home" photos.
  ('sitter-photos', 'sitter-photos', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp']),

  -- Private: pet photos belong to the owner and to whoever has a confirmed
  -- booking. Served through signed URLs only.
  ('pet-photos', 'pet-photos', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp']),

  -- Private: IDs, vaccination records, insurance certificates.
  -- Only the uploader and Havenr staff may read these.
  ('verification-docs', 'verification-docs', false, 20971520,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- avatars (public read, self write)
-- ---------------------------------------------------------------------------
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: self write" on storage.objects;
create policy "avatars: self write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: self update" on storage.objects;
create policy "avatars: self update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: self delete" on storage.objects;
create policy "avatars: self delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- sitter-photos (public read, self write)
-- ---------------------------------------------------------------------------
drop policy if exists "sitter photos: public read" on storage.objects;
create policy "sitter photos: public read"
  on storage.objects for select
  using (bucket_id = 'sitter-photos');

drop policy if exists "sitter photos: self write" on storage.objects;
create policy "sitter photos: self write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'sitter-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "sitter photos: self delete" on storage.objects;
create policy "sitter photos: self delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'sitter-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- pet-photos (private: owner + staff. Sitter access lands with bookings.)
-- ---------------------------------------------------------------------------
drop policy if exists "pet photos: owner read" on storage.objects;
create policy "pet photos: owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pet-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

drop policy if exists "pet photos: owner write" on storage.objects;
create policy "pet photos: owner write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "pet photos: owner delete" on storage.objects;
create policy "pet photos: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- verification-docs (private: uploader + staff, no public URL ever)
-- ---------------------------------------------------------------------------
drop policy if exists "verification docs: self or staff read" on storage.objects;
create policy "verification docs: self or staff read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

drop policy if exists "verification docs: self write" on storage.objects;
create policy "verification docs: self write"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Deliberately no DELETE policy: verification documents are retained for the
-- audit trail. Staff remove them through the service_role key, following the
-- retention policy Havenr defines with counsel.
