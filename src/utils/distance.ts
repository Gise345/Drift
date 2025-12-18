/**
 * Distance Utility Functions
 *
 * Provides consistent distance formatting throughout the app.
 * Uses miles as the default unit (Cayman Islands standard).
 */

// Conversion constants
const KM_TO_MILES = 0.621371;
const METERS_TO_FEET = 3.28084;
const MILES_TO_FEET = 5280;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format distance in miles (default)
 * Shows feet for distances under 0.1 miles
 */
export const formatDistance = (miles: number): string => {
  if (miles < 0.1) {
    const feet = Math.round(miles * MILES_TO_FEET);
    return `${feet} ft`;
  }
  return `${miles.toFixed(1)} mi`;
};

/**
 * Format distance with unit suffix
 */
export const formatDistanceWithUnit = (miles: number): string => {
  if (miles < 0.1) {
    const feet = Math.round(miles * MILES_TO_FEET);
    return `${feet} ft away`;
  }
  return `${miles.toFixed(1)} mi away`;
};

/**
 * Convert kilometers to miles
 */
export const kmToMiles = (km: number): number => {
  return km * KM_TO_MILES;
};

/**
 * Convert meters to miles
 */
export const metersToMiles = (meters: number): number => {
  return (meters / 1000) * KM_TO_MILES;
};

/**
 * Convert meters to feet
 */
export const metersToFeet = (meters: number): number => {
  return meters * METERS_TO_FEET;
};

/**
 * Format meters as miles (for API responses that return meters)
 */
export const formatMetersAsMiles = (meters: number): string => {
  const miles = metersToMiles(meters);
  return formatDistance(miles);
};

/**
 * Format a distance string, converting km to miles if needed
 * @param distanceStr - String like "5.2 km" or "3.1 mi"
 */
export const convertDistanceString = (distanceStr: string): string => {
  if (!distanceStr) return '';

  // Already in miles
  if (distanceStr.includes('mi') || distanceStr.includes('ft')) {
    return distanceStr;
  }

  // Convert from km
  const match = distanceStr.match(/([\d.]+)\s*km/i);
  if (match) {
    const km = parseFloat(match[1]);
    const miles = kmToMiles(km);
    return formatDistance(miles);
  }

  // Convert from meters
  const mMatch = distanceStr.match(/([\d.]+)\s*m(?!i)/i);
  if (mMatch) {
    const meters = parseFloat(mMatch[1]);
    const miles = metersToMiles(meters);
    return formatDistance(miles);
  }

  return distanceStr;
};

export default {
  calculateDistance,
  formatDistance,
  formatDistanceWithUnit,
  kmToMiles,
  metersToMiles,
  metersToFeet,
  formatMetersAsMiles,
  convertDistanceString,
};
