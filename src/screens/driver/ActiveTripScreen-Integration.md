# Live Tracking Integration Guide - Driver App

This guide shows how to integrate the live tracking feature into the driver's active trip screens to automatically update the driver's location for shared tracking links.

## Overview

The driver integration:
- Automatically updates location every 10 seconds when a tracking session is active
- Updates trip phase as the driver progresses through the ride
- Updates estimated arrival time
- Cleans up when the trip ends

## Files to Modify

1. `app/(driver)/active-ride/navigate-to-pickup.tsx` - Navigating to rider
2. `app/(driver)/active-ride/arrived-at-pickup.tsx` - Waiting at pickup
3. `app/(driver)/active-ride/navigate-to-destination.tsx` - Trip in progress
4. `app/(driver)/active-ride/complete-ride.tsx` - Trip completion

## Integration Steps

### 1. Add Required Imports

Add to each driver active-ride screen:

```typescript
// Add to imports
import {
  startAutoUpdate,
  stopAutoUpdate,
  updateLocation,
  completeSession,
  getActiveSession,
} from '@/src/services/trackingService';
import type { TripPhase } from '@/src/types/tracking';
```

### 2. Navigate to Pickup Integration

In `navigate-to-pickup.tsx`, add auto-update on mount:

```typescript
export default function NavigateToPickup() {
  const { activeRide } = useDriverStore();
  const { currentTrip } = useTripStore();

  // Start tracking updates when navigating to pickup
  useEffect(() => {
    // Check if there's an active tracking session for this trip
    const session = getActiveSession();

    if (session && session.tripId === activeRide?.id) {
      console.log('📍 Starting location updates for tracking');

      // Start auto-updating location every 10 seconds
      startAutoUpdate(
        10000, // 10 second interval
        () => 'navigating_to_pickup' as TripPhase, // Current phase
        () => eta || undefined // ETA in minutes
      );
    }

    return () => {
      // Don't stop updates here - continue through trip phases
    };
  }, [activeRide?.id]);

  // Update location when ETA changes significantly
  useEffect(() => {
    const session = getActiveSession();
    if (session && currentLocation) {
      updateLocation(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          heading: currentLocation.heading,
        },
        'navigating_to_pickup',
        eta || undefined
      );
    }
  }, [eta, currentLocation]);

  // ... rest of component
}
```

### 3. Arrived at Pickup Integration

In `arrived-at-pickup.tsx`:

```typescript
export default function ArrivedAtPickup() {
  const { activeRide } = useDriverStore();

  // Update tracking phase when arriving at pickup
  useEffect(() => {
    const session = getActiveSession();
    if (session && session.tripId === activeRide?.id) {
      // Update phase to "at_pickup"
      updateLocation(
        {
          latitude: activeRide.pickup.latitude,
          longitude: activeRide.pickup.longitude,
        },
        'at_pickup',
        0 // At location
      );
    }
  }, []);

  // ... rest of component
}
```

### 4. Navigate to Destination Integration

In `navigate-to-destination.tsx`:

```typescript
export default function NavigateToDestination() {
  const { activeRide } = useDriverStore();
  const [eta, setEta] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RouteCoordinate | null>(null);

  // Update tracking for trip in progress
  useEffect(() => {
    const session = getActiveSession();

    if (session && session.tripId === activeRide?.id) {
      console.log('📍 Continuing location updates - trip in progress');

      // Continue/restart auto-updates with new phase
      startAutoUpdate(
        10000,
        () => {
          // Return 'arriving' when close to destination
          if (distance && distance < 500) { // Within 500 meters
            return 'arriving' as TripPhase;
          }
          return 'in_progress' as TripPhase;
        },
        () => eta || undefined
      );
    }

    return () => {
      // Continue through to complete-ride
    };
  }, [activeRide?.id]);

  // Update on significant changes
  useEffect(() => {
    if (currentLocation && getActiveSession()) {
      const phase: TripPhase = (distance && distance < 500) ? 'arriving' : 'in_progress';

      updateLocation(
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          heading: currentLocation.heading,
        },
        phase,
        eta || undefined
      );
    }
  }, [eta, distance, currentLocation]);

  // ... rest of component
}
```

### 5. Complete Ride Integration

In `complete-ride.tsx`:

```typescript
export default function CompleteRide() {
  const { activeRide, completeRide } = useDriverStore();

  // Complete tracking session when ride is done
  useEffect(() => {
    const cleanupTracking = async () => {
      // Stop auto-updates
      stopAutoUpdate();

      // Complete the tracking session
      if (activeRide?.id) {
        await completeSession(undefined, activeRide.id);
        console.log('✅ Tracking session completed');
      }
    };

    cleanupTracking();
  }, []);

  const handleCompleteRide = async () => {
    // Ensure tracking is cleaned up before completing
    stopAutoUpdate();

    if (activeRide?.id) {
      await completeSession(undefined, activeRide.id);
    }

    // Existing complete ride logic
    await completeRide();

    // Navigate to summary
    router.push('/(driver)/active-ride/trip-summary');
  };

  // ... rest of component
}
```

### 6. Centralized Hook (Optional)

For cleaner integration, create a custom hook:

```typescript
// src/hooks/useTrackingUpdates.ts

import { useEffect, useRef } from 'react';
import {
  startAutoUpdate,
  stopAutoUpdate,
  updateLocation,
  getActiveSession,
} from '@/src/services/trackingService';
import type { TripPhase } from '@/src/types/tracking';

interface UseTrackingUpdatesParams {
  tripId: string | null;
  currentLocation: { latitude: number; longitude: number; heading?: number } | null;
  tripPhase: TripPhase;
  estimatedMinutes?: number;
  distanceMeters?: number;
}

export function useTrackingUpdates({
  tripId,
  currentLocation,
  tripPhase,
  estimatedMinutes,
  distanceMeters,
}: UseTrackingUpdatesParams) {
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start auto-updates when there's an active session
  useEffect(() => {
    const session = getActiveSession();

    if (session && session.tripId === tripId) {
      // Determine actual phase based on distance
      const getPhase = (): TripPhase => {
        if (tripPhase === 'in_progress' && distanceMeters && distanceMeters < 500) {
          return 'arriving';
        }
        return tripPhase;
      };

      startAutoUpdate(
        10000,
        getPhase,
        () => estimatedMinutes
      );

      return () => {
        // Don't stop here - let complete-ride handle it
      };
    }
  }, [tripId, tripPhase]);

  // Update on significant location changes
  useEffect(() => {
    const session = getActiveSession();
    if (!session || !currentLocation) return;

    const now = Date.now();
    // Throttle updates to every 5 seconds minimum
    if (now - lastUpdateRef.current < 5000) return;
    lastUpdateRef.current = now;

    const phase: TripPhase =
      tripPhase === 'in_progress' && distanceMeters && distanceMeters < 500
        ? 'arriving'
        : tripPhase;

    updateLocation(
      currentLocation,
      phase,
      estimatedMinutes
    );
  }, [currentLocation, tripPhase, estimatedMinutes, distanceMeters]);

  // Cleanup function to call manually on trip end
  const cleanupTracking = async () => {
    stopAutoUpdate();
  };

  return { cleanupTracking };
}
```

Usage in components:

```typescript
export default function NavigateToDestination() {
  const { activeRide } = useDriverStore();
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RouteCoordinate | null>(null);

  const { cleanupTracking } = useTrackingUpdates({
    tripId: activeRide?.id || null,
    currentLocation,
    tripPhase: 'in_progress',
    estimatedMinutes: eta || undefined,
    distanceMeters: distance || undefined,
  });

  // Call cleanupTracking when navigating away
  useEffect(() => {
    return () => {
      // Only cleanup if going to trip-summary
      // cleanupTracking();
    };
  }, []);

  // ... rest of component
}
```

## Complete Example - Navigate to Destination

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  startAutoUpdate,
  stopAutoUpdate,
  updateLocation,
  getActiveSession,
} from '@/src/services/trackingService';
import type { TripPhase } from '@/src/types/tracking';

export default function NavigateToDestination() {
  const { activeRide } = useDriverStore();
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    heading?: number;
  } | null>(null);

  // Initialize tracking updates
  useEffect(() => {
    const session = getActiveSession();

    if (session && session.tripId === activeRide?.id) {
      console.log('📍 Starting tracking updates for trip in progress');

      startAutoUpdate(
        10000, // 10 seconds
        () => {
          if (distance && distance < 500) return 'arriving';
          return 'in_progress';
        },
        () => eta || undefined
      );
    }
  }, [activeRide?.id]);

  // Watch location
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          setCurrentLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading || undefined,
          });
        }
      );
    };

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Manual location update on significant changes
  useEffect(() => {
    if (!currentLocation || !getActiveSession()) return;

    const phase: TripPhase = distance && distance < 500 ? 'arriving' : 'in_progress';

    updateLocation(
      {
        ...currentLocation,
        speed: undefined,
      },
      phase,
      eta || undefined
    );
  }, [currentLocation, distance, eta]);

  // ... rest of component render
}
```

## Trip Phase Guide

| Screen | Trip Phase | Description |
|--------|------------|-------------|
| navigate-to-pickup | `navigating_to_pickup` | Driver heading to pickup location |
| arrived-at-pickup | `at_pickup` | Driver waiting for rider |
| navigate-to-destination | `in_progress` | Trip underway |
| navigate-to-destination (< 500m) | `arriving` | Almost at destination |
| complete-ride | `completed` | Trip finished |

## Testing

1. **Start as Rider**: Request a ride and accept a driver
2. **Create Tracking**: Share the trip to get a tracking URL
3. **Open Tracking Page**: In browser, open the tracking URL
4. **Start as Driver**: Accept the ride and begin navigation
5. **Watch Updates**: Tracking page should show driver moving in real-time
6. **Phase Changes**: Verify phase updates (pickup -> in_progress -> arriving)
7. **Complete**: End the ride and verify session marked complete

## Troubleshooting

### Location not updating
- Check location permissions are granted
- Verify expo-location is installed
- Test on physical device (simulators may have location issues)

### Updates too slow
- Reduce interval in startAutoUpdate (minimum 5000ms recommended)
- Check network connectivity

### Session not found
- Ensure rider created tracking session before driver starts
- Verify tripId matches between rider and driver

## Performance Considerations

1. **Battery**: 10-second intervals balance accuracy vs battery
2. **Network**: Updates are small (~200 bytes each)
3. **Throttling**: Don't update more than once per 5 seconds
4. **Cleanup**: Always stop updates when trip ends

## Required Packages

```bash
npx expo install expo-location expo-task-manager
```

Note: `expo-task-manager` is needed for background location updates if you want tracking to continue when app is backgrounded.
