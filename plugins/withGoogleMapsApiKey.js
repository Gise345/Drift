const { withAndroidManifest } = require('@expo/config-plugins');

const withGoogleMapsApiKey = (config) => {
  return withAndroidManifest(config, async (config) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set');
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
      (item) => item.$?.['android:name'] !== 'com.google.android.geo.API_KEY'
    );

    // Add Google Maps API key
    application['meta-data'].push({
      $: {
        'android:name': 'com.google.android.geo.API_KEY',
        'android:value': apiKey,
      },
    });

    return config;
  });
};

module.exports = withGoogleMapsApiKey;