/**
 * Drift Pricing Calculation Engine
 * Calculates suggested cost contributions for trips
 *
 * NEW PRICING RULES:
 * - Within zone, ≤3 mins: $6 KYD
 * - Within zone, ≤3 mins + extra stop: $10 KYD
 * - Within zone, >3 mins + extra stop: +$3 KYD
 * - To sub-zone (same parent): $10 + $3 = $13 KYD
 * - Cross-zone (different parent): $15 KYD base + distance calc
 * - Airport: $15 base + distance calc
 */

import {
  CAYMAN_ZONES,
  PRICING_CONSTANTS,
  TIME_MULTIPLIERS,
  isSubZoneTrip,
  getParentZoneId,
} from './drift-zones-config';
import { detectZone } from './drift-zone-utils';

export interface TripDetails {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceMiles: number;
  durationMinutes: number;
  requestTime?: Date;
  hasExtraStop?: boolean; // New: for extra stop pricing
}

export interface PricingResult {
  pickupZoneId: string;
  pickupZoneName: string;
  destinationZoneId: string;
  destinationZoneName: string;
  isWithinZone: boolean;
  isSubZoneTrip: boolean;
  isAirportTrip: boolean;
  isCrossZoneTrip: boolean;
  breakdown: {
    baseFee?: number;
    distanceCost?: number;
    timeCost?: number;
    extraStopFee?: number;
    subZoneFee?: number;
    timeMultiplier?: number;
    timeMultiplierName?: string;
  };
  suggestedContribution: number;
  minContribution: number;
  maxContribution: number;
  displayText: string;
  calculatedAt: Date;
}

/**
 * Check if trip is a long-distance trip (Zone 1/2/3 to Zone 6/7 or vice versa)
 */
function isLongDistanceTrip(pickupZoneId: string, destZoneId: string): boolean {
  const westZones = ['zone_1', 'zone_1a', 'zone_2', 'zone_3', 'zone_3a'];
  const eastZones = ['zone_6', 'zone_6a', 'zone_6b', 'zone_6c', 'zone_7', 'zone_7a', 'zone_7b', 'zone_7c', 'zone_7d', 'zone_7e', 'zone_7f'];

  const pickupIsWest = westZones.includes(pickupZoneId);
  const pickupIsEast = eastZones.includes(pickupZoneId);
  const destIsWest = westZones.includes(destZoneId);
  const destIsEast = eastZones.includes(destZoneId);

  // West to East or East to West
  return (pickupIsWest && destIsEast) || (pickupIsEast && destIsWest);
}

/**
 * Main pricing calculation function
 */
export function calculateTripPricing(trip: TripDetails): PricingResult {
  const pickupZone = detectZone(trip.pickupLat, trip.pickupLng);
  const destinationZone = detectZone(trip.destinationLat, trip.destinationLng);

  if (!pickupZone || !destinationZone) {
    throw new Error('Pickup or destination is outside service area');
  }

  // Check for long-distance trips first (Zone 1/2/3 to Zone 6/7) - $50 fixed
  if (isLongDistanceTrip(pickupZone.id, destinationZone.id)) {
    return calculateLongDistancePricing(pickupZone, destinationZone, trip);
  }

  // Check if it's an airport trip (Zone 3a)
  const isAirportTrip =
    pickupZone.id === 'zone_3a' || destinationZone.id === 'zone_3a';

  if (isAirportTrip) {
    return calculateAirportPricing(pickupZone, destinationZone, trip);
  }

  // Check if within same zone (exact match)
  const isWithinZone = pickupZone.id === destinationZone.id;

  if (isWithinZone) {
    return calculateWithinZonePricing(pickupZone, trip);
  }

  // Check if sub-zone trip (same parent zone family)
  const isSubZone = isSubZoneTrip(pickupZone.id, destinationZone.id);

  if (isSubZone) {
    return calculateSubZonePricing(pickupZone, destinationZone, trip);
  }

  // Full cross-zone trip (different zone families)
  return calculateCrossZonePricing(pickupZone, destinationZone, trip);
}

