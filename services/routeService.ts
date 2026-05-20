/**
 * routeService.ts
 * Fetches a walking route from the server proxy (/api/route) which
 * in turn calls the Google Maps Directions API.
 *
 * Returns both the decoded polyline (for the map) and the human-readable
 * turn-by-turn steps (for the directions panel / chat).
 */

import { decode } from '@mapbox/polyline';
import { isUserOnCampus } from '../utils/locationUtils';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStep {
  instruction: string;   // Plain text — HTML already stripped
  distance: string;      // e.g. "120 m"
  duration: string;      // e.g. "2 mins"
  maneuver: string;      // e.g. "turn-left" | "" for straight
  target?: LatLng;       // The end coordinate of this step, used for location-based auto-advance
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

/** Replace street names with generic "Road" labels for campus map display */
function replaceWithRoadLabels(instruction: string): string {
  // Pattern: "Head on [street name] for [distance]" or "Turn on [street name]" etc.
  // Replace specific street names with generic Road labels
  const roadPattern = /(?:head on|turn on|turn left on|turn right on|continue on)\s+([A-Z][A-Za-z\s0-9]*?)(?:\s+for|\s*$)/gi;
  
  let roadCounter = 1;
  const roadMap: Record<string, string> = {};
  
  return instruction.replace(roadPattern, (match, streetName) => {
    const cleanedName = streetName.trim();
    
    // Avoid replacing common landmarks or keywords
    if (cleanedName.match(/plaza|square|avenue|boulevard|circle|mall|park|building/i)) {
      return match;
    }
    
    if (!roadMap[cleanedName]) {
      roadMap[cleanedName] = `Road ${roadCounter}`;
      roadCounter++;
    }
    
    const roadLabel = roadMap[cleanedName];
    return match.replace(cleanedName, roadLabel);
  });
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1).replace(/\.0$/, '')} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  if (seconds < 120) {
    return '1 min';
  }
  return `${Math.round(seconds / 60)} mins`;
}

/** Perform a fetch with an AbortController timeout. Returns the Response or throws on timeout. */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit | undefined, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...(init || {}), signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function getRoadName(name: string | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'the campus road';
}

function buildOsrmInstruction(step: any): string {
  const roadName = getRoadName(step.name);
  const modifier = (step.maneuver?.modifier ?? '').toLowerCase();
  const distance = formatDistance(step.distance ?? 0);
  const type = step.maneuver?.type;

  if (type === 'depart') {
    const direction = modifier || 'straight';
    return `Head ${direction} on ${roadName} for ${distance}`;
  }

  if (type === 'turn') {
    if (modifier.includes('left')) {
      return `Turn left onto ${roadName}`;
    }
    if (modifier.includes('right')) {
      return `Turn right onto ${roadName}`;
    }
    if (modifier.includes('straight')) {
      return `Continue straight on ${roadName} for ${distance}`;
    }
    return `Turn onto ${roadName}`;
  }

  if (type === 'continue' || type === 'roundabout' || type === 'fork') {
    return `Continue straight on ${roadName} for ${distance}`;
  }

  return `Continue straight on ${roadName} for ${distance}`;
}

async function fetchOsrmRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  try {
    const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `https://router.project-osrm.org/route/v1/foot/${coordinates}?overview=full&geometries=geojson&steps=true&annotations=true`;
    const res = await fetchWithTimeout(url, undefined, 15000);
    const data = await res.json();

    if (!data.routes?.length) {
      console.error('[routeService] OSRM route error: no routes returned');
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs?.[0];
    if (!leg) {
      console.error('[routeService] OSRM route error: no leg data');
      return null;
    }

    const polyline = (route.geometry?.coordinates ?? []).map(([lng, lat]: [number, number]) => ({ lat, lng }));

    // Define average walking speed: 4.8 km/h = 1.33 m/s
    const WALKING_SPEED_M_S = 1.33;

    const steps: RouteStep[] = (leg.steps ?? []).map((step: any) => {
      const stepDistance = step.distance ?? 0;
      const calculatedDuration = stepDistance / WALKING_SPEED_M_S;
      
      let target: LatLng | undefined = undefined;
      const coords = step.geometry?.coordinates;
      if (coords && coords.length > 0) {
        // OSRM coordinates are [lng, lat]
        const last = coords[coords.length - 1];
        target = { lat: last[1], lng: last[0] };
      }

      return {
        instruction: buildOsrmInstruction(step),
        distance:    formatDistance(stepDistance),
        duration:    formatDuration(calculatedDuration),
        maneuver:    step.maneuver?.type ?? '',
        target
      };
    });

    const totalDistance = leg.distance ?? 0;
    const totalCalculatedDuration = totalDistance / WALKING_SPEED_M_S;

    return {
      polyline,
      steps,
      totalDistance: formatDistance(totalDistance),
      totalDuration: formatDuration(totalCalculatedDuration),
      startAddress:  '',
      endAddress:    '',
    };
  } catch (err) {
    console.error('[routeService] Failed to fetch OSRM route:', err);
    return null;
  }
}

/**
 * Fetches a walking route between two lat/lng points.
 * Uses the OSRM public routing service for on-campus origin points and
 * the existing Google Maps Directions API proxy for off-campus routes.
 */
