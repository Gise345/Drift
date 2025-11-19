/**
 * Drift Zone Boundaries - Grand Cayman
 * Coordinates define polygon boundaries for each pricing zone
 * Format: [longitude, latitude] pairs
 */

export interface Zone {
  id: string;
  name: string;
  displayName: string;
  color: string; // For map display
  flatRateMin: number; // CI$
  flatRateMax: number; // CI$
  boundaryCoordinates: [number, number][]; // [lng, lat] polygon
}

export const CAYMAN_ZONES: Zone[] = [
  {
    id: 'zone_a',
    name: 'Zone A',
    displayName: 'West Bay Corridor',
    color: '#3B82F6', // Blue
    flatRateMin: 8,
    flatRateMax: 10,
    boundaryCoordinates: [
      // Expanded to cover all of West Bay including northern residential areas
      [-81.4200, 19.3900], // West Bay far north (expanded)
      [-81.3850, 19.3900], // West Bay northeast (expanded)
      [-81.3750, 19.3800], // West Bay Rd north
      [-81.3700, 19.3700], // Camana Bay north
      [-81.3650, 19.3500], // Seven Mile Beach north
      [-81.3620, 19.3300], // Seven Mile Beach mid
      [-81.3650, 19.3100], // Seven Mile Beach south
      [-81.3750, 19.2950], // George Town north
      [-81.3850, 19.2850], // George Town harbor
      [-81.3950, 19.2800], // George Town south
      [-81.4100, 19.2850], // South Sound west
      [-81.4250, 19.2950], // West Bay south
      [-81.4300, 19.3150], // West Bay Road mid
      [-81.4300, 19.3400], // West Bay central
      [-81.4250, 19.3650], // West Bay north central
      [-81.4200, 19.3900], // Close polygon
    ],
  },
  {
    id: 'zone_b',
    name: 'Zone B',
    displayName: 'Eastern Districts',
    color: '#10B981', // Green
    flatRateMin: 8,
    flatRateMax: 10,
    boundaryCoordinates: [
      [-81.3234, 19.2889], // Savannah west
      [-81.3089, 19.2845], // Savannah east
      [-81.2867, 19.2778], // Bodden Town west
      [-81.2645, 19.2734], // Bodden Town central
      [-81.2456, 19.2689], // Bodden Town east
      [-81.2334, 19.2756], // Bodden Town north
      [-81.2456, 19.2867], // Newlands
      [-81.2678, 19.2923], // Red Bay
      [-81.2889, 19.2956], // Savannah north
      [-81.3123, 19.2945], // Prospect
      [-81.3234, 19.2889], // Close polygon
    ],
  },
  {
    id: 'zone_c',
    name: 'Zone C',
    displayName: 'North & East End',
    color: '#F59E0B', // Amber
    flatRateMin: 8,
    flatRateMax: 10,
    boundaryCoordinates: [
      [-81.2234, 19.2767], // East End west
      [-81.1967, 19.2734], // East End central
      [-81.1756, 19.2823], // East End north
      [-81.1634, 19.2945], // East End northeast
      [-81.1689, 19.3123], // North Side east
      [-81.1823, 19.3289], // North Side central
      [-81.2012, 19.3445], // Rum Point west
      [-81.2156, 19.3567], // Rum Point central
      [-81.2301, 19.3623], // Cayman Kai
      [-81.2445, 19.3589], // North Sound
      [-81.2567, 19.3456], // North Side west
      [-81.2656, 19.3289], // North Side south
      [-81.2589, 19.3123], // Colliers
      [-81.2456, 19.2956], // Old Man Bay
      [-81.2334, 19.2845], // East End north boundary
      [-81.2234, 19.2767], // Close polygon
    ],
  },
  {
    id: 'zone_d',
    name: 'Zone D',
    displayName: 'South Coast',
    color: '#8B5CF6', // Purple
    flatRateMin: 8,
    flatRateMax: 10,
    boundaryCoordinates: [
      [-81.3923, 19.2789], // George Town south
      [-81.3867, 19.2689], // South Sound beach
      [-81.3789, 19.2623], // South Sound east
      [-81.3656, 19.2589], // Spotts west
      [-81.3534, 19.2567], // Spotts central
      [-81.3456, 19.2612], // Prospect south
      [-81.3389, 19.2689], // Savannah west boundary
      [-81.3456, 19.2778], // Savannah southwest
      [-81.3589, 19.2823], // Red Bay west
      [-81.3734, 19.2867], // South Sound north
      [-81.3856, 19.2889], // George Town boundary
      [-81.3923, 19.2789], // Close polygon
    ],
  },
  {
    id: 'zone_airport',
    name: 'Airport Zone',
    displayName: 'Owen Roberts Airport',
    color: '#EF4444', // Red
    flatRateMin: 0, // Special pricing rules apply
    flatRateMax: 0, // Calculated based on origin/destination
    boundaryCoordinates: [
      [-81.3623, 19.2956], // Airport west
      [-81.3545, 19.2945], // Airport northwest
      [-81.3478, 19.2923], // Airport north
      [-81.3423, 19.2889], // Airport northeast
      [-81.3401, 19.2845], // Airport east
      [-81.3434, 19.2789], // Airport southeast
      [-81.3489, 19.2767], // Airport south
      [-81.3556, 19.2778], // Airport southwest
      [-81.3612, 19.2823], // Airport west side
      [-81.3634, 19.2878], // Airport west boundary
      [-81.3623, 19.2956], // Close polygon
    ],
  },
  {
    id: 'zone_general',
    name: 'General Zone',
    displayName: 'Grand Cayman',
    color: '#6B7280', // Gray
    flatRateMin: 8,
    flatRateMax: 12,
    // Fallback zone covering entire Grand Cayman island
    // This catches any coordinates not in the specific zones above
    // Expanded bounds to cover all of Grand Cayman including West Bay north
    boundaryCoordinates: [
      [-81.440, 19.400], // Northwest corner (expanded to cover West Bay north)
      [-81.080, 19.400], // Northeast corner (North Side/Rum Point)
      [-81.080, 19.250], // Southeast corner (East End)
      [-81.440, 19.250], // Southwest corner (South Sound/South West)
      [-81.440, 19.400], // Close polygon
    ],
  },
];

