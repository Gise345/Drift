/**
 * Drift Zone Boundaries - Grand Cayman
 * Updated zone structure with main zones and sub-zones
 * Coordinates define polygon boundaries for each pricing zone
 * Format: [longitude, latitude] pairs
 */

export interface Zone {
  id: string;
  name: string;
  displayName: string;
  color: string;
  parentZone?: string; // For sub-zones (e.g., zone_1a has parent zone_1)
  isSubZone: boolean;
  boundaryCoordinates: [number, number][]; // [lng, lat] polygon
}

/**
 * New Pricing Rules:
 * - Within zone, ≤3 mins: $6 KYD
 * - Within zone, ≤3 mins + extra stop: $10 KYD
 * - Within zone, >3 mins + extra stop: +$3 KYD
 * - To sub-zone (same parent): $10 + $3 = $13 KYD
 * - Cross-zone (different parent): $15 KYD base + distance calc
 * - Airport: $15 base + distance calc
 */

export const CAYMAN_ZONES: Zone[] = [
  // ============================================
  // ZONE 1 - West Bay (Heart to Fire Station/Mt Pleasant)
  // ============================================
  {
    id: 'zone_1',
    name: 'Zone 1',
    displayName: 'West Bay',
    color: '#3B82F6', // Blue
    isSubZone: false,
    boundaryCoordinates: [
      // Polygon around West Bay heart area
      [-81.4100, 19.3950], // NW corner
      [-81.3550, 19.3950], // NE corner
      [-81.3550, 19.3800], // East upper
      [-81.3620, 19.3700], // Camana Bay north
      [-81.3800, 19.3650], // Fire station area
      [-81.3940, 19.3600], // Mt Pleasant bypass
      [-81.4180, 19.3650], // West side
      [-81.4180, 19.3800], // NW return
      [-81.4100, 19.3950], // Close polygon
    ],
  },
  {
    id: 'zone_1a',
    name: 'Zone 1a',
    displayName: 'West Bay to Yacht Club',
    color: '#60A5FA', // Light blue
    parentZone: 'zone_1',
    isSubZone: true,
    boundaryCoordinates: [
      // Zone 1 end to Yacht Club roundabout corridor
      [-81.3990, 19.3700], // Start from Zone 1 boundary
      [-81.3800, 19.3750], // Upper edge
      [-81.3750, 19.3650], // East side
      [-81.3700, 19.3550], // Yacht Club road north
      [-81.3650, 19.3500], // Yacht Club roundabout
      [-81.3800, 19.3450], // Lower edge
      [-81.3900, 19.3550], // Return west
      [-81.3990, 19.3700], // Close polygon
    ],
  },

  // ============================================
  // ZONE 2 - Yacht Club to Camana Bay/Lakeside/Seven Mile
  // ============================================
  {
    id: 'zone_2',
    name: 'Zone 2',
    displayName: 'Seven Mile Beach & Camana Bay',
    color: '#10B981', // Green
    isSubZone: false,
    boundaryCoordinates: [
      // Yacht Club roundabout to Lakeside corridor
      [-81.3900, 19.3600], // NW corner (connects to Zone 1a)
      [-81.3700, 19.3600], // NE corner
      [-81.3650, 19.3450], // Seven Mile north
      [-81.3700, 19.3200], // Camana Bay
      [-81.3750, 19.3100], // Seven Mile south
      [-81.3850, 19.3050], // Lakeside approach
      [-81.3900, 19.3050], // SW corner
      [-81.3950, 19.3200], // West side
      [-81.3900, 19.3400], // West mid
      [-81.3900, 19.3600], // Close polygon
    ],
  },

  // ============================================
  // ZONE 3 - Lakeside/KFC Baytown to Hurleys
  // ============================================
  {
    id: 'zone_3',
    name: 'Zone 3',
    displayName: 'George Town & Industrial',
    color: '#F59E0B', // Amber
    isSubZone: false,
    boundaryCoordinates: [
      // Lakeside to Hurleys corridor
      [-81.3900, 19.3100], // NW (connects to Zone 2)
      [-81.3700, 19.3100], // NE corner
      [-81.3700, 19.2850], // East side
      [-81.3500, 19.2700], // Hurleys area
      [-81.3400, 19.2650], // SE corner
      [-81.3500, 19.2600], // South side
      [-81.3850, 19.2700], // SW corner
      [-81.3900, 19.2900], // West side
      [-81.3900, 19.3100], // Close polygon
    ],
  },
  {
    id: 'zone_3a',
    name: 'Zone 3a',
    displayName: 'Owen Roberts Airport',
    color: '#EF4444', // Red
    parentZone: 'zone_3',
    isSubZone: true,
    boundaryCoordinates: [
      // Airport zone
      [-81.3650, 19.3000], // NW corner
      [-81.3500, 19.3000], // NE corner
      [-81.3450, 19.2900], // East side
      [-81.3500, 19.2850], // SE corner
      [-81.3650, 19.2850], // South side
      [-81.3700, 19.2950], // West side
      [-81.3650, 19.3000], // Close polygon
    ],
  },

  // ============================================
  // ZONE 4 - Prospect, Scotts, Newlands, Savannah
  // ============================================
  {
    id: 'zone_4',
    name: 'Zone 4',
    displayName: 'Prospect to Savannah',
    color: '#8B5CF6', // Purple
    isSubZone: false,
    boundaryCoordinates: [
      // Prospect to Savannah corridor
      [-81.3550, 19.2850], // NW (connects to Zone 3)
      [-81.3400, 19.2850], // North edge
      [-81.3000, 19.2800], // Newlands
      [-81.2900, 19.2750], // Savannah
      [-81.2900, 19.2650], // SE corner
      [-81.3100, 19.2600], // South side
      [-81.3400, 19.2650], // Prospect south
      [-81.3550, 19.2750], // SW corner
      [-81.3550, 19.2850], // Close polygon
    ],
  },
  {
    id: 'zone_4a',
    name: 'Zone 4a',
    displayName: 'Dominos to Agricola',
    color: '#A78BFA', // Light purple
    parentZone: 'zone_4',
    isSubZone: true,
    boundaryCoordinates: [
      // Dominos to Agricola Dr corridor
      [-81.3000, 19.2800], // NW corner
      [-81.2800, 19.2850], // NE corner
      [-81.2800, 19.2750], // East side
      [-81.2900, 19.2700], // SE corner
      [-81.3000, 19.2700], // South side
      [-81.3000, 19.2800], // Close polygon
    ],
  },

  // ============================================
  // ZONE 5 - End of Savannah to Bodden Town
  // ============================================
  {
    id: 'zone_5',
    name: 'Zone 5',
    displayName: 'Savannah to Bodden Town',
    color: '#EC4899', // Pink
    isSubZone: false,
    boundaryCoordinates: [
      // End of Savannah to BT Police
      [-81.2950, 19.2850], // NW (connects to Zone 4)
      [-81.2400, 19.2900], // NE corner
      [-81.2400, 19.2750], // East side
      [-81.2500, 19.2650], // BT Police area
      [-81.2800, 19.2650], // South side
      [-81.2950, 19.2750], // SW corner
      [-81.2950, 19.2850], // Close polygon
    ],
  },
  {
    id: 'zone_5a',
    name: 'Zone 5a',
    displayName: 'BT Stadium to Midland Acres',
    color: '#F472B6', // Light pink
    parentZone: 'zone_5',
    isSubZone: true,
    boundaryCoordinates: [
      // BT Stadium to Midland Acres
      [-81.2500, 19.2900], // NW corner
      [-81.2200, 19.2980], // NE corner
      [-81.2200, 19.2850], // East side
      [-81.2350, 19.2800], // SE corner
      [-81.2500, 19.2800], // South side
      [-81.2500, 19.2900], // Close polygon
    ],
  },
  {
    id: 'zone_5b',
    name: 'Zone 5b',
    displayName: 'Midland Acres to Frank Sound',
    color: '#FB7185', // Rose
    parentZone: 'zone_5',
    isSubZone: true,
    boundaryCoordinates: [
      // Midland Acres to top of Frank Sound road
      [-81.2300, 19.3050], // NW corner
      [-81.1800, 19.3100], // NE corner
      [-81.1750, 19.2950], // East side
      [-81.2000, 19.2900], // SE corner
      [-81.2300, 19.2900], // South side
      [-81.2300, 19.3050], // Close polygon
    ],
  },

  // ============================================
  // ZONE 6 - North Side Area
  // ============================================
  {
    id: 'zone_6',
    name: 'Zone 6',
    displayName: 'Frank Sound Road',
    color: '#14B8A6', // Teal
    isSubZone: false,
    boundaryCoordinates: [
      // Frank Sound Road corridor
      [-81.1900, 19.3100], // SW corner
      [-81.1700, 19.3550], // NW corner (NS area)
      [-81.1650, 19.3550], // NE corner
      [-81.1650, 19.3000], // East side
      [-81.1750, 19.2950], // SE corner
      [-81.1900, 19.3000], // South side
      [-81.1900, 19.3100], // Close polygon
    ],
  },
  {
    id: 'zone_6a',
    name: 'Zone 6a',
    displayName: 'North Side to Queens Monument',
    color: '#2DD4BF', // Light teal
    parentZone: 'zone_6',
    isSubZone: true,
    boundaryCoordinates: [
      // Old North Side playing field to Queens Monument
      [-81.1800, 19.3550], // NW corner
      [-81.1500, 19.3600], // NE corner
      [-81.1450, 19.3450], // East side
      [-81.1700, 19.3400], // SE corner
      [-81.1800, 19.3450], // South side
      [-81.1800, 19.3550], // Close polygon
    ],
  },
  {
    id: 'zone_6b',
    name: 'Zone 6b',
    displayName: 'NS Stadium to Chisholm\'s',
    color: '#5EEAD4', // Lighter teal
    parentZone: 'zone_6',
    isSubZone: true,
    boundaryCoordinates: [
      // NS Stadium to Chisholm's Grocery
      [-81.2200, 19.3600], // NW corner
      [-81.1750, 19.3600], // NE corner
      [-81.1700, 19.3400], // East side
      [-81.2100, 19.3400], // SE corner
      [-81.2200, 19.3500], // South side
      [-81.2200, 19.3600], // Close polygon
    ],
  },
  {
    id: 'zone_6c',
    name: 'Zone 6c',
    displayName: 'Rum Point & Kaibo',
    color: '#99F6E4', // Lightest teal
    parentZone: 'zone_6',
    isSubZone: true,
    boundaryCoordinates: [
      // Chisholm's to Rum Point, Kaibo, Starfish Point
      [-81.2900, 19.3700], // NW corner (Starfish)
      [-81.2100, 19.3750], // NE corner
      [-81.2050, 19.3500], // East side
      [-81.2700, 19.3450], // SE corner
      [-81.2900, 19.3550], // South side
      [-81.2900, 19.3700], // Close polygon
    ],
  },

  // ============================================
  // ZONE 7 - East End Area
  // ============================================
  {
    id: 'zone_7',
    name: 'Zone 7',
    displayName: 'East End',
    color: '#F97316', // Orange
    isSubZone: false,
    boundaryCoordinates: [
      // EE General area
      [-81.1300, 19.3050], // NW corner
      [-81.0950, 19.3050], // NE corner
      [-81.0950, 19.2900], // East side
      [-81.1150, 19.2850], // SE corner
      [-81.1300, 19.2900], // South side
      [-81.1300, 19.3050], // Close polygon
    ],
  },
  {
    id: 'zone_7a',
    name: 'Zone 7a',
    displayName: 'EE to Health City',
    color: '#FB923C', // Light orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // EE to Health City corridor
      [-81.1550, 19.3050], // NW corner
      [-81.1200, 19.3050], // NE corner
      [-81.1150, 19.2900], // East side
      [-81.1400, 19.2850], // SE corner
      [-81.1550, 19.2950], // South side
      [-81.1550, 19.3050], // Close polygon
    ],
  },
  {
    id: 'zone_7b',
    name: 'Zone 7b',
    displayName: 'EE to Fosters/Morritts',
    color: '#FDBA74', // Lighter orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // EE to Fosters/Morritts corridor
      [-81.1050, 19.3550], // NW corner (Morritts)
      [-81.0850, 19.3550], // NE corner
      [-81.0850, 19.2950], // East side
      [-81.0950, 19.2900], // SE corner
      [-81.1050, 19.2950], // South side
      [-81.1050, 19.3550], // Close polygon
    ],
  },
  {
    id: 'zone_7c',
    name: 'Zone 7c',
    displayName: 'Health City to EE Homes',
    color: '#FED7AA', // Pale orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // Health City past EE homes
      [-81.1550, 19.3100], // NW corner
      [-81.1000, 19.3100], // NE corner
      [-81.0950, 19.2950], // East side
      [-81.1400, 19.2900], // SE corner
      [-81.1550, 19.2950], // South side
      [-81.1550, 19.3100], // Close polygon
    ],
  },
  {
    id: 'zone_7d',
    name: 'Zone 7d',
    displayName: 'Fosters to EE Homes',
    color: '#FFEDD5', // Lightest orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // Fosters past EE homes
      [-81.1300, 19.3550], // NW corner
      [-81.0900, 19.3550], // NE corner
      [-81.0850, 19.2900], // East side
      [-81.1200, 19.2850], // SE corner
      [-81.1300, 19.3000], // South side
      [-81.1300, 19.3550], // Close polygon
    ],
  },
  {
    id: 'zone_7e',
    name: 'Zone 7e',
    displayName: 'Fosters to North Side Back Road',
    color: '#EA580C', // Deep orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // Fosters to North Side back road
      [-81.1600, 19.3600], // NW corner
      [-81.0900, 19.3600], // NE corner
      [-81.0850, 19.3450], // East side
      [-81.1500, 19.3400], // SE corner
      [-81.1600, 19.3500], // South side
      [-81.1600, 19.3600], // Close polygon
    ],
  },
  {
    id: 'zone_7f',
    name: 'Zone 7f',
    displayName: 'North Side to Health City',
    color: '#C2410C', // Dark orange
    parentZone: 'zone_7',
    isSubZone: true,
    boundaryCoordinates: [
      // NS to Health City corridor
      [-81.1900, 19.3100], // NW corner
      [-81.1450, 19.3100], // NE corner
      [-81.1400, 19.2950], // East side
      [-81.1800, 19.2900], // SE corner
      [-81.1900, 19.2950], // South side
      [-81.1900, 19.3100], // Close polygon
    ],
  },

  // ============================================
  // FALLBACK - General Grand Cayman Zone
  // ============================================
  {
    id: 'zone_general',
    name: 'General Zone',
    displayName: 'Grand Cayman',
    color: '#6B7280', // Gray
    isSubZone: false,
    boundaryCoordinates: [
      // Entire island fallback
      [-81.4300, 19.4000], // NW corner
      [-81.0800, 19.4000], // NE corner
      [-81.0800, 19.2500], // SE corner
      [-81.4300, 19.2500], // SW corner
      [-81.4300, 19.4000], // Close polygon
    ],
  },
];

