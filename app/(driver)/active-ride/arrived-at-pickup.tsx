import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function ArrivedAtPickup() {
  const router = useRouter();
  const { activeRide } = useDriverStore();
  const [waitTime, setWaitTime] = useState(0);
  const maxWaitTime = 300; // 5 minutes in seconds

  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!activeRide) {
    router.replace('/(driver)/dashboard/home');
    return null;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallRider = () => {
    Linking.openURL(`tel:${(activeRide as any).riderPhone || '+13455551234'}`);
  };

  const handleMessageRider = () => {
    Linking.openURL(`sms:${(activeRide as any).riderPhone || '+13455551234'}`);
  };

  const handleStartRide = () => {
    router.push('/(driver)/active-ride/start-ride');
  };

  const handleNoShow = () => {
    router.push('/(driver)/active-ride/rider-no-show');
  };

  const waitPercentage = Math.min((waitTime / maxWaitTime) * 100, 100);
  const isNearLimit = waitTime > 240; // Last minute warning

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>You've Arrived!</Text>
          <Text style={styles.headerSubtitle}>Waiting for rider to join</Text>
        </View>

        {/* Wait Timer */}
        <View style={styles.timerCard}>
          <View style={styles.timerCircle}>
            <View style={styles.timerInner}>
              <Text style={styles.timerValue}>{formatTime(waitTime)}</Text>
              <Text style={styles.timerLabel}>Wait Time</Text>
            </View>
          </View>
          
          {/* Progress Ring */}
          <View style={styles.progressRing}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${waitPercentage}%`,
                  backgroundColor: isNearLimit ? Colors.warning : Colors.primary,
                }
              ]} 
            />
          </View>

          <Text style={styles.waitInfo}>
            {isNearLimit 
              ? '⚠️ Rider has 1 minute remaining'
              : `Rider has ${Math.floor((maxWaitTime - waitTime) / 60)} minutes to arrive`
            }
          </Text>
        </View>

        {/* Rider Info */}
        <View style={styles.riderCard}>
          <Ionicons name="person-circle" size={64} color={Colors.primary} />
          <View style={styles.riderInfo}>
            <Text style={styles.riderName}>{activeRide.riderName}</Text>
            <View style={styles.riderRating}>
              <Ionicons name="star" size={16} color={Colors.primary} />
              <Text style={styles.ratingText}>{activeRide.riderRating}</Text>
            </View>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Rider</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactCard} onPress={handleMessageRider}>
              <Ionicons name="chatbubble" size={32} color={Colors.primary} />
              <Text style={styles.contactLabel}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactCard} onPress={handleCallRider}>
              <Ionicons name="call" size={32} color={Colors.primary} />
              <Text style={styles.contactLabel}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.locationCard}>
          <Ionicons name="location" size={20} color={Colors.success} />
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>Pickup Location</Text>
            <Text style={styles.locationAddress}>{activeRide.pickup.address}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.noShowButton} onPress={handleNoShow}>
            <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
            <Text style={styles.noShowText}>Rider No-Show</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            <Text style={styles.startButtonText}>Start Ride</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  timerCard: {
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  timerInner: {
    alignItems: 'center',
  },
  timerValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  timerLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  progressRing: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  waitInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    textAlign: 'center',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  riderInfo: {
    marginLeft: Spacing.lg,
  },
  riderName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
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
  contactSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  contactLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.sm,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  locationText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  locationLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    lineHeight: 20,
  },
  actionButtons: {
    gap: Spacing.md,
  },
  noShowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  noShowText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
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
  startButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});