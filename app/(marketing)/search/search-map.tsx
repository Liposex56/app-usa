'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useRef } from 'react';
import type { CircleMarker, LatLngBoundsExpression, Map as LeafletMap, Marker } from 'leaflet';

export type MapPin = { id: string; rank: number; name: string; lat: number; lng: number };

const INK = '#26100B';
const CREAM = '#F8F5E6';
const MUSTARD = '#BE8210';
const SKY = '#C2DCF4';

function pinHtml(rank: number, active: boolean) {
  const size = active ? 38 : 32;
  const background = active ? MUSTARD : INK;
  return (
    `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${background};` +
    `color:${CREAM};border:2px solid ${CREAM};box-shadow:0 2px 6px rgba(38,16,11,.35);` +
    `display:flex;align-items:center;justify-content:center;` +
    `font:700 ${active ? 17 : 15}px 'Barlow Condensed',sans-serif;">${rank}</div>`
  );
}

/**
 * Numbered pins on free OpenStreetMap tiles, matching the numbers in the list.
 * Pin positions are approximate on purpose (see 0019 and spreadPin).
 */
export function SearchMap({
  pins,
  origin,
  activeId,
  visible,
  onSelect,
}: {
  pins: MapPin[];
  origin: { lat: number; lng: number } | null;
  activeId: string | null;
  /** False while the map's container is hidden (mobile list view). */
  visible: boolean;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const originRef = useRef<CircleMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Build the map and the pins whenever the set of results changes.
  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;

      const map =
        mapRef.current ??
        L.map(containerRef.current, { scrollWheelZoom: false }).setView(
          origin ? [origin.lat, origin.lng] : [42.3601, -71.0589],
          12
        );
      if (!mapRef.current) {
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);
        mapRef.current = map;
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      originRef.current?.remove();
      originRef.current = null;

      const bounds: [number, number][] = [];

      if (origin) {
        originRef.current = L.circleMarker([origin.lat, origin.lng], {
          radius: 9,
          color: INK,
          weight: 3,
          fillColor: SKY,
          fillOpacity: 1,
        })
          .bindTooltip('Your address')
          .addTo(map);
        bounds.push([origin.lat, origin.lng]);
      }

      for (const pin of pins) {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: L.divIcon({
            html: pinHtml(pin.rank, false),
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        })
          .bindTooltip(pin.name, { direction: 'top', offset: [0, -14] })
          .on('click', () => onSelectRef.current(pin.id))
          .addTo(map);
        markersRef.current.set(pin.id, marker);
        bounds.push([pin.lat, pin.lng]);
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds as LatLngBoundsExpression, { padding: [36, 36], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pins, origin]);

  // Remove the map with the component.
  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    },
    []
  );

  // Highlight the pin of the hovered / selected result.
  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    pins.forEach((pin) => {
      const marker = markersRef.current.get(pin.id);
      if (!marker) return;
      const active = pin.id === activeId;
      marker.setIcon(
        L.divIcon({
          html: pinHtml(pin.rank, active),
          className: '',
          iconSize: active ? [38, 38] : [32, 32],
          iconAnchor: active ? [19, 19] : [16, 16],
        })
      );
      marker.setZIndexOffset(active ? 1000 : 0);
    });
  }, [activeId, pins]);

  // A map that was hidden while it was built needs to re-measure itself.
  useEffect(() => {
    const map = mapRef.current;
    if (!visible || !map) return;
    map.invalidateSize();
    const points = [...markersRef.current.values()].map((marker) => marker.getLatLng());
    const you = originRef.current?.getLatLng();
    if (you) points.push(you);
    if (points.length > 1) {
      map.fitBounds(points.map((point) => [point.lat, point.lng]) as LatLngBoundsExpression, {
        padding: [36, 36],
        maxZoom: 14,
      });
    }
  }, [visible]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Map of Haveners near you"
      className="h-full min-h-[320px] w-full overflow-hidden rounded-3xl border border-espresso-700/10 bg-hv-paper"
    />
  );
}
