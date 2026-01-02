/**
 * CarMarker Component
 *
 * A modern image-based car marker for maps
 * Uses a top-down car PNG for professional appearance like Uber/Google Maps
 *
 * Features:
 * - Top-down car image (not a side-view icon)
 * - Outer glow effect for visibility
 * - Blue dot fallback option
 * - Optimized for map marker rendering
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

// Import the car marker image
const CarMarkerImage = require('@/assets/car-marker.png');

interface CarMarkerProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  useFallback?: boolean; // Force blue dot fallback
}

/**
 * Blue Dot Fallback Marker
 * Used as explicit fallback when requested
 */
export function BlueDotMarker({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const sizeConfig = {
    small: { outer: 24, inner: 12 },
    medium: { outer: 32, inner: 16 },
    large: { outer: 40, inner: 20 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.blueDotWrapper, { width: config.outer, height: config.outer }]}>
      {/* Outer pulse ring */}
      <View style={[
        styles.blueDotOuter,
        {
          width: config.outer,
          height: config.outer,
          borderRadius: config.outer / 2,
        }
      ]} />
      {/* Inner solid dot */}
      <View style={[
        styles.blueDotInner,
        {
          width: config.inner,
          height: config.inner,
          borderRadius: config.inner / 2,
        }
      ]} />
    </View>
  );
}

/**
 * Modern Image-Based Car Marker
 * Top-down car view for professional map appearance
 */
export function CarMarker({
  color = '#5D1289',
  size = 'medium',
  useFallback = false
}: CarMarkerProps) {
  // If useFallback is true, show blue dot
  if (useFallback) {
    return <BlueDotMarker size={size} />;
  }

  const sizeConfig = {
    small: { wrapper: 48, image: 36 },
    medium: { wrapper: 64, image: 48 },
    large: { wrapper: 80, image: 60 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.wrapper, { width: config.wrapper, height: config.wrapper }]}>
      {/* Outer glow for visibility on map */}
      <View style={[
        styles.outerGlow,
        {
          width: config.wrapper,
          height: config.wrapper,
          borderRadius: config.wrapper / 2,
          backgroundColor: `${color}40`,
        }
      ]} />

      {/* Shadow under car */}
      <View style={[
        styles.shadow,
        {
          width: config.image * 0.6,
          height: config.image * 0.2,
          borderRadius: config.image * 0.1,
        }
      ]} />

      {/* Car image */}
      <Image
        source={CarMarkerImage}
        style={[
          styles.carImage,
          {
            width: config.image,
            height: config.image,
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Main wrapper
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Outer glow effect
  outerGlow: {
    position: 'absolute',
  },

  // Shadow for 3D depth
  shadow: {
    position: 'absolute',
    bottom: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  // Car image
  carImage: {
    // Shadow for the car itself
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  // Blue dot fallback styles
  blueDotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueDotOuter: {
    position: 'absolute',
    backgroundColor: 'rgba(66, 133, 244, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(66, 133, 244, 0.5)',
  },
  blueDotInner: {
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
});
