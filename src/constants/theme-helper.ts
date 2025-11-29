/**
 * Enhanced Theme Helper
 * Add these properties to your existing theme-helper.ts
 * 
 * Location: src/constants/theme-helper.ts
 */

import { Colors as BaseColors, Typography as BaseTypography, Spacing, Shadows, BorderRadius } from './theme';

// Export original constants
export { Spacing, BorderRadius, Shadows };

// Extended Colors with ALL aliases needed
export const Colors = {
  ...BaseColors,
  
  // Text colors
  text: BaseColors.black,
  textSecondary: BaseColors.gray[600],
  textLight: BaseColors.gray[400],
  dark: BaseColors.gray[900],           // ← ADD THIS for legal docs
  
  // Background colors
  background: BaseColors.gray[50],
  backgroundDark: BaseColors.gray[100],
  lightGray: BaseColors.gray[50],       // ← ADD THIS for legal docs
  
  // Border colors  
  border: BaseColors.border || BaseColors.gray[200],
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
  
  // Shadow helper
  shadow: Shadows.md,
};

// Extended Typography
export const Typography = {
  ...BaseTypography,
  
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

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};