const { withAndroidManifest } = require('@expo/config-plugins');

const withGoogleMapsApiKey = (config) => {
  return withAndroidManifest(config, async (config) => {
    const mapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const placesApiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!mapsApiKey) {
      throw new Error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set');
    }

    if (!placesApiKey) {
      console.warn('EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not set - Places API features may not work');
    }

    const manifest = config.modResults.manifest;

    // Find or create the application tag
    let application = manifest.application?.[0];
    if (!application) {
      manifest.application = [{ 'meta-data': [] }];
      application = manifest.application[0];
    }

    // Ensure meta-data array exists
    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    // Remove existing Google Maps API key meta-data if present
    application['meta-data'] = application['meta-data'].filter(
      (item) => {
        const name = item.$?.['android:name'];
        return name !== 'com.google.android.geo.API_KEY' &&
               name !== 'com.google.android.places.API_KEY';
      }
    );

    // Add Google Maps API key (for map rendering)
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': mapsApiKey,
      },
    });

    // Add Google Places API key (for Places API - optional but recommended)
    if (placesApiKey) {
      application['meta-data'].push({
        $: {
          'android:name': 'com.google.android.places.API_KEY',
          'android:value': placesApiKey,
        },
      });
    }

    console.log('✅ Google Maps API Key configured');
    if (placesApiKey) {
      console.log('✅ Google Places API Key configured');
    }

    return config;
  });
};

module.exports = withGoogleMapsApiKey;