/**
 * NEW PRICING CONSTANTS
 */
export const PRICING_CONSTANTS = {
  // Within-zone pricing (≤3 mins)
  WITHIN_ZONE_SHORT_TRIP: 6,        // $6 KYD for trips ≤3 mins
  WITHIN_ZONE_WITH_STOP: 10,        // $10 KYD for trips with extra stop
  EXTRA_STOP_FEE: 3,                // $3 KYD for extra stop after 3 mins

  // Sub-zone pricing
  SUB_ZONE_BASE: 10,                // $10 KYD base for sub-zone trip
  SUB_ZONE_FEE: 3,                  // +$3 KYD for going to sub-zone

  // Cross-zone pricing
  CROSS_ZONE_BASE: 13,              // $13 KYD base when leaving zone entirely
  PRICE_PER_MILE: 0.75,             // $0.75 KYD per mile after base
  PRICE_PER_MINUTE: 0,              // Not used - distance only pricing

  // Airport base (Zone 3a)
  AIRPORT_BASE: 13,                 // $13 KYD base for airport trips
  AIRPORT_PRICE_PER_MILE: 1.00,     // $1.00 KYD per mile for airport trips to zones 1,2,4,5

  // Long-distance fixed prices
  LONG_DISTANCE_FIXED: 50,          // $50 KYD fixed for Zone 1/2/3 to Zone 6/7

  // Legacy constants (for compatibility)
  BASE_ZONE_EXIT_FEE: 13,
  WITHIN_ZONE_MIN: 6,
  WITHIN_ZONE_MAX: 10,
};

/**
 * Time-based multipliers
 */
export const TIME_MULTIPLIERS = {
  LATE_NIGHT: {
    startHour: 22, // 10 PM
    endHour: 6,    // 6 AM
    multiplier: 1.25, // +25%
  },
  EARLY_MORNING: {
    startHour: 5,
    endHour: 7,
    multiplier: 1.15, // +15%
  },
};

/**
 * Airport Pricing - Flat rates from airport to each zone
 * (For reference, actual calculation uses distance-based after base)
 */
export const AIRPORT_PRICING = {
  // From airport to zones (base $15 + distance)
  from_zone_3a_to_zone_1: { base: 15, description: 'Airport to West Bay' },
  from_zone_3a_to_zone_2: { base: 15, description: 'Airport to Seven Mile' },
  from_zone_3a_to_zone_3: { base: 15, description: 'Airport to George Town' },
  from_zone_3a_to_zone_4: { base: 15, description: 'Airport to Prospect/Savannah' },
  from_zone_3a_to_zone_5: { base: 15, description: 'Airport to Bodden Town' },
  from_zone_3a_to_zone_6: { base: 15, description: 'Airport to North Side' },
  from_zone_3a_to_zone_7: { base: 15, description: 'Airport to East End' },
};

/**
 * Event-based pricing (future implementation)
 */
export const EVENT_MULTIPLIERS = {
  BATABANO: { multiplier: 1.40, dates: ['2025-05-02', '2025-05-03', '2025-05-04'] },
  PIRATES_WEEK: { multiplier: 1.30, dates: ['2025-11-07', '2025-11-15'] },
  NEW_YEARS_EVE: { multiplier: 1.50, dates: ['2025-12-31'] },
};

/**
 * Helper to get parent zone ID from a zone
 */
export function getParentZoneId(zoneId: string): string {
  const zone = CAYMAN_ZONES.find(z => z.id === zoneId);
  if (!zone) return zoneId;
  return zone.parentZone || zoneId;
}

/**
 * Check if two zones share the same parent (are in same zone family)
 */
export function areZonesRelated(zoneId1: string, zoneId2: string): boolean {
  const parent1 = getParentZoneId(zoneId1);
  const parent2 = getParentZoneId(zoneId2);
  return parent1 === parent2;
}

/**
 * Check if trip is to a sub-zone of the same parent
 */
export function isSubZoneTrip(pickupZoneId: string, destZoneId: string): boolean {
  if (pickupZoneId === destZoneId) return false;

  const pickupZone = CAYMAN_ZONES.find(z => z.id === pickupZoneId);
  const destZone = CAYMAN_ZONES.find(z => z.id === destZoneId);

  if (!pickupZone || !destZone) return false;

  // Check if they share the same parent
  const pickupParent = pickupZone.parentZone || pickupZone.id;
  const destParent = destZone.parentZone || destZone.id;

  // Same parent, or one is the parent of the other
  return pickupParent === destParent ||
         pickupParent === destZoneId ||
         destParent === pickupZoneId;
}
