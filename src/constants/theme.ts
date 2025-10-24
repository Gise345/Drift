/**
 * Drift Design System
 * Based on RideX Figma design, adapted for Drift branding
 */

export const Colors = {
  // Primary Brand Colors (Yellow/Lime - from Figma)
  primary: '#D4E700',      // Bright yellow-lime
  primaryDark: '#B8CA00',
  primaryLight: '#E5F44D',
  
  // Drift Purple (your existing brand color)
  purple: '#5d1289ff',
  purpleLight: '#d8d3ecff',
  
  // Neutrals
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Map & Location
  mapBackground: '#F5F5F5',
  markerGreen: '#00D676',
};

export const Typography = {
  // Font Family (Lato from Figma)
  fontFamily: {
    regular: 'Lato-Regular',
    medium: 'Lato-Medium',
    semibold: 'Lato-Semibold',
    bold: 'Lato-Bold',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Screen Dimensions
export const Layout = {
  window: {
    width: 375,  // Base iPhone width for design
    height: 812,
  },
  statusBar: {
    height: 44,
  },
  tabBar: {
    height: 70,
  },
};