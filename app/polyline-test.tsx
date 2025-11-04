// MINIMAL POLYLINE TEST COMPONENT
// Save as: app/polyline-test.tsx
// Run with: Navigate to /polyline-test in your app

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

export default function PolylineTest() {
  // Ultra-simple static coordinates
  const testCoords = [
    { latitude: 19.3838, longitude: -81.3982 },
    { latitude: 19.3500, longitude: -81.3800 },
    { latitude: 19.3213, longitude: -81.3782 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Polyline Test</Text>
      <Text style={styles.subtitle}>
        You should see a BRIGHT GREEN LINE
      </Text>
      
      <MapView
        style={styles.map}
        // NO PROVIDER_GOOGLE - testing default
        initialRegion={{
          latitude: 19.3525,
          longitude: -81.3891,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* Ultra-bright, ultra-thick test polyline */}
        <Polyline
          coordinates={testCoords}
          strokeColor="#00FF00"
          strokeWidth={20}
          geodesic={true}
        />
      </MapView>
      
      <Text style={styles.instructions}>
        ✅ If you see a bright green line → react-native-maps works!
        {'\n'}
        ❌ If no line → react-native-maps is broken
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  map: {
    flex: 1,
    margin: 20,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
});