'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { HOME_MEDIA_BUCKET, homeMediaKind } from '@/lib/home-media';
import { createClient } from '@/lib/supabase/client';

export type HomeMediaFile = { name: string; url: string; kind: 'photo' | 'video' };

const MAX_FILES = 12;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];

export function HomeMediaManager({
  userId,
  initial,
}: {
  userId: string;
  initial: HomeMediaFile[];
}) {
  const [files, setFiles] = useState<HomeMediaFile[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(selected: FileList | null) {
    if (!selected || selected.length === 0) return;
    setError(null);

    if (files.length + selected.length > MAX_FILES) {
      setError(`You can keep up to ${MAX_FILES} photos and videos. Remove one first.`);
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const added: HomeMediaFile[] = [];

    for (const file of Array.from(selected)) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`“${file.name}” isn’t a supported photo or video (use JPG, PNG, WebP, MP4, MOV or WebM).`);
        continue;
      }
      const isVideo = file.type.startsWith('video/');
      if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) {
        setError(
          `“${file.name}” is too large — photos up to 10 MB and videos up to 50 MB.`
        );
        continue;
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const name = `${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(HOME_MEDIA_BUCKET)
        .upload(`${userId}/home/${name}`, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      added.push({
        name,
        kind: homeMediaKind(name),
        url: supabase.storage.from(HOME_MEDIA_BUCKET).getPublicUrl(`${userId}/home/${name}`).data
          .publicUrl,
      });
    }

    setFiles((current) => [...current, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function remove(file: HomeMediaFile) {
    setError(null);
    const supabase = createClient();
    const { error: removeError } = await supabase.storage
      .from(HOME_MEDIA_BUCKET)
      .remove([`${userId}/home/${file.name}`]);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setFiles((current) => current.filter((item) => item.name !== file.name));
  }

  return (
    <div className="space-y-5">
      <FormError message={error} />

      {files.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-espresso-700/15 bg-white p-8 text-center text-sm text-espresso-500">
          Nothing here yet. Owners looking at boarding will see these on your
          public profile.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {files.map((file) => (
            <div key={file.name} className="relative">
              {file.kind === 'video' ? (
                <video
                  src={file.url}
                  controls
                  preload="metadata"
                  className="aspect-square w-full rounded-2xl bg-espresso-700/5 object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt="Your home"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => remove(file)}
                className="absolute right-2 top-2 rounded-full bg-espresso-700/85 px-3 py-1 text-xs font-medium text-cream hover:bg-espresso-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          onChange={(event) => upload(event.target.files)}
          className="hidden"
          id="home-media"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={busy || files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Add photos or video'}
        </Button>
        <p className="mt-2 text-xs text-espresso-500/75">
          Up to {MAX_FILES} files · photos 10 MB, videos 50 MB. Show the places
          your guest will actually use — sleeping area, yard, play space.
        </p>
      </div>
    </div>
  );
}
