/**
 * Drift Zone Detection Utilities
 * Functions to determine which zone a coordinate belongs to
 */

import { CAYMAN_ZONES, Zone, getParentZoneId } from './drift-zones-config';

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
 * Priority: Airport > Sub-zones > Main zones > General fallback
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Zone object or null if not in any zone
 */
export function detectZone(
  latitude: number,
  longitude: number
): Zone | null {
  const point: [number, number] = [longitude, latitude];

  // Check airport zone first (highest priority)
  const airportZone = CAYMAN_ZONES.find(z => z.id === 'zone_3a');
  if (airportZone && isPointInPolygon(point, airportZone.boundaryCoordinates)) {
    return airportZone;
  }

  // Check sub-zones next (more specific areas)
  const subZones = CAYMAN_ZONES.filter(z => z.isSubZone && z.id !== 'zone_3a');
  for (const zone of subZones) {
    if (isPointInPolygon(point, zone.boundaryCoordinates)) {
      return zone;
    }
  }

  // Check main zones
  const mainZones = CAYMAN_ZONES.filter(z => !z.isSubZone && z.id !== 'zone_general');
  for (const zone of mainZones) {
    if (isPointInPolygon(point, zone.boundaryCoordinates)) {
      return zone;
    }
  }

  // Fallback to general zone if within Grand Cayman bounds
  const generalZone = CAYMAN_ZONES.find(z => z.id === 'zone_general');
  if (generalZone && isPointInPolygon(point, generalZone.boundaryCoordinates)) {
    return generalZone;
  }

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
 * Get all zones in a zone family (parent + all sub-zones)
 */
export function getZoneFamily(zoneId: string): Zone[] {
  const parentId = getParentZoneId(zoneId);
  return CAYMAN_ZONES.filter(z => {
    return z.id === parentId || z.parentZone === parentId;
  });
}

/**
 * Get all main zones (not sub-zones)
 */
export function getMainZones(): Zone[] {
  return CAYMAN_ZONES.filter(z => !z.isSubZone && z.id !== 'zone_general');
}

/**
 * Get all sub-zones for a parent zone
 */
export function getSubZones(parentZoneId: string): Zone[] {
  return CAYMAN_ZONES.filter(z => z.parentZone === parentZoneId);
}

/**
 * Check if a coordinate is within Grand Cayman bounds
 */
export function isWithinCaymanBounds(
  latitude: number,
  longitude: number
): boolean {
  // Grand Cayman approximate bounds (expanded for all zones)
  const bounds = {
    north: 19.40,
    south: 19.25,
    east: -81.08,
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

/**
 * Get all zone centers for map display
 */
export function getAllZoneCenters(): { zoneId: string; center: [number, number]; displayName: string }[] {
  return CAYMAN_ZONES
    .filter(z => z.id !== 'zone_general')
    .map(zone => {
      const center = getZoneCenter(zone.id);
      return {
        zoneId: zone.id,
        center: center || [0, 0],
        displayName: zone.displayName,
      };
    });
}

/**
 * Determine trip type based on pickup and destination zones
 */
export function determineTripType(
  pickupZoneId: string,
  destZoneId: string
): 'within' | 'subzone' | 'crosszone' | 'airport' {
  // Airport trip
  if (pickupZoneId === 'zone_3a' || destZoneId === 'zone_3a') {
    return 'airport';
  }

  // Same zone
  if (pickupZoneId === destZoneId) {
    return 'within';
  }

  // Check if same zone family
  const pickupParent = getParentZoneId(pickupZoneId);
  const destParent = getParentZoneId(destZoneId);

  if (pickupParent === destParent ||
      pickupParent === destZoneId ||
      destParent === pickupZoneId) {
    return 'subzone';
  }

  return 'crosszone';
}
