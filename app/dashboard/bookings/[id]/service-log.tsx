'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import type { ServiceType } from '@/lib/database.types';
import {
  ACCEPTED_MEDIA,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  SERVICE_BUCKET,
  quickEntries,
  type PetMix,
  type QuickEntry,
  type Requirement,
} from '@/lib/service-reports';
import { createClient } from '@/lib/supabase/client';

import { logServiceUpdateAction } from '../actions';

/**
 * Havener-side log while the service is in progress: what still has to be
 * logged before it can be completed, one-tap entries, and photos/videos with
 * an optional note for the owner.
 */
export function ServiceLog({
  bookingId,
  sitterId,
  service,
  pets,
  requirements,
}: {
  bookingId: string;
  sitterId: string;
  service: ServiceType;
  pets: PetMix;
  requirements: Requirement[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const allMet = requirements.every((r) => r.met);

  // The booked time ticks on its own; re-check it once a minute until it's up.
  const waitingOnTime = requirements.some((r) => r.key === 'duration' && !r.met);
  useEffect(() => {
    if (!waitingOnTime) return;
    const timer = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(timer);
  }, [waitingOnTime, router]);

  function quick(entry: QuickEntry) {
    setError(null);
    startTransition(async () => {
      const result = await logServiceUpdateAction(bookingId, {
        kind: entry.kind,
        body: entry.body ?? null,
      });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  async function send() {
    setError(null);
    const file = fileRef.current?.files?.[0] ?? null;
    const text = note.trim();
    if (!file && !text) {
      setError('Add a photo, a video or a note first.');
      return;
    }

    setBusy(true);
    try {
      let mediaPath: string | null = null;
      let mediaType: 'image' | 'video' | null = null;

      if (file) {
        if (!ACCEPTED_MEDIA.includes(file.type)) {
          setError('Use a JPG, PNG or WebP photo, or an MP4, MOV or WebM video.');
          return;
        }
        const isVideo = file.type.startsWith('video/');
        if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) {
          setError(`That file is too large — photos up to 10 MB and videos up to 50 MB.`);
          return;
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        mediaPath = `${sitterId}/${bookingId}/${Date.now()}-${safeName}`;
        mediaType = isVideo ? 'video' : 'image';
        const { error: uploadError } = await createClient()
          .storage.from(SERVICE_BUCKET)
          .upload(mediaPath, file, { upsert: false, contentType: file.type });
        if (uploadError) {
          setError(uploadError.message);
          return;
        }
      }

      const result = await logServiceUpdateAction(bookingId, {
        kind: file ? 'photo' : 'note',
        body: text || null,
        mediaPath,
        mediaType,
      });
      if (result.error) {
        setError(result.error);
        return;
      }

      setNote('');
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-espresso-700/8 bg-hv-paper p-5 shadow-card">
      <h2 className="text-lg text-espresso-700">Service log</h2>
      <p className="mt-1 text-sm text-espresso-500">
        Everything you log here reaches the owner live and becomes their service
        report.
      </p>

      <ul className="mt-4 space-y-1.5">
        {requirements.map((requirement) => (
          <li key={requirement.key} className="flex items-center gap-2.5 text-[17px]">
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                requirement.met ? 'bg-green-600 text-white' : 'border border-espresso-700/30'
              }`}
            >
              {requirement.met ? '✓' : ''}
            </span>
            <span className={requirement.met ? 'text-espresso-500 line-through' : 'text-espresso-700'}>
              {requirement.label}
            </span>
          </li>
        ))}
      </ul>
      {allMet && (
        <p className="mt-3 text-sm font-medium text-green-700">
          Everything required is logged — you can mark the service completed.
        </p>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-olive-500">
          One tap
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickEntries(service, pets).map((entry) => (
            <Button
              key={entry.id}
              type="button"
              size="sm"
              variant="secondary"
              disabled={isPending || busy}
              onClick={() => quick(entry)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-olive-500">
          Photo, video or note
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="block w-full text-sm text-espresso-600 file:mr-3 file:rounded-full file:border-0 file:bg-hv-sky file:px-4 file:py-2 file:text-[15px] file:font-semibold file:text-hv-ink"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={600}
          placeholder="Optional note for the owner — how are they doing?"
          className="w-full rounded-2xl border border-hv-ink/20 bg-hv-paper px-4 py-2.5 text-[17px] font-medium text-espresso-700 placeholder:text-espresso-700/40 focus:border-hv-ink focus:outline-none focus:ring-2 focus:ring-hv-mustard/40"
        />
        <FormError message={error} />
        <Button type="button" size="sm" disabled={busy || isPending} onClick={send}>
          {busy ? 'Sending…' : 'Send to owner'}
        </Button>
      </div>
    </div>
  );
}
