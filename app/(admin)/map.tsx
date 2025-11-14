/**
 * LIVE MAP SCREEN
 * Shows active drivers on a real-time map
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
import firestore from '@react-native-firebase/firestore';

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
    const unsubscribe = firestore()
      .collection('drivers')
      .where('isOnline', '==', true)
      .onSnapshot(
        async (snapshot) => {
          try {
            const driversList: ActiveDriver[] = [];

            for (const doc of snapshot.docs) {
              const data = doc.data();

              // Only include drivers with valid location data
              if (data.currentLocation?.lat && data.currentLocation?.lng) {
                let currentTrip = undefined;

                // Check if driver is on a trip
                if (data.currentTripId) {
                  const tripDoc = await firestore()
                    .collection('trips')
                    .doc(data.currentTripId)
                    .get();

                  if (tripDoc.exists) {
                    const tripData = tripDoc.data();
                    currentTrip = {
                      id: tripDoc.id,
                      pickup: tripData?.pickup?.address || 'Unknown',
                      destination: tripData?.destination?.address || 'Unknown',
                    };
                  }
                }

                driversList.push({
                  id: doc.id,
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
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
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Map</Text>
        <View style={styles.statsChip}>
          <Ionicons name="car-sport" size={16} color={Colors.white} />
          <Text style={styles.statsText}>{drivers.length}</Text>
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
                {selectedDriver.vehicle.year || ''} {selectedDriver.vehicle.make}{' '}
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
    backgroundColor: Colors.background,
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
    color: Colors.text,
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
    ...Shadows.small,
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
    ...Shadows.large,
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
    color: Colors.text,
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
    color: Colors.text,
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
    color: Colors.text,
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
    color: Colors.text,
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
