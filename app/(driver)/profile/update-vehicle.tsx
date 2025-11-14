/**
 * UPDATE VEHICLE SCREEN
 * Allows driver to update vehicle information
 * Requires document re-submission when vehicle details change
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';
import firestore from '@react-native-firebase/firestore';

interface VehicleFormData {
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  vin: string;
  seats: string;
}

export default function UpdateVehicleScreen() {
  const { user } = useAuthStore();
  const { vehicle, loadDriverProfile } = useDriverStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: '',
    color: '',
    licensePlate: '',
    vin: '',
    seats: '',
  });
  const [errors, setErrors] = useState<Partial<VehicleFormData>>({});
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    loadVehicleData();
  }, []);

  const loadVehicleData = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        router.back();
        return;
      }

      // Load vehicle data from Firebase
      if (!vehicle) {
        await loadDriverProfile(user.id);
      }

      if (vehicle) {
        setFormData({
          make: vehicle.make || '',
          model: vehicle.model || '',
          year: String(vehicle.year || ''),
          color: vehicle.color || '',
          licensePlate: vehicle.licensePlate || '',
          vin: vehicle.vin || '',
          seats: String(vehicle.seats || ''),
        });
      }
    } catch (error) {
      console.error('❌ Error loading vehicle data:', error);
      Alert.alert('Error', 'Failed to load vehicle information');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<VehicleFormData> = {};

    if (!formData.make.trim()) {
      newErrors.make = 'Vehicle make is required';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Vehicle model is required';
    }

    if (!formData.year.trim()) {
      newErrors.year = 'Year is required';
    } else {
      const year = parseInt(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1990 || year > currentYear + 1) {
        newErrors.year = `Year must be between 1990 and ${currentYear + 1}`;
      }
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Vehicle color is required';
    }

    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }

    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    } else if (formData.vin.trim().length !== 17) {
      newErrors.vin = 'VIN must be exactly 17 characters';
    }

    if (!formData.seats.trim()) {
      newErrors.seats = 'Number of seats is required';
    } else {
      const seats = parseInt(formData.seats);
      if (isNaN(seats) || seats < 2 || seats > 8) {
        newErrors.seats = 'Seats must be between 2 and 8';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasVehicleChanged = (): boolean => {
    if (!vehicle) return true;

    return (
      formData.make.trim() !== vehicle.make ||
      formData.model.trim() !== vehicle.model ||
      parseInt(formData.year) !== vehicle.year ||
      formData.licensePlate.trim() !== vehicle.licensePlate ||
      formData.vin.trim().toUpperCase() !== (vehicle.vin || '').toUpperCase()
    );
  };

  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    // Check if significant vehicle details changed
    if (hasVehicleChanged()) {
      setShowWarningModal(true);
    } else {
      // Only minor changes (color, seats) - save directly
      saveVehicleChanges();
    }
  };

  const saveVehicleChanges = async () => {
    try {
      setSaving(true);

      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        color: formData.color.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        vin: formData.vin.trim().toUpperCase(),
        seats: parseInt(formData.seats),
      };

      // Update vehicle in Firebase
      await firestore()
        .collection('drivers')
        .doc(user.id)
        .update({
          vehicle: vehicleData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Reload profile to get updated data
      await loadDriverProfile(user.id);

      Alert.alert('Success', 'Vehicle information updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('❌ Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmUpdate = async () => {
    setShowWarningModal(false);

    try {
      setSaving(true);

      if (!user?.id) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const vehicleData = {
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year),
        color: formData.color.trim(),
        licensePlate: formData.licensePlate.trim().toUpperCase(),
        vin: formData.vin.trim().toUpperCase(),
        seats: parseInt(formData.seats),
      };

      // Update vehicle and set documents status to pending re-verification
      await firestore()
        .collection('drivers')
        .doc(user.id)
        .update({
          vehicle: vehicleData,
          'documents.registration.status': 'pending',
          'documents.insurance.status': 'pending',
          vehicleUpdatedAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Reload profile
      await loadDriverProfile(user.id);

      Alert.alert(
        'Vehicle Updated',
        'Your vehicle information has been updated. Please upload new vehicle documents (registration and insurance) for verification.',
        [
          {
            text: 'Upload Documents',
            onPress: () => {
              router.back();
              router.push('/(driver)/profile/documents');
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error updating vehicle:', error);
      Alert.alert('Error', 'Failed to update vehicle information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Vehicle</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading vehicle information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Vehicle</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={24} color={Colors.info} />
            <Text style={styles.infoBannerText}>
              Updating vehicle make, model, year, license plate, or VIN will require re-submission
              of vehicle documents for verification.
            </Text>
          </View>

          {/* Make */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Make *</Text>
            <TextInput
              style={[styles.input, errors.make && styles.inputError]}
              value={formData.make}
              onChangeText={(text) => {
                setFormData({ ...formData, make: text });
                setErrors({ ...errors, make: undefined });
              }}
              placeholder="e.g., Toyota, Honda, Ford"
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
          </View>

          {/* Model */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Model *</Text>
            <TextInput
              style={[styles.input, errors.model && styles.inputError]}
              value={formData.model}
              onChangeText={(text) => {
                setFormData({ ...formData, model: text });
                setErrors({ ...errors, model: undefined });
              }}
              placeholder="e.g., Camry, Accord, F-150"
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
          </View>

          {/* Year */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              value={formData.year}
              onChangeText={(text) => {
                setFormData({ ...formData, year: text });
                setErrors({ ...errors, year: undefined });
              }}
              placeholder="e.g., 2022"
              keyboardType="numeric"
              maxLength={4}
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>

          {/* Color */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Color *</Text>
            <TextInput
              style={[styles.input, errors.color && styles.inputError]}
              value={formData.color}
              onChangeText={(text) => {
                setFormData({ ...formData, color: text });
                setErrors({ ...errors, color: undefined });
              }}
              placeholder="e.g., Silver, Black, White"
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
          </View>

          {/* License Plate */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>License Plate *</Text>
            <TextInput
              style={[styles.input, errors.licensePlate && styles.inputError]}
              value={formData.licensePlate}
              onChangeText={(text) => {
                setFormData({ ...formData, licensePlate: text });
                setErrors({ ...errors, licensePlate: undefined });
              }}
              placeholder="e.g., CAY 12345"
              autoCapitalize="characters"
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
          </View>

          {/* VIN */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Vehicle Identification Number (VIN) *</Text>
            <TextInput
              style={[styles.input, errors.vin && styles.inputError]}
              value={formData.vin}
              onChangeText={(text) => {
                setFormData({ ...formData, vin: text });
                setErrors({ ...errors, vin: undefined });
              }}
              placeholder="17-character VIN"
              autoCapitalize="characters"
              maxLength={17}
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.vin && <Text style={styles.errorText}>{errors.vin}</Text>}
            <Text style={styles.helperText}>
              Found on vehicle registration document
            </Text>
          </View>

          {/* Seats */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Number of Seats *</Text>
            <TextInput
              style={[styles.input, errors.seats && styles.inputError]}
              value={formData.seats}
              onChangeText={(text) => {
                setFormData({ ...formData, seats: text });
                setErrors({ ...errors, seats: undefined });
              }}
              placeholder="e.g., 4"
              keyboardType="numeric"
              maxLength={1}
              placeholderTextColor={Colors.gray[400]}
            />
            {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Warning Modal */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color={Colors.warning} />
              <Text style={styles.modalTitle}>Document Re-submission Required</Text>
            </View>

            <Text style={styles.modalText}>
              You've changed your vehicle's make, model, year, license plate, or VIN. This requires
              re-submission and verification of your vehicle documents:
            </Text>

            <View style={styles.documentList}>
              <View style={styles.documentItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <Text style={styles.documentText}>Vehicle Registration</Text>
              </View>
              <View style={styles.documentItem}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                <Text style={styles.documentText}>Vehicle Insurance</Text>
              </View>
            </View>

            <Text style={styles.modalWarning}>
              Your driver status may be temporarily suspended until the new documents are verified.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleConfirmUpdate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>I Understand, Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  content: {
    padding: Spacing.lg,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.info + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.info,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  saveText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  modalText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  documentList: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  documentText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },
  modalWarning: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    backgroundColor: Colors.error + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
  },
  modalConfirmButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
