'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { logWalkLocationAction } from '../actions';

/**
 * Havener-side GPS capture — only rendered while the walk is in progress.
 *
 * A phone stops sharing its location as soon as the screen locks, so while
 * tracking we ask the browser to keep the screen awake (Screen Wake Lock) and
 * re-request it if the page comes back to the foreground. Where the browser
 * can't do that, the Havener is told to keep the screen on themselves.
 */
export function WalkTracker({ bookingId }: { bookingId: string }) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [awake, setAwake] = useState<boolean | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const trackingRef = useRef(false);

  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) {
      setAwake(false);
      return;
    }
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setAwake(true);
      wakeLockRef.current.addEventListener('release', () => setAwake(false));
    } catch {
      setAwake(false);
    }
  }

  async function releaseWakeLock() {
    try {
      await wakeLockRef.current?.release();
    } catch {
      // already released
    }
    wakeLockRef.current = null;
  }

  useEffect(() => {
    // The browser drops the lock whenever the tab is hidden; take it back.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && trackingRef.current) {
        void acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      void releaseWakeLock();
    };
  }, []);

  function start() {
    if (!('geolocation' in navigator)) {
      setError('This browser can’t share your location.');
      return;
    }
    setError(null);
    setTracking(true);
    trackingRef.current = true;
    void acquireWakeLock();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setPointCount((n) => n + 1);
        void logWalkLocationAction(
          bookingId,
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (geoError) => {
        setError(geoError.message);
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    trackingRef.current = false;
    setTracking(false);
    void releaseWakeLock();
  }

  return (
    <div className="rounded-2xl border border-espresso-700/8 bg-bone p-4">
      <p className="text-[17px] font-semibold text-espresso-700">Walk tracking</p>
      <p className="mt-1 text-sm text-espresso-500">
        Share your location while you walk so the owner can follow along live.
        Use your phone and keep this screen open — location sharing stops when
        the screen locks.
      </p>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {tracking && awake === true && (
        <p className="mt-2 text-sm font-medium text-green-700">
          Screen will stay on while you walk.
        </p>
      )}
      {tracking && awake === false && (
        <p className="mt-2 text-sm font-medium text-red-700">
          This browser can’t keep the screen on for you — turn off auto-lock in
          your phone settings until the walk is over, or tracking will stop.
        </p>
      )}
      <div className="mt-3 flex items-center gap-3">
        {tracking ? (
          <Button type="button" size="sm" variant="secondary" onClick={stop}>
            Stop sharing location
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={start}>
            Start sharing location
          </Button>
        )}
        {tracking && (
          <span className="text-sm text-espresso-500">
            {pointCount} point{pointCount === 1 ? '' : 's'} logged
          </span>
        )}
      </div>
    </div>
  );
}
