/**
 * Drift Zone Detection Utilities
 * Functions to determine which zone a coordinate belongs to
 */

import { CAYMAN_ZONES, Zone } from './drift-zones-config';

/**
 * Point-in-Polygon algorithm (Ray Casting)
 * Determines if a point is inside a polygon
 */
function isPointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [lng, lat] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Detect which zone a coordinate belongs to
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Zone object or null if not in any zone
 */
export function detectZone(
  latitude: number,
  longitude: number
): Zone | null {
  const point: [number, number] = [longitude, latitude];

  console.log(`🔍 detectZone called with lat=${latitude}, lng=${longitude}`);
  console.log(`   Point array: [${longitude}, ${latitude}]`);

  // Check airport zone first (priority)
  const airportZone = CAYMAN_ZONES.find(z => z.id === 'zone_airport');
  if (airportZone && isPointInPolygon(point, airportZone.boundaryCoordinates)) {
    console.log(`   ✅ Found in airport zone`);
    return airportZone;
  }

  // Check other zones
  for (const zone of CAYMAN_ZONES) {
    if (zone.id === 'zone_airport') continue; // Already checked

    const inZone = isPointInPolygon(point, zone.boundaryCoordinates);
    console.log(`   Checking ${zone.displayName}: ${inZone ? 'YES ✅' : 'no'}`);

    if (inZone) {
      console.log(`   ✅ Found in zone: ${zone.displayName}`);
      return zone;
    }
  }

  console.log(`   ❌ NOT IN ANY ZONE`);
  console.log(`   Checked ${CAYMAN_ZONES.length} zones`);
  return null;
}

/**
 * Get zone by ID
 */
export function getZoneById(zoneId: string): Zone | null {
  return CAYMAN_ZONES.find(z => z.id === zoneId) || null;
}

/**
 * Get zone display name
 */
export function getZoneDisplayName(zoneId: string): string {
  const zone = getZoneById(zoneId);
  return zone ? zone.displayName : 'Unknown Zone';
}

/**
 * Check if a coordinate is within Grand Cayman bounds
 */
export function isWithinCaymanBounds(
  latitude: number,
  longitude: number
): boolean {
  // Grand Cayman approximate bounds
  const bounds = {
    north: 19.37,
    south: 19.26,
    east: -81.16,
    west: -81.43,
  };

  return (
    latitude >= bounds.south &&
    latitude <= bounds.north &&
    longitude >= bounds.west &&
    longitude <= bounds.east
  );
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get center point of a zone (for map display)
 */
export function getZoneCenter(zoneId: string): [number, number] | null {
  const zone = getZoneById(zoneId);
  if (!zone) return null;

  const coords = zone.boundaryCoordinates;
  const sumLng = coords.reduce((sum, [lng]) => sum + lng, 0);
  const sumLat = coords.reduce((sum, [, lat]) => sum + lat, 0);

  return [sumLng / coords.length, sumLat / coords.length];
}