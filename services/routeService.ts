/**
 * routeService.ts
 * Fetches a walking route from the server proxy (/api/route) which
 * in turn calls the Google Maps Directions API.
 *
 * Returns both the decoded polyline (for the map) and the human-readable
 * turn-by-turn steps (for the directions panel / chat).
 */

import { decode } from '@mapbox/polyline';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;   // Plain text — HTML already stripped
  distance: string;      // e.g. "120 m"
  duration: string;      // e.g. "2 mins"
  maneuver: string;      // e.g. "turn-left" | "" for straight
}

export interface RouteResult {
  polyline:      LatLng[];
  steps:         RouteStep[];
  totalDistance: string;
  totalDuration: string;
  startAddress:  string;
  endAddress:    string;
}

/** Strips HTML tags returned by Google (e.g. <b>, <div>) from instruction strings */
function stripHtml(html: string): string {
  return html
    .replace(/<b>/gi, '').replace(/<\/b>/gi, '')
    .replace(/<div[^>]*>/gi, ' ').replace(/<\/div>/gi, '')
    .replace(/<wbr\/>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches a walking route between two lat/lng points via the server proxy.
 * Returns a RouteResult with both the decoded polyline and the step-by-step
 * directions, or null if the fetch fails.
 */
export async function fetchGoogleRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  try {
    const url = `/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data.error || !data.polyline) {
      console.error('[routeService] Route error:', data.error ?? 'No polyline returned');
      return null;
    }

    const polyline = decode(data.polyline).map(([lat, lng]) => ({ lat, lng }));

    const steps: RouteStep[] = (data.steps ?? []).map((s: any) => ({
      instruction: stripHtml(s.instruction),
      distance:    s.distance ?? '',
      duration:    s.duration ?? '',
      maneuver:    s.maneuver ?? '',
    }));

    return {
      polyline,
      steps,
      totalDistance: data.totalDistance ?? '',
      totalDuration: data.totalDuration ?? '',
      startAddress:  data.startAddress  ?? '',
      endAddress:    data.endAddress    ?? '',
    };
  } catch (err) {
    console.error('[routeService] Failed to fetch route:', err);
    return null;
  }
}
