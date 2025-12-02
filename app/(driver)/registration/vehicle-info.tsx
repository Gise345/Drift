import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { DriftButton } from '@/components/ui/DriftButton';
import { DriftInput } from '@/components/ui/DriftInput';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

const VEHICLE_MAKES = [
  'Toyota', 'Honda', 'Nissan', 'Ford', 'Chevrolet',
  'Hyundai', 'Kia', 'Mazda', 'Volkswagen', 'Mercedes-Benz',
  'BMW', 'Audi', 'Lexus', 'Jeep', 'Subaru', 'Other'
];

const VEHICLE_COLORS = [
  'White', 'Black', 'Silver', 'Gray', 'Red',
  'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Other'
];

export default function VehicleInfo() {
  const router = useRouter();
  const { updateRegistrationData, setRegistrationStep, registrationData } = useDriverStore();

  // Initialize from saved data
  const savedVehicle = registrationData?.vehicle;

  const [make, setMake] = useState(savedVehicle?.make || '');
  const [model, setModel] = useState(savedVehicle?.model || '');
  const [year, setYear] = useState(savedVehicle?.year?.toString() || '2024');
  const [color, setColor] = useState(savedVehicle?.color || '');
  const [licensePlate, setLicensePlate] = useState(savedVehicle?.licensePlate || '');
  const [vin, setVin] = useState(savedVehicle?.vin || '');
  const [seats, setSeats] = useState(savedVehicle?.seats?.toString() || '4');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString());

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!make) newErrors.make = 'Vehicle make is required';
    if (!model.trim()) newErrors.model = 'Vehicle model is required';
    if (!year) newErrors.year = 'Vehicle year is required';
    if (!color) newErrors.color = 'Vehicle color is required';
    if (!licensePlate.trim()) newErrors.licensePlate = 'License plate is required';
    if (!vin.trim()) {
      newErrors.vin = 'VIN is required';
    } else if (vin.trim().length !== 17) {
      newErrors.vin = 'VIN must be exactly 17 characters';
    }
    if (!seats) newErrors.seats = 'Number of seats is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      updateRegistrationData({
        vehicle: {
          make,
          model: model.trim(),
          year: parseInt(year),
          color,
          licensePlate: licensePlate.trim().toUpperCase(),
          vin: vin.trim().toUpperCase(),
          seats: parseInt(seats),
          photos: {},
        },
      });
      setRegistrationStep(5); // Moving to step 5 (vehicle-photos)
      router.push('/(driver)/registration/vehicle-photos');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Information</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '21%' }]} />
        </View>
        <Text style={styles.progressText}>Step 3 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Vehicle</Text>
        <Text style={styles.subtitle}>
          Tell us about the vehicle you'll use for carpooling
        </Text>

        {/* Make */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Make *</Text>
          <View style={[styles.pickerContainer, errors.make && styles.inputError]}>
            <Picker
              selectedValue={make}
              onValueChange={setMake}
              style={styles.picker}
            >
              <Picker.Item label="Select make..." value="" />
              {VEHICLE_MAKES.map(m => (
                <Picker.Item key={m} label={m} value={m} />
              ))}
            </Picker>
          </View>
          {errors.make && <Text style={styles.errorText}>{errors.make}</Text>}
        </View>

        {/* Model */}
        <DriftInput
          label="Model *"
          placeholder="Camry"
          value={model}
          onChangeText={setModel}
          error={errors.model}
        />

        {/* Year */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Year *</Text>
          <View style={[styles.pickerContainer, errors.year && styles.inputError]}>
            <Picker
              selectedValue={year}
              onValueChange={setYear}
              style={styles.picker}
            >
              {years.map(y => (
                <Picker.Item key={y} label={y} value={y} />
              ))}
            </Picker>
          </View>
          {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          <Text style={styles.helperText}>Vehicle must be 2010 or newer</Text>
        </View>

        {/* Color */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Color *</Text>
          <View style={[styles.pickerContainer, errors.color && styles.inputError]}>
            <Picker
              selectedValue={color}
              onValueChange={setColor}
              style={styles.picker}
            >
              <Picker.Item label="Select color..." value="" />
              {VEHICLE_COLORS.map(c => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>
          {errors.color && <Text style={styles.errorText}>{errors.color}</Text>}
        </View>

        {/* License Plate */}
        <DriftInput
          label="License Plate Number *"
          placeholder="ABC 123"
          value={licensePlate}
          onChangeText={setLicensePlate}
          autoCapitalize="characters"
          error={errors.licensePlate}
        />

        {/* VIN */}
        <DriftInput
          label="Vehicle Identification Number (VIN) *"
          placeholder="1HGBH41JXMN109186"
          value={vin}
          onChangeText={setVin}
          autoCapitalize="characters"
          maxLength={17}
          error={errors.vin}
          helperText="17-character VIN found on vehicle registration"
        />

        {/* Seats */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Available Seats *</Text>
          <View style={[styles.pickerContainer, errors.seats && styles.inputError]}>
            <Picker
              selectedValue={seats}
              onValueChange={setSeats}
              style={styles.picker}
            >
              {['4', '5', '6', '7'].map(s => (
                <Picker.Item key={s} label={`${s} seats`} value={s} />
              ))}
            </Picker>
          </View>
          {errors.seats && <Text style={styles.errorText}>{errors.seats}</Text>}
          <Text style={styles.helperText}>Total passenger capacity</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Make sure your vehicle is clean, well-maintained, and has valid insurance and registration.
          </Text>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  picker: {
    height: 50,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: '#ef4444',
    marginTop: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
});