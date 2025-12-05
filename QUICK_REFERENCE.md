# Drift Live Tracking - Quick Reference

## Quick Commands

```bash
# Development
npm run firebase:serve              # Start emulators
npm run firebase:serve:hosting      # Hosting only

# Deployment
npm run firebase:deploy             # Deploy all
npm run firebase:deploy:hosting     # Hosting only
npm run firebase:deploy:functions   # Functions only
npm run firebase:deploy:rules       # Security rules

# Monitoring
npm run firebase:logs               # View all logs
npm run firebase:logs:tracking      # Tracking logs only

# Build
npm run functions:build             # Build functions
```

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://drift-cayman.web.app |
| Tracking | https://drift-cayman.web.app/track/{token} |
| Console | https://console.firebase.google.com/project/drift-cayman |

## Cloud Functions

| Function | Purpose |
|----------|---------|
| `createTrackingSession` | Create shareable tracking link |
| `updateTrackingLocation` | Update driver location |
| `completeTrackingSession` | End tracking session |
| `getTrackingSession` | Get session by token |
| `cleanupExpiredSessions` | Daily cleanup (scheduled) |

## Firestore Collections

| Collection | Purpose |
|------------|---------|
| `trackingSessions` | Tracking session data |
| `trips` | Trip records |
| `users` | User profiles |
| `drivers` | Driver profiles |

## Tracking Session Status

| Status | Description |
|--------|-------------|
| `active` | Session is live |
| `completed` | Trip finished |
| `expired` | Session timed out |

## Trip Phases

| Phase | When |
|-------|------|
| `navigating_to_pickup` | Driver heading to rider |
| `at_pickup` | Driver arrived, waiting |
| `in_progress` | Trip underway |
| `arriving` | Near destination |
| `completed` | Trip finished |

## Key Files

```
functions/src/tracking.ts      # Cloud Functions
src/services/trackingService.ts  # Mobile service
src/types/tracking.ts          # TypeScript types
src/components/ShareTrackingModal.tsx  # Share UI
public/track.html              # Tracking page
firestore.rules                # Security rules
```

## Environment Variables

```bash
# Functions (.env or Firebase secrets)
STRIPE_SECRET_KEY=sk_xxx
TRACKING_BASE_URL=https://drift-cayman.web.app
```

## Deployment Checklist

- [ ] Functions deployed
- [ ] Hosting deployed
- [ ] Rules deployed
- [ ] Indexes deployed
- [ ] Tested tracking page
- [ ] Tested mobile share
- [ ] Tested location updates

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Functions fail | Check `firebase functions:log` |
| 404 on tracking | Verify hosting deployed |
| Permission denied | Deploy rules, check auth |
| CORS errors | Add headers in firebase.json |
| SMS not working | Test on physical device |

## Mobile Integration

```typescript
// Create session
import { createTrackingSession } from '@/src/services/trackingService';
const result = await createTrackingSession({...});

// Update location
import { updateLocation } from '@/src/services/trackingService';
await updateLocation({lat, lng}, 'in_progress', 5);

// Complete session
import { completeSession } from '@/src/services/trackingService';
await completeSession(sessionId);
```

## Support

- Issues: https://github.com/anthropics/claude-code/issues
- Firebase: https://console.firebase.google.com
- Expo: https://expo.dev
