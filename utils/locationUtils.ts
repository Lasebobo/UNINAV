/**
 * locationUtils.ts
 * Campus boundary helpers for OAU, Ile-Ife.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Approximate bounding box for OAU campus */
const OAU_BOUNDS = {
  north: 7.5280,
  south: 7.4950,
  east:  4.5350,
  west:  4.5050,
};

/**
 * The OAU Main Gate — used as the routing origin when
 * the user's GPS fix is outside the campus perimeter.
 */
export const OAU_MAIN_GATE: LatLng = { lat: 7.497281099999999, lng: 4.522773 };

/**
 * Returns true if the given coordinates fall within the OAU campus
 * bounding box.
 */
export function isUserOnCampus(location: LatLng): boolean {
  return (
    location.lat >= OAU_BOUNDS.south &&
    location.lat <= OAU_BOUNDS.north &&
    location.lng >= OAU_BOUNDS.west &&
    location.lng <= OAU_BOUNDS.east
  );
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const haversine = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  return 6371000 * c;
}

export type LocationState = 'onCampus' | 'nearGate' | 'farOffCampus';

export function getUserLocationState(location: LatLng): LocationState {
  if (isUserOnCampus(location)) return 'onCampus';
  return haversineDistanceMeters(location, OAU_MAIN_GATE) <= 2000 ? 'nearGate' : 'farOffCampus';
}

export function getRoutingOrigin(location: LatLng): LatLng {
  return getUserLocationState(location) === 'nearGate' ? OAU_MAIN_GATE : location;
}
