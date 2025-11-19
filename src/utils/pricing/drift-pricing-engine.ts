/**
 * Drift Pricing Calculation Engine
 * Calculates suggested cost contributions for trips
 */

import {
  CAYMAN_ZONES,
  AIRPORT_PRICING,
  PRICING_CONSTANTS,
  TIME_MULTIPLIERS,
} from './drift-zones-config';
import { detectZone } from './drift-zone-utils';

export interface TripDetails {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceMiles: number;
  durationMinutes: number;
  requestTime?: Date; // For time-based multipliers
}

export interface PricingResult {
  pickupZoneId: string;
  pickupZoneName: string;
  destinationZoneId: string;
  destinationZoneName: string;
  isWithinZone: boolean;
  isAirportTrip: boolean;
  breakdown: {
    baseZoneFee?: number;
    distanceCost?: number;
    timeCost?: number;
    flatRate?: number;
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
 * Main pricing calculation function
 */
export function calculateTripPricing(trip: TripDetails): PricingResult {
  const pickupZone = detectZone(trip.pickupLat, trip.pickupLng);
  const destinationZone = detectZone(trip.destinationLat, trip.destinationLng);

  if (!pickupZone || !destinationZone) {
    throw new Error('Pickup or destination is outside service area');
  }

  // Check if it's an airport trip
  const isAirportTrip =
    pickupZone.id === 'zone_airport' || destinationZone.id === 'zone_airport';

  if (isAirportTrip) {
    return calculateAirportPricing(pickupZone.id, destinationZone.id);
  }

  // Check if within same zone
  const isWithinZone = pickupZone.id === destinationZone.id;

  if (isWithinZone) {
    return calculateWithinZonePricing(pickupZone, trip);
  }

  // Cross-zone trip
  return calculateCrossZonePricing(pickupZone, destinationZone, trip);
}

/**
 * Calculate pricing for within-zone trips
 */
function calculateWithinZonePricing(
  zone: any,
  trip: TripDetails
): PricingResult {
  const timeMultiplier = getTimeMultiplier(trip.requestTime);
  const baseMin = PRICING_CONSTANTS.WITHIN_ZONE_MIN;
  const baseMax = PRICING_CONSTANTS.WITHIN_ZONE_MAX;

  const suggested = Math.round((baseMin + baseMax) / 2);
  const min = Math.round(baseMin * timeMultiplier.value);
  const max = Math.round(baseMax * timeMultiplier.value);

  return {
    pickupZoneId: zone.id,
    pickupZoneName: zone.displayName,
    destinationZoneId: zone.id,
    destinationZoneName: zone.displayName,
    isWithinZone: true,
    isAirportTrip: false,
    breakdown: {
      flatRate: suggested,
      timeMultiplier: timeMultiplier.value,
      timeMultiplierName: timeMultiplier.name,
    },
    suggestedContribution: Math.round(suggested * timeMultiplier.value),
    minContribution: min,
    maxContribution: max,
    displayText: `Within ${zone.displayName}`,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate pricing for cross-zone trips
 */
function calculateCrossZonePricing(
  pickupZone: any,
  destinationZone: any,
  trip: TripDetails
): PricingResult {
  const baseFee = PRICING_CONSTANTS.BASE_ZONE_EXIT_FEE;
  const distanceCost = trip.distanceMiles * PRICING_CONSTANTS.PRICE_PER_MILE;
  const timeCost = trip.durationMinutes * PRICING_CONSTANTS.PRICE_PER_MINUTE;

  const baseTotal = baseFee + distanceCost + timeCost;
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
    isAirportTrip: false,
    breakdown: {
      baseZoneFee: baseFee,
      distanceCost: Math.round(distanceCost * 100) / 100,
      timeCost: Math.round(timeCost * 100) / 100,
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
 * Calculate pricing for airport trips
 */
function calculateAirportPricing(
  pickupZoneId: string,
  destinationZoneId: string
): PricingResult {
  let pricing;
  let direction: 'from' | 'to';
  let otherZoneId: string;

  if (pickupZoneId === 'zone_airport') {
    direction = 'to';
    otherZoneId = destinationZoneId;
  } else {
    direction = 'from';
    otherZoneId = pickupZoneId;
  }

  const key = `${direction}_${otherZoneId}` as keyof typeof AIRPORT_PRICING;
  pricing = AIRPORT_PRICING[key];

  if (!pricing) {
    // Fallback to default airport pricing
    pricing = { min: 25, max: 35, suggested: 30 };
  }

  const pickupZone = CAYMAN_ZONES.find(z => z.id === pickupZoneId);
  const destZone = CAYMAN_ZONES.find(z => z.id === destinationZoneId);

  return {
    pickupZoneId,
    pickupZoneName: pickupZone?.displayName || 'Unknown',
    destinationZoneId,
    destinationZoneName: destZone?.displayName || 'Unknown',
    isWithinZone: false,
    isAirportTrip: true,
    breakdown: {
      flatRate: pricing.suggested,
    },
    suggestedContribution: pricing.suggested,
    minContribution: pricing.min,
    maxContribution: pricing.max,
    displayText: direction === 'from'
      ? `${pickupZone?.displayName} → Airport`
      : `Airport → ${destZone?.displayName}`,
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
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `CI$${amount.toFixed(2)}`;
}

/**
 * Format pricing result for display
 */
export function formatPricingDisplay(result: PricingResult): string {
  const lines: string[] = [];

  lines.push(`📍 ${result.displayText}`);
  lines.push('');

  if (result.isWithinZone) {
    lines.push('💡 Within-zone flat rate');
    if (result.breakdown.timeMultiplier && result.breakdown.timeMultiplier > 1) {
      lines.push(`⏰ ${result.breakdown.timeMultiplierName} rate applied`);
    }
  } else if (result.isAirportTrip) {
    lines.push('✈️ Fixed airport contribution');
  } else {
    lines.push('💡 Contribution breakdown:');
    if (result.breakdown.baseZoneFee) {
      lines.push(`   • Base zone exit: ${formatCurrency(result.breakdown.baseZoneFee)}`);
    }
    if (result.breakdown.distanceCost) {
      lines.push(`   • Distance: ${formatCurrency(result.breakdown.distanceCost)}`);
    }
    if (result.breakdown.timeCost) {
      lines.push(`   • Time: ${formatCurrency(result.breakdown.timeCost)}`);
    }
    if (result.breakdown.timeMultiplier && result.breakdown.timeMultiplier > 1) {
      lines.push(`   • ${result.breakdown.timeMultiplierName}: +${((result.breakdown.timeMultiplier - 1) * 100).toFixed(0)}%`);
    }
  }

  lines.push('');
  lines.push(`💰 Suggested contribution: ${formatCurrency(result.suggestedContribution)}`);
  lines.push(`   Range: ${formatCurrency(result.minContribution)} - ${formatCurrency(result.maxContribution)}`);

  return lines.join('\n');
}

/**
 * Example usage function
 */
export function exampleCalculations() {
  console.log('=== DRIFT PRICING EXAMPLES ===\n');

  // Example 1: Within Zone A
  const withinZone = calculateTripPricing({
    pickupLat: 19.3234,
    pickupLng: -81.3789,
    destinationLat: 19.2978,
    destinationLng: -81.3867,
    distanceMiles: 2.5,
    durationMinutes: 8,
  });
  console.log('Example 1: Seven Mile Beach to George Town (Within Zone A)');
  console.log(formatPricingDisplay(withinZone));
  console.log('\n---\n');

  // Example 2: Cross-zone (Zone A to Zone B)
  const crossZone = calculateTripPricing({
    pickupLat: 19.2978,
    pickupLng: -81.3867,
    destinationLat: 19.2734,
    destinationLng: -81.2645,
    distanceMiles: 12.0,
    durationMinutes: 22,
  });
  console.log('Example 2: George Town to Bodden Town (Zone A → Zone B)');
  console.log(formatPricingDisplay(crossZone));
  console.log('\n---\n');

  // Example 3: Airport to Zone A
  const airportTrip = calculateTripPricing({
    pickupLat: 19.2923,
    pickupLng: -81.3545,
    destinationLat: 19.3234,
    destinationLng: -81.3789,
    distanceMiles: 3.5,
    durationMinutes: 10,
  });
  console.log('Example 3: Airport to Seven Mile Beach (Airport → Zone A)');
  console.log(formatPricingDisplay(airportTrip));
  console.log('\n---\n');

  // Example 4: Late night within zone
  const lateNight = new Date();
  lateNight.setHours(23, 30); // 11:30 PM
  const lateNightTrip = calculateTripPricing({
    pickupLat: 19.3234,
    pickupLng: -81.3789,
    destinationLat: 19.2978,
    destinationLng: -81.3867,
    distanceMiles: 2.5,
    durationMinutes: 8,
    requestTime: lateNight,
  });
  console.log('Example 4: Late Night Trip (11:30 PM, Within Zone A)');
  console.log(formatPricingDisplay(lateNightTrip));
  console.log('\n---\n');

  // Example 5: Long cross-island trip
  const longTrip = calculateTripPricing({
    pickupLat: 19.3522,
    pickupLng: -81.4089,
    destinationLat: 19.2734,
    destinationLng: -81.1967,
    distanceMiles: 22.0,
    durationMinutes: 35,
  });
  console.log('Example 5: West Bay to East End (Zone A → Zone C)');
  console.log(formatPricingDisplay(longTrip));
}