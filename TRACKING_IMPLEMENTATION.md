# Drift Live Tracking - Technical Implementation

Complete technical documentation for the Drift Live Tracking feature.

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Cloud Functions](#cloud-functions)
5. [Mobile Service](#mobile-service)
6. [Web Tracking Page](#web-tracking-page)
7. [Security](#security)
8. [Performance](#performance)
9. [Privacy](#privacy)

---

## Feature Overview

### Purpose
Allow riders to share their trip with friends and family who can track the journey in real-time via a web link.

### User Flow

1. **Rider** requests a ride
2. **Rider** taps "Share Trip" button
3. System creates a tracking session with unique token
4. **Rider** shares link via SMS, clipboard, or other method
5. **Recipient** opens link in browser
6. Tracking page shows real-time driver location and trip info
7. **Driver** location auto-updates every 10 seconds
8. Trip ends, session marked complete

### Features

- Shareable tracking links (no app required to view)
- Real-time driver location on map
- Trip details (pickup, dropoff, vehicle)
- Driver first name (privacy-conscious)
- ETA and trip phase display
- SMS sharing integration
- Clipboard link copying
- Auto-cleanup of expired sessions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Rider      │  │   Driver     │  │  Tracking    │          │
│  │   Screens    │  │   Screens    │  │  Service     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └────────────────┼──────────────────┘                   │
│                          │                                       │
│  ┌───────────────────────▼────────────────────────┐             │
│  │            Firebase Functions SDK               │             │
│  └───────────────────────┬────────────────────────┘             │
└──────────────────────────┼───────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Functions                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ createTracking   │  │ updateTracking   │  │ completeSession│ │
│  │ Session          │  │ Location         │  │                │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 ▼                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Firestore                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │              trackingSessions collection            │  │   │
│  │  │  - id, token, tripId, status                       │  │   │
│  │  │  - currentLocation, tripPhase, ETA                 │  │   │
│  │  │  - pickup, dropoff, vehicle, names                 │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                │ Real-time Updates
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Firebase Hosting                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   track.html                                │  │
│  │  - Firebase Web SDK                                        │  │
│  │  - Firestore onSnapshot listener                           │  │
│  │  - Google Maps JavaScript API                              │  │
│  │  - Real-time location display                              │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### TrackingSession Document

```typescript
interface TrackingSession {
  // Identifiers
  id: string;                    // Document ID: track_{tripId}_{timestamp}
  token: string;                 // Unique URL token (32-char hex)
  tripId: string;                // Reference to trips collection

  // Users (privacy-conscious)
  driverId: string;              // Firebase UID
  driverFirstName: string;       // First name only
  riderId: string;               // Firebase UID
  riderFirstName: string;        // First name only

  // Status
  status: 'active' | 'completed' | 'expired';
  tripPhase: 'navigating_to_pickup' | 'at_pickup' | 'in_progress' | 'arriving' | 'completed';

  // Location
  currentLocation: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    timestamp: Timestamp;
  } | null;

  // Trip Details
  pickup: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };

  // Vehicle (privacy-conscious)
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateLastFour: string;       // Only last 4 chars
  };

  // Timing
  estimatedArrival: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;          // 4 hours after creation

  // Sharing
  shareableUrl: string;          // Full URL for sharing
}
```

### Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "trackingSessions",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "trackingSessions",
      "fields": [
        { "fieldPath": "tripId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "trackingSessions",
      "fieldPath": "token",
      "indexes": [
        { "order": "ASCENDING", "queryScope": "COLLECTION" }
      ]
    }
  ]
}
```

---

## Cloud Functions

### createTrackingSession

**Purpose**: Create a new tracking session with shareable URL

**Trigger**: `onCall` (authenticated)

**Input**:
```typescript
{
  tripId: string;
  pickup: NamedLocation;
  dropoff: NamedLocation;
  driverFirstName: string;
  riderFirstName: string;
  vehicle: VehicleInfo;
  initialLocation?: Coordinates;
}
```

**Output**:
```typescript
{
  sessionId: string;
  token: string;
  shareableUrl: string;
  isExisting: boolean;
}
```

**Logic**:
1. Verify authentication
2. Check for existing active session for trip
3. If exists, return existing session
4. Generate unique token (UUID without dashes)
5. Get trip details from Firestore
6. Verify user is rider or driver
7. Create session document
8. Return session info with shareable URL

### updateTrackingLocation

**Purpose**: Update driver location for active session

**Trigger**: `onCall` (authenticated)

**Input**:
```typescript
{
  sessionId: string;
  location: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
  };
  tripPhase?: TripPhase;
  estimatedMinutes?: number;
}
```

**Output**:
```typescript
{
  success: boolean;
  updatedAt: string;
}
```

**Logic**:
1. Verify authentication
2. Get session document
3. Verify user is driver
4. Verify session is active
5. Check expiration
6. Update location and metadata
7. Return success

### completeTrackingSession

**Purpose**: Mark session as completed

**Trigger**: `onCall` (authenticated)

**Input**:
```typescript
{
  sessionId?: string;
  tripId?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  sessionId?: string;
  message?: string;
}
```

### getTrackingSession

**Purpose**: Retrieve session by token (public)

**Trigger**: `onCall` (no auth required)

**Input**:
```typescript
{
  token: string;
}
```

**Output**: Public session data (sanitized)

### cleanupExpiredSessions

**Purpose**: Daily cleanup of old sessions

**Trigger**: `onSchedule` (daily at 3 AM UTC)

**Logic**:
1. Mark expired active sessions as 'expired'
2. Delete sessions older than 7 days

---

## Mobile Service

### File: `src/services/trackingService.ts`

### Key Functions

```typescript
// Create a tracking session
createTrackingSession(params: CreateTrackingParams): Promise<CreateTrackingResponse | null>

// Create from Trip object
createSessionFromTrip(trip: TripInfo, location?: Coordinates): Promise<CreateTrackingResponse | null>

// Update driver location
updateLocation(location: TrackingLocation, phase?: TripPhase, eta?: number): Promise<boolean>

// Update using device location
updateLocationFromDevice(phase?: TripPhase, eta?: number): Promise<boolean>

// Start auto-updates (every 10 seconds)
startAutoUpdate(interval?: number, getPhase?: () => TripPhase, getETA?: () => number): void

// Stop auto-updates
stopAutoUpdate(): void

// Complete session
completeSession(sessionId?: string, tripId?: string): Promise<boolean>

// Share via SMS
shareTrackingViaSMS(phone: string, name?: string): Promise<boolean>

// Copy link to clipboard
copyTrackingLink(): Promise<boolean>

// Get current shareable URL
getShareableUrl(): string | null

// Reset all tracking state
resetTracking(): void
```

### Usage Example

```typescript
import trackingService from '@/src/services/trackingService';

// Create session when ride starts
const result = await trackingService.createSessionFromTrip(currentTrip, driverLocation);
console.log('Share URL:', result?.shareableUrl);

// Start auto-updates (driver)
trackingService.startAutoUpdate(10000, () => 'in_progress', () => eta);

// Share via SMS
await trackingService.shareViaSMS('+1234567890', 'Mom');

// Copy link
await trackingService.copyLink();

// Complete when ride ends
await trackingService.completeSession();
```

---

## Web Tracking Page

### File: `public/track.html`

### Features

- Pure HTML/CSS/JavaScript (no framework)
- Firebase Web SDK for real-time updates
- Google Maps JavaScript API for map
- Responsive design (mobile-first)
- Auto-refresh on location updates

### Key Components

1. **Header**: Trip info, driver name, vehicle
2. **Map**: Full-screen Google Map with driver marker
3. **Status Card**: Phase, ETA, pickup/dropoff
4. **Footer**: Powered by Drift branding

### Real-time Updates

```javascript
// Listen to tracking session
db.collection('trackingSessions')
  .where('token', '==', token)
  .limit(1)
  .onSnapshot(snapshot => {
    if (!snapshot.empty) {
      const session = snapshot.docs[0].data();
      updateUI(session);
      updateMarker(session.currentLocation);
    }
  });
```

---

## Security

### Firestore Rules

```javascript
match /trackingSessions/{sessionId} {
  // Anyone can read (public tracking links)
  allow read: if true;

  // Only authenticated users can create
  allow create: if request.auth != null;

  // Only driver or admin can update
  allow update: if request.auth != null &&
    (resource.data.driverId == request.auth.uid || isAdmin());

  // Only admin can delete
  allow delete: if isAdmin();
}
```

### Authentication

- Session creation requires Firebase Auth
- Location updates require authenticated driver
- Public read via token (no auth needed)
- Token is 32-character UUID (128-bit entropy)

### Rate Limiting

- Location updates throttled to 5-second minimum
- Session creation checks for existing session
- Scheduled cleanup prevents data accumulation

---

## Performance

### Optimization Strategies

1. **Efficient Queries**: Token is indexed for fast lookup
2. **Update Throttling**: 10-second intervals, 5-second minimum
3. **Client-side Caching**: Session data cached locally
4. **Lazy Loading**: Map loads after session data
5. **Batch Cleanup**: Daily scheduled function

### Resource Usage

| Operation | Firestore Reads | Firestore Writes |
|-----------|-----------------|------------------|
| Create Session | 2 | 1 |
| Update Location | 1 | 1 |
| View Tracking | 1 + realtime | 0 |
| Complete Session | 1 | 1 |

### Estimated Costs (per 1000 trips)

- Firestore reads: ~10,000 (with real-time)
- Firestore writes: ~50,000 (updates)
- Cloud Functions: ~50,000 invocations
- Hosting: Minimal (static files)

---

## Privacy

### Data Minimization

| Full Data | Shared Data |
|-----------|-------------|
| Full name | First name only |
| License plate | Last 4 digits |
| User ID | Not exposed |
| Trip history | Current trip only |
| Driver photo | Not shared |

### Data Retention

- Active sessions: Until trip completes
- Completed sessions: 7 days (then auto-deleted)
- No location history stored (only current)

### User Controls

- Sharing is opt-in (rider initiates)
- Link expires in 4 hours
- Session can be manually completed

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `unauthenticated` | Not logged in | Ensure Firebase Auth |
| `not-found` | Invalid token/session | Check token validity |
| `permission-denied` | Wrong user | Verify driver/rider role |
| `failed-precondition` | Session expired | Create new session |

### Retry Strategy

- Network errors: Auto-retry with exponential backoff
- Auth errors: Re-authenticate and retry
- Permission errors: Log and fail (no retry)

---

## Monitoring

### Logs

```bash
# View all tracking function logs
firebase functions:log --only createTrackingSession,updateTrackingLocation,completeTrackingSession

# View specific function
firebase functions:log --only createTrackingSession
```

### Alerts

Set up alerts in Firebase Console for:
- Function errors > 5/minute
- Latency > 2 seconds
- Session creation failures

---

## Testing

### Unit Tests

```typescript
// Test session creation
test('creates tracking session', async () => {
  const result = await createTrackingSession({...});
  expect(result.sessionId).toBeDefined();
  expect(result.shareableUrl).toContain('/track/');
});
```

### Integration Tests

1. Create session → Verify Firestore document
2. Update location → Verify realtime update on web
3. Complete session → Verify status change
4. Open expired link → Verify error display

### Manual Testing

1. Request ride in app
2. Tap "Share Trip"
3. Copy link and open in browser
4. Accept ride as driver
5. Watch location update on web
6. Complete ride
7. Verify "Trip Complete" on web
