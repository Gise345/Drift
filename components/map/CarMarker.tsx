/**
 * CarMarker Component
 *
 * A modern 3D-style car marker for maps
 * Inspired by Google Maps navigation car design
 */

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CarMarkerProps {
  heading?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export function CarMarker({
  heading = 0,
  color = '#4285F4',
  size = 'medium'
}: CarMarkerProps) {
  const sizeConfig = {
    small: { container: 36, car: 20, pulse: 44 },
    medium: { container: 48, car: 28, pulse: 56 },
    large: { container: 60, car: 36, pulse: 72 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[styles.wrapper, { transform: [{ rotate: `${heading}deg` }] }]}>
      {/* Outer glow/pulse effect */}
      <View style={[
        styles.outerGlow,
        {
          width: config.pulse,
          height: config.pulse,
          borderRadius: config.pulse / 2,
          backgroundColor: `${color}20`,
        }
      ]} />

      {/* Shadow under car */}
      <View style={[
        styles.shadow,
        {
          width: config.container * 0.8,
          height: config.container * 0.4,
          borderRadius: config.container * 0.2,
        }
      ]} />

      {/* Main car body */}
      <View style={[
        styles.carBody,
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
          backgroundColor: color,
        }
      ]}>
        {/* 3D highlight effect */}
        <View style={[
          styles.highlight,
          {
            width: config.container - 8,
            height: (config.container - 8) / 2,
            borderTopLeftRadius: (config.container - 8) / 2,
            borderTopRightRadius: (config.container - 8) / 2,
          }
        ]} />

        {/* Car icon with styling */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="car-sport"
            size={config.car}
            color="white"
          />
        </View>

        {/* Direction arrow at top */}
        <View style={styles.directionArrow}>
          <View style={[
            styles.arrowTriangle,
            {
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderBottomWidth: 10,
              borderBottomColor: 'white',
            }
          ]} />
        </View>
      </View>

      {/* Inner ring for depth */}
      <View style={[
        styles.innerRing,
        {
          width: config.container + 6,
          height: config.container + 6,
          borderRadius: (config.container + 6) / 2,
          borderColor: 'white',
        }
      ]} />
    </View>
  );
}

/**
 * Simple Car Marker - less complex, better performance
 * Use this for multiple markers on map
 */
export function SimpleCarMarker({
  heading = 0,
  color = '#4285F4',
  size = 'medium'
}: CarMarkerProps) {
  const sizeConfig = {
    small: { container: 40, car: 22 },
    medium: { container: 52, car: 28 },
    large: { container: 64, car: 36 },
  };

  const config = sizeConfig[size];

  return (
    <View style={[
      styles.simpleContainer,
      {
        width: config.container,
        height: config.container,
        borderRadius: config.container / 2,
        backgroundColor: color,
        transform: [{ rotate: `${heading}deg` }],
      }
    ]}>
      {/* White border for 3D effect */}
      <View style={[
        styles.simpleBorder,
        {
          width: config.container,
          height: config.container,
          borderRadius: config.container / 2,
        }
      ]} />

      {/* Gradient overlay for 3D look */}
      <View style={[
        styles.gradientTop,
        {
          width: config.container - 6,
          height: (config.container - 6) / 2,
          borderTopLeftRadius: (config.container - 6) / 2,
          borderTopRightRadius: (config.container - 6) / 2,
        }
      ]} />

      {/* Car icon */}
      <Ionicons
        name="car-sport"
        size={config.car}
        color="white"
      />

      {/* Direction indicator */}
      <View style={styles.simpleArrow}>
        <View style={styles.arrowDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
  },
  shadow: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transform: [{ scaleX: 1.2 }],
  },
  carBody: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  iconContainer: {
    zIndex: 1,
  },
  directionArrow: {
    position: 'absolute',
    top: -2,
    alignItems: 'center',
  },
  arrowTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.5,
  },

  // Simple marker styles
  simpleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
    overflow: 'hidden',
  },
  simpleBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  simpleArrow: {
    position: 'absolute',
    top: 4,
  },
  arrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
});
