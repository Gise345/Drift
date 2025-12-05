# Live Tracking Integration Guide - Rider App

This guide shows how to integrate the live tracking feature into the rider's active trip screens, specifically `trip-in-progress.tsx`.

## Overview

The live tracking feature allows riders to:
- Create shareable tracking links
- Share their trip with friends/family via SMS
- Copy tracking links to clipboard
- Have their location shared in real-time with recipients

## Required Files

Make sure these files exist:
- `src/services/trackingService.ts` - Core tracking service
- `src/types/tracking.ts` - TypeScript types
- `src/components/ShareTrackingModal.tsx` - Share modal component

## Integration Steps

### 1. Add Required Imports

Add these imports to `app/(rider)/trip-in-progress.tsx`:

```typescript
// Add to existing imports
import { ShareTrackingModal } from '@/src/components/ShareTrackingModal';
import trackingService, {
  createTrackingSession,
  getShareableUrl,
  completeSessionByTrip,
} from '@/src/services/trackingService';
import type { CreateTrackingParams, TrackingSession } from '@/src/types/tracking';
```

### 2. Add State Variables

Add these state variables inside the component:

```typescript
export default function TripInProgress() {
  // ... existing state ...

  // Live Tracking State
  const [showShareModal, setShowShareModal] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [trackingSessionCreated, setTrackingSessionCreated] = useState(false);
```

### 3. Create Tracking Session on Trip Start

Add a useEffect to automatically create a tracking session when the trip starts:

```typescript
// Create tracking session when trip starts
useEffect(() => {
  const initializeTracking = async () => {
    // Only create session if trip is active and we haven't created one yet
    if (!currentTrip?.id || trackingSessionCreated || isCreatingSession) {
      return;
    }

    // Check if trip has required data
    if (!currentTrip.pickup || !currentTrip.dropoff) {
      console.log('⚠️ Trip missing pickup/dropoff data');
      return;
    }

    setIsCreatingSession(true);

    try {
      const params: CreateTrackingParams = {
        tripId: currentTrip.id,
        pickup: {
          name: currentTrip.pickup.name || 'Pickup',
          address: currentTrip.pickup.address || '',
          latitude: currentTrip.pickup.latitude,
          longitude: currentTrip.pickup.longitude,
        },
        dropoff: {
          name: currentTrip.dropoff.name || 'Destination',
          address: currentTrip.dropoff.address || '',
          latitude: currentTrip.dropoff.latitude,
          longitude: currentTrip.dropoff.longitude,
        },
        driverFirstName: currentTrip.driverName?.split(' ')[0] || 'Driver',
        riderFirstName: user?.displayName?.split(' ')[0] || 'Rider',
        vehicle: {
          make: currentTrip.vehicle?.make || '',
          model: currentTrip.vehicle?.model || '',
          color: currentTrip.vehicle?.color || '',
          plateLastFour: currentTrip.vehicle?.licensePlate?.slice(-4) || '',
        },
        initialLocation: currentTrip.driverLocation ? {
          latitude: currentTrip.driverLocation.latitude,
          longitude: currentTrip.driverLocation.longitude,
        } : undefined,
      };

      const result = await createTrackingSession(params);

      if (result) {
        setTrackingUrl(result.shareableUrl);
        setTrackingSessionCreated(true);
        console.log('✅ Tracking session created:', result.shareableUrl);
      }
    } catch (error) {
      console.error('❌ Error creating tracking session:', error);
    } finally {
      setIsCreatingSession(false);
    }
  };

  initializeTracking();
}, [currentTrip?.id, currentTrip?.status]);
```

### 4. Complete Session on Trip End

Add cleanup when trip ends:

```typescript
// Complete tracking session when trip ends
useEffect(() => {
  if (currentTrip?.status === 'COMPLETED' || currentTrip?.status === 'CANCELLED') {
    if (trackingSessionCreated && currentTrip.id) {
      completeSessionByTrip(currentTrip.id).then(() => {
        console.log('✅ Tracking session completed');
        setTrackingSessionCreated(false);
        setTrackingUrl(null);
      });
    }
  }
}, [currentTrip?.status]);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (trackingSessionCreated && currentTrip?.id) {
      completeSessionByTrip(currentTrip.id);
    }
  };
}, []);
```

### 5. Add Share Trip Button

Find the button row in your component (usually near emergency/contact buttons) and add:

```typescript
{/* Share Trip Button */}
<TouchableOpacity
  style={styles.actionButton}
  onPress={() => setShowShareModal(true)}
  disabled={!trackingUrl}
>
  <View style={[
    styles.actionIconContainer,
    { backgroundColor: trackingUrl ? Colors.primary + '15' : Colors.gray[200] }
  ]}>
    <Ionicons
      name="share-outline"
      size={22}
      color={trackingUrl ? Colors.primary : Colors.gray[400]}
    />
  </View>
  <Text style={[
    styles.actionLabel,
    !trackingUrl && { color: Colors.gray[400] }
  ]}>
    Share Trip
  </Text>
  {isCreatingSession && (
    <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 4 }} />
  )}
</TouchableOpacity>
```

