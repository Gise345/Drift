/**
 * Theme Helper for Phase 4 Screens
 * Maps Phase 4 property names to your actual theme structure
 * Add this file to: src/constants/theme-helper.ts
 */

import { Colors as BaseColors, Typography as BaseTypography, Spacing, Shadows, BorderRadius } from './theme';

// Export original constants
export { Spacing, BorderRadius, Shadows };

// Extended Colors with aliases for Phase 4 screens
export const Colors = {
  ...BaseColors,
  // Text colors
  text: BaseColors.black,
  textSecondary: BaseColors.gray[600],
  textLight: BaseColors.gray[400],
  
  // Background colors
  background: BaseColors.gray[50],
  backgroundDark: BaseColors.gray[100],
  
  // Border colors
  border: BaseColors.gray[200],
  borderDark: BaseColors.gray[300],
  
  // Maintain original colors
  primary: BaseColors.primary,
  primaryDark: BaseColors.primaryDark,
  primaryLight: BaseColors.primaryLight,
  purple: BaseColors.purple,
  purpleLight: BaseColors.purpleLight,
  success: BaseColors.success,
  warning: BaseColors.warning,
  error: BaseColors.error,
  info: BaseColors.info,
  white: BaseColors.white,
  black: BaseColors.black,
  gray: BaseColors.gray,
  mapBackground: BaseColors.mapBackground,
  markerGreen: BaseColors.markerGreen,
  
  // Shadow helper (for ...Colors.shadow syntax)
  shadow: Shadows.md,
};

// Extended Typography with text style helpers
export const Typography = {
  ...BaseTypography,
  
  // Text style helpers for Phase 4 screens
  h1: {
    fontSize: BaseTypography.fontSize['3xl'],
    fontFamily: BaseTypography.fontFamily.bold,
    color: Colors.text,
    lineHeight: BaseTypography.fontSize['3xl'] * 1.2,
  },
  
  h2: {
    fontSize: BaseTypography.fontSize['2xl'],
    fontFamily: BaseTypography.fontFamily.bold,
    color: Colors.text,
    lineHeight: BaseTypography.fontSize['2xl'] * 1.2,
  },
  
  h3: {
    fontSize: BaseTypography.fontSize.xl,
    fontFamily: BaseTypography.fontFamily.semibold,
    color: Colors.text,
    lineHeight: BaseTypography.fontSize.xl * 1.3,
  },
  
  body: {
    fontSize: BaseTypography.fontSize.base,
    fontFamily: BaseTypography.fontFamily.regular,
    color: Colors.text,
    lineHeight: BaseTypography.fontSize.base * 1.5,
  },
  
  bodyMedium: {
    fontSize: BaseTypography.fontSize.base,
    fontFamily: BaseTypography.fontFamily.medium,
    color: Colors.text,
    lineHeight: BaseTypography.fontSize.base * 1.5,
  },
  
  caption: {
    fontSize: BaseTypography.fontSize.xs,
    fontFamily: BaseTypography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: BaseTypography.fontSize.xs * 1.4,
  },
  
  small: {
    fontSize: BaseTypography.fontSize.sm,
    fontFamily: BaseTypography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: BaseTypography.fontSize.sm * 1.4,
  },
};