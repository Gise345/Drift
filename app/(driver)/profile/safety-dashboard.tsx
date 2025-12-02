/**
 * DRIVER SAFETY DASHBOARD
 * Shows driver's safety metrics, strikes, and appeal options
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { useSafetyStore } from '@/src/stores/safety-store';
import { useDriverStore } from '@/src/stores/driver-store';
import {
  DriverSafetyProfile,
  Strike,
  SuspensionStatus,
} from '@/src/types/safety.types';
import { STRIKE_CONSTANTS } from '@/src/services/strikeService';

export default function SafetyDashboardScreen() {
  const router = useRouter();
  const { driverProfile, driverStrikes, loadDriverProfile, loadDriverStrikes, loading } = useSafetyStore();
  const { driver } = useDriverStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (driver?.id) {
      loadDriverProfile(driver.id);
      loadDriverStrikes(driver.id);
    }
  }, [driver?.id]);

  const onRefresh = async () => {
    if (!driver?.id) return;
    setRefreshing(true);
    await Promise.all([
      loadDriverProfile(driver.id),
      loadDriverStrikes(driver.id),
    ]);
    setRefreshing(false);
  };

  const getSuspensionStatusColor = (status: SuspensionStatus): string => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'suspended_temp':
        return '#F59E0B';
      case 'suspended_perm':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getSuspensionStatusText = (status: SuspensionStatus): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'suspended_temp':
        return 'Temporarily Suspended';
      case 'suspended_perm':
        return 'Permanently Suspended';
      default:
        return 'Unknown';
    }
  };

  const getStrikeColor = (count: number): string => {
    if (count === 0) return '#10B981';
    if (count === 1) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getDaysUntilExpiry = (expiresAt: Date): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading && !driverProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading safety data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Dashboard</Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push('/(driver)/support/safety-help' as any)}
        >
          <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Account Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Account Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getSuspensionStatusColor(driverProfile?.suspensionStatus || 'active') },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getSuspensionStatusText(driverProfile?.suspensionStatus || 'active')}
              </Text>
            </View>
          </View>

          {driverProfile?.currentSuspension && (
            <View style={styles.suspensionInfo}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <View style={styles.suspensionDetails}>
                <Text style={styles.suspensionReason}>
                  {driverProfile.currentSuspension.reason}
                </Text>
                {driverProfile.currentSuspension.expiresAt && (
                  <Text style={styles.suspensionExpiry}>
                    Ends: {formatDate(driverProfile.currentSuspension.expiresAt)}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Safety Metrics */}
        <View style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Safety Metrics</Text>

          <View style={styles.metricsGrid}>
            {/* Safety Rating */}
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              </View>
              <Text style={styles.metricValue}>
                {driverProfile?.safetyRating?.toFixed(1) || '5.0'}
              </Text>
              <Text style={styles.metricLabel}>Safety Rating</Text>
            </View>

            {/* Route Adherence */}
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="navigate" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.metricValue}>
                {driverProfile?.routeAdherenceScore || 100}%
              </Text>
              <Text style={styles.metricLabel}>Route Adherence</Text>
            </View>

            {/* Speed Compliance */}
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="speedometer" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.metricValue}>
                {driverProfile?.speedComplianceScore || 100}%
              </Text>
              <Text style={styles.metricLabel}>Speed Compliance</Text>
            </View>

            {/* Safe Trip Streak */}
            <View style={styles.metricItem}>
              <View style={styles.metricIcon}>
                <Ionicons name="flame" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.metricValue}>
                {driverProfile?.safeTripsStreak || 0}
              </Text>
              <Text style={styles.metricLabel}>Safe Trip Streak</Text>
            </View>
          </View>
        </View>

        {/* Strike Summary */}
        <View style={styles.strikeCard}>
          <View style={styles.strikeHeader}>
            <Text style={styles.sectionTitle}>Strike Status</Text>
            <View
              style={[
                styles.strikeCountBadge,
                { backgroundColor: getStrikeColor(driverProfile?.activeStrikes || 0) },
              ]}
            >
              <Text style={styles.strikeCountText}>
                {driverProfile?.activeStrikes || 0} / {STRIKE_CONSTANTS.MAX_STRIKES_BEFORE_PERM_BAN}
              </Text>
            </View>
          </View>

          <View style={styles.strikeProgress}>
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                style={[
                  styles.strikeIndicator,
                  (driverProfile?.activeStrikes || 0) >= num && styles.strikeIndicatorActive,
                ]}
              >
                <Ionicons
                  name={(driverProfile?.activeStrikes || 0) >= num ? 'close-circle' : 'ellipse-outline'}
                  size={32}
                  color={(driverProfile?.activeStrikes || 0) >= num ? '#EF4444' : '#4B5563'}
                />
              </View>
            ))}
          </View>

          <Text style={styles.strikeInfo}>
            Strikes expire after {STRIKE_CONSTANTS.STRIKE_EXPIRATION_DAYS} days of safe driving.
            {'\n'}3 strikes result in permanent suspension.
          </Text>
        </View>

        {/* Active Strikes */}
        {driverStrikes.length > 0 && (
          <View style={styles.strikesListCard}>
            <Text style={styles.sectionTitle}>Active Strikes</Text>

            {driverStrikes.map((strike) => (
              <View key={strike.id} style={styles.strikeItem}>
                <View style={styles.strikeItemHeader}>
                  <View style={styles.strikeTypeContainer}>
                    <Ionicons
                      name={
                        strike.type === 'speed_violation'
                          ? 'speedometer'
                          : strike.type === 'route_deviation'
                          ? 'navigate'
                          : 'warning'
                      }
                      size={20}
                      color="#EF4444"
                    />
                    <Text style={styles.strikeType}>
                      {strike.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                  <Text style={styles.strikeSeverity}>{strike.severity}</Text>
                </View>

                <Text style={styles.strikeReason}>{strike.reason}</Text>

                <View style={styles.strikeFooter}>
                  <Text style={styles.strikeDate}>
                    Issued: {formatDate(strike.issuedAt)}
                  </Text>
                  <Text style={styles.strikeExpiry}>
                    Expires in {getDaysUntilExpiry(strike.expiresAt)} days
                  </Text>
                </View>

                {strike.status === 'active' && (
                  <TouchableOpacity
                    style={styles.appealButton}
                    onPress={() => router.push({
                      pathname: '/(driver)/profile/appeal-strike' as any,
                      params: { strikeId: strike.id },
                    })}
                  >
                    <Text style={styles.appealButtonText}>Appeal This Strike</Text>
                    <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tips for Improvement */}
        <View style={styles.tipsCard}>
          <Text style={styles.sectionTitle}>Tips for Safe Driving</Text>

          <View style={styles.tipItem}>
            <Ionicons name="speedometer-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Always follow posted speed limits. Consistent speeding triggers violations.
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Communicate with riders if you need to take a different route than planned.
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="location-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Always complete trips at the correct destination to avoid early completion alerts.
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Be professional and courteous. Safety ratings affect your driver score.
            </Text>
          </View>
        </View>

        {/* View Full Safety Policy */}
        <TouchableOpacity
          style={styles.policyLink}
          onPress={() => router.push('/(driver)/legal/safety-policy' as any)}
        >
          <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
          <Text style={styles.policyLinkText}>View Full Safety Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helpButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  statusCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suspensionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
  },
  suspensionDetails: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  suspensionReason: {
    color: '#EF4444',
    fontSize: 14,
  },
  suspensionExpiry: {
    color: '#999999',
    fontSize: 12,
    marginTop: 4,
  },
  metricsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  strikeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  strikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  strikeCountBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  strikeCountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  strikeProgress: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.md,
  },
  strikeIndicator: {
    alignItems: 'center',
  },
  strikeIndicatorActive: {},
  strikeInfo: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  strikesListCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  strikeItem: {
    backgroundColor: '#0A0A0A',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  strikeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  strikeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  strikeType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  strikeSeverity: {
    color: '#F59E0B',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  strikeReason: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  strikeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strikeDate: {
    color: '#666666',
    fontSize: 12,
  },
  strikeExpiry: {
    color: '#666666',
    fontSize: 12,
  },
  appealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  appealButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  tipsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
  },
  policyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  policyLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  bottomPadding: {
    height: 40,
  },
});
