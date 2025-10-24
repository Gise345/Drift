import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCarpoolStore } from '@/src/stores/carpool-store';

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
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
};

export default function TripCompleteScreen() {
  const router = useRouter();
  const { estimatedCost, route, clearBookingFlow } = useCarpoolStore();
  
  const [showReceipt, setShowReceipt] = useState(false);

  // Mock trip data
  const trip = {
    id: 'TRIP-12345',
    driver: 'John Smith',
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    distance: route?.distance ? (route.distance / 1000).toFixed(1) : '5.2',
    duration: route?.duration ? Math.round(route.duration / 60) : 18,
    costShare: estimatedCost?.max || 15,
    currency: estimatedCost?.currency || 'KYD',
  };

  const handleDone = () => {
    clearBookingFlow();
    router.push('/(tabs)');
  };

  const handleRate = () => {
    router.push('/(rider)/rate-driver');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Icon */}
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Trip Complete!</Text>
            <Text style={styles.successSubtitle}>
              Thanks for riding with Drift
            </Text>
          </View>

          {/* Trip Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Trip Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trip ID</Text>
              <Text style={styles.summaryValue}>{trip.id}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Driver</Text>
              <Text style={styles.summaryValue}>{trip.driver}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>{trip.date}, {trip.time}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>{trip.distance} km</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{trip.duration} min</Text>
            </View>
            
            <View style={styles.highlightDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Cost Share</Text>
              <Text style={styles.totalAmount}>
                ${trip.costShare} {trip.currency}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRate}
            >
              <Text style={styles.actionIcon}>⭐</Text>
              <Text style={styles.actionText}>Rate Driver</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(rider)/add-tip')}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Add Tip</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              ⚖️ This was a private carpool arrangement. The cost share shown is for mutual expense splitting only. Drift is a coordination platform, not a transportation provider.
            </Text>
          </View>
        </ScrollView>

        {/* Done Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={handleDone}
          >
            <Text style={styles.doneButtonText}>Done</Text>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 48,
    color: Colors.white,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: 4,
  },
  highlightDivider: {
    height: 2,
    backgroundColor: Colors.primary,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  actionsCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.black,
  },
  chevron: {
    fontSize: 24,
    color: Colors.gray[400],
  },
  legalNotice: {
    marginHorizontal: 16,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  legalText: {
    fontSize: 12,
    color: Colors.gray[600],
    lineHeight: 18,
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
  },
  doneButton: {
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});