/**
 * Calculate pricing for within-zone trips
 * - ≤3 mins: $6 KYD
 * - ≤3 mins + extra stop: $10 KYD
 * - >3 mins + extra stop: $10 + $3 = $13 KYD
 */
function calculateWithinZonePricing(
  zone: any,
  trip: TripDetails
): PricingResult {
  const timeMultiplier = getTimeMultiplier(trip.requestTime);
  const isShortTrip = trip.durationMinutes <= 3;

  let baseFee: number;
  let extraStopFee = 0;

  if (isShortTrip) {
    // Short trip: $6 base, $10 with extra stop
    baseFee = trip.hasExtraStop
      ? PRICING_CONSTANTS.WITHIN_ZONE_WITH_STOP
      : PRICING_CONSTANTS.WITHIN_ZONE_SHORT_TRIP;
  } else {
    // Longer trip: $6 base, or $10 + $3 with extra stop
    if (trip.hasExtraStop) {
      baseFee = PRICING_CONSTANTS.WITHIN_ZONE_WITH_STOP; // $10
      extraStopFee = PRICING_CONSTANTS.EXTRA_STOP_FEE;   // +$3
    } else {
      baseFee = PRICING_CONSTANTS.WITHIN_ZONE_SHORT_TRIP; // $6
    }
  }

  const total = baseFee + extraStopFee;
  const suggested = Math.round(total * timeMultiplier.value);

  return {
    pickupZoneId: zone.id,
    pickupZoneName: zone.displayName,
    destinationZoneId: zone.id,
    destinationZoneName: zone.displayName,
    isWithinZone: true,
    isSubZoneTrip: false,
    isAirportTrip: false,
    isCrossZoneTrip: false,
    breakdown: {
      baseFee,
      extraStopFee: extraStopFee > 0 ? extraStopFee : undefined,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: suggested,
    minContribution: Math.round(suggested * 0.95),
    maxContribution: Math.round(suggested * 1.1),
    displayText: `Within ${zone.displayName}`,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate pricing for sub-zone trips (same zone family)
 * Base $10 + $3 sub-zone fee = $13 KYD
 */
function calculateSubZonePricing(
  pickupZone: any,
  destinationZone: any,
  trip: TripDetails
): PricingResult {
  const timeMultiplier = getTimeMultiplier(trip.requestTime);

  const baseFee = PRICING_CONSTANTS.SUB_ZONE_BASE; // $10
  const subZoneFee = PRICING_CONSTANTS.SUB_ZONE_FEE; // $3
  const total = baseFee + subZoneFee;

  const suggested = Math.round(total * timeMultiplier.value);

  return {
    pickupZoneId: pickupZone.id,
    pickupZoneName: pickupZone.displayName,
    destinationZoneId: destinationZone.id,
    destinationZoneName: destinationZone.displayName,
    isWithinZone: false,
    isSubZoneTrip: true,
    isAirportTrip: false,
    isCrossZoneTrip: false,
    breakdown: {
      baseFee,
      subZoneFee,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: suggested,
    minContribution: Math.round(suggested * 0.95),
    maxContribution: Math.round(suggested * 1.1),
    displayText: `${pickupZone.displayName} → ${destinationZone.displayName}`,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate pricing for cross-zone trips (different zone families)
 * $13 KYD base + distance calculation (no time component)
 */
function calculateCrossZonePricing(
  pickupZone: any,
  destinationZone: any,
  trip: TripDetails
): PricingResult {
  const baseFee = PRICING_CONSTANTS.CROSS_ZONE_BASE; // $13
  const distanceCost = trip.distanceMiles * PRICING_CONSTANTS.PRICE_PER_MILE;

  const baseTotal = baseFee + distanceCost;
  const timeMultiplier = getTimeMultiplier(trip.requestTime);

  const suggested = Math.round(baseTotal * timeMultiplier.value);
  const min = Math.round(baseTotal * 0.92 * timeMultiplier.value);
  const max = Math.round(baseTotal * 1.08 * timeMultiplier.value);

  return {
    pickupZoneId: pickupZone.id,
    pickupZoneName: pickupZone.displayName,
    destinationZoneId: destinationZone.id,
    destinationZoneName: destinationZone.displayName,
    isWithinZone: false,
    isSubZoneTrip: false,
    isAirportTrip: false,
    isCrossZoneTrip: true,
    breakdown: {
      baseFee,
      distanceCost: Math.round(distanceCost * 100) / 100,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: suggested,
    minContribution: min,
    maxContribution: max,
    displayText: `${pickupZone.displayName} → ${destinationZone.displayName}`,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate pricing for long-distance trips (Zone 1/2/3 to Zone 6/7)
 * Fixed $50 KYD
 */
function calculateLongDistancePricing(
  pickupZone: any,
  destinationZone: any,
  trip: TripDetails
): PricingResult {
  const fixedPrice = PRICING_CONSTANTS.LONG_DISTANCE_FIXED; // $50
  const timeMultiplier = getTimeMultiplier(trip.requestTime);

  const suggested = Math.round(fixedPrice * timeMultiplier.value);

  return {
    pickupZoneId: pickupZone.id,
    pickupZoneName: pickupZone.displayName,
    destinationZoneId: destinationZone.id,
    destinationZoneName: destinationZone.displayName,
    isWithinZone: false,
    isSubZoneTrip: false,
    isAirportTrip: false,
    isCrossZoneTrip: true,
    breakdown: {
      baseFee: fixedPrice,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: suggested,
    minContribution: suggested,
    maxContribution: suggested,
    displayText: `${pickupZone.displayName} → ${destinationZone.displayName}`,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate pricing for airport trips
 * $13 base + distance calculation (no time component)
 * Uses $1/mile for zones 1, 2, 4, 5 (Owen Roberts International Airport)
 */
function calculateAirportPricing(
  pickupZone: any,
  destinationZone: any,
  trip: TripDetails
): PricingResult {
  const baseFee = PRICING_CONSTANTS.AIRPORT_BASE; // $13

  // Determine the non-airport zone
  const isFromAirport = pickupZone.id === 'zone_3a';
  const otherZoneId = isFromAirport ? destinationZone.id : pickupZone.id;

  // Use $1/mile for zones 1, 2, 4, 5 (and their sub-zones)
  const premiumZones = ['zone_1', 'zone_1a', 'zone_2', 'zone_4', 'zone_4a', 'zone_5', 'zone_5a', 'zone_5b'];
  const isPremiumZone = premiumZones.includes(otherZoneId);

  const pricePerMile = isPremiumZone
    ? PRICING_CONSTANTS.AIRPORT_PRICE_PER_MILE  // $1.00/mile
    : PRICING_CONSTANTS.PRICE_PER_MILE;         // $0.75/mile for other zones

  const distanceCost = trip.distanceMiles * pricePerMile;

  const baseTotal = baseFee + distanceCost;
  const timeMultiplier = getTimeMultiplier(trip.requestTime);

  const suggested = Math.round(baseTotal * timeMultiplier.value);
  const min = Math.round(baseTotal * 0.92 * timeMultiplier.value);
  const max = Math.round(baseTotal * 1.08 * timeMultiplier.value);

  const displayText = isFromAirport
    ? `Airport → ${destinationZone.displayName}`
    : `${pickupZone.displayName} → Airport`;

  return {
    pickupZoneId: pickupZone.id,
    pickupZoneName: pickupZone.displayName,
    destinationZoneId: destinationZone.id,
    destinationZoneName: destinationZone.displayName,
    isWithinZone: false,
    isSubZoneTrip: false,
    isAirportTrip: true,
    isCrossZoneTrip: false,
    breakdown: {
      baseFee,
      distanceCost: Math.round(distanceCost * 100) / 100,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: suggested,
    minContribution: min,
    maxContribution: max,
    displayText,
    calculatedAt: new Date(),
  };
}

/**
 * Get time-based multiplier
 */
function getTimeMultiplier(requestTime?: Date): { value: number; name: string } {
  if (!requestTime) {
    return { value: 1.0, name: 'Standard' };
  }

  const hour = requestTime.getHours();

  // Late night (10 PM - 6 AM)
  if (
    hour >= TIME_MULTIPLIERS.LATE_NIGHT.startHour ||
    hour < TIME_MULTIPLIERS.LATE_NIGHT.endHour
  ) {
    return {
      value: TIME_MULTIPLIERS.LATE_NIGHT.multiplier,
      name: 'Late Night',
    };
  }

  // Early morning (5 AM - 7 AM)
  if (
    hour >= TIME_MULTIPLIERS.EARLY_MORNING.startHour &&
    hour < TIME_MULTIPLIERS.EARLY_MORNING.endHour
  ) {
    return {
      value: TIME_MULTIPLIERS.EARLY_MORNING.multiplier,
      name: 'Early Morning',
    };
  }

  return { value: 1.0, name: 'Standard' };
}

/**
 * Format currency for display (KYD)
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)} KYD`;
}

/**
 * Format pricing result for display
 */
export function formatPricingDisplay(result: PricingResult): string {
  const lines: string[] = [];

  lines.push(`Route: ${result.displayText}`);
  lines.push('');

  if (result.isWithinZone) {
    lines.push('Within-zone trip');
    if (result.breakdown.baseFee) {
      lines.push(`  Base: ${formatCurrency(result.breakdown.baseFee)}`);
    }
    if (result.breakdown.extraStopFee) {
      lines.push(`  Extra stop: +${formatCurrency(result.breakdown.extraStopFee)}`);
    }
  } else if (result.isSubZoneTrip) {
    lines.push('Sub-zone trip');
    if (result.breakdown.baseFee) {
      lines.push(`  Base: ${formatCurrency(result.breakdown.baseFee)}`);
    }
    if (result.breakdown.subZoneFee) {
      lines.push(`  Sub-zone fee: +${formatCurrency(result.breakdown.subZoneFee)}`);
    }
  } else if (result.isAirportTrip) {
    lines.push('Airport trip');
    if (result.breakdown.baseFee) {
      lines.push(`  Base: ${formatCurrency(result.breakdown.baseFee)}`);
    }
    if (result.breakdown.distanceCost) {
      lines.push(`  Distance: +${formatCurrency(result.breakdown.distanceCost)}`);
    }
    if (result.breakdown.timeCost) {
      lines.push(`  Time: +${formatCurrency(result.breakdown.timeCost)}`);
    }
  } else if (result.isCrossZoneTrip) {
    lines.push('Cross-zone trip');
    if (result.breakdown.baseFee) {
      lines.push(`  Base: ${formatCurrency(result.breakdown.baseFee)}`);
    }
    if (result.breakdown.distanceCost) {
      lines.push(`  Distance: +${formatCurrency(result.breakdown.distanceCost)}`);
    }
    if (result.breakdown.timeCost) {
      lines.push(`  Time: +${formatCurrency(result.breakdown.timeCost)}`);
    }
  }

  if (result.breakdown.timeMultiplier && result.breakdown.timeMultiplier > 1) {
    lines.push(`  ${result.breakdown.timeMultiplierName}: +${((result.breakdown.timeMultiplier - 1) * 100).toFixed(0)}%`);
  }

  lines.push('');
  lines.push(`Suggested: ${formatCurrency(result.suggestedContribution)}`);
  lines.push(`Range: ${formatCurrency(result.minContribution)} - ${formatCurrency(result.maxContribution)}`);

  return lines.join('\n');
}

/**
 * Quick price estimate without full zone detection
 */
export function getQuickEstimate(
  durationMinutes: number,
  hasExtraStop: boolean = false,
  tripType: 'within' | 'subzone' | 'crosszone' | 'airport' = 'within'
): number {
  switch (tripType) {
    case 'within':
      if (durationMinutes <= 3) {
        return hasExtraStop ? 10 : 6;
      }
      return hasExtraStop ? 13 : 6; // $10 + $3 extra stop for longer trips
    case 'subzone':
      return 13; // $10 + $3
    case 'crosszone':
    case 'airport':
      return 15; // Base, actual price depends on distance
    default:
      return 6;
  }
}
