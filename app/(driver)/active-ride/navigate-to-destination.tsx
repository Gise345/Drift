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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function NavigateToDestination() {
  const router = useRouter();
  const { activeRide } = useDriverStore();
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(4.2);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
      setDistance((prev) => Math.max(0, prev - 0.02));
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

  const handleComplete = () => {
    router.push('/(driver)/active-ride/complete-ride');
  };

  const handleAddStop = () => {
    router.push('/(driver)/active-ride/add-stop');
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: activeRide.destination.lat,
          longitude: activeRide.destination.lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
        followsUserLocation
      >
        <Marker
          coordinate={{
            latitude: activeRide.destination.lat,
            longitude: activeRide.destination.lng,
          }}
          title="Destination"
          pinColor={Colors.error}
        />
      </MapView>

      {/* Trip Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{formatTime(elapsed)}</Text>
            <Text style={styles.statusLabel}>Elapsed</Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusValue}>{distance.toFixed(1)} km</Text>
            <Text style={styles.statusLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        {/* Navigation */}
        <View style={styles.navCard}>
          <Ionicons name="arrow-forward" size={24} color={Colors.primary} />
          <View style={styles.navText}>
            <Text style={styles.navMain}>Turn right on Seven Mile Beach Road</Text>
            <Text style={styles.navSub}>in 200 meters</Text>
          </View>
        </View>

        {/* Destination */}
        <View style={styles.destCard}>
          <Ionicons name="location" size={20} color={Colors.error} />
          <View style={styles.destText}>
            <Text style={styles.destLabel}>Destination</Text>
            <Text style={styles.destAddress}>{activeRide.destination.address}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addStopText}>Add Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
            <Text style={styles.completeText}>Complete Ride</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  map: { flex: 1 },
  statusCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  statusRow: { flexDirection: 'row' },
  statusItem: { flex: 1, alignItems: 'center' },
  statusValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  statusDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.lg,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  navText: { flex: 1, marginLeft: Spacing.md },
  navMain: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  navSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  destCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  destText: { flex: 1, marginLeft: Spacing.md },
  destLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  destAddress: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
  },
  actions: { gap: Spacing.md },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  addStopText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
  },
  completeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});