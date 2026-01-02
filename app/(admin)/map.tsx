/**
 * LIVE MAP SCREEN
 * Shows active drivers on a real-time map
 *
 * ✅ UPGRADED TO React Native Firebase v22+ Modular API
 * ✅ Using 'main' database (restored from backup)
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, onSnapshot, writeBatch, deleteField, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface ActiveDriver {
  id: string;
  name: string;
  phone: string;
  location: {
    lat: number;
    lng: number;
    heading?: number;
    updatedAt?: Date;
  };
  vehicle: {
    make: string;
    model: string;
    licensePlate: string;
  };
  status: 'available' | 'on_trip' | 'offline';
  currentTrip?: {
    id: string;
    pickup: string;
    destination: string;
  };
}

export default function LiveMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [drivers, setDrivers] = useState<ActiveDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<ActiveDriver | null>(null);

  useEffect(() => {
    // Set up real-time listener for active drivers
    console.log('🗺️ Admin Map: Setting up driver listener...');

    const driversRef = collection(db, 'drivers');
    const onlineDriversQuery = query(driversRef, where('isOnline', '==', true));

    const unsubscribe = onSnapshot(
      onlineDriversQuery,
      async (snapshot) => {
        try {
          console.log(`🗺️ Admin Map: Received ${snapshot.docs.length} online drivers`);

          const driversList: ActiveDriver[] = [];

          for (const driverDoc of snapshot.docs) {
            const data = driverDoc.data();

            console.log(`🗺️ Driver ${driverDoc.id}:`, {
              name: `${data.firstName} ${data.lastName}`,
              isOnline: data.isOnline,
              hasLocation: !!(data.currentLocation?.lat && data.currentLocation?.lng),
              location: data.currentLocation,
            });

            // Only include drivers with valid location data AND recent updates
            // Filter out stale locations (older than 10 minutes)
            const locationUpdatedAt = data.currentLocation?.updatedAt?.toDate?.();
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const isLocationFresh = !locationUpdatedAt || locationUpdatedAt > tenMinutesAgo;

            if (data.currentLocation?.lat && data.currentLocation?.lng && isLocationFresh) {
              let currentTrip = undefined;

              // Check if driver is on a trip
              if (data.currentTripId) {
                const tripDocRef = doc(db, 'trips', data.currentTripId);
                const tripDocSnap = await getDoc(tripDocRef);

                if (tripDocSnap.exists()) {
                  const tripData = tripDocSnap.data();
                  currentTrip = {
                    id: tripDocSnap.id,
                    pickup: tripData?.pickup?.address || 'Unknown',
                    destination: tripData?.destination?.address || 'Unknown',
                  };
                }
              }

              driversList.push({
                id: driverDoc.id,
                name: `${data.firstName} ${data.lastName}`,
                phone: data.phone,
                location: {
                  lat: data.currentLocation.lat,
                  lng: data.currentLocation.lng,
                  heading: data.currentLocation.heading,
                  updatedAt: data.currentLocation.updatedAt?.toDate(),
                },
                vehicle: {
                  make: data.vehicle?.make || 'Unknown',
                  model: data.vehicle?.model || 'Unknown',
                  licensePlate: data.vehicle?.licensePlate || 'Unknown',
                },
                status: currentTrip ? 'on_trip' : 'available',
                currentTrip,
              });
            }
          }

          console.log(`🗺️ Admin Map: Final driver list has ${driversList.length} drivers`);
          setDrivers(driversList);
          setLoading(false);

          // Fit map to show all drivers
          if (driversList.length > 0 && mapRef.current) {
            const coordinates = driversList.map((d) => ({
              latitude: d.location.lat,
              longitude: d.location.lng,
            }));

            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        } catch (error) {
          console.error('❌ Error loading drivers:', error);
        }
      },
      (error) => {
        console.error('❌ Error in drivers listener:', error);
        Alert.alert('Error', 'Failed to load driver locations');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.success;
      case 'on_trip':
        return Colors.primary;
      default:
        return Colors.gray[500];
    }
  };

  const handleMarkerPress = (driver: ActiveDriver) => {
    setSelectedDriver(driver);
  };

  const handleCloseInfo = () => {
    setSelectedDriver(null);
  };

  const handleDebugDrivers = async () => {
    console.log('\n🔍 ===== DEBUG: CHECKING ALL DRIVERS =====');

    try {
      const driversRef = collection(db, 'drivers');

      // Check all drivers
      const allDrivers = await getDocs(driversRef);
      console.log(`📊 Total drivers in database: ${allDrivers.docs.length}`);

      allDrivers.docs.forEach((driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const data = driverDoc.data();
        console.log(`\nDriver: ${data.firstName} ${data.lastName}`);
        console.log(`  ID: ${driverDoc.id}`);
        console.log(`  isOnline: ${data.isOnline}`);
        console.log(`  registrationStatus: ${data.registrationStatus}`);
        console.log(`  currentLocation:`, data.currentLocation);
      });

      // Check specifically for online drivers
      const onlineQuery = query(driversRef, where('isOnline', '==', true));
      const onlineDrivers = await getDocs(onlineQuery);

      console.log(`\n🟢 Online drivers: ${onlineDrivers.docs.length}`);

      if (onlineDrivers.docs.length === 0) {
        Alert.alert(
          'Debug Info',
          `Total drivers: ${allDrivers.docs.length}\nOnline drivers: 0\n\nCheck console for details.`
        );
      } else {
        const onlineDriverNames = onlineDrivers.docs.map((driverDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
          const data = driverDoc.data();
          const hasLocation = !!(data.currentLocation?.lat && data.currentLocation?.lng);
          return `${data.firstName} ${data.lastName} (Location: ${hasLocation ? 'Yes' : 'No'})`;
        }).join('\n');

        Alert.alert(
          'Debug Info',
          `Total drivers: ${allDrivers.docs.length}\nOnline drivers: ${onlineDrivers.docs.length}\n\n${onlineDriverNames}\n\nCheck console for details.`
        );
      }
    } catch (error) {
      console.error('❌ Debug error:', error);
      Alert.alert('Error', 'Failed to debug drivers');
    }
  };

  /**
   * Clear stale driver online status
   * Sets isOnline to false for drivers whose location hasn't been updated in 10+ minutes
   */
  const handleClearStaleDrivers = async () => {
    Alert.alert(
      'Clear Stale Drivers',
      'This will set all drivers with stale locations (10+ minutes old) to offline. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🧹 Clearing stale driver online status...');

              const driversRef = collection(db, 'drivers');
              const onlineQuery = query(driversRef, where('isOnline', '==', true));
              const onlineDrivers = await getDocs(onlineQuery);

              const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
              const batch = writeBatch(db);
              let staleCount = 0;

              for (const driverDoc of onlineDrivers.docs) {
                const data = driverDoc.data();
                const locationUpdatedAt = data.currentLocation?.updatedAt?.toDate?.();

                // If no location timestamp or timestamp is older than 10 minutes
                if (!locationUpdatedAt || locationUpdatedAt < tenMinutesAgo) {
                  batch.update(driverDoc.ref, {
                    isOnline: false,
                    currentLocation: deleteField(),
                  });
                  staleCount++;
                  console.log(`🔴 Marking ${data.firstName} ${data.lastName} as offline (stale location)`);
                }
              }

              if (staleCount > 0) {
                await batch.commit();
                console.log(`✅ Cleared ${staleCount} stale drivers`);
                Alert.alert('Success', `Cleared ${staleCount} drivers with stale locations.`);
              } else {
                Alert.alert('Info', 'No stale drivers found. All online drivers have recent locations.');
              }
            } catch (error) {
              console.error('❌ Error clearing stale drivers:', error);
              Alert.alert('Error', 'Failed to clear stale drivers');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Live Map</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleClearStaleDrivers} style={styles.debugButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.warning} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDebugDrivers} style={styles.debugButton}>
            <Ionicons name="bug" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.statsChip}>
            <Ionicons name="car-sport" size={16} color={Colors.white} />
            <Text style={styles.statsText}>{drivers.length}</Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 19.3133,
          longitude: -81.2546,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {drivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.location.lat,
              longitude: driver.location.lng,
            }}
            onPress={() => handleMarkerPress(driver)}
            rotation={driver.location.heading || 0}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(driver.status) },
                ]}
              >
                <Ionicons name="car" size={20} color={Colors.white} />
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Available ({drivers.filter(d => d.status === 'available').length})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>On Trip ({drivers.filter(d => d.status === 'on_trip').length})</Text>
        </View>
      </View>

      {/* Driver Info Panel */}
      {selectedDriver && (
        <View style={styles.infoPanel}>
          <View style={styles.infoPanelHeader}>
            <View style={styles.driverHeader}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getMarkerColor(selectedDriver.status) },
                ]}
              />
              <View>
                <Text style={styles.driverName}>{selectedDriver.name}</Text>
                <Text style={styles.driverStatus}>
                  {selectedDriver.status === 'on_trip' ? 'On Trip' : 'Available'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleCloseInfo} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoPanelContent}>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={18} color={Colors.gray[600]} />
              <Text style={styles.infoText}>
                {selectedDriver.vehicle.make}{' '}
                {selectedDriver.vehicle.model}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={18} color={Colors.gray[600]} />
              <Text style={styles.infoText}>{selectedDriver.vehicle.licensePlate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={Colors.gray[600]} />
              <Text style={styles.infoText}>{selectedDriver.phone}</Text>
            </View>

            {selectedDriver.currentTrip && (
              <>
                <View style={styles.divider} />
                <Text style={styles.tripLabel}>Current Trip:</Text>
                <View style={styles.routeContainer}>
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {selectedDriver.currentTrip.pickup}
                    </Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {selectedDriver.currentTrip.destination}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {selectedDriver.location.updatedAt && (
              <Text style={styles.updateText}>
                Updated {selectedDriver.location.updatedAt.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Empty State */}
      {drivers.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <View style={styles.emptyCard}>
            <Ionicons name="car-outline" size={48} color={Colors.gray[400]} />
            <Text style={styles.emptyTitle}>No Active Drivers</Text>
            <Text style={styles.emptyText}>
              Online drivers will appear on the map
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  debugButton: {
    padding: Spacing.xs,
  },
  statsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.base,
  },
  legend: {
    position: 'absolute',
    top: 80,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  infoPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  driverName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[900],
  },
  driverStatus: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  infoPanelContent: {
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[700],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.md,
  },
  tripLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[900],
    marginBottom: Spacing.sm,
  },
  routeContainer: {
    marginBottom: Spacing.sm,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.gray[300],
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[900],
    flex: 1,
  },
  updateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  emptyState: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
});
