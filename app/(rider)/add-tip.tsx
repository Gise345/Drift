/**
 * Add Tip Screen - Production
 * Shows when driver completes trip to allow rider to add a tip
 *
 * Features:
 * - Safety check for incomplete trips (more than 0.25 miles from destination)
 * - SOS button for emergencies
 * - Suggested tip amounts
 * - Custom tip input
 * - Driver rating
 * - Firebase integration for tip submission
 * - Real-time updates
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '@/src/stores/trip-store';
import { addTipToTrip, skipTipAndFinalize } from '@/src/services/ride-request.service';

const Colors = {
  primary: '#5d1289',
  black: '#000000',
  white: '#FFFFFF',
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
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

// Quarter mile in meters (0.25 miles = ~402 meters)
const SAFETY_DISTANCE_THRESHOLD = 402;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function AddTipScreen() {
  const router = useRouter();
  const { currentTrip, setCurrentTrip, subscribeToTrip } = useTripStore();

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverRating, setDriverRating] = useState<number>(5);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);

  // Check if trip was completed far from destination (safety concern)
  const tripIncomplete = useMemo(() => {
    if (!currentTrip?.destination?.coordinates) return false;

    // Get driver's final location when they completed the trip
    const driverFinalLocation = (currentTrip as any).driverFinalLocation;
    if (!driverFinalLocation) return false;

    const distanceToDestination = calculateDistance(
      driverFinalLocation.latitude,
      driverFinalLocation.longitude,
      currentTrip.destination.coordinates.latitude,
      currentTrip.destination.coordinates.longitude
    );

    // If more than 0.25 miles (402m) from destination, show safety check
    return distanceToDestination > SAFETY_DISTANCE_THRESHOLD;
  }, [currentTrip]);

  // Show safety modal when trip appears incomplete
  useEffect(() => {
    if (tripIncomplete && !safetyConfirmed) {
      setShowSafetyModal(true);
    }
  }, [tripIncomplete, safetyConfirmed]);

  // Subscribe to trip updates
  useEffect(() => {
    if (!currentTrip?.id) return;

    const unsubscribe = subscribeToTrip(currentTrip.id);
    return () => unsubscribe();
  }, [currentTrip?.id]);

  // If trip becomes fully completed (driver finalized), navigate away
  useEffect(() => {
    if (currentTrip?.status === 'COMPLETED') {
      console.log('Trip fully completed, navigating to trip-complete');
      router.replace('/(rider)/trip-complete');
    }
  }, [currentTrip?.status]);

  // If no trip, go home
  if (!currentTrip) {
    router.replace('/(tabs)');
    return null;
  }

  const driver = currentTrip.driverInfo;
  const tripCost = currentTrip.finalCost || currentTrip.estimatedCost || 0;

  // Suggested tip amounts based on trip cost
  const suggestedTips = [
    Math.max(2, Math.round(tripCost * 0.1)), // 10%
    Math.max(3, Math.round(tripCost * 0.15)), // 15%
    Math.max(5, Math.round(tripCost * 0.2)), // 20%
    Math.max(7, Math.round(tripCost * 0.25)), // 25%
  ];

  const handleTipSelect = (amount: number) => {
    setSelectedTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setCustomTip(cleaned);
    setSelectedTip(null);
  };

  const getTipAmount = (): number => {
    if (selectedTip !== null) return selectedTip;
    return parseFloat(customTip) || 0;
  };

  const handleAddTip = async () => {
    const tipAmount = getTipAmount();

    if (tipAmount <= 0) {
      Alert.alert('Invalid Tip', 'Please enter a valid tip amount');
      return;
    }

    if (!currentTrip?.id || !currentTrip?.driverId) {
      Alert.alert('Error', 'Trip information not available');
      return;
    }

    setLoading(true);

    try {
      // Add tip to Firebase
      await addTipToTrip(currentTrip.id, tipAmount, currentTrip.driverId);

      Alert.alert(
        'Tip Added!',
        `CI$${tipAmount.toFixed(2)} tip added for ${driver?.name || 'your driver'}. Thank you!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentTrip(null);
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to add tip:', error);
      Alert.alert('Error', 'Failed to add tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!currentTrip?.id || !currentTrip?.driverId) {
      setCurrentTrip(null);
      router.replace('/(tabs)');
      return;
    }

    setLoading(true);

    try {
      // Skip tip and finalize trip in Firebase
      await skipTipAndFinalize(currentTrip.id, currentTrip.driverId);

      setCurrentTrip(null);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to skip tip:', error);
      // Still navigate away even if there's an error
      setCurrentTrip(null);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  // Emergency call function - directly opens phone dialer with 911
  const handleEmergencyCall = () => {
    Linking.openURL('tel:911');
  };

  // Handle safety confirmation - user says they're OK
  const handleSafetyConfirmOk = () => {
    setSafetyConfirmed(true);
    setShowSafetyModal(false);
  };

  // Render star rating
  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setDriverRating(star)}
            disabled={loading}
          >
            <Ionicons
              name={star <= driverRating ? 'star' : 'star-outline'}
              size={36}
              color={star <= driverRating ? '#f39c12' : Colors.gray[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Safety Modal for Incomplete Trips */}
        <Modal
          visible={showSafetyModal}
          transparent
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.safetyModal}>
              <View style={styles.safetyIconContainer}>
                <Ionicons name="shield-checkmark" size={60} color={Colors.primary} />
              </View>

              <Text style={styles.safetyTitle}>Drift Cares About Your Safety</Text>
              <Text style={styles.safetyMessage}>
                We noticed your trip ended before reaching your destination. Is everything okay?
              </Text>

              <TouchableOpacity
                style={styles.safetyOkButton}
                onPress={handleSafetyConfirmOk}
              >
                <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
                <Text style={styles.safetyOkText}>Yes, I'm okay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosButton}
                onPress={handleEmergencyCall}
              >
                <Ionicons name="warning" size={22} color={Colors.white} />
                <Text style={styles.sosButtonText}>Call Emergency (911)</Text>
              </TouchableOpacity>

              <Text style={styles.safetyNote}>
                If you feel unsafe, please call emergency services immediately.
              </Text>
            </View>
          </View>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          {/* SOS Button - Always visible when trip was incomplete */}
          {tripIncomplete ? (
            <TouchableOpacity
              style={styles.sosHeaderButton}
              onPress={handleEmergencyCall}
            >
              <Ionicons name="warning" size={20} color={Colors.white} />
              <Text style={styles.sosHeaderText}>SOS</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}

          <Text style={styles.title}>Add a Tip</Text>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Banner */}
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
            <Text style={styles.successText}>Trip Completed!</Text>
          </View>

          {/* Driver Info and Rating */}
          <View style={styles.driverContainer}>
            {driver?.photo ? (
              <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
            ) : (
              <View style={styles.driverPhotoPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.primary} />
              </View>
            )}
            <Text style={styles.driverName}>{driver?.name || 'Your Driver'}</Text>

            {/* Star Rating */}
            <Text style={styles.rateDriverLabel}>Rate your driver</Text>
            {renderStarRating()}

            <Text style={styles.subtitle}>
              Show your appreciation with a tip
            </Text>
          </View>

          {/* Trip Cost Summary */}
          <View style={styles.tripSummary}>
            <Text style={styles.tripCostLabel}>Trip Cost</Text>
            <Text style={styles.tripCostAmount}>CI${tripCost.toFixed(2)}</Text>
          </View>

          {/* Suggested Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.sectionTitle}>Suggested Amounts</Text>
            <View style={styles.tipsGrid}>
              {suggestedTips.map((amount, index) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.tipButton,
                    selectedTip === amount && styles.tipButtonSelected,
                  ]}
                  onPress={() => handleTipSelect(amount)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.tipAmount,
                    selectedTip === amount && styles.tipAmountSelected,
                  ]}>
                    CI${amount}
                  </Text>
                  <Text style={[
                    styles.tipLabel,
                    selectedTip === amount && styles.tipLabelSelected,
                  ]}>
                    {['10%', '15%', '20%', '25%'][index]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Tip */}
          <View style={styles.customContainer}>
            <Text style={styles.sectionTitle}>Or Enter Custom Amount</Text>
            <View style={styles.customInputContainer}>
              <Text style={styles.currencySymbol}>CI$</Text>
              <TextInput
                style={styles.customInput}
                placeholder="0.00"
                placeholderTextColor={Colors.gray[400]}
                value={customTip}
                onChangeText={handleCustomTipChange}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Tips are optional and go 100% to your driver as a token of appreciation for great service.
            </Text>
          </View>
        </ScrollView>

        {/* Add Tip Button */}
        <View style={styles.bottomContainer}>
          {getTipAmount() > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Tip</Text>
              <Text style={styles.totalAmount}>
                CI${getTipAmount().toFixed(2)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.addButton,
              (getTipAmount() <= 0 || loading) && styles.addButtonDisabled,
            ]}
            onPress={handleAddTip}
            disabled={getTipAmount() <= 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="heart" size={20} color={Colors.white} />
                <Text style={styles.addButtonText}>Add CI${getTipAmount().toFixed(2)} Tip</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.noTipButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.noTipText}>No tip this time</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success + '15',
    paddingVertical: 16,
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
  },
  driverContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  driverPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[600],
  },
  tripSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    marginBottom: 24,
  },
  tripCostLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  tripCostAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  tipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tipAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  tipAmountSelected: {
    color: Colors.primary,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray[500],
  },
  tipLabelSelected: {
    color: Colors.primary,
  },
  customContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.black,
    padding: 0,
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
    paddingBottom: 32,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  noTipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  noTipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },

  // Safety Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  safetyModal: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  safetyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  safetyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: 12,
  },
  safetyMessage: {
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  safetyOkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  safetyOkText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  sosButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  safetyNote: {
    fontSize: 13,
    color: Colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },

  // SOS Header Button
  sosHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sosHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },

  // Rating Styles
  rateDriverLabel: {
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 12,
    marginBottom: 8,
  },
});
