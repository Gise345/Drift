import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
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

interface VehicleOption {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or image
  maxPassengers: number;
  costEstimate: string;
  costRange: { min: number; max: number };
  eta: string;
  popular?: boolean;
  eco?: boolean;
}

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const { route, setVehicleType, setEstimatedCost, destination } = useCarpoolStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  // Load vehicle options based on route
  useEffect(() => {
    loadVehicleOptions();
  }, [route]);

  const loadVehicleOptions = () => {
    // Calculate base cost from route distance (mock calculation)
    // In real app, this would come from your pricing algorithm
    const distanceKm = route?.distance ? route.distance / 1000 : 5;
    const baseCost = Math.round(distanceKm * 2.5); // $2.50/km base rate
    
    const options: VehicleOption[] = [
      {
        id: 'economy',
        name: 'Drift Economy',
        description: 'Share with up to 3 riders',
        icon: '🚗',
        maxPassengers: 3,
        costEstimate: `$${baseCost - 3}-${baseCost} CI`,
        costRange: { min: baseCost - 3, max: baseCost },
        eta: '5-8 min',
        eco: true,
      },
      {
        id: 'standard',
        name: 'Drift Standard',
        description: 'Comfortable ride, 2 riders max',
        icon: '🚙',
        maxPassengers: 2,
        costEstimate: `$${baseCost + 2}-${baseCost + 5} CI`,
        costRange: { min: baseCost + 2, max: baseCost + 5 },
        eta: '3-5 min',
        popular: true,
      },
      {
        id: 'comfort',
        name: 'Drift Comfort',
        description: 'Premium vehicle, extra space',
        icon: '🚐',
        maxPassengers: 2,
        costEstimate: `$${baseCost + 5}-${baseCost + 10} CI`,
        costRange: { min: baseCost + 5, max: baseCost + 10 },
        eta: '5-7 min',
      },
      {
        id: 'xl',
        name: 'Drift XL',
        description: 'For groups up to 5 riders',
        icon: '🚌',
        maxPassengers: 5,
        costEstimate: `$${baseCost + 8}-${baseCost + 15} CI`,
        costRange: { min: baseCost + 8, max: baseCost + 15 },
        eta: '8-10 min',
      },
    ];

    setVehicles(options);
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleConfirmVehicle = async () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicle);
    if (!vehicle) return;

    setLoading(true);

    try {
      // Save vehicle selection to store
      setVehicleType(vehicle.id);
      setEstimatedCost({
        min: vehicle.costRange.min,
        max: vehicle.costRange.max,
        currency: 'KYD',
      });

      // Simulate API call to find available drivers
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to payment selection or finding driver
      router.push('/(rider)/select-payment');
    } catch (error) {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  // Format route info
  const formatDistance = () => {
    if (!route?.distance) return '';
    const km = route.distance / 1000;
    return km < 1 ? `${route.distance}m` : `${km.toFixed(1)}km`;
  };

  const formatDuration = () => {
    if (!route?.duration) return '';
    const minutes = Math.round(route.duration / 60);
    return `${minutes} min`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Choose Carpool Type</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Route Summary Card */}
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTitle}>Your Route</Text>
              {route && (
                <Text style={styles.routeInfo}>
                  {formatDistance()} • {formatDuration()}
                </Text>
              )}
            </View>
            
            <View style={styles.routeDetails}>
              {/* Pickup */}
              <View style={styles.routePoint}>
                <View style={styles.routeDot} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {route?.origin?.address || 'Current Location'}
                </Text>
              </View>
              
              <View style={styles.routeLine} />
              
              {/* Destination */}
              <View style={styles.routePoint}>
                <Text style={styles.routeIcon}>📍</Text>
                <Text style={styles.routeText} numberOfLines={1}>
                  {route?.destination?.address || destination?.address || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          {/* Vehicle Options */}
          <View style={styles.vehiclesSection}>
            <Text style={styles.sectionTitle}>Available Carpool Options</Text>
            
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  selectedVehicle === vehicle.id && styles.vehicleCardSelected,
                ]}
                onPress={() => handleVehicleSelect(vehicle.id)}
                activeOpacity={0.7}
              >
                {/* Badge */}
                {vehicle.popular && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>POPULAR</Text>
                  </View>
                )}
                {vehicle.eco && (
                  <View style={[styles.badge, styles.badgeEco]}>
                    <Text style={styles.badgeText}>ECO</Text>
                  </View>
                )}

                <View style={styles.vehicleContent}>
                  {/* Vehicle Icon */}
                  <View style={styles.vehicleIconContainer}>
                    <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                  </View>

                  {/* Vehicle Info */}
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleDescription}>
                      {vehicle.description}
                    </Text>
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleEta}>🕐 {vehicle.eta}</Text>
                      <Text style={styles.vehiclePassengers}>
                        👤 {vehicle.maxPassengers} max
                      </Text>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={styles.vehiclePriceContainer}>
                    <Text style={styles.vehiclePrice}>{vehicle.costEstimate}</Text>
                  </View>
                </View>

                {/* Selection Indicator */}
                {selectedVehicle === vehicle.id && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              ⚖️ <Text style={styles.legalBold}>Drift is a coordination platform.</Text>
              {' '}All rides are private arrangements between users. Cost estimates are for shared expenses only.
            </Text>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          {selectedVehicleData && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selectedVehicleData.name}</Text>
              <Text style={styles.selectedPrice}>{selectedVehicleData.costEstimate}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirmVehicle}
            disabled={loading || !selectedVehicle}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Continue</Text>
                <Text style={styles.confirmButtonArrow}>→</Text>
              </>
            )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  routeCard: {
    backgroundColor: Colors.gray[50],
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.black,
  },
  routeInfo: {
    fontSize: 13,
    color: Colors.gray[600],
  },
  routeDetails: {
    marginTop: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginRight: 12,
  },
  routeIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.gray[300],
    marginLeft: 4,
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.gray[700],
  },
  vehiclesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.gray[50],
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.purple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  badgeEco: {
    backgroundColor: Colors.success,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: Colors.gray[100],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleIcon: {
    fontSize: 32,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  vehicleDescription: {
    fontSize: 13,
    color: Colors.gray[600],
    marginBottom: 6,
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleEta: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  vehiclePassengers: {
    fontSize: 12,
    color: Colors.gray[500],
  },
  vehiclePriceContainer: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.black,
  },
  legalNotice: {
    marginHorizontal: 16,
    marginTop: 16,
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
  legalBold: {
    fontWeight: '700',
    color: Colors.purple,
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
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  selectedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  confirmButtonArrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});