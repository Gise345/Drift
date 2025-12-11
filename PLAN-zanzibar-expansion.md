# Drift App - Zanzibar (Tanzania) Expansion Plan

## Overview

This document outlines the plan to expand the Drift carpool app to support **Zanzibar, Tanzania** alongside the existing **Cayman Islands** deployment. The goal is to have a single app that can serve both markets with country-specific features, languages, pricing, and payment methods.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Development & Testing Strategy](#development--testing-strategy)
3. [Phase 1: Multi-Country Infrastructure](#phase-1-multi-country-infrastructure)
4. [Phase 2: Internationalization (i18n)](#phase-2-internationalization-i18n)
5. [Phase 3: Country Selection & Auth Flow](#phase-3-country-selection--auth-flow)
6. [Phase 4: Zanzibar-Specific Configuration](#phase-4-zanzibar-specific-configuration)
7. [Phase 5: Payment Integration for Tanzania](#phase-5-payment-integration-for-tanzania)
8. [Phase 6: Driver Registration Adaptations](#phase-6-driver-registration-adaptations)
9. [Phase 7: Testing & QA](#phase-7-testing--qa)
10. [Phase 8: Production Deployment](#phase-8-production-deployment)
11. [Technical Architecture](#technical-architecture)
12. [Risk Mitigation](#risk-mitigation)

---

## Current State Analysis

### What Exists (Cayman Islands)
- Complete authentication flow (email + Google Sign-In)
- 14-step driver registration with document uploads
- Zone-based pricing engine (CI$ currency)
- Stripe payment integration (cards, Apple Pay, Google Pay)
- 80/20 fee split (driver gets 80%)
- Firebase backend (Auth, Firestore, Functions, Storage)
- No internationalization - all text hardcoded in English

### What Needs to be Added for Zanzibar
- Country detection/selection mechanism
- Multi-language support (English + Swahili)
- Tanzania-specific pricing (TZS - Tanzanian Shilling)
- Alternative payment methods (M-Pesa, Tigo Pesa, Airtel Money)
- Zanzibar geographic zones
- Tanzania-specific legal requirements
- Different driver documentation requirements

---

## Development & Testing Strategy

### CRITICAL: Protecting Production

Since the Cayman Islands app is in production, we MUST use a safe development workflow:

### 1. EAS Build Channels

Use Expo Application Services (EAS) with separate build channels:

```bash
# Development builds (for local testing)
npx eas build --profile development --platform all

# Preview builds (for stakeholder testing)
npx eas build --profile preview --platform all

# Production builds (Cayman - DO NOT touch during development)
npx eas build --profile production --platform all
```

**Update `eas.json` to include:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development",
        "FEATURE_MULTI_COUNTRY": "true"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "preview",
        "FEATURE_MULTI_COUNTRY": "true"
      }
    },
    "production": {
      "env": {
        "APP_ENV": "production",
        "FEATURE_MULTI_COUNTRY": "false"
      }
    }
  }
}
```

### 2. Feature Flags

Implement a feature flag system to safely roll out Zanzibar features:

```typescript
// src/config/feature-flags.ts
export const FeatureFlags = {
  MULTI_COUNTRY_ENABLED: process.env.EXPO_PUBLIC_FEATURE_MULTI_COUNTRY === 'true',
  ZANZIBAR_ENABLED: process.env.EXPO_PUBLIC_FEATURE_ZANZIBAR === 'true',
  MPESA_ENABLED: process.env.EXPO_PUBLIC_FEATURE_MPESA === 'true',
};
```

### 3. Environment Configuration

Create separate environment files:

```
.env.development    # Local development
.env.preview        # Preview/staging builds
.env.production     # Production (Cayman only initially)
```

### 4. Git Branching Strategy

```
main                    # Production (Cayman) - protected
├── develop             # Integration branch
│   ├── feature/i18n-infrastructure
│   ├── feature/country-selection
│   ├── feature/zanzibar-pricing
│   ├── feature/mpesa-integration
│   └── feature/swahili-translations
```

**Rules:**
- Never push directly to `main`
- All Zanzibar features developed in feature branches
- Merge to `develop` for integration testing
- Only merge to `main` when fully tested and ready

### 5. Firebase Environment Separation

Consider using separate Firebase projects or Firestore collections:

**Option A: Separate Collections (Recommended for now)**
```
users/                    # All users
  └── {userId}/
      └── country: "KY" | "TZ"

drivers_ky/               # Cayman drivers
drivers_tz/               # Tanzania drivers

trips_ky/                 # Cayman trips
trips_tz/                 # Tanzania trips
```

**Option B: Separate Firebase Projects (Future)**
- `drift-cayman` (production)
- `drift-tanzania` (production)
- `drift-dev` (development/testing)

### 6. Testing Without Affecting Production

1. **Development Client**: Use `expo-dev-client` for local testing
2. **Internal Distribution**: Use EAS internal distribution for preview builds
3. **TestFlight/Internal Testing**: Submit preview builds to TestFlight (iOS) and Internal Testing (Android)
4. **Staged Rollout**: When ready, use percentage-based rollout in app stores

---

## Phase 1: Multi-Country Infrastructure

### 1.1 Country Configuration System

Create a centralized country configuration:

**File: `src/config/countries.ts`**
```typescript
export type CountryCode = 'KY' | 'TZ';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  nativeName: string;
  flag: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
  };
  languages: string[];
  defaultLanguage: string;
  timezone: string;
  phonePrefix: string;
  paymentMethods: PaymentMethod[];
  legalEntity: string;
  supportEmail: string;
  supportPhone: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  KY: {
    code: 'KY',
    name: 'Cayman Islands',
    nativeName: 'Cayman Islands',
    flag: '🇰🇾',
    currency: {
      code: 'KYD',
      symbol: 'CI$',
      name: 'Cayman Islands Dollar',
    },
    languages: ['en'],
    defaultLanguage: 'en',
    timezone: 'America/Cayman',
    phonePrefix: '+1345',
    paymentMethods: ['card', 'apple_pay', 'google_pay'],
    legalEntity: 'Drift Cayman Ltd.',
    supportEmail: 'support@driftcayman.com',
    supportPhone: '+1 345 XXX XXXX',
  },
  TZ: {
    code: 'TZ',
    name: 'Tanzania',
    nativeName: 'Tanzania',
    flag: '🇹🇿',
    currency: {
      code: 'TZS',
      symbol: 'TSh',
      name: 'Tanzanian Shilling',
    },
    languages: ['sw', 'en'],
    defaultLanguage: 'sw',
    timezone: 'Africa/Dar_es_Salaam',
    phonePrefix: '+255',
    paymentMethods: ['mpesa', 'tigo_pesa', 'airtel_money', 'card'],
    legalEntity: 'Drift Tanzania Ltd.',
    supportEmail: 'support@driftzanzibar.com',
    supportPhone: '+255 XXX XXX XXX',
  },
};
```

### 1.2 Country Context Provider

**File: `src/contexts/CountryContext.tsx`**
```typescript
// Provides country configuration throughout the app
// Persists user's country selection
// Handles country switching
```

### 1.3 Update User Model

**Firestore users collection update:**
```typescript
interface User {
  // ... existing fields
  country: CountryCode;
  preferredLanguage: string;
  createdInCountry: CountryCode; // Original signup country
}
```

---

## Phase 2: Internationalization (i18n)

### 2.1 Install i18n Library

```bash
npm install react-i18next i18next expo-localization
```

### 2.2 Translation File Structure

```
src/
└── locales/
    ├── en/
    │   ├── common.json       # Shared strings
    │   ├── auth.json         # Auth screens
    │   ├── driver.json       # Driver app
    │   ├── rider.json        # Rider app
    │   └── legal.json        # Legal documents
    └── sw/
        ├── common.json
        ├── auth.json
        ├── driver.json
        ├── rider.json
        └── legal.json
```

### 2.3 Key Translations Needed

**English → Swahili examples:**
| English | Swahili |
|---------|---------|
| Welcome | Karibu |
| Sign In | Ingia |
| Sign Up | Jisajili |
| Driver | Dereva |
| Rider | Abiria |
| Book a Ride | Agiza Safari |
| Your trip | Safari yako |
| Payment | Malipo |
| Settings | Mipangilio |
| Help | Msaada |

### 2.4 i18n Configuration

**File: `src/config/i18n.ts`**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Load translation files
// Configure language detection
// Set up fallback languages
```

---

## Phase 3: Country Selection & Auth Flow

### 3.1 Updated Welcome Screen Flow

```
┌─────────────────────────────────────────┐
│                                         │
│              DRIFT LOGO                 │
│                                         │
│     [🌐 Language: English ▼]            │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🇰🇾 Cayman Islands             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🇹🇿 Tanzania (Zanzibar)         │    │
│  └─────────────────────────────────┘    │
│                                         │
│         [Continue →]                    │
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 Welcome Screen Components

**New components needed:**
- `LanguageSelector.tsx` - Dropdown for language selection
- `CountrySelector.tsx` - Country selection cards
- `CountryCard.tsx` - Individual country option

### 3.3 Auth Flow Modifications

**Sign Up Flow (Country-Aware):**
1. User selects country on welcome screen
2. User selects preferred language
3. Sign up screen shows country-specific requirements
4. For Tanzania: Phone number verification (required for M-Pesa)
5. Terms & conditions in selected language
6. Driver registration adapts to country requirements

**Sign In Flow:**
1. User can change country on welcome screen
2. Sign in authenticates against correct user pool
3. Redirect to country-appropriate experience

### 3.4 Updated Welcome Screen

**File: `app/(auth)/welcome.tsx` modifications:**
```typescript
// Add country selection state
// Add language selector dropdown
// Show country-specific branding
// For Tanzania: "Drift Zanzibar" branding
// For Cayman: "Drift Cayman" branding (existing)
```

---

## Phase 4: Zanzibar-Specific Configuration

### 4.1 Zanzibar Zone Configuration

**File: `src/utils/pricing/zanzibar-zones-config.ts`**
```typescript
export const ZANZIBAR_ZONES = {
  STONE_TOWN: {
    id: 'stone_town',
    name: 'Stone Town',
    swahiliName: 'Mji Mkongwe',
    // Zone boundaries (polygon coordinates)
  },
  NORTH_COAST: {
    id: 'north_coast',
    name: 'North Coast (Nungwi/Kendwa)',
    swahiliName: 'Pwani ya Kaskazini',
  },
  EAST_COAST: {
    id: 'east_coast',
    name: 'East Coast (Paje/Jambiani)',
    swahiliName: 'Pwani ya Mashariki',
  },
  AIRPORT: {
    id: 'airport',
    name: 'Abeid Amani Karume Airport',
    swahiliName: 'Uwanja wa Ndege',
  },
  FUMBA: {
    id: 'fumba',
    name: 'Fumba/South',
    swahiliName: 'Fumba/Kusini',
  },
};
```

### 4.2 Zanzibar Pricing Engine

**File: `src/utils/pricing/zanzibar-pricing-engine.ts`**

**Suggested pricing structure (TZS - Tanzanian Shilling):**
| Route Type | Price (TZS) | Approx USD |
|------------|-------------|------------|
| Within Stone Town | 5,000 - 10,000 | $2 - $4 |
| Stone Town ↔ Airport | 20,000 - 30,000 | $8 - $12 |
| Stone Town ↔ North Coast | 50,000 - 70,000 | $20 - $28 |
| Stone Town ↔ East Coast | 40,000 - 60,000 | $16 - $24 |
| Cross-zone base rate | 15,000 | $6 |
| Per kilometer | 1,500 | $0.60 |

**Note:** Prices should be competitive with local taxi rates but transparent.

### 4.3 Official Taxi Driver Model

Since Zanzibar will use official taxi drivers, consider:

```typescript
// Driver types for Tanzania
export enum TanzaniaDriverType {
  OFFICIAL_TAXI = 'official_taxi',
  LICENSED_TOUR = 'licensed_tour',
}

// Additional verification for official taxis
interface TanzaniaDriverRequirements {
  taxiLicenseNumber: string;
  taxiAssociation?: string;
  governmentPermitNumber: string;
  vehicleTaxiBadge: string; // Photo of taxi badge
}
```

---

## Phase 5: Payment Integration for Tanzania

### 5.1 Mobile Money Integration

Tanzania primarily uses mobile money. Key providers:

| Provider | Market Share | Integration |
|----------|-------------|-------------|
| M-Pesa (Vodacom) | ~40% | Vodacom M-Pesa API |
| Tigo Pesa | ~25% | Tigo API |
| Airtel Money | ~20% | Airtel Money API |
| Cards | ~15% | Stripe (limited) |

### 5.2 M-Pesa Integration

**Option A: Direct Vodacom M-Pesa API**
- Register as merchant with Vodacom Tanzania
- Implement M-Pesa Paybill/Till Number
- Handle push payment requests

**Option B: Payment Gateway (Recommended)**
Use a payment aggregator that handles all mobile money:
- **Flutterwave** - Supports M-Pesa, Tigo, Airtel + Cards
- **DPO Group** - Pan-African payment gateway
- **Selcom** - Tanzania-focused gateway

### 5.3 Payment Flow for Tanzania

```
┌─────────────────────────────────────────┐
│         Select Payment Method           │
├─────────────────────────────────────────┤
│  ◉ M-Pesa (Vodacom)                     │
│  ○ Tigo Pesa                            │
│  ○ Airtel Money                         │
│  ○ Credit/Debit Card                    │
├─────────────────────────────────────────┤
│  Phone: +255 XXX XXX XXX                │
│                                         │
│  [Pay TSh 25,000]                       │
└─────────────────────────────────────────┘
```

**M-Pesa Payment Flow:**
1. Rider selects M-Pesa as payment
2. Rider confirms phone number
3. App sends STK Push to rider's phone
4. Rider enters M-Pesa PIN on their phone
5. Payment confirmed via callback
6. Trip can proceed

### 5.4 New Firebase Functions Needed

```typescript
// functions/src/payments/tanzania.ts

// M-Pesa STK Push
export const initiateMpesaPayment = functions.https.onCall(async (data, context) => {
  // Initiate STK Push to customer phone
});

// M-Pesa callback handler
export const mpesaCallback = functions.https.onRequest(async (req, res) => {
  // Handle M-Pesa payment confirmation
});

// Tigo Pesa integration
export const initiateTigoPesaPayment = functions.https.onCall(async (data, context) => {
  // Similar to M-Pesa
});
```

### 5.5 Driver Payouts (Tanzania)

Drivers receive payouts via:
1. **Mobile Money** (preferred) - Daily/weekly automated payouts
2. **Bank Transfer** - For drivers with bank accounts
3. **Cash Collection** - Partner with local agents (fallback)

---

## Phase 6: Driver Registration Adaptations

### 6.1 Tanzania Driver Requirements

**Different from Cayman Islands:**

| Document | Cayman | Tanzania |
|----------|--------|----------|
| Driver's License | Yes | Yes (Tanzania format) |
| Vehicle Insurance | Yes | Yes |
| Vehicle Registration | Yes | Yes |
| Vehicle Inspection | Yes | Yes (TRA inspection) |
| Bank Details | Yes | Mobile Money Number |
| Taxi License | No | **Yes (Required)** |
| TRA Permit | No | **Yes (Required)** |
| Background Check | Yes | Different process |

### 6.2 New Registration Steps for Tanzania

Additional screens needed:
- `taxi-license.tsx` - Upload official taxi license
- `tra-permit.tsx` - Upload TRA (Transport Regulatory Authority) permit
- `mobile-money-setup.tsx` - Register mobile money for payouts

### 6.3 Verification Process

For official taxi drivers:
1. Verify taxi license number with authorities (if API available)
2. Manual verification by local operations team
3. Training on app usage (consider local onboarding support)

---

## Phase 7: Testing & QA

### 7.1 Testing Strategy

**Unit Tests:**
- Country configuration logic
- Pricing calculations for both regions
- Currency formatting
- Language switching

**Integration Tests:**
- Auth flow with country selection
- Payment flow (mock M-Pesa callbacks)
- Driver registration for both countries

**E2E Tests:**
- Complete rider journey in both countries
- Complete driver journey in both countries
- Language switching throughout app

### 7.2 Device Testing

Test on devices common in Tanzania:
- Android devices (majority market share)
- Lower-end devices (2GB RAM, older Android versions)
- Various screen sizes

### 7.3 Network Testing

Tanzania network considerations:
- Test on 3G connections (slower networks)
- Test offline scenarios
- Test with high latency
- Ensure app works with data saver modes

### 7.4 Beta Testing

1. **Internal Testing** - Team members in Tanzania
2. **Closed Beta** - Select taxi drivers in Zanzibar
3. **Open Beta** - Wider testing before launch

---

## Phase 8: Production Deployment

### 8.1 Rollout Strategy

**Phase A: Soft Launch**
- Enable Zanzibar in app
- Onboard 10-20 official taxi drivers
- Limited rider access (invite-only)
- Gather feedback

**Phase B: Expanded Launch**
- Onboard more drivers
- Open to all riders
- Marketing campaign

**Phase C: Full Launch**
- App store updates highlighting Zanzibar
- Press release
- Partnership announcements

### 8.2 Feature Flag Rollout

```typescript
// Gradual rollout via feature flags
const zanzibarRollout = {
  stage1: { enabled: true, percentage: 10 },  // 10% of Tanzania users
  stage2: { enabled: true, percentage: 50 },  // 50%
  stage3: { enabled: true, percentage: 100 }, // Full launch
};
```

### 8.3 Monitoring

- Set up Firebase Analytics for Tanzania-specific events
- Monitor crash reports by region
- Track payment success rates by provider
- Monitor driver/rider feedback

---

## Technical Architecture

### Updated System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DRIFT APP                               │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Cayman Module  │  │ Tanzania Module │                   │
│  │  - CI$ Pricing  │  │  - TZS Pricing  │                   │
│  │  - Stripe       │  │  - M-Pesa       │                   │
│  │  - Cayman Zones │  │  - Zanzibar Zones│                  │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│  ┌────────┴────────────────────┴────────┐                   │
│  │         Shared Core                   │                   │
│  │  - Authentication                     │                   │
│  │  - Trip Management                    │                   │
│  │  - Real-time Location                 │                   │
│  │  - Notifications                      │                   │
│  │  - Rating System                      │                   │
│  └────────────────────┬─────────────────┘                   │
└───────────────────────┼─────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           │     Firebase Backend     │
           │  ┌─────────────────────┐ │
           │  │ Firestore           │ │
           │  │ - users             │ │
           │  │ - trips_ky          │ │
           │  │ - trips_tz          │ │
           │  │ - drivers_ky        │ │
           │  │ - drivers_tz        │ │
           │  └─────────────────────┘ │
           │  ┌─────────────────────┐ │
           │  │ Cloud Functions     │ │
           │  │ - Stripe (Cayman)   │ │
           │  │ - M-Pesa (Tanzania) │ │
           │  │ - Trip Management   │ │
           │  └─────────────────────┘ │
           └──────────────────────────┘
```

### Folder Structure Updates

```
src/
├── config/
│   ├── countries.ts          # Country configurations
│   ├── feature-flags.ts      # Feature flag system
│   └── i18n.ts               # Internationalization setup
├── contexts/
│   ├── CountryContext.tsx    # Country provider
│   └── LanguageContext.tsx   # Language provider
├── locales/
│   ├── en/                   # English translations
│   └── sw/                   # Swahili translations
├── utils/
│   └── pricing/
│       ├── index.ts          # Pricing router by country
│       ├── cayman/           # Cayman pricing (existing)
│       └── tanzania/         # Tanzania pricing (new)
└── services/
    └── payments/
        ├── stripe.service.ts # Existing Stripe
        └── mpesa.service.ts  # New M-Pesa service
```

---

## Risk Mitigation

### 1. Production Stability (Cayman)
- **Risk:** Zanzibar code breaks Cayman production
- **Mitigation:** Feature flags, separate build profiles, thorough testing

### 2. Payment Failures (Tanzania)
- **Risk:** M-Pesa integration fails in production
- **Mitigation:** Extensive testing, fallback to cash, local payment partner

### 3. Network Reliability
- **Risk:** Poor connectivity in Zanzibar
- **Mitigation:** Offline-first features, data optimization, retry logic

### 4. Localization Quality
- **Risk:** Poor Swahili translations affect UX
- **Mitigation:** Native speaker review, user feedback mechanism

### 5. Regulatory Compliance
- **Risk:** Non-compliance with Tanzania transport laws
- **Mitigation:** Legal review, partnership with taxi associations

---

## Implementation Priority

### High Priority (Must Have)
1. Feature flag system
2. Country configuration
3. Country selection on welcome screen
4. Tanzania pricing engine
5. M-Pesa payment integration
6. Basic Swahili translations

### Medium Priority (Should Have)
1. Complete Swahili translation
2. Tanzania driver registration flow
3. Zanzibar zone configuration
4. Local phone verification

### Lower Priority (Nice to Have)
1. Multiple mobile money providers
2. Advanced analytics by region
3. Region-specific promotions
4. Offline mode improvements

---

## Estimated Implementation Order

1. **Infrastructure Setup** - Feature flags, environment setup
2. **Country Configuration** - Country model, context providers
3. **i18n System** - Install and configure react-i18next
4. **Welcome Screen Update** - Country/language selection
5. **Auth Flow Update** - Country-aware sign up/in
6. **Tanzania Pricing** - Zone configuration, pricing engine
7. **M-Pesa Integration** - Payment gateway setup
8. **Driver Registration** - Tanzania-specific flow
9. **Swahili Translations** - Complete translation
10. **Testing & QA** - Comprehensive testing
11. **Soft Launch** - Limited Zanzibar release

---

## Next Steps

1. Review and approve this plan
2. Set up development environment with feature flags
3. Create `develop` branch for integration
4. Begin Phase 1 implementation

---

*Document created: December 11, 2025*
*Last updated: December 11, 2025*
*Status: PLANNING - NOT YET IMPLEMENTED*
