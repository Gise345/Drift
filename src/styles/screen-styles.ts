/**
 * Drift Universal Screen Styles
 * 
 * Use these styles in ALL screens to ensure consistent safe area handling
 * and prevent content from being cut off by phone navigation buttons
 * 
 * Location: src/styles/screen-styles.ts
 */

import { StyleSheet } from 'react-native';

// Import your theme constants
// Adjust paths based on your project structure
import { Colors, Spacing } from '../constants/theme';

/**
 * Universal Screen Styles
 * Use these in every screen for consistent spacing and safe areas
 */
export const ScreenStyles = StyleSheet.create({
  /**
   * Safe Area Container
   * Use this as the root container for ALL screens
   * Works with SafeAreaView from react-native-safe-area-context
   */
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  /**
   * Scrollable Container
   * Use this for ScrollView
   */
  scrollView: {
    flex: 1,
  },

  /**
   * Scroll Content Container
   * Use this for contentContainerStyle in ScrollView
   * Includes extra bottom padding to prevent cutoff
   */
  scrollContent: {
    flexGrow: 1, // IMPORTANT: Use flexGrow, not flex
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'] + 20, // Extra bottom padding
  },

  /**
   * Non-Scrollable Container
   * Use for screens that don't need scrolling
   */
  container: {
    flex: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing['2xl'], // Bottom padding for nav buttons
  },

  /**
   * Centered Content
   * For splash screens, empty states, etc.
   */
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },

  /**
   * Full Width Container (no horizontal padding)
   * For maps, images, etc.
   */
  fullWidth: {
    flex: 1,
    paddingBottom: Spacing['2xl'], // Still add bottom padding
  },

  /**
   * Form Container
   * For auth screens and forms
   */
  formContainer: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'] + 20,
  },
});

/**
 * =======================================================================
 * USAGE EXAMPLES
 * =======================================================================
 */

/**
 * Example 1: Scrollable Screen (most common)
 */
/*
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { ScreenStyles } from '@/src/styles/screen-styles';

export default function MyScreen() {
  return (
    <SafeAreaView style={ScreenStyles.safeArea} edges={['top', 'bottom']}>
      <ScrollView 
        style={ScreenStyles.scrollView}
        contentContainerStyle={ScreenStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Your content *\/}
      </ScrollView>
    </SafeAreaView>
  );
}
*/

/**
 * Example 2: Non-Scrollable Screen
 */
/*
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { ScreenStyles } from '@/src/styles/screen-styles';

export default function MyScreen() {
  return (
    <SafeAreaView style={ScreenStyles.safeArea} edges={['top', 'bottom']}>
      <View style={ScreenStyles.container}>
        {/* Your content *\/}
      </View>
    </SafeAreaView>
  );
}
*/

/**
 * Example 3: Form Screen
 */
/*
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { ScreenStyles } from '@/src/styles/screen-styles';

export default function FormScreen() {
  return (
    <SafeAreaView style={ScreenStyles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={ScreenStyles.scrollView}
          contentContainerStyle={ScreenStyles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Your form *\/}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
*/

/**
 * Example 4: Map Screen (full width)
 */
/*
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import { ScreenStyles } from '@/src/styles/screen-styles';

export default function MapScreen() {
  return (
    <SafeAreaView style={ScreenStyles.safeArea} edges={['top']}>
      <View style={ScreenStyles.fullWidth}>
        <MapView style={{ flex: 1 }} />
        {/* Overlay UI components *\/}
      </View>
    </SafeAreaView>
  );
}
*/

export default ScreenStyles;