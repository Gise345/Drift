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
              onPress={() => router.push('/(driver)/dashboard/home')}
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

            {sortedRequests.map((request) => {
              const timeRemaining = timers[request.id] || 0;
              const isExpiringSoon = timeRemaining <= 5;

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

                  {/* Header */}
                  <TouchableOpacity
                    style={styles.requestHeader}
                    onPress={() => router.push(`/(driver)/requests/request-detail?id=${request.id}`)}
                  >
                    <View style={styles.riderInfo}>
                      <Ionicons name="person-circle" size={40} color={Colors.primary} />
                      <View style={styles.riderDetails}>
                        <Text style={styles.riderName}>{request.riderName}</Text>
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={14} color={Colors.primary} />
                          <Text style={styles.riderRating}>{request.riderRating}</Text>
                          <Text style={styles.tripCount}>• {(request as any).riderTrips || 0} trips</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.earningsBox}>
                      <Text style={styles.earningsAmount}>
                        CI${request.estimatedEarnings.toFixed(2)}
                      </Text>
                      <Text style={styles.earningsLabel}>Est. earnings</Text>
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
                      <Text style={styles.tripInfoText}>{(request as any).passengers || 1} passengers</Text>
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
                      <Text style={styles.acceptText}>Accept</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  goOnlineButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  goOnlineText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  requestCardExpiring: {
    borderColor: Colors.error,
  },
  timerBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
  },
  timerFill: {
    height: '100%',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  riderInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  riderDetails: {
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  riderName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  riderRating: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  tripCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
  },
  earningsBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  earningsAmount: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 2,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  routeSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  routeLine: {
    width: 20,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  routeDashes: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.gray[300],
    marginVertical: 4,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  routeDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  locationText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  tripInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripInfoText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[50],
  },
  timerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  timerValue: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  declineButton: {
    flex: 1,
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
  declineText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  acceptText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});