export type CarpoolStatus = 'MATCHING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UserMode = 'RIDER' | 'DRIVER';

export interface Location {
  name: string; // Display name for the location (e.g., "Home", "Work", "Seven Mile Beach")
  address: string; // Full formatted address
  latitude: number;
  longitude: number;
}

// Import pricing types from carpool-store
import type { PricingResult, ZoneInfo, PricingBreakdown } from '../stores/carpool-store';

// Re-export for convenience
export type { PricingResult, ZoneInfo, PricingBreakdown };

export interface CarpoolRequest {
  id: string;
  riderId: string;
  riderName: string;
  pickup: Location;
  dropoff: Location;
  requestedTime: Date;
  status: CarpoolStatus;
  createdAt: Date;
  expiresAt: Date;
  matchedDriverId?: string;
  estimatedCost?: number;
  
  // ✅ NEW: Zone-based pricing fields
  pricing?: PricingResult;
  lockedContribution?: number;
}

export interface CarpoolTrip {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string;
  driverName: string;
  pickup: Location;
  dropoff: Location;
  scheduledTime: Date;
  status: CarpoolStatus;
  createdAt: Date;
  completedAt?: Date;
  sharedCost?: number;
  rating?: number;
  
  // ✅ NEW: Zone-based pricing fields
  pricing?: PricingResult;
  lockedContribution?: number;
}

export interface SavedRoute {
  id: string;
  userId: string;
  name: string;
  pickup: Location;
  dropoff: Location;
  createdAt: Date;
}

export interface RecentActivityItem {
  id: string;
  type: 'trip' | 'request' | 'match';
  title: string;
  subtitle: string;
  timestamp: Date;
  status: CarpoolStatus;
  icon: string;
}