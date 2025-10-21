export type CarpoolStatus = 'MATCHING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UserMode = 'RIDER' | 'DRIVER';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

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
