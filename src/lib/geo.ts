const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// Above this, a GPS reading is too unreliable to trust for a geofence decision.
export const MAX_ACCEPTABLE_ACCURACY_METERS = 1000;

/**
 * Whether a check-in should be accepted given the reported distance from the
 * geofence center and the device's own accuracy margin. Indoor GPS commonly
 * degrades to 50-500m accuracy (wifi/cell triangulation), so a bare
 * distance <= radius check would reject members legitimately inside the
 * building — the accuracy margin is subtracted before comparing.
 */
export function isWithinGeofence(
  distanceMeters: number,
  accuracyMeters: number,
  radiusMeters: number
): boolean {
  if (accuracyMeters > MAX_ACCEPTABLE_ACCURACY_METERS) return false;
  return distanceMeters - accuracyMeters <= radiusMeters;
}
