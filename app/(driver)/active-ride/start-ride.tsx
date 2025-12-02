import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { startTrip } from '@/src/services/ride-request.service';

export default function StartRide() {
  const router = useRouter();
  const { activeRide, startRide } = useDriverStore();
  const [verificationCode, setVerificationCode] = useState('');
  const [skipVerification, setSkipVerification] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  if (!activeRide) {
    router.replace('/(driver)/tabs');
    return null;
  }

  const correctCode = '1234'; // Mock - should come from activeRide

  const handleStartRide = async () => {
    if (!skipVerification && verificationCode !== correctCode) {
      Alert.alert('Invalid Code', 'Please enter the correct 4-digit code from the rider.');
      return;
    }

    setIsStarting(true);

    try {
      // Update trip status to IN_PROGRESS in Firebase
      // This will trigger the rider's screen to navigate to trip-in-progress
      await startTrip(activeRide.id);
      console.log('✅ Trip started successfully - Rider should see status change');

      // Update local driver store
      startRide();

      // Navigate to destination screen
      router.replace('/(driver)/active-ride/navigate-to-destination');
    } catch (error) {
      console.error('❌ Failed to start trip:', error);
      Alert.alert('Error', 'Failed to start the ride. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start Ride</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Rider Info */}
        <View style={styles.riderCard}>
          <Ionicons name="person-circle" size={80} color={Colors.primary} />
          <Text style={styles.riderName}>{activeRide.riderName}</Text>
          <View style={styles.riderRating}>
            <Ionicons name="star" size={16} color={Colors.primary} />
            <Text style={styles.ratingText}>{activeRide.riderRating}</Text>
          </View>
        </View>

        {/* Verification Section */}
        <View style={styles.verificationSection}>
          <Text style={styles.sectionTitle}>Verify Rider</Text>
          <Text style={styles.sectionDescription}>
            Ask the rider for their 4-digit verification code
          </Text>

          <View style={styles.codeInputContainer}>
            <TextInput
              style={styles.codeInput}
              value={verificationCode}
              onChangeText={setVerificationCode}
              placeholder="• • • •"
              placeholderTextColor={Colors.gray[400]}
              keyboardType="number-pad"
              maxLength={4}
              editable={!skipVerification}
            />
          </View>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setSkipVerification(!skipVerification)}
          >
            <View style={styles.checkbox}>
              {skipVerification && <Ionicons name="checkmark" size={16} color={Colors.white} />}
            </View>
            <Text style={styles.skipText}>Skip verification (rider confirmed verbally)</Text>
          </TouchableOpacity>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.success} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>From</Text>
              <Text style={styles.detailValue}>{activeRide.pickup.address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={Colors.error} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>To</Text>
              <Text style={styles.detailValue}>{activeRide.destination.address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash" size={20} color={Colors.primary} />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Estimated Earnings</Text>
              <Text style={styles.detailValue}>CI${activeRide.estimatedEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            ((!skipVerification && verificationCode.length !== 4) || isStarting) && styles.startButtonDisabled,
          ]}
          onPress={handleStartRide}
          disabled={(!skipVerification && verificationCode.length !== 4) || isStarting}
        >
          {isStarting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="car" size={24} color={Colors.white} />
              <Text style={styles.startButtonText}>Start Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  riderCard: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 20,
    padding: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  riderName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  riderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
  },
  verificationSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.lg,
  },
  codeInputContainer: {
    marginBottom: Spacing.lg,
  },
  codeInput: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    letterSpacing: 16,
    borderWidth: 2,
    borderColor: Colors.gray[300],
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  skipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  tripDetails: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  detailText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  detailLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    lineHeight: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  startButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  startButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});