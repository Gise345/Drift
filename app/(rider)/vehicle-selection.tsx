/**
 * Drift Vehicle Selection Screen
 * Figma: 16_Selected_ride.png
 * 
 * Choose carpool type with cost estimates
 * Built for Expo SDK 52
 */

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
import { DriftButton, ArrowRight } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing, BorderRadius } from '@/src/constants/theme';
import { useCarpoolStore } from '@/src/stores/carpool-store';

interface VehicleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxPassengers: number;
  costEstimate: string;
  costRange: {
    min: number;
    max: number;
  };
  eta: string;
  popular?: boolean;
  eco?: boolean;
}

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const { route, setVehicleType, setEstimatedCost } = useCarpoolStore();
  
  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);

  // Load vehicle options
  useEffect(() => {
    loadVehicleOptions();
  }, []);

  const loadVehicleOptions = () => {
    // Calculate base cost from route distance (mock calculation)
    const baseCost = route?.distance ? Math.round(route.distance * 0.001 * 3) : 10;
    
    const options: VehicleOption[] = [
      {
        id: 'economy',
        name: 'Drift Economy',
        description: 'Share with up to 3 riders',
        icon: '🚗',
        maxPassengers: 3,
        costEstimate: `$${baseCost - 2}-${baseCost} CI`,
        costRange: { min: baseCost - 2, max: baseCost },
        eta: '5-8 min',
        eco: true,
      },
      {
        id: 'standard',
        name: 'Drift Standard',
        description: 'Comfortable ride, 2 riders max',
        icon: '🚙',
        maxPassengers: 2,
        costEstimate: `$${baseCost}-${baseCost + 3} CI`,
        costRange: { min: baseCost, max: baseCost + 3 },
        eta: '3-5 min',
        popular: true,
      },
      {
        id: 'comfort',
        name: 'Drift Comfort',
        description: 'Premium vehicle, extra space',
        icon: '🚐',
        maxPassengers: 2,
        costEstimate: `$${baseCost + 3}-${baseCost + 6} CI`,
        costRange: { min: baseCost + 3, max: baseCost + 6 },
        eta: '5-7 min',
      },
      {
        id: 'xl',
        name: 'Drift XL',
        description: 'For groups up to 5 riders',
        icon: '🚌',
        maxPassengers: 5,
        costEstimate: `$${baseCost + 5}-${baseCost + 10} CI`,
        costRange: { min: baseCost + 5, max: baseCost + 10 },
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
      // Save vehicle selection
      setVehicleType(vehicle.id);
      setEstimatedCost({
        min: vehicle.costRange.min,
        max: vehicle.costRange.max,
        currency: 'KYD',
      });

      // Simulate finding drivers
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to driver matching
      router.push('/(rider)/finding-driver');
    } catch (error) {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

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
          {/* Route Summary */}
          <View style={styles.routeSummary}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <Text style={styles.routeText} numberOfLines={1}>
                Current Location
              </Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routePoint}>
              <Text style={styles.routeIcon}>📍</Text>
              <Text style={styles.routeText} numberOfLines={1}>
                {route?.destination?.address || 'Destination'}
              </Text>
            </View>
          </View>

          {/* Vehicle Options */}
          <View style={styles.vehiclesContainer}>
            <Text style={styles.sectionTitle}>AVAILABLE CARPOOLS</Text>
            
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
                <View style={styles.vehicleLeft}>
                  <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                  <View style={styles.vehicleInfo}>
                    <View style={styles.vehicleNameRow}>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      {vehicle.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      )}
                      {vehicle.eco && (
                        <View style={styles.ecoBadge}>
                          <Text style={styles.ecoText}>🌱 ECO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.vehicleDescription}>
                      {vehicle.description}
                    </Text>
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleEta}>
                        🕐 {vehicle.eta}
                      </Text>
                      <Text style={styles.vehicleSeats}>
                        👥 {vehicle.maxPassengers} seats
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.vehicleRight}>
                  <Text style={styles.vehicleCost}>{vehicle.costEstimate}</Text>
                  <View style={styles.radioButton}>
                    {selectedVehicle === vehicle.id && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cost Breakdown */}
          {selectedVehicleData && (
            <View style={styles.costBreakdown}>
              <Text style={styles.costTitle}>Cost Contribution Breakdown</Text>
              <View style={styles.costItem}>
                <Text style={styles.costLabel}>Base contribution</Text>
                <Text style={styles.costValue}>
                  ${selectedVehicleData.costRange.min} CI
                </Text>
              </View>
              <View style={styles.costItem}>
                <Text style={styles.costLabel}>Peak time adjustment</Text>
                <Text style={styles.costValue}>
                  +${selectedVehicleData.costRange.max - selectedVehicleData.costRange.min} CI
                </Text>
              </View>
              <View style={styles.costDivider} />
              <View style={styles.costItem}>
                <Text style={styles.costTotalLabel}>Total estimate</Text>
                <Text style={styles.costTotalValue}>
                  {selectedVehicleData.costEstimate}
                </Text>
              </View>
            </View>
          )}

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>💳</Text>
              <Text style={styles.infoText}>
                Digital cost-sharing via Drift Wallet
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🚗</Text>
              <Text style={styles.infoText}>
                Private arrangement between users
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>✅</Text>
              <Text style={styles.infoText}>
                All drivers verified & insured
              </Text>
            </View>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              <Text style={styles.legalBold}>Peer-to-Peer Platform:</Text>{' '}
              Drift facilitates private carpooling between independent users.
              Cost contributions are voluntary and go directly to drivers to
              share travel expenses. We are not a taxi or rideshare service.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <DriftButton
            title={loading ? 'Finding Drivers...' : 'Request Carpool'}
            onPress={handleConfirmVehicle}
            variant="black"
            size="large"
            icon={!loading && <ArrowRight />}
            loading={loading}
            disabled={!selectedVehicle}
          />
          
          {selectedVehicleData && (
            <Text style={styles.etaText}>
              Estimated pickup in {selectedVehicleData.eta}
            </Text>
          )}
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

  // Header
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
    width: 40,
  },

  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },

  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
  },

  headerSpacer: {
    width: 40,
  },

  // Content
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Route Summary
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },

  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },

  routeIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },

  routeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    flex: 1,
  },

  routeLine: {
    width: 20,
    height: 1,
    backgroundColor: Colors.gray[400],
    marginHorizontal: Spacing.xs,
  },

  // Vehicles
  vehiclesContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.gray[500],
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  vehicleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },

  vehicleLeft: {
    flexDirection: 'row',
    flex: 1,
  },

  vehicleIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  vehicleName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
    marginRight: Spacing.sm,
  },

  popularBadge: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },

  popularText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '700',
  },

  ecoBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  ecoText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '700',
  },

  vehicleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: 4,
  },

  vehicleDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  vehicleEta: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },

  vehicleSeats: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
  },

  vehicleRight: {
    alignItems: 'flex-end',
  },

  vehicleCost: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },

  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  // Cost Breakdown
  costBreakdown: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  costTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.gray[700],
    marginBottom: Spacing.md,
  },

  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },

  costLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },

  costValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[800],
  },

  costDivider: {
    height: 1,
    backgroundColor: Colors.gray[300],
    marginVertical: Spacing.sm,
  },

  costTotalLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.black,
  },

  costTotalValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Info Cards
  infoCards: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  infoIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },

  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
  },

  // Legal Notice
  legalNotice: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.purple + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  legalText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    lineHeight: 16,
  },

  legalBold: {
    fontWeight: '700',
    color: Colors.gray[800],
  },

  // Bottom Action
  bottomAction: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.white,
  },

  etaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});