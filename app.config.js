// Determine build environment from EAS or fallback
const APP_VARIANT = process.env.APP_VARIANT || 'development';
const IS_DEV = APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';
const IS_PRODUCTION = APP_VARIANT === 'production';

module.exports = {
  expo: {
    name: IS_PRODUCTION ? "Drift" : IS_PREVIEW ? "Drift (Preview)" : "Drift (Dev)",
    slug: "drift",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/drift-logo.png",
    userInterfaceStyle: "automatic",
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
        NSLocationWhenInUseUsageDescription: "Drift needs your location to show nearby carpools and provide navigation.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Drift needs your location to show nearby carpools and provide navigation.",
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
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      },
      // Deep linking for Stripe callbacks (iOS Universal Links - optional)
      associatedDomains: [
        // Uncomment if you want to use Universal Links:
        // "applinks:drift-global.com"
      ],
      // Apple Pay entitlement
      entitlements: {
        "com.apple.developer.in-app-payments": ["merchant.com.drift.app"]
      }
    },
    android: {
      package: "com.drift.global",
      adaptiveIcon: {
        foregroundImage: "./assets/images/drift-logo.png",
        backgroundColor: "#5d1289"
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
          apiKey: "AIzaSyD94ZFCQvkJjyqjIGFmZ7ASpZX9vRvwbjk"
        }
      },
      // Deep linking for Stripe callbacks
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
          locationAlwaysAndWhenInUsePermission: "Drift needs your location to show nearby carpools and provide navigation.",
          locationWhenInUsePermission: "Drift needs your location to show nearby carpools and provide navigation.",
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
            newArchEnabled: false,
            minSdkVersion: 24
          },
          ios: {
            newArchEnabled: false,
            deploymentTarget: "15.1"
          }
        }
      ],
      "@react-native-firebase/app",
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