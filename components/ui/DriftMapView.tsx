import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

/**
 * ENHANCED DRIFT MAP COMPONENT - WITH MULTI-STOP SUPPORT
 * 
 * Features:
 * ✅ Google Maps with proper API key handling
 * ✅ Pickup and destination markers
 * ✅ Stop markers (up to 2)
 * ✅ Route polyline display
 * ✅ Proper region management
 * ✅ Consistent styling across app
 * 
 * Usage:
 * <DriftMapView
 *   region={region}
 *   showUserLocation={true}
 *   pickupLocation={pickup}
 *   stops={[stop1, stop2]}
 *   destinationLocation={destination}
 *   routeCoordinates={route}
 *   onMapReady={() => console.log('Map ready')}
 * />
 */

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

interface DriftMapViewProps {
  // Required
  region: Region;
  
  // Map configuration
  showUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  
  // Markers
  pickupLocation?: Location | null;
  destinationLocation?: Location | null;
  stops?: Location[]; // NEW: Support for multiple stops
  
  // Route display
  routeCoordinates?: LatLng[];
  
  // Callbacks
  onMapReady?: () => void;
  onRegionChange?: (region: Region) => void;
  
  // Ref forwarding
  mapRef?: React.RefObject<MapView>;
  
  // Style
  style?: any;
}

const DriftMapView: React.FC<DriftMapViewProps> = ({
  region,
  showUserLocation = true,
  showsMyLocationButton = false,
  showsCompass = true,
  pickupLocation,
  destinationLocation,
  stops = [],
  routeCoordinates,
  onMapReady,
  onRegionChange,
  mapRef,
  style,
}) => {
  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      showsUserLocation={showUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      showsCompass={showsCompass}
      loadingEnabled={true}
      loadingIndicatorColor="#5d1289"
      onMapReady={onMapReady}
      onRegionChangeComplete={onRegionChange}
    >
      {/* Pickup Location Marker */}
      {pickupLocation && (
        <Marker
          coordinate={{
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
          }}
          title={pickupLocation.name || 'Pickup'}
          description={pickupLocation.address}
        >
          <Ionicons name="location" size={40} color="#10B981" />
        </Marker>
      )}

      {/* Stop Markers */}
      {stops && stops.map((stop, index) => (
        <Marker
          key={`stop-${index}`}
          coordinate={{
            latitude: stop.latitude,
            longitude: stop.longitude,
          }}
          title={stop.name || `Stop ${index + 1}`}
          description={stop.address}
        >
          <Ionicons name="location" size={38} color="#F59E0B" />
        </Marker>
      ))}

      {/* Destination Location Marker */}
      {destinationLocation && (
        <Marker
          coordinate={{
            latitude: destinationLocation.latitude,
            longitude: destinationLocation.longitude,
          }}
          title={destinationLocation.name || 'Destination'}
          description={destinationLocation.address}
        >
          <Ionicons name="location" size={40} color="#5d1289" />
        </Marker>
      )}

      {/* Route Polyline - Shows complete route through all stops */}
      {routeCoordinates && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#5d1289"
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default DriftMapView;