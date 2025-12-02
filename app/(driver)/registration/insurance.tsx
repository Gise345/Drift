import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function Insurance() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, setRegistrationStep } = useDriverStore();

  // Initialize from saved data
  const savedInsurance = registrationData?.documents?.insurance;

  const [insuranceImage, setInsuranceImage] = useState<string | null>(savedInsurance?.image || null);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.9 });

    if (!result.canceled && result.assets[0]) {
      setInsuranceImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Insurance Document', 'Choose how to add your photo', [
      { text: 'Take Photo', onPress: () => pickImage(true) },
      { text: 'Choose from Gallery', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleContinue = () => {
    if (!insuranceImage) {
      Alert.alert('Document required', 'Please upload your insurance document');
      return;
    }

    if (expiryDate < new Date()) {
      Alert.alert('Insurance expired', 'Please provide valid insurance that has not expired');
      return;
    }

    // Save to store in the correct format
    updateRegistrationData({
      documents: {
        insurance: {
          image: insuranceImage,
        },
      },
    });

    setRegistrationStep(8); // Moving to step 8 (registration-cert)
    router.push('/(driver)/registration/registration-cert');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Insurance</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '42%' }]} />
        </View>
        <Text style={styles.progressText}>Step 6 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Vehicle Insurance</Text>
        <Text style={styles.subtitle}>
          Upload your current vehicle insurance certificate
        </Text>

        {/* Insurance Document */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionLabel}>Insurance Certificate *</Text>
          {insuranceImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: insuranceImage }} style={styles.documentImage} />
              <TouchableOpacity style={styles.retakeButton} onPress={showImageOptions}>
                <Ionicons name="camera" size={16} color={Colors.white} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={showImageOptions}>
              <Ionicons name="camera-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expiry Date */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionLabel}>Expiry Date *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{expiryDate.toLocaleDateString()}</Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.gray[600]} />
          </TouchableOpacity>
          <Text style={styles.helperText}>Insurance must be valid for at least 30 days</Text>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={expiryDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setExpiryDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>Insurance Requirements:</Text>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>Valid comprehensive or third-party insurance</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>Must cover the vehicle you registered</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>Not expired or expiring within 30 days</Text>
          </View>
          <View style={styles.requirementRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            <Text style={styles.requirementText}>Policy holder name must match driver name</Text>
          </View>
        </View>

        {/* Important Note */}
        <View style={styles.importantNote}>
          <Ionicons name="alert-circle" size={20} color={Colors.warning} />
          <Text style={styles.importantText}>
            <Text style={styles.bold}>Important:</Text> Make sure your insurance covers 3rd party. 
            You are responsible for maintaining adequate insurance coverage at all times.
          </Text>
        </View>

        <DriftButton
          title="Continue"
          onPress={handleContinue}
          disabled={!insuranceImage}
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
  documentSection: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  uploadBox: {
    height: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.gray[300],
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray[50],
  },
  uploadText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
  imagePreview: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.gray[100],
  },
  documentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  retakeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black + 'CC',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  retakeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: Spacing.xl,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    color: Colors.black,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  requirementsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  requirementText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    flex: 1,
  },
  importantNote: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  importantText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: Colors.black,
  },
});