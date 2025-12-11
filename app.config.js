// Determine build environment from EAS or fallback
const APP_VARIANT = process.env.APP_VARIANT || 'development';
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';
const IS_PRODUCTION = APP_VARIANT === 'production';

// Google Maps API Key - required for native map rendering
// For local dev: Create .env.local with EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
// For EAS builds: Set via `eas secret:create GOOGLE_MAPS_API_KEY`
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn(
    '\n⚠️  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set!\n' +
    '   Maps will not work in this build.\n' +
    '   For local development: Create .env.local with your API key\n' +
    '   For EAS builds: Run `eas secret:create GOOGLE_MAPS_API_KEY`\n'
  );
}

module.exports = {
  expo: {
    name: IS_PRODUCTION ? "Drift" : IS_PREVIEW ? "Drift (Preview)" : "Drift (Dev)",
    slug: "drift",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/images/app-icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    // Android navigation bar - edge-to-edge support (visible property deprecated in API 30+)
    // Status bar configuration - edge-to-edge support
    androidStatusBar: {
      barStyle: "dark-content",
      translucent: true
    },
    splash: {
      image: "./assets/images/drift-logo.png",
      resizeMode: "contain",
      backgroundColor: "#5d1289"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.drift.app",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Drift uses your location to show nearby drivers, calculate routes, provide turn-by-turn navigation, and share your trip with trusted contacts for safety.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Drift uses your location in the background during active trips to: share your real-time location with trusted contacts for safety, provide turn-by-turn navigation when your screen is off, and update arrival times for other users. Background location tracking stops automatically when your trip ends.",
        // Deep link URL types for Stripe callbacks
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ["drift"]
          }
        ],
        // Allow opening external URLs
        LSApplicationQueriesSchemes: ["https", "http"]
      },
      config: {
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
      },
      // Deep linking for Universal Links (iOS)
      associatedDomains: [
        "applinks:drift-global.web.app"
      ],
      // Apple Pay entitlement
      entitlements: {
        "com.apple.developer.in-app-payments": ["merchant.com.drift.app"]
      }
    },
    android: {
      package: "com.drift.global",
      versionCode: 12,
      adaptiveIcon: {
        foregroundImage: "./assets/images/app-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ],
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: GOOGLE_MAPS_API_KEY
        }
      },
      // Deep linking for app features
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "drift",
              host: "stripe"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        // Trip tracking deep link
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "drift",
              host: "track"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        // Web URL deep links (Universal Links fallback)
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "drift-global.web.app",
              pathPrefix: "/track"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        },
        // General deep link fallback
        {
          action: "VIEW",
          data: [
            {
              scheme: "drift"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    plugins: [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Drift to access your photos to upload vehicle and document images"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Drift to use your camera to capture vehicle and document photos"
        }
      ],
      "expo-router",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Drift uses your location in the background during active trips to share your real-time location with trusted contacts, provide navigation when your screen is off, and update arrival times. Tracking stops when your trip ends.",
          locationWhenInUsePermission: "Drift uses your location to show nearby drivers, calculate routes, provide turn-by-turn navigation, and share your trip with trusted contacts for safety.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      "expo-secure-store",
      "expo-notifications",
      "expo-dev-client",
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            usesCleartextTraffic: false,
            minSdkVersion: 24,
            support16KBPages: true
          },
          ios: {
            deploymentTarget: "15.1",
            useFrameworks: "static"  // Required for React Native Firebase
          }
        }
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/perf",
      // Note: @react-native-firebase/analytics doesn't have a plugin - it works via @react-native-firebase/app
      "@react-native-google-signin/google-signin",
      [
        "@stripe/stripe-react-native",
        {
          merchantIdentifier: "merchant.com.drift.app",
          enableGooglePay: true
        }
      ],
    ],
    // Deep linking scheme for Stripe callbacks
    scheme: "drift",
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "d7b6f22f-7d74-4cc2-b3c6-89ceece434fc"
      },
      // Environment configuration for logging
      appVariant: APP_VARIANT,
      isDevelopment: IS_DEV,
      isPreview: IS_PREVIEW,
      isProduction: IS_PRODUCTION,
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/d7b6f22f-7d74-4cc2-b3c6-89ceece434fc"
    }
  }
};