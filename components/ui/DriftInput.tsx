import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

interface DriftInputProps extends TextInputProps {
  label?: string;
  error?: string;
  showValidation?: boolean;
  isValid?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

/**
 * Input component matching Figma RideX design
 * Underlined style with validation checkmark
 */
export function DriftInput({
  label,
  error,
  showValidation = false,
  isValid = false,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: DriftInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            style,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={Colors.gray[400]}
          {...props}
        />
        
        {/* Validation checkmark or custom right icon */}
        {showValidation && isValid && !error && (
          <View style={styles.validationIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
        
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {/* Underline */}
      <View
        style={[
          styles.underline,
          isFocused && styles.underlineFocused,
          error && styles.underlineError,
        ]}
      />
      
      {/* Error message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/**
 * Phone input with country code dropdown
 */
export function PhoneInput({
  value,
  onChangeText,
  countryCode = '+1',
  onCountryCodePress,
  ...props
}: DriftInputProps & {
  countryCode?: string;
  onCountryCodePress?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter mobile number</Text>
      
      <View style={styles.phoneInputWrapper}>
        {/* Country Code */}
        <TouchableOpacity
          style={styles.countryCodeButton}
          onPress={onCountryCodePress}
          activeOpacity={0.7}
        >
          <Text style={styles.countryCodeText}>{countryCode}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        
        {/* Phone Number */}
        <TextInput
          style={styles.phoneInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          placeholder="373 299 3456"
          placeholderTextColor={Colors.gray[400]}
          {...props}
        />
      </View>
      
      <View style={styles.underline} />
    </View>
  );
}

/**
 * Password input with show/hide toggle
 */
export function PasswordInput({ value, onChangeText, ...props }: DriftInputProps) {
  const [isSecure, setIsSecure] = useState(true);

  return (
    <DriftInput
      label="Enter Your Password"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={isSecure}
      rightIcon={
        <Text style={styles.eyeIcon}>{isSecure ? '🙈' : '👁️'}</Text>
      }
      onRightIconPress={() => setIsSecure(!isSecure)}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  
  label: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  input: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.black,
    paddingVertical: Spacing.md,
    paddingRight: 40, // Space for icons
  },
  
  inputFocused: {
    // Optional: add focus styles
  },
  
  inputError: {
    color: Colors.error,
  },
  
  underline: {
    height: 1,
    backgroundColor: Colors.gray[300],
    marginTop: 2,
  },
  
  underlineFocused: {
    backgroundColor: Colors.primary,
    height: 2,
  },
  
  underlineError: {
    backgroundColor: Colors.error,
  },
  
  validationIcon: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  
  checkmark: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  
  rightIcon: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    padding: Spacing.xs,
  },
  
  eyeIcon: {
    fontSize: 20,
  },
  
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  
  // Phone input specific
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[300],
    marginRight: Spacing.md,
  },
  
  countryCodeText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.black,
    marginRight: Spacing.xs,
  },
  
  dropdownArrow: {
    fontSize: 10,
    color: Colors.gray[500],
  },
  
  phoneInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.black,
    paddingVertical: Spacing.md,
  },
});