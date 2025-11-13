import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BorderRadius, Spacing } from '@/src/constants/theme';

interface DriftButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'black';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode | string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Primary button component matching Figma RideX design
 * Black rounded button with white text and arrow icon
 */
export function DriftButton({
  title,
  onPress,
  variant = 'black',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: DriftButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'black' || variant === 'primary' ? Colors.white : Colors.black}
        />
      ) : (
        <View style={styles.content}>
          <Text style={textStyles}>{title}</Text>
          {icon && (
            <View style={styles.icon}>
              {typeof icon === 'string' ? (
                <Ionicons
                  name={icon as any}
                  size={20}
                  color={variant === 'black' || variant === 'primary' ? Colors.white : Colors.black}
                />
              ) : (
                icon
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Sizes
  size_small: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 40,
  },
  size_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  size_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  
  // Variants (from Figma)
  variant_black: {
    backgroundColor: Colors.black,
  },
  variant_primary: {
    backgroundColor: Colors.primary,
  },
  variant_secondary: {
    backgroundColor: Colors.gray[100],
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.black,
  },
  
  // Full width
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  text_black: {
    color: Colors.white,
  },
  text_primary: {
    color: Colors.black,
  },
  text_secondary: {
    color: Colors.gray[900],
  },
  text_outline: {
    color: Colors.black,
  },
  
  textSize_small: {
    fontSize: Typography.fontSize.sm,
  },
  textSize_medium: {
    fontSize: Typography.fontSize.base,
  },
  textSize_large: {
    fontSize: Typography.fontSize.lg,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  // Layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginLeft: Spacing.sm,
  },
});

/**
 * Arrow icon component for buttons (matches Figma)
 */
export function ArrowRight() {
  return (
    <Text style={{ color: Colors.white, fontSize: 20, fontWeight: 'bold' }}>→</Text>
  );
}