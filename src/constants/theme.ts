/**
 * Drift Design System - Theme Configuration
 * Updated with Bright Purple Primary Color
 * 
 * EXPO SDK 52 COMPATIBLE
 * Use with NativeWind/Tailwind for styling
 */

// ============================================
// COLORS
// ============================================

export const Colors = {
  // PRIMARY COLORS (Updated to Purple)
  primary: '#8B5CF6',        // Bright Purple (replaces lime green)
  primaryDark: '#7C3AED',    // Darker Purple (for pressed states)
  primaryLight: '#A78BFA',   // Lighter Purple (for backgrounds)
  
  // BRAND COLORS (Kept)
  purple: '#5d1289ff',       // Drift Brand Purple
  purpleLight: '#d8d3ecff',  // Light Purple Background
  
  // BASIC COLORS
  black: '#000000',
  white: '#FFFFFF',
  
  // GRAY SCALE
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
  
  // SEMANTIC COLORS
  success: '#10B981',     // Green - for completed, approved
  successLight: '#D1FAE5',
  
  warning: '#F59E0B',     // Orange - for pending, caution
  warningLight: '#FEF3C7',
  
  error: '#EF4444',       // Red - for errors, rejected
  errorLight: '#FEE2E2',
  
  info: '#3B82F6',        // Blue - for information
  infoLight: '#DBEAFE',
  
  // UI ELEMENT COLORS
  border: '#E5E7EB',
  inputBg: '#F9FAFB',
  cardBg: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  // MAP COLORS
  mapPrimary: '#8B5CF6',     // Purple marker
  mapSecondary: '#7C3AED',   // Darker purple
  mapRoute: '#8B5CF6',       // Route color
  
  // STATUS COLORS
  online: '#10B981',          // Green
  offline: '#6B7280',         // Gray
  busy: '#F59E0B',            // Orange
  
  // DRIVER SPECIFIC
  earnings: '#10B981',        // Green for money
  trips: '#8B5CF6',           // Purple for trip count
  rating: '#F59E0B',          // Orange for stars
};

// ============================================
// TYPOGRAPHY
// ============================================

export const Typography = {
  fontFamily: {
    regular: 'Lato-Regular',
    medium: 'Lato-Medium',
    semibold: 'Lato-SemiBold',
    bold: 'Lato-Bold',
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
};

// ============================================
// SPACING
// ============================================

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ============================================
// BORDER RADIUS
// ============================================

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

// ============================================
// BUTTON STYLES
// ============================================

export const ButtonStyles = {
  primary: {
    backgroundColor: Colors.primary,      // Bright Purple
    color: Colors.white,
    borderColor: Colors.primary,
  },
  
  primaryPressed: {
    backgroundColor: Colors.primaryDark,   // Darker Purple
    color: Colors.white,
  },
  
  secondary: {
    backgroundColor: Colors.white,
    color: Colors.primary,
    borderColor: Colors.primary,
  },
  
  outline: {
    backgroundColor: 'transparent',
    color: Colors.primary,
    borderColor: Colors.primary,
  },
  
  ghost: {
    backgroundColor: 'transparent',
    color: Colors.primary,
  },
  
  success: {
    backgroundColor: Colors.success,
    color: Colors.white,
  },
  
  danger: {
    backgroundColor: Colors.error,
    color: Colors.white,
  },
  
  disabled: {
    backgroundColor: Colors.gray[200],
    color: Colors.gray[400],
  },
};

// ============================================
// INPUT STYLES
// ============================================

export const InputStyles = {
  default: {
    backgroundColor: Colors.inputBg,
    borderColor: Colors.border,
    color: Colors.black,
  },
  
  focused: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,      // Purple border when focused
    color: Colors.black,
  },
  
  error: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    color: Colors.error,
  },
  
  disabled: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[200],
    color: Colors.gray[400],
  },
};

// ============================================
// CARD STYLES
// ============================================

export const CardStyles = {
  default: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  
  elevated: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  
  flat: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
};

// ============================================
// STATUS BADGES
// ============================================

export const StatusBadges = {
  online: {
    backgroundColor: Colors.online,
    color: Colors.white,
  },
  
  offline: {
    backgroundColor: Colors.offline,
    color: Colors.white,
  },
  
  pending: {
    backgroundColor: Colors.warning,
    color: Colors.white,
  },
  
  approved: {
    backgroundColor: Colors.success,
    color: Colors.white,
  },
  
  rejected: {
    backgroundColor: Colors.error,
    color: Colors.white,
  },
};

// ============================================
// ANIMATIONS
// ============================================

export const Animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ============================================
// BREAKPOINTS (for responsive design)
// ============================================

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// ============================================
// Z-INDEX LAYERS
// ============================================

export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  notification: 70,
  max: 9999,
};

// ============================================
// LAYOUT
// ============================================

export const Layout = {
  screen: {
    horizontal: Spacing.xl,
    vertical: Spacing.lg,
  },
  
  header: {
    height: 60,
    paddingHorizontal: Spacing.xl,
  },
  
  tabBar: {
    height: 70,
    paddingHorizontal: Spacing.base,
  },
  
  card: {
    padding: Spacing.lg,
    margin: Spacing.base,
  },
};

// ============================================
// DRIVER SPECIFIC THEME
// ============================================

export const DriverTheme = {
  // Status Colors
  status: {
    online: {
      bg: Colors.success,
      text: Colors.white,
      icon: 'checkmark-circle',
    },
    offline: {
      bg: Colors.offline,
      text: Colors.white,
      icon: 'close-circle',
    },
    busy: {
      bg: Colors.warning,
      text: Colors.white,
      icon: 'time',
    },
  },
  
  // Earnings Display
  earnings: {
    positive: Colors.success,
    negative: Colors.error,
    neutral: Colors.gray[600],
  },
  
  // Rating Display
  rating: {
    excellent: Colors.success,    // 4.5+
    good: Colors.primary,         // 4.0 - 4.4
    average: Colors.warning,      // 3.5 - 3.9
    poor: Colors.error,           // < 3.5
  },
  
  // Document Status
  documents: {
    approved: Colors.success,
    pending: Colors.warning,
    rejected: Colors.error,
    notUploaded: Colors.gray[400],
  },
  
  // Trip Status
  trip: {
    requested: Colors.info,
    accepted: Colors.primary,
    arrived: Colors.warning,
    inProgress: Colors.success,
    completed: Colors.gray[600],
    cancelled: Colors.error,
  },
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  ButtonStyles,
  InputStyles,
  CardStyles,
  StatusBadges,
  Animations,
  Breakpoints,
  ZIndex,
  Layout,
  DriverTheme,
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ThemeColors = typeof Colors;
export type ThemeTypography = typeof Typography;
export type ThemeSpacing = typeof Spacing;
export type ThemeBorderRadius = typeof BorderRadius;
export type ThemeShadows = typeof Shadows;