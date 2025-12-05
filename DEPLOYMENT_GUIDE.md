# Drift Live Tracking - Complete Deployment Guide

This guide covers the complete setup and deployment process for the Drift Live Tracking feature.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Initial Setup](#initial-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [Deploying Cloud Functions](#deploying-cloud-functions)
6. [Deploying Firebase Hosting](#deploying-firebase-hosting)
7. [Deploying Security Rules](#deploying-security-rules)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

1. **Node.js** (v18 or later, v22 recommended)
   ```bash
   node --version  # Should be v18+
   ```

2. **Firebase CLI** (latest version)
   ```bash
   npm install -g firebase-tools
   firebase --version  # Should be v13+
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   npx expo --version
   ```

### Required Accounts

- Firebase project (`drift-cayman`)
- Google Cloud Platform (for Maps API)
- Stripe account (for payments)

---

## Project Structure

After setup, your project should have:

```
drift/
├── public/                    # Firebase Hosting files
│   ├── index.html            # Landing page
│   ├── track.html            # Live tracking page
│   └── 404.html              # Error page
├── functions/                 # Cloud Functions
│   ├── src/
│   │   ├── index.ts          # Function exports
│   │   ├── stripe.ts         # Payment functions
│   │   ├── safety.ts         # Safety functions
│   │   └── tracking.ts       # Tracking functions (NEW)
│   ├── package.json
│   └── tsconfig.json
├── src/                       # Mobile app
│   ├── services/
│   │   └── trackingService.ts # Tracking service (NEW)
│   ├── types/
│   │   └── tracking.ts        # Tracking types (NEW)
│   └── components/
│       └── ShareTrackingModal.tsx  # Share modal (NEW)
├── firebase.json              # Firebase config
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Firestore indexes
└── package.json               # Project config
```

---

## Initial Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to project
cd drift

# Install root dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Login to Firebase

```bash
# Login to Firebase
firebase login

# Select your project
firebase use drift-cayman

# Verify project
firebase projects:list
```

### 3. Install Required Expo Packages

```bash
# Install expo packages for tracking
npx expo install expo-sms expo-contacts expo-clipboard expo-haptics expo-location
```

---

## Firebase Configuration

### 1. Verify firebase.json

Your `firebase.json` should include hosting configuration:

```json
{
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/track/**",
        "destination": "/track.html"
      }
    ]
  }
}
```

### 2. Verify .firebaserc

```json
{
  "projects": {
    "default": "drift-cayman"
  }
}
```

### 3. Set Environment Variables (Functions)

Create `functions/.env` or use Firebase secrets:

```bash
# Option 1: .env file in functions/
STRIPE_SECRET_KEY=sk_live_xxx
TRACKING_BASE_URL=https://drift-cayman.web.app

# Option 2: Firebase secrets (recommended for production)
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set TRACKING_BASE_URL
```

---

## Deploying Cloud Functions

### 1. Build Functions

```bash
cd functions
npm run build
```

### 2. Test Locally (Optional)

```bash
# Start local emulators
npm run serve

# Or from root
npm run firebase:serve
```

### 3. Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createTrackingSession,functions:updateTrackingLocation,functions:completeTrackingSession,functions:getTrackingSession,functions:cleanupExpiredSessions
```

### 4. Verify Deployment

```bash
# Check function logs
firebase functions:log

# View in Firebase Console
# https://console.firebase.google.com/project/drift-cayman/functions
```

---

## Deploying Firebase Hosting

### 1. Prepare Public Files

Ensure your `public/` folder contains:
- `index.html` - Landing page
- `track.html` - Tracking page with Firebase SDK
- `404.html` - Error page

### 2. Test Locally

```bash
# Start hosting emulator
firebase emulators:start --only hosting

# Open http://localhost:5000
```

### 3. Deploy Hosting

```bash
# Deploy hosting only
firebase deploy --only hosting
```

### 4. Verify Deployment

Open your hosting URL:
- Main site: `https://drift-cayman.web.app`
- Tracking page: `https://drift-cayman.web.app/track/TEST_TOKEN`

---

## Deploying Security Rules

### 1. Review Firestore Rules

Ensure `firestore.rules` includes tracking session rules:

```javascript
match /trackingSessions/{sessionId} {
  // Anyone can read (for public tracking links)
  allow read: if true;

  // Only authenticated users can create
  allow create: if request.auth != null;

  // Only driver or admin can update
  allow update: if request.auth != null &&
    (resource.data.driverId == request.auth.uid || isAdmin());
}
```

### 2. Deploy Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules (if needed)
firebase deploy --only storage:rules

# Deploy both
firebase deploy --only firestore:rules,storage:rules
```

### 3. Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

---

## Testing

### 1. Test Tracking Page

1. Create a test token: `test123`
2. Visit: `https://drift-cayman.web.app/track/test123`
3. Should show "Tracking Not Found" (expected for invalid token)

### 2. Test Full Flow

#### A. Create Session (from app or test script)

```javascript
// Test in browser console with Firebase
const result = await firebase.functions().httpsCallable('createTrackingSession')({
  tripId: 'test_trip_1',
  pickup: { name: 'Test Pickup', address: '123 Main St', latitude: 19.3, longitude: -81.4 },
  dropoff: { name: 'Test Dropoff', address: '456 Oak Ave', latitude: 19.4, longitude: -81.5 },
  driverFirstName: 'John',
  riderFirstName: 'Jane',
  vehicle: { make: 'Toyota', model: 'Camry', color: 'Silver', plateLastFour: '1234' }
});
console.log('Tracking URL:', result.data.shareableUrl);
```

#### B. Open Tracking Link

Visit the returned URL to verify tracking page works.

#### C. Update Location

```javascript
await firebase.functions().httpsCallable('updateTrackingLocation')({
  sessionId: 'session_id_here',
  location: { latitude: 19.35, longitude: -81.45 },
  tripPhase: 'in_progress',
  estimatedMinutes: 5
});
```

#### D. Complete Session

```javascript
await firebase.functions().httpsCallable('completeTrackingSession')({
  sessionId: 'session_id_here'
});
```

### 3. Mobile App Testing

1. Start the Expo dev server: `npm start`
2. Open on device/simulator
3. Request a ride as rider
4. Tap "Share Trip" button
5. Copy tracking link
6. Open in browser
7. Accept ride as driver
8. Verify location updates on tracking page

---

## Troubleshooting

### Functions Not Deploying

```bash
# Check for build errors
cd functions
npm run build

# Check Firebase login
firebase login:ci

# Clear cache and retry
rm -rf functions/node_modules functions/lib
cd functions && npm install && npm run build
firebase deploy --only functions
```

### Hosting 404 Errors

```bash
# Verify files exist
ls -la public/

# Redeploy
firebase deploy --only hosting

# Check firebase.json rewrites
```

### CORS Errors

Add CORS headers in Cloud Functions or firebase.json:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.json",
        "headers": [
          { "key": "Access-Control-Allow-Origin", "value": "*" }
        ]
      }
    ]
  }
}
```

### Firestore Permission Denied

1. Check authentication status
2. Verify Firestore rules are deployed
3. Check user role in Firestore
4. Review function logs:
   ```bash
   firebase functions:log --only createTrackingSession
   ```

### Tracking Page Not Loading

1. Check browser console for errors
2. Verify Firebase config in track.html
3. Test with valid token
4. Check Cloud Function logs

---

## Quick Commands Reference

```bash
# Local development
npm run firebase:serve              # Start all emulators
npm run firebase:serve:hosting      # Start hosting only

# Deployment
npm run firebase:deploy             # Deploy everything
npm run firebase:deploy:hosting     # Deploy hosting only
npm run firebase:deploy:functions   # Deploy functions only
npm run firebase:deploy:rules       # Deploy security rules
npm run firebase:deploy:all         # Build and deploy all

# Monitoring
npm run firebase:logs               # View function logs
npm run firebase:logs:tracking      # View tracking function logs

# Functions
npm run functions:build             # Build TypeScript
npm run functions:watch             # Watch mode
```

---

## Production Checklist

- [ ] Firebase project on Blaze (pay-as-you-go) plan
- [ ] Production API keys configured
- [ ] Environment variables set via secrets
- [ ] Firestore rules deployed
- [ ] Firestore indexes deployed
- [ ] Cloud Functions deployed
- [ ] Firebase Hosting deployed
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Mobile app updated with tracking feature
- [ ] Tested on physical devices
- [ ] Monitoring/alerting configured

---

## Support

For issues:
1. Check Firebase Console for errors
2. Review Cloud Function logs
3. Test with emulators first
4. Report issues at: https://github.com/anthropics/claude-code/issues
