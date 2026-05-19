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
    const res = await fetch(url);
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
      return {
        instruction: buildOsrmInstruction(step),
        distance:    formatDistance(stepDistance),
        duration:    formatDuration(calculatedDuration),
        maneuver:    step.maneuver?.type ?? '',
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
    const res  = await fetch(url);
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
