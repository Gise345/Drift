import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';

export default function EditProfileScreen() {
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 345 923 4567',
    address: '123 West Bay Road',
    city: 'George Town',
    district: 'Grand Cayman',
    emergencyContact: '+1 345 555 1234',
    emergencyName: 'Jane Smith',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Success',
        'Your profile has been updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    required = false,
    icon,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
    required?: boolean;
    icon: string;
  }) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>
      <View style={styles.inputWrapper}>
        <View style={styles.inputIcon}>
          <Ionicons name={icon as any} size={20} color={Colors.textSecondary} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <InputField
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Enter first name"
              required
              icon="person-outline"
            />

            <InputField
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Enter last name"
              required
              icon="person-outline"
            />

            <InputField
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              keyboardType="email-address"
              required
              icon="mail-outline"
            />

            <InputField
              label="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              required
              icon="call-outline"
            />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            
            <InputField
              label="Street Address"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter street address"
              icon="home-outline"
            />

            <InputField
              label="City"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Enter city"
              icon="location-outline"
            />

            <InputField
              label="District"
              value={formData.district}
              onChangeText={(text) => setFormData({ ...formData, district: text })}
              placeholder="Enter district"
              icon="map-outline"
            />
          </View>

          {/* Emergency Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Text style={styles.sectionDescription}>
              This information will only be used in case of emergency
            </Text>
            
            <InputField
              label="Contact Name"
              value={formData.emergencyName}
              onChangeText={(text) => setFormData({ ...formData, emergencyName: text })}
              placeholder="Enter emergency contact name"
              icon="person-outline"
            />

            <InputField
              label="Contact Phone"
              value={formData.emergencyContact}
              onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
              placeholder="Enter emergency contact phone"
              keyboardType="phone-pad"
              icon="call-outline"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  label: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  required: {
    color: Colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Colors.shadow,
  },
  inputIcon: {
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    ...Colors.shadow,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
});