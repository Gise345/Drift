import React, { useEffect, useRef } from 'react';
import { Polyline } from 'react-native-maps';
import { LatLng } from 'react-native-maps';

interface RoutePolylineProps {
  coordinates: LatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  onReady?: () => void;
}

/**
 * RoutePolyline Component - FIXED FOR EXPO SDK 52 + ANDROID
 * 
 * Displays the route line on the map with proper rendering
 * Fixes polyline visibility issues on Android with Expo SDK 52
 * 
 * KEY FIXES:
 * 1. Normalize coordinates to plain objects (not LatLng class instances)
 * 2. Add geodesic={true} for proper curved rendering
 * 3. Add unique key props to each polyline
 * 4. Add tappable={false} to improve performance
 * 5. Remove zIndex (not reliable on Android)
 * 
 * Usage:
 * <RoutePolyline 
 *   coordinates={routeCoordinates}
 *   strokeColor="#5d1289"
 *   strokeWidth={6}
 * />
 */
export const RoutePolyline: React.FC<RoutePolylineProps> = ({
  coordinates,
  strokeColor = '#5d1289',
  strokeWidth = 6,
  onReady,
}) => {
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (coordinates.length > 0 && !isReadyRef.current) {
      isReadyRef.current = true;
      console.log('🗺️ RoutePolyline ready with', coordinates.length, 'points');
      onReady?.();
    }
  }, [coordinates.length, onReady]);

  // Don't render if no coordinates
  if (!coordinates || coordinates.length < 2) {
    console.log('⚠️ RoutePolyline: Not enough coordinates to render');
    return null;
  }

  // CRITICAL FIX FOR EXPO SDK 52 + ANDROID
  // Ensure coordinates are PLAIN OBJECTS (not LatLng class instances)
  // This is the #1 reason polylines don't render on Android
  const normalizedCoordinates = coordinates.map(coord => ({
    latitude: Number(coord.latitude),
    longitude: Number(coord.longitude),
  }));

  console.log('🎨 Rendering RoutePolyline:', {
    points: normalizedCoordinates.length,
    color: strokeColor,
    width: strokeWidth,
    firstPoint: normalizedCoordinates[0],
    lastPoint: normalizedCoordinates[normalizedCoordinates.length - 1],
  });

  return (
    <>
      {/* TEST POLYLINE: Ultra-bright red to verify rendering works */}
      <Polyline
        key="test-red-polyline"
        coordinates={normalizedCoordinates}
        strokeColor="#FF0000"
        strokeWidth={10}
        geodesic={true}
        tappable={false}
      />
      
      {/* Shadow/Border Polyline (wider, lighter) */}
      <Polyline
        key="shadow-polyline"
        coordinates={normalizedCoordinates}
        strokeColor="rgba(0, 0, 0, 0.3)"
        strokeWidth={strokeWidth + 4}
        lineCap="round"
        lineJoin="round"
        geodesic={true}
        tappable={false}
      />
      
      {/* Main Route Polyline */}
      <Polyline
        key="main-polyline"
        coordinates={normalizedCoordinates}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        geodesic={true}
        tappable={false}
      />
    </>
  );
};

export default RoutePolyline;