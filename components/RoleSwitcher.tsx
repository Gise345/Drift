/**
 * Role Switcher Component
 * 
 * Allows users with multiple roles to switch between rider and driver modes
 * Only shows if user has both RIDER and DRIVER roles
 * 
 * Location: src/components/RoleSwitcher.tsx
 * 
 * Usage:
 * import { RoleSwitcher } from '@/components/RoleSwitcher';
 * <RoleSwitcher />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/stores/auth-store';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export function RoleSwitcher() {
  const user = useAuthStore((state) => state.user);
  const currentMode = useAuthStore((state) => state.currentMode);
  const setMode = useAuthStore((state) => state.setMode);

  // Only show if user has multiple roles
  if (!user || user.roles.length < 2) {
    return null;
  }

  const isRider = currentMode === 'RIDER';
  const isDriver = currentMode === 'DRIVER';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>You're viewing as:</Text>
      
      <View style={styles.switchContainer}>
        {/* Rider Button */}
        {user.roles.includes('RIDER') && (
          <TouchableOpacity
            style={[
              styles.modeButton,
              isRider && styles.modeButtonActive,
            ]}
            onPress={() => setMode('RIDER')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.modeIcon,
              isRider && styles.modeIconActive,
            ]}>
              🚗
            </Text>
            <Text style={[
              styles.modeText,
              isRider && styles.modeTextActive,
            ]}>
              Rider
            </Text>
            {isRider && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        )}

        {/* Driver Button */}
        {user.roles.includes('DRIVER') && (
          <TouchableOpacity
            style={[
              styles.modeButton,
              isDriver && styles.modeButtonActive,
            ]}
            onPress={() => setMode('DRIVER')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.modeIcon,
              isDriver && styles.modeIconActive,
            ]}>
              🚙
            </Text>
            <Text style={[
              styles.modeText,
              isDriver && styles.modeTextActive,
            ]}>
              Driver
            </Text>
            {isDriver && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        Switch between your rider and driver accounts anytime
      </Text>
    </View>
  );
}

/**
 * Compact Role Switcher
 * Smaller version for use in headers/navigation
 */
export function CompactRoleSwitcher() {
  const user = useAuthStore((state) => state.user);
  const currentMode = useAuthStore((state) => state.currentMode);
  const setMode = useAuthStore((state) => state.setMode);

  if (!user || user.roles.length < 2) {
    return null;
  }

  const isRider = currentMode === 'RIDER';

  return (
    <TouchableOpacity
      style={styles.compactContainer}
      onPress={() => setMode(isRider ? 'DRIVER' : 'RIDER')}
      activeOpacity={0.7}
    >
      <Text style={styles.compactIcon}>
        {isRider ? '🚗' : '🚙'}
      </Text>
      <Text style={styles.compactText}>
        {isRider ? 'Rider' : 'Driver'}
      </Text>
      <Text style={styles.compactArrow}>⇄</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Main Role Switcher
  container: {
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },

  switchContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
    position: 'relative',
  },

  modeButtonActive: {
    borderColor: Colors.purple,
    backgroundColor: Colors.purple + '10',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  modeIcon: {
    fontSize: 24,
  },

  modeIconActive: {
    fontSize: 28,
  },

  modeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[600],
  },

  modeTextActive: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.purple,
  },

  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.purple,
  },

  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Compact Role Switcher
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
  },

  compactIcon: {
    fontSize: 18,
  },

  compactText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray[700],
  },

  compactArrow: {
    fontSize: 14,
    color: Colors.gray[500],
  },
});

export default RoleSwitcher;