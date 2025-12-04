import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import type { PricingResult } from '@/src/stores/carpool-store';

// Extend the request interface to include pricing
interface RideRequestWithPricing {
  id: string;
  riderName: string;
  riderRating: number;
  pickup: { address: string };
  destination: { address: string };
  estimatedEarnings: number;
  estimatedDuration: number;
  expiresAt: Date;
  pricing?: PricingResult;
  lockedContribution?: number;
}

export default function IncomingRequests() {
  const router = useRouter();
  const { incomingRequests, acceptRequest, declineRequest } = useDriverStore();
  const [refreshing, setRefreshing] = useState(false);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // Update timers every second
    const interval = setInterval(() => {
      const newTimers: { [key: string]: number } = {};
      incomingRequests.forEach((request) => {
        const remaining = Math.max(
          0,
          Math.ceil((request.expiresAt.getTime() - Date.now()) / 1000)
        );
        newTimers[request.id] = remaining;
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [incomingRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - replace with actual API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleAccept = async (requestId: string) => {
    const request = incomingRequests.find(r => r.id === requestId) as any;
    if (request?.lockedContribution) {
      console.log('💰 Driver accepting ride with locked contribution:', request.lockedContribution);
    }
    await acceptRequest(requestId);
    router.push('/(driver)/active-ride/navigate-to-pickup');
  };

  const handleDecline = async (requestId: string) => {
    await declineRequest(requestId, 'Driver declined');
  };

  const calculateDistance = (pickup: any) => {
    // Mock distance calculation - replace with actual calculation
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  const sortedRequests = [...incomingRequests].sort(
    (a, b) => (timers[b.id] || 0) - (timers[a.id] || 0)
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Ride Requests</Text>
          {incomingRequests.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{incomingRequests.length}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {incomingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptyMessage}>
              Make sure you're online to start receiving ride requests from nearby riders.
            </Text>
            <TouchableOpacity
              style={styles.goOnlineButton}
              onPress={() => router.push('/(driver)/tabs')}
            >
              <Text style={styles.goOnlineText}>Go Online</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Requests expire in 15 seconds. Accept quickly to secure the ride!
              </Text>
            </View>

            {sortedRequests.map((request: any) => {
              const timeRemaining = timers[request.id] || 0;
              const isExpiringSoon = timeRemaining <= 5;
              
              // Get the locked contribution or pricing
              const contributionAmount = request.lockedContribution || 
                                        request.pricing?.suggestedContribution || 
                                        request.estimatedEarnings;

              return (
                <View
                  key={request.id}
                  style={[
                    styles.requestCard,
                    isExpiringSoon && styles.requestCardExpiring,
                  ]}
                >
                  {/* Timer Bar */}
                  <View style={styles.timerBar}>
                    <View
                      style={[
                        styles.timerFill,
                        {
                          width: `${(timeRemaining / 15) * 100}%`,
                          backgroundColor: isExpiringSoon ? Colors.error : Colors.primary,
                        },
                      ]}
                    />
                  </View>

                  {/* Women-Only Badge */}
                  {(request as any).womenOnlyRide && (
                    <View style={styles.womenOnlyBanner}>
                      <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                      <Text style={styles.womenOnlyBannerText}>Women-Only Ride Request</Text>
                    </View>
                  )}

                  {/* Header */}
                  <TouchableOpacity
                    style={styles.requestHeader}
                    onPress={() => router.push(`/(driver)/requests/request-detail?id=${request.id}`)}
                  >
                    <View style={styles.riderInfo}>
                      <Ionicons name="person-circle" size={40} color={(request as any).womenOnlyRide ? '#EC4899' : Colors.primary} />
                      <View style={styles.riderDetails}>
                        <Text style={styles.riderName}>{request.riderName}</Text>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color={Colors.primary} />
                          <Text style={styles.riderRating}>{request.riderRating}</Text>
                          <Text style={styles.tripCount}>• {request.riderTrips || 0} trips</Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* ✅ UPDATED: Show Locked Contribution */}
                    <View style={styles.earningsBox}>
                      <Text style={styles.earningsAmount}>
                        CI${contributionAmount?.toFixed(2)}
                      </Text>
                      <Text style={styles.earningsLabel}>
                        {request.lockedContribution ? 'Locked amount' : 'Est. earnings'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Route */}
                  <View style={styles.routeSection}>
                    <View style={styles.routeLine}>
                      <View style={styles.pickupDot} />
                      <View style={styles.routeDashes} />
                      <View style={styles.destinationDot} />
                    </View>
                    <View style={styles.routeDetails}>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color={Colors.success} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {request.pickup.address}
                        </Text>
                      </View>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={16} color={Colors.error} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {request.destination.address}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ✅ NEW: Zone Route Display */}
                  {request.pricing?.displayText && (
                    <View style={styles.zoneContainer}>
                      <Text style={styles.zoneText}>{request.pricing.displayText}</Text>
                      
                      {/* Zone Type Badge */}
                      <View style={styles.zoneBadge}>
                        {request.pricing.isWithinZone ? (
                          <Text style={styles.zoneBadgeText}>Within Zone</Text>
                        ) : request.pricing.isAirportTrip ? (
                          <Text style={styles.zoneBadgeText}>✈️ Airport</Text>
                        ) : (
                          <Text style={styles.zoneBadgeText}>Cross Zone</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* ✅ NEW: Pricing Breakdown (for cross-zone trips) */}
                  {request.pricing && !request.pricing.isWithinZone && !request.pricing.isAirportTrip && (
                    <View style={styles.breakdownCard}>
                      <Text style={styles.breakdownTitle}>Contribution Breakdown:</Text>
                      {request.pricing.breakdown.baseZoneFee !== undefined && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Base:</Text>
                          <Text style={styles.breakdownValue}>
                            CI${request.pricing.breakdown.baseZoneFee.toFixed(2)}
                          </Text>
                        </View>
                      )}
                      {request.pricing.breakdown.distanceCost !== undefined && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Distance:</Text>
                          <Text style={styles.breakdownValue}>
                            CI${request.pricing.breakdown.distanceCost.toFixed(2)}
                          </Text>
                        </View>
                      )}
                      {request.pricing.breakdown.timeCost !== undefined && (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Time:</Text>
                          <Text style={styles.breakdownValue}>
                            CI${request.pricing.breakdown.timeCost.toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Trip Info */}
                  <View style={styles.tripInfo}>
                    <View style={styles.tripInfoItem}>
                      <Ionicons name="navigate" size={16} color={Colors.gray[600]} />
                      <Text style={styles.tripInfoText}>
                        {calculateDistance(request.pickup)} km away
                      </Text>
                    </View>
                    <View style={styles.tripInfoItem}>
                      <Ionicons name="time" size={16} color={Colors.gray[600]} />
                      <Text style={styles.tripInfoText}>~{request.estimatedDuration} min</Text>
                    </View>
                    <View style={styles.tripInfoItem}>
                      <Ionicons name="people" size={16} color={Colors.gray[600]} />
                      <Text style={styles.tripInfoText}>{request.passengers || 1} passengers</Text>
                    </View>
                  </View>

                  {/* Timer */}
                  <View style={styles.timerSection}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isExpiringSoon ? Colors.error : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.timerText,
                        isExpiringSoon && { color: Colors.error },
                      ]}
                    >
                      {isExpiringSoon ? 'Expiring soon: ' : 'Expires in '}
                      <Text style={styles.timerValue}>{timeRemaining}s</Text>
                    </Text>
                  </View>

                  {/* ✅ NEW: Legal Notice for Locked Amount */}
                  {request.lockedContribution && (
                    <View style={styles.legalNotice}>
                      <Text style={styles.legalText}>
                        This contribution amount is locked and cannot be changed
                      </Text>
                    </View>
                  )}

                  {/* Age Restriction Warning */}
                  <View style={styles.ageWarning}>
                    <Ionicons name="alert-circle" size={14} color={Colors.warning} />
                    <Text style={styles.ageWarningText}>
                Children under 16 must be accompanied by an adult. You must refuse unaccompanied minors. Violations result in account suspension or  permanent ban.
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleDecline(request.id)}
                    >
                      <Ionicons name="close" size={20} color={Colors.error} />
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(request.id)}
                    >
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                      <Text style={styles.acceptText}>
                        Accept - CI${contributionAmount?.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    ...Typography.heading3,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.black,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.heading2,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyMessage: {
    ...Typography.body,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  goOnlineButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  goOnlineText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.black,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    ...Typography.caption,
    color: Colors.gray[700],
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  requestCardExpiring: {
    borderWidth: 2,
    borderColor: Colors.error,
  },
  timerBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
  },
  timerFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riderRating: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tripCount: {
    ...Typography.caption,
    color: Colors.gray[600],
  },
  earningsBox: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    ...Typography.heading3,
    fontWeight: '700',
    color: Colors.success,
  },
  earningsLabel: {
    ...Typography.caption,
    color: Colors.gray[600],
  },
  routeSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  routeLine: {
    alignItems: 'center',
    paddingTop: 4,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  routeDashes: {
    width: 2,
    height: 30,
    backgroundColor: Colors.gray[300],
    marginVertical: 4,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.error,
  },
  routeDetails: {
    flex: 1,
    gap: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.body,
    color: Colors.gray[700],
    flex: 1,
  },
  // Zone-based pricing styles
  zoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[50],
  },
  zoneText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.purple || '#5d1289ff',
    flex: 1,
  },
  zoneBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  zoneBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray[700],
    fontSize: 10,
  },
  breakdownCard: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  breakdownTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  breakdownLabel: {
    ...Typography.caption,
    color: Colors.gray[600],
  },
  breakdownValue: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripInfoText: {
    ...Typography.caption,
    color: Colors.gray[600],
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray[50],
    gap: Spacing.xs,
  },
  timerText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  timerValue: {
    fontWeight: '700',
  },
  legalNotice: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.gray[50],
  },
  legalText: {
    fontSize: 10,
    color: Colors.gray[600],
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    gap: Spacing.xs,
  },
  declineText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.error,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    gap: Spacing.xs,
  },
  acceptText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.white,
  },
  ageWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.warning + '15',
    gap: 6,
  },
  ageWarningText: {
    flex: 1,
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '500',
    lineHeight: 15,
  },
  womenOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC4899',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  womenOnlyBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});