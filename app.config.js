module.exports = {
  expo: {
    name: "Drift",
    slug: "drift",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.drift.app",
      googleServicesFile: "./GoogleService-Info.plist",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Drift needs your location to show nearby carpools and provide navigation.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Drift needs your location to show nearby carpools and provide navigation."
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.drift.global",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#3B82F6"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ],
      googleServicesFile: "./google-services.json",
      config: {
        googleMaps: {
          apiKey: "AIzaSyDjk96AyKGgPJRhzBRH7VY2qTsEsuvIq0g"
        }
      }
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
          locationAlwaysAndWhenInUsePermission: "Drift needs your location to show nearby carpools and provide navigation."
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
    ],
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
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/d7b6f22f-7d74-4cc2-b3c6-89ceece434fc"
    }
  }
};