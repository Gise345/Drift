/**
 * Add Late Tip Screen - Rider
 * Allows riders to add a tip to a completed trip within the 3-day window
 *
 * Features:
 * - Load trip data from Firebase
 * - Validate rating window is still open
 * - Suggested tip amounts
 * - Custom tip input
 * - Firebase integration for late tip submission
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { canRateOrTipTrip, addLateTip } from '@/src/services/ride-request.service';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

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

export default function AddLateTipScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tripData, setTripData] = useState<any>(null);
  const [tipStatus, setTipStatus] = useState<{
    canTip: boolean;
    hasTipped: boolean;
    remainingTime?: string;
  }>({ canTip: true, hasTipped: false });

  // Load trip data
  useEffect(() => {
    const loadTripData = async () => {
      const actualTripId = typeof tripId === 'string' ? tripId : null;

      if (!actualTripId) {
        Alert.alert('Error', 'Trip ID not found', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        return;
      }

      try {
        const tripRef = doc(db, 'trips', actualTripId);
        const tripDoc = await getDoc(tripRef);
        if (tripDoc.exists()) {
          const data = tripDoc.data();
          setTripData(data);

          // Check if tip window is still open
          const status = canRateOrTipTrip({
            completedAt: data?.completedAt,
            ratingDeadline: data?.ratingDeadline,
            driverRating: data?.driverRating,
            tip: data?.tip,
            status: data?.status,
          });

          setTipStatus({
            canTip: status.canTip,
            hasTipped: status.hasTipped,
            remainingTime: status.remainingTime,
          });

          if (!status.canTip) {
            if (status.hasTipped) {
              Alert.alert(
                'Already Tipped',
                'You have already added a tip for this trip.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } else {
              Alert.alert(
                'Tip Window Expired',
                'The 3-day tipping window for this trip has expired.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }
          }
        } else {
          Alert.alert('Error', 'Trip not found', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      } catch (error) {
        console.error('Error loading trip data:', error);
        Alert.alert('Error', 'Failed to load trip data', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } finally {
        setInitialLoading(false);
      }
    };

    loadTripData();
  }, [tripId]);

  // Get driver info
  const driver = useMemo(() => ({
    name: tripData?.driverInfo?.name || tripData?.driverName || 'Your Driver',
    photo: tripData?.driverInfo?.photo || tripData?.driverPhoto,
  }), [tripData]);

  // Trip cost for tip suggestions
  const tripCost = tripData?.finalCost || tripData?.estimatedCost || 0;

  // Suggested tip amounts based on trip cost
  const suggestedTips = useMemo(() => [
    Math.max(2, Math.round(tripCost * 0.1)), // 10%
    Math.max(3, Math.round(tripCost * 0.15)), // 15%
    Math.max(5, Math.round(tripCost * 0.2)), // 20%
    Math.max(7, Math.round(tripCost * 0.25)), // 25%
  ], [tripCost]);

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

    const actualTripId = typeof tripId === 'string' ? tripId : null;
    if (!actualTripId) {
      Alert.alert('Error', 'Trip information not available');
      return;
    }

    setLoading(true);

    try {
      const result = await addLateTip(actualTripId, tipAmount);

      if (result.success) {
        Alert.alert(
          'Tip Added!',
          `CI$${tipAmount.toFixed(2)} tip added for ${driver.name}. Thank you for your generosity!`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Failed to add tip:', error);
      Alert.alert('Error', 'Failed to add tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.back();
  };

  // Show loading while fetching trip data
  if (initialLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleSkip}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>

          <Text style={styles.title}>Add a Tip</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Remaining time banner */}
        {tipStatus.remainingTime && (
          <View style={styles.remainingTimeBanner}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <Text style={styles.remainingTimeText}>
              {tipStatus.remainingTime} to add a tip
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="heart" size={24} color={Colors.success} />
            <Text style={styles.infoBannerText}>
              Show your appreciation! You can add a tip within 3 days of your trip.
            </Text>
          </View>

          {/* Driver Info */}
          <View style={styles.driverContainer}>
            {driver.photo ? (
              <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
            ) : (
              <View style={styles.driverPhotoPlaceholder}>
                <Ionicons name="person" size={40} color={Colors.primary} />
              </View>
            )}
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.subtitle}>
              Your tip goes 100% to your driver
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
            style={styles.cancelButton}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.gray[600],
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
  },
  remainingTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  remainingTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: Colors.success + '15',
    borderRadius: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray[700],
    lineHeight: 20,
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
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[500],
  },
});
