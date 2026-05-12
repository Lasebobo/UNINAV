/**
 * routeService.ts
 * Fetches a walking route from Google Maps Directions API and decodes
 * the returned encoded polyline into an array of {lat, lng} points.
 */

import { decode } from '@mapbox/polyline';

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Fetches a walking route between two lat/lng points using the Google Maps
 * Directions API. Returns an array of LatLng points describing the path,
 * or null if the fetch fails or no API key is configured.
 */
export async function fetchGoogleRoute(
  origin: LatLng,
  destination: LatLng
): Promise<LatLng[] | null> {
  try {
    const url = `/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) {
      console.error('[routeService] No routes returned:', data.status);
      return null;
    }

    // Decode the polyline path
    const decodedPoints = decode(data.routes[0].overview_polyline.points);
    
    // @mapbox/polyline decodes into an array of [lat, lng] arrays
    return decodedPoints.map(([lat, lng]) => ({ lat, lng }));

  } catch (err) {
    console.error('[routeService] Failed to fetch route:', err);
    return null;
  }
}
