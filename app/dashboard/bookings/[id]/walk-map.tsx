'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Polyline, CircleMarker } from 'leaflet';

import type { WalkLocationRow } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';

/**
 * Free, keyless map tiles (OpenStreetMap via Leaflet) — no Google Maps
 * account needed, so the walk map works with zero extra setup.
 */
export function WalkMap({
  bookingId,
  initialLocations,
  live,
}: {
  bookingId: string;
  initialLocations: WalkLocationRow[];
  /** Subscribe for new points in real time — only meaningful while the walk is in progress. */
  live: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const [locations, setLocations] = useState(initialLocations);

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start: [number, number] = locations.length
        ? [locations[locations.length - 1].latitude, locations[locations.length - 1].longitude]
        : [42.3601, -71.0589]; // Boston — placeholder center until the first point arrives

      const map = L.map(containerRef.current).setView(start, 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;

      const path = locations.map((l) => [l.latitude, l.longitude] as [number, number]);
      lineRef.current = L.polyline(path, { color: '#be8210', weight: 4 }).addTo(map);
      if (path.length) {
        markerRef.current = L.circleMarker(path[path.length - 1], {
          radius: 7,
          color: '#26100b',
          fillColor: '#be8210',
          fillOpacity: 1,
        }).addTo(map);
        map.fitBounds(lineRef.current.getBounds(), { maxZoom: 16, padding: [24, 24] });
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; points update it imperatively below
  }, []);

  // Redraw the route whenever new points come in (from realtime or the initial fetch).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    import('leaflet').then((L) => {
      const path = locations.map((l) => [l.latitude, l.longitude] as [number, number]);
      if (!path.length) return;
      lineRef.current?.setLatLngs(path);
      const last = path[path.length - 1];
      if (markerRef.current) {
        markerRef.current.setLatLng(last);
      } else {
        markerRef.current = L.circleMarker(last, {
          radius: 7,
          color: '#26100b',
          fillColor: '#be8210',
          fillOpacity: 1,
        }).addTo(map);
      }
      map.panTo(last);
    });
  }, [locations]);

  useEffect(() => {
    if (!live) return;
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function start() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase
        .channel(`walk-${bookingId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'walk_locations', filter: `booking_id=eq.${bookingId}` },
          (payload) => {
            const row = payload.new as WalkLocationRow;
            setLocations((current) =>
              current.some((l) => l.id === row.id) ? current : [...current, row]
            );
          }
        )
        .subscribe();
    }

    start();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [bookingId, live]);

  if (locations.length === 0 && !live) {
    return (
      <p className="rounded-2xl border border-dashed border-espresso-700/15 bg-white p-8 text-center text-sm text-espresso-500">
        No route recorded for this walk.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-2xl border border-espresso-700/8 bg-bone"
    />
  );
}