### 6. Add Share Modal

Add the modal at the end of the component, before the closing tags:

```typescript
{/* Share Tracking Modal */}
<ShareTrackingModal
  visible={showShareModal}
  onClose={() => setShowShareModal(false)}
  trackingUrl={trackingUrl}
  rideInfo={currentTrip ? {
    riderName: user?.displayName || 'Rider',
    driverName: currentTrip.driverName || 'Driver',
    pickup: {
      name: currentTrip.pickup?.name || 'Pickup',
      address: currentTrip.pickup?.address || '',
      latitude: currentTrip.pickup?.latitude || 0,
      longitude: currentTrip.pickup?.longitude || 0,
    },
    dropoff: {
      name: currentTrip.dropoff?.name || 'Destination',
      address: currentTrip.dropoff?.address || '',
      latitude: currentTrip.dropoff?.latitude || 0,
      longitude: currentTrip.dropoff?.longitude || 0,
    },
    vehicle: currentTrip.vehicle ? {
      make: currentTrip.vehicle.make || '',
      model: currentTrip.vehicle.model || '',
      color: currentTrip.vehicle.color || '',
      plateLastFour: currentTrip.vehicle.licensePlate?.slice(-4) || '',
    } : undefined,
  } : null}
  onShared={(contact) => {
    console.log('📱 Shared with:', contact.name);
  }}
/>
```

### 7. Add Styles

Add these styles to your StyleSheet:

```typescript
// Add to styles object
actionButton: {
  alignItems: 'center',
  flex: 1,
},
actionIconContainer: {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 4,
},
actionLabel: {
  fontSize: 12,
  fontFamily: Typography.fontFamily.medium,
  color: Colors.gray[700],
},
```

## Complete Example

Here's a minimal working example of the integration:

```typescript
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShareTrackingModal } from '@/src/components/ShareTrackingModal';
import { createTrackingSession, completeSessionByTrip } from '@/src/services/trackingService';

export default function TripInProgress() {
  const { currentTrip } = useTripStore();
  const { user } = useAuthStore();

  const [showShareModal, setShowShareModal] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Auto-create session
  useEffect(() => {
    if (currentTrip?.id && !trackingUrl) {
      setIsCreatingSession(true);
      createTrackingSession({
        tripId: currentTrip.id,
        pickup: currentTrip.pickup,
        dropoff: currentTrip.dropoff,
        driverFirstName: currentTrip.driverName?.split(' ')[0] || 'Driver',
        riderFirstName: user?.displayName?.split(' ')[0] || 'Rider',
        vehicle: {
          make: currentTrip.vehicle?.make || '',
          model: currentTrip.vehicle?.model || '',
          color: currentTrip.vehicle?.color || '',
          plateLastFour: currentTrip.vehicle?.licensePlate?.slice(-4) || '',
        },
      }).then(result => {
        if (result) setTrackingUrl(result.shareableUrl);
      }).finally(() => setIsCreatingSession(false));
    }
  }, [currentTrip?.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (currentTrip?.id) completeSessionByTrip(currentTrip.id);
    };
  }, []);

  return (
    <View>
      {/* ... other UI ... */}

      <TouchableOpacity onPress={() => setShowShareModal(true)}>
        <Ionicons name="share-outline" size={24} />
        <Text>Share Trip</Text>
        {isCreatingSession && <ActivityIndicator />}
      </TouchableOpacity>

      <ShareTrackingModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        trackingUrl={trackingUrl}
        rideInfo={currentTrip ? {
          riderName: user?.displayName || 'Rider',
          driverName: currentTrip.driverName || 'Driver',
          pickup: currentTrip.pickup,
          dropoff: currentTrip.dropoff,
          vehicle: currentTrip.vehicle,
        } : null}
      />
    </View>
  );
}
```

## Testing

1. Start a ride as a rider
2. Wait for "Share Trip" button to become active (tracking URL created)
3. Tap "Share Trip"
4. Either:
   - Copy the link and open in browser
   - Select a contact to send SMS
5. Verify the tracking page shows correct trip info
6. Complete the ride and verify session is marked as completed

## Troubleshooting

### "No tracking link available" error
- Ensure the trip has a valid ID
- Check that Firebase Functions are deployed
- Verify the user is authenticated

### Share button stays disabled
- Check console for tracking session creation errors
- Verify trip data has pickup/dropoff coordinates
- Ensure Firebase Functions permission is set correctly

### SMS not sending
- Check that device has SMS capability
- Verify expo-sms is installed: `npx expo install expo-sms`
- Test on physical device (simulators may not support SMS)

## Required Packages

Make sure these packages are installed:

```bash
npx expo install expo-sms expo-contacts expo-clipboard expo-haptics
```