export async function fetchGoogleRoute(
  origin: LatLng,
  destination: LatLng,
  useRawGoogleNames = false
): Promise<RouteResult | null> {
  try {
    if (!useRawGoogleNames && isUserOnCampus(origin)) {
      return await fetchOsrmRoute(origin, destination);
    }

    const url = `/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
    const res  = await fetchWithTimeout(url, undefined, 15000);
    const data = await res.json();

    if (data.error || !data.polyline) {
      console.error('[routeService] Route error:', data.error ?? 'No polyline returned');
      return null;
    }

    const polyline = decode(data.polyline).map(([lat, lng]) => ({ lat, lng }));

    const steps: RouteStep[] = (data.steps ?? []).map((s: any) => ({
      instruction: useRawGoogleNames ? stripHtml(s.instruction) : replaceWithRoadLabels(stripHtml(s.instruction)),
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

/** Direct call to the /api/route Google Maps proxy — no campus-check branching */
async function fetchGoogleProxyRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult | null> {
  try {
    const url = `/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
    const res = await fetchWithTimeout(url, undefined, 15000);
    if (!res.ok) {
      console.warn('[routeService] Google proxy HTTP error:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();

    if (data.error || !data.polyline) {
      console.warn('[routeService] Google proxy returned no route:', data.error ?? data.status ?? 'no polyline');
      return null;
    }

    const polyline = decode(data.polyline).map(([lat, lng]: [number, number]) => ({ lat, lng }));
    const steps: RouteStep[] = (data.steps ?? []).map((s: any) => {
      let target: LatLng | undefined = undefined;
      // Google API usually provides end_location for steps:
      if (s.end_location) {
        target = { lat: s.end_location.lat, lng: s.end_location.lng };
      }
      return {
        instruction: stripHtml(s.instruction),  // keep real Google street names for this view
        distance:    s.distance ?? '',
        duration:    s.duration ?? '',
        maneuver:    s.maneuver ?? '',
        target
      };
    });

    console.log('[routeService] Google proxy route OK —', data.totalDistance, '/', data.totalDuration);
    return {
      polyline,
      steps,
      totalDistance: data.totalDistance ?? '',
      totalDuration: data.totalDuration ?? '',
      startAddress:  data.startAddress  ?? '',
      endAddress:    data.endAddress    ?? '',
    };
  } catch (err) {
    console.warn('[routeService] fetchGoogleProxyRoute failed:', err);
    return null;
  }
}

/**
 * Fetches OSRM (campus road labels) and Google Maps (street names) routes
 * **in parallel** via Promise.allSettled so one failure never blocks the other.
 *
 * Both results are stored; the UI toggle swaps between them without re-fetching.
 */
/**
 * Retry helper: calls `fn` up to `attempts` times with exponential backoff delays.
 * `delaysMs` is an array of delays to wait before each retry (in ms).
 * Calls `onAttempt` with attempt number (1-based) before each try.
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T | null>,
  attempts = 3,
  delaysMs = [2000, 4000, 8000],
  onAttempt?: (attempt: number) => void
): Promise<T | null> {
  for (let i = 0; i < attempts; i++) {
    const attempt = i + 1;
    try {
      onAttempt?.(attempt);
      const res = await fn();
      if (res) return res;
      // if fn returned null, fallthrough to retry
    } catch (err) {
      // log and retry
      console.warn('[routeService] attempt error', err);
    }

    if (i < attempts - 1) {
      const delay = delaysMs[i] ?? delaysMs[delaysMs.length - 1] ?? 2000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  return null;
}

/**
 * Try OSRM first with retries; if OSRM fails after retries, try Google proxy with retries.
 * Calls `onProgress` with { phase, attempt } updates so callers can update UI/voice.
 */
export async function fetchBothRoutes(
  origin: LatLng,
  destination: LatLng,
  onProgress?: (info: { phase: 'osrm' | 'google' | 'done' | 'failed'; attempt?: number }) => void
): Promise<{ osrmRoute: RouteResult | null; googleRoute: RouteResult | null }> {
  console.log('[routeService] fetchBothRoutes (with retries) →', origin, '→', destination);

  // Try OSRM with retries
  const osrmRoute = await retryWithBackoff<RouteResult>(
    () => fetchOsrmRoute(origin, destination),
    3,
    [2000, 4000, 8000],
    (attempt) => onProgress?.({ phase: 'osrm', attempt })
  );

  if (osrmRoute) {
    onProgress?.({ phase: 'done' });
    // Still fetch google in background for the toggle, but do not block the UI
    fetchGoogleProxyRoute(origin, destination).then((g) => {
      if (g) console.log('[routeService] background google route fetched');
    }).catch(() => {});
    return { osrmRoute, googleRoute: null };
  }

  // OSRM failed after retries — try Google with retries
  const googleRoute = await retryWithBackoff<RouteResult>(
    () => fetchGoogleProxyRoute(origin, destination),
    3,
    [2000, 4000, 8000],
    (attempt) => onProgress?.({ phase: 'google', attempt })
  );

  if (googleRoute) {
    onProgress?.({ phase: 'done' });
    return { osrmRoute: null, googleRoute };
  }

  onProgress?.({ phase: 'failed' });
  return { osrmRoute: null, googleRoute: null };
}