/**
 * Special Airport Pricing Rules
 * Fixed contributions based on origin/destination zone
 */
export const AIRPORT_PRICING = {
  from_zone_a: { min: 25, max: 32, suggested: 28 },
  from_zone_b: { min: 35, max: 45, suggested: 40 },
  from_zone_c: { min: 55, max: 65, suggested: 60 },
  from_zone_d: { min: 22, max: 28, suggested: 25 },
  from_zone_general: { min: 28, max: 38, suggested: 33 },
  to_zone_a: { min: 25, max: 32, suggested: 28 },
  to_zone_b: { min: 35, max: 45, suggested: 40 },
  to_zone_c: { min: 55, max: 65, suggested: 60 },
  to_zone_d: { min: 22, max: 28, suggested: 25 },
  to_zone_general: { min: 28, max: 38, suggested: 33 },
};

/**
 * Cross-Zone Pricing Constants
 */
export const PRICING_CONSTANTS = {
  BASE_ZONE_EXIT_FEE: 5, // CI$ base fee for leaving a zone
  PRICE_PER_MILE: 1.50, // CI$ per mile
  PRICE_PER_MINUTE: 0.30, // CI$ per minute
  WITHIN_ZONE_MIN: 8, // CI$ minimum for within-zone trips
  WITHIN_ZONE_MAX: 10, // CI$ maximum for within-zone trips
};

/**
 * Time-based multipliers
 */
export const TIME_MULTIPLIERS = {
  LATE_NIGHT: {
    startHour: 22, // 10 PM
    endHour: 6, // 6 AM
    multiplier: 1.25, // +25%
  },
  EARLY_MORNING: {
    startHour: 5,
    endHour: 7,
    multiplier: 1.15, // +15%
  },
};

/**
 * Event-based pricing (future implementation)
 */
export const EVENT_MULTIPLIERS = {
  BATABANO: { multiplier: 1.40, dates: ['2025-05-02', '2025-05-03', '2025-05-04'] },
  PIRATES_WEEK: { multiplier: 1.30, dates: ['2025-11-07', '2025-11-15'] },
  NEW_YEARS_EVE: { multiplier: 1.50, dates: ['2025-12-31'] },
};