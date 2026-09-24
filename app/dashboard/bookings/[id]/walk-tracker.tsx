'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

import { logWalkLocationAction } from '../actions';

/** Havener-side GPS capture — only rendered while the walk is in progress. */
export function WalkTracker({ bookingId }: { bookingId: string }) {
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  function start() {
    if (!('geolocation' in navigator)) {
      setError('This browser can’t share your location.');
      return;
    }
    setError(null);
    setTracking(true);
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
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stop() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }

  return (
    <div className="rounded-2xl border border-espresso-700/8 bg-bone p-4">
      <p className="text-sm font-medium text-espresso-700">Walk tracking</p>
      <p className="mt-1 text-xs text-espresso-500">
        Share your location while you walk so the owner can follow along live.
      </p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
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
          <span className="text-xs text-espresso-500">
            {pointCount} point{pointCount === 1 ? '' : 's'} logged
          </span>
        )}
      </div>
    </div>
  );
}
