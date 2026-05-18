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
