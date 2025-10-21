import { useCallback } from 'react';
import { FadeIn, FadeInDown, FadeInUp, SlideInDown, SlideInUp, ZoomIn } from 'react-native-reanimated';

/**
 * Custom hook providing reusable animation presets for consistent UI animations
 */
export const useAnimations = () => {
  // Card entry animation: fade in with slide up
  const cardEntry = useCallback((delay = 0) => {
    return FadeInUp.duration(400).delay(delay).springify();
  }, []);

  // Fade in animation
  const fadeIn = useCallback((delay = 0, duration = 300) => {
    return FadeIn.duration(duration).delay(delay);
  }, []);

  // Slide in from top
  const slideInTop = useCallback((delay = 0) => {
    return SlideInDown.duration(300).delay(delay).springify();
  }, []);

  // Slide in from bottom
  const slideInBottom = useCallback((delay = 0) => {
    return SlideInUp.duration(400).delay(delay).springify();
  }, []);

  // Zoom in animation
  const zoomIn = useCallback((delay = 0, duration = 300) => {
    return ZoomIn.duration(duration).delay(delay).springify();
  }, []);

  // Staggered list animation
  const staggeredEntry = useCallback((index: number, itemDelay = 100) => {
    return FadeInDown.duration(400).delay(index * itemDelay).springify();
  }, []);

  return {
    cardEntry,
    fadeIn,
    slideInTop,
    slideInBottom,
    zoomIn,
    staggeredEntry,
  };
};

// Spring configuration presets
export const springConfig = {
  gentle: {
    damping: 20,
    stiffness: 90,
  },
  smooth: {
    damping: 15,
    stiffness: 100,
  },
  bouncy: {
    damping: 10,
    stiffness: 100,
  },
  snappy: {
    damping: 25,
    stiffness: 120,
  },
};
