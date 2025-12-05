import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCarpoolStore } from '@/src/stores/carpool-store';
import { useAuthStore } from '@/src/stores/auth-store';
import { calculateTripPricing } from '@/src/utils/pricing/drift-pricing-engine';
import { detectZone } from '@/src/utils/pricing/drift-zone-utils';
import type { PricingResult } from '@/src/stores/carpool-store';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

// KYD to USD conversion rate (fixed rate for Cayman Islands)
const KYD_TO_USD_RATE = 1.20; // 1 KYD = 1.20 USD approximately

interface VehicleOption {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  maxPassengers: number;
  multiplier: number; // Price multiplier based on vehicle type
  eta: string;
  popular?: boolean;
  eco?: boolean;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'standard',
    name: 'Drift Standard',
    description: 'Standard car, up to 4 riders',
    icon: 'car-sport-outline',
    maxPassengers: 4,
    multiplier: 1.0, // Base price
    eta: '3-5 min',
    popular: true,
  },
  {
    id: 'xl',
    name: 'Drift XL',
    description: 'Larger vehicle, up to 6 riders',
    icon: 'car',
    maxPassengers: 6,
    multiplier: 1.25, // 25% more
    eta: '5-8 min',
  },
  {
    id: 'van',
    name: 'Drift Van',
    description: 'Spacious van, up to 8 riders',
    icon: 'bus-outline',
    maxPassengers: 8,
    multiplier: 1.5, // 50% more
    eta: '8-12 min',
  },
];

export default function VehicleSelectionScreen() {
  const router = useRouter();
  const {
    route,
    pickupLocation,
    destination,
    setVehicleType,
    setEstimatedCost,
    setPricing,
    setZoneInfo,
    lockContribution,
    pricing,
    isPricingCalculating,
    setPricingCalculating,
    womenOnlyRide,
    setWomenOnlyRide,
  } = useCarpoolStore();
  const { user } = useAuthStore();

  // Debug: Log user gender for women-only feature
  console.log('👤 Vehicle Selection - User gender:', user?.gender, 'Show women-only:', user?.gender === 'female');

  const [selectedVehicle, setSelectedVehicle] = useState<string>('standard');
  const [loading, setLoading] = useState(false);

  // Calculate zone-based pricing when route is available
  useEffect(() => {
    if (route && pickupLocation && destination) {
      calculateZoneBasedPricing();
    }
  }, [route, pickupLocation, destination]);

  const calculateZoneBasedPricing = async () => {
    try {
      setPricingCalculating(true);

      console.log('🔍 Detecting zones for:');
      console.log('  Pickup:', pickupLocation!.latitude, pickupLocation!.longitude);
      console.log('  Destination:', destination!.latitude, destination!.longitude);

      // Detect zones
      const pickupZone = detectZone(
        pickupLocation!.latitude,
        pickupLocation!.longitude
      );
      const destZone = detectZone(
        destination!.latitude,
        destination!.longitude
      );

      console.log('📍 Zone detection results:');
      console.log('  Pickup zone:', pickupZone?.displayName || 'NULL - NOT IN ANY ZONE');
      console.log('  Destination zone:', destZone?.displayName || 'NULL - NOT IN ANY ZONE');

      if (!pickupZone || !destZone) {
        console.error('❌ Zone detection failed!');
        Alert.alert(
          'Service Area',
          `Pickup or destination is outside our service area (Grand Cayman).\n\nPickup: ${pickupZone ? 'OK' : 'OUTSIDE'}\nDestination: ${destZone ? 'OK' : 'OUTSIDE'}`
        );
        setPricingCalculating(false);
        return;
      }

      // Calculate pricing
      const pricingResult = calculateTripPricing({
        pickupLat: pickupLocation!.latitude,
        pickupLng: pickupLocation!.longitude,
        destinationLat: destination!.latitude,
        destinationLng: destination!.longitude,
        distanceMiles: (route!.distance / 1000) * 0.621371,
        durationMinutes: Math.ceil(route!.duration / 60),
        requestTime: new Date(),
      });

      // Store in Zustand
      setPricing(pricingResult);
      setZoneInfo({
        pickupZone: {
          id: pickupZone.id,
          name: pickupZone.name,
          displayName: pickupZone.displayName,
        },
        destinationZone: {
          id: destZone.id,
          name: destZone.name,
          displayName: destZone.displayName,
        },
      });

      console.log('✅ Pricing calculated:', pricingResult);

    } catch (error) {
      console.error('❌ Pricing error:', error);
      Alert.alert('Error', 'Unable to calculate cost contribution');
    } finally {
      setPricingCalculating(false);
    }
  };

  // Get adjusted price based on vehicle multiplier
  const getVehiclePrice = (multiplier: number): number => {
    if (!pricing) return 0;
    return Math.round(pricing.suggestedContribution * multiplier * 100) / 100;
  };

  // Format KYD price
  const formatKYD = (amount: number): string => {
    return `$${amount.toFixed(2)} KYD`;
  };

  // Get USD equivalent
  const getUSDEquivalent = (kydAmount: number): string => {
    const usd = kydAmount * KYD_TO_USD_RATE;
    return `≈ $${usd.toFixed(2)} USD`;
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleConfirmVehicle = async () => {
    if (!pricing) {
      Alert.alert('Error', 'Cost contribution not yet calculated');
      return;
    }

    const vehicle = VEHICLE_OPTIONS.find(v => v.id === selectedVehicle);
    if (!vehicle) return;

    setLoading(true);

    try {
      const finalPrice = getVehiclePrice(vehicle.multiplier);

      // Save vehicle selection to store
      setVehicleType(vehicle.id);
      setEstimatedCost({
        min: finalPrice * 0.9, // 10% less for range
        max: finalPrice,
        currency: 'KYD',
      });

      // 🔒 LOCK THE CONTRIBUTION AMOUNT (adjusted for vehicle type)
      lockContribution(finalPrice);

      console.log('🔒 Contribution locked:', finalPrice, 'KYD');

      // Navigate to payment selection
      router.push('/(rider)/select-payment');
    } catch (error) {
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleData = VEHICLE_OPTIONS.find(v => v.id === selectedVehicle);
  const finalPrice = selectedVehicleData ? getVehiclePrice(selectedVehicleData.multiplier) : 0;

  // Format route info
  const formatDistance = () => {
    if (!route?.distance) return '';
    const km = route.distance / 1000;
    return km < 1 ? `${route.distance}m` : `${km.toFixed(1)} km`;
  };

  const formatDuration = () => {
    if (!route?.duration) return '';
    const minutes = Math.round(route.duration / 60);
    return `${minutes} min`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[Colors.purple, Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.title}>Choose Your Ride</Text>

          <View style={styles.headerSpacer} />
        </LinearGradient>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Route Summary Card */}
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <View style={styles.routeTitleRow}>
                <Ionicons name="navigate" size={18} color={Colors.primary} />
                <Text style={styles.routeTitle}>Your Route</Text>
              </View>
              {route && (
                <View style={styles.routeStats}>
                  <Text style={styles.routeInfo}>{formatDistance()}</Text>
                  <View style={styles.routeDivider} />
                  <Text style={styles.routeInfo}>{formatDuration()}</Text>
                </View>
              )}
            </View>

            <View style={styles.routeDetails}>
              {/* Pickup */}
              <View style={styles.routePoint}>
                <View style={styles.routeDotGreen} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {route?.origin?.address || pickupLocation?.address || 'Current Location'}
                </Text>
              </View>

              <View style={styles.routeLineContainer}>
                <View style={styles.routeLine} />
              </View>

              {/* Destination */}
              <View style={styles.routePoint}>
                <View style={styles.routeDotPurple} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {route?.destination?.address || destination?.address || 'Destination'}
                </Text>
              </View>
            </View>
          </View>

          {/* Pricing Card */}
          {isPricingCalculating ? (
            <View style={styles.pricingCard}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.pricingLoadingText}>Calculating your contribution...</Text>
            </View>
          ) : pricing ? (
            <View style={styles.pricingCard}>
              {/* Zone Route */}
              <Text style={styles.zoneRouteText}>{pricing.displayText}</Text>

              {/* Pricing Type Badge */}
              <View style={[
                styles.pricingTypeBadge,
                pricing.isAirportTrip && styles.pricingTypeBadgeAirport
              ]}>
                {pricing.isWithinZone ? (
                  <Text style={styles.pricingTypeText}>Within-zone flat rate</Text>
                ) : pricing.isAirportTrip ? (
                  <>
                    <Ionicons name="airplane" size={12} color={Colors.info} />
                    <Text style={[styles.pricingTypeText, { color: Colors.info }]}>Airport fixed rate</Text>
                  </>
                ) : (
                  <Text style={styles.pricingTypeText}>Cross-zone contribution</Text>
                )}
              </View>

              {/* Main Price Display */}
              <View style={styles.mainPriceContainer}>
                <Text style={styles.mainPriceLabel}>Your Contribution</Text>
                <Text style={styles.mainPrice}>{formatKYD(finalPrice)}</Text>
                <Text style={styles.usdEquivalent}>{getUSDEquivalent(finalPrice)}</Text>
              </View>

              {/* Price Range */}
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeText}>
                  Base range: {formatKYD(pricing.minContribution)} - {formatKYD(pricing.maxContribution)}
                </Text>
              </View>

              {/* Breakdown for cross-zone trips */}
              {!pricing.isWithinZone && !pricing.isAirportTrip && (
                <View style={styles.breakdownContainer}>
                  <Text style={styles.breakdownTitle}>Cost Breakdown</Text>
                  {pricing.breakdown.baseZoneFee !== undefined && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Base zone exit</Text>
                      <Text style={styles.breakdownValue}>{formatKYD(pricing.breakdown.baseZoneFee)}</Text>
                    </View>
                  )}
                  {pricing.breakdown.distanceCost !== undefined && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Distance</Text>
                      <Text style={styles.breakdownValue}>{formatKYD(pricing.breakdown.distanceCost)}</Text>
                    </View>
                  )}
                  {pricing.breakdown.timeCost !== undefined && (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Time</Text>
                      <Text style={styles.breakdownValue}>{formatKYD(pricing.breakdown.timeCost)}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : null}

          {/* Vehicle Options */}
          <View style={styles.vehiclesSection}>
            <Text style={styles.sectionTitle}>Select Carpool Type</Text>

            {VEHICLE_OPTIONS.map((vehicle) => {
              const vehiclePrice = getVehiclePrice(vehicle.multiplier);
              const isSelected = selectedVehicle === vehicle.id;

              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    isSelected && styles.vehicleCardSelected,
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
                      <Ionicons name="leaf" size={10} color={Colors.white} />
                      <Text style={styles.badgeText}> ECO</Text>
                    </View>
                  )}

                  <View style={styles.vehicleContent}>
                    {/* Selection Indicator */}
                    <View style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected
                    ]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    {/* Vehicle Icon */}
                    <View style={[
                      styles.vehicleIconContainer,
                      isSelected && styles.vehicleIconContainerSelected
                    ]}>
                      <Ionicons
                        name={vehicle.icon}
                        size={28}
                        color={isSelected ? Colors.white : Colors.primary}
                      />
                    </View>

                    {/* Vehicle Info */}
                    <View style={styles.vehicleInfo}>
                      <Text style={[
                        styles.vehicleName,
                        isSelected && styles.vehicleNameSelected
                      ]}>
                        {vehicle.name}
                      </Text>
                      <Text style={styles.vehicleDescription}>
                        {vehicle.description}
                      </Text>
                      <View style={styles.vehicleDetails}>
                        <View style={styles.vehicleDetailItem}>
                          <Ionicons name="time-outline" size={12} color={Colors.gray[500]} />
                          <Text style={styles.vehicleDetailText}>{vehicle.eta}</Text>
                        </View>
                        <View style={styles.vehicleDetailItem}>
                          <Ionicons name="people-outline" size={12} color={Colors.gray[500]} />
                          <Text style={styles.vehicleDetailText}>{vehicle.maxPassengers} max</Text>
                        </View>
                      </View>
                    </View>

                    {/* Price */}
                    <View style={styles.vehiclePriceContainer}>
                      <Text style={[
                        styles.vehiclePrice,
                        isSelected && styles.vehiclePriceSelected
                      ]}>
                        {pricing ? formatKYD(vehiclePrice) : '--'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Women-Only Ride Option - Only show for female users */}
          {user?.gender === 'female' && (
            <View style={styles.womenOnlySection}>
              <View style={styles.womenOnlyHeader}>
                <View style={styles.womenOnlyTitleRow}>
                  <View style={styles.womenOnlyIconCircle}>
                    <Ionicons name="shield-checkmark" size={20} color="#EC4899" />
                  </View>
                  <View style={styles.womenOnlyTextContainer}>
                    <Text style={styles.womenOnlyTitle}>Women-Only Driver</Text>
                    <Text style={styles.womenOnlyDescription}>
                      Request a female driver for your ride
                    </Text>
                  </View>
                </View>
                <Switch
                  value={womenOnlyRide}
                  onValueChange={setWomenOnlyRide}
                  trackColor={{ false: Colors.gray[300], true: '#EC4899' + '60' }}
                  thumbColor={womenOnlyRide ? '#EC4899' : Colors.gray[100]}
                  ios_backgroundColor={Colors.gray[300]}
                />
              </View>
              {womenOnlyRide && (
                <View style={styles.womenOnlyNote}>
                  <Ionicons name="information-circle" size={14} color="#EC4899" />
                  <Text style={styles.womenOnlyNoteText}>
                    Only female drivers will see your ride request. Wait times may be longer.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Currency Notice */}
          <View style={styles.currencyNotice}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={styles.currencyNoticeText}>
              All prices shown in <Text style={styles.currencyBold}>KYD (Cayman Islands Dollar)</Text>.
              Payment will be processed in USD at the current exchange rate.
            </Text>
          </View>

          {/* Legal Notice */}
          <View style={styles.legalNotice}>
            <Text style={styles.legalText}>
              <Text style={styles.legalBold}>Drift is a coordination platform.</Text>
              {' '}All rides are private arrangements between users. Cost estimates are for shared expenses only and are locked at request time.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Confirm Section */}
        <View style={styles.bottomContainer}>
          {selectedVehicleData && pricing && (
            <View style={styles.selectedSummary}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>{selectedVehicleData.name}</Text>
                <Text style={styles.selectedEta}>{selectedVehicleData.eta}</Text>
              </View>
              <View style={styles.selectedPriceContainer}>
                <Text style={styles.selectedPrice}>{formatKYD(finalPrice)}</Text>
                <Text style={styles.selectedUsd}>{getUSDEquivalent(finalPrice)}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, (!pricing || loading) && styles.confirmButtonDisabled]}
            onPress={handleConfirmVehicle}
            disabled={!pricing || loading}
          >
            <LinearGradient
              colors={(!pricing || loading) ? [Colors.gray[300], Colors.gray[400]] : [Colors.purple, Colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>
                    Continue to Payment
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  routeCard: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  routeTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  routeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfo: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
  },
  routeDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[400],
    marginHorizontal: Spacing.sm,
  },
  routeDetails: {
    marginTop: Spacing.sm,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  routeDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
  },
  routeDotPurple: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  routeLineContainer: {
    paddingLeft: 5,
    height: 24,
  },
  routeLine: {
    width: 2,
    height: '100%',
    backgroundColor: Colors.gray[300],
  },
  routeText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
  },
  pricingCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  pricingLoadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  zoneRouteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.purple,
    marginBottom: Spacing.sm,
  },
  pricingTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  pricingTypeBadgeAirport: {
    backgroundColor: Colors.infoLight,
  },
  pricingTypeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
  },
  mainPriceContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
    marginBottom: Spacing.md,
  },
  mainPriceLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  mainPrice: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  usdEquivalent: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
  },
  priceRangeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceRangeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  breakdownContainer: {
    backgroundColor: Colors.gray[50],
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  breakdownTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  breakdownValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  vehiclesSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
    ...Shadows.sm,
  },
  vehicleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '15',
  },
  badge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  badgeEco: {
    backgroundColor: Colors.success,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  vehicleIconContainer: {
    width: 52,
    height: 52,
    backgroundColor: Colors.primaryLight + '30',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  vehicleIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: 2,
  },
  vehicleNameSelected: {
    color: Colors.purple,
  },
  vehicleDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  vehicleDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  vehicleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  vehicleDetailText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  vehiclePriceContainer: {
    alignItems: 'flex-end',
  },
  vehiclePrice: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  vehiclePriceSelected: {
    color: Colors.purple,
  },
  currencyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  currencyNoticeText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.info,
    lineHeight: 18,
  },
  currencyBold: {
    fontFamily: Typography.fontFamily.bold,
  },
  legalNotice: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.purple,
  },
  legalText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    lineHeight: 18,
  },
  legalBold: {
    fontFamily: Typography.fontFamily.bold,
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
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  selectedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  selectedInfo: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  selectedEta: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  selectedPriceContainer: {
    alignItems: 'flex-end',
  },
  selectedPrice: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.purple,
  },
  selectedUsd: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  confirmButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  // Women-Only Section Styles
  womenOnlySection: {
    backgroundColor: '#FDF2F8',
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  womenOnlyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  womenOnlyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  womenOnlyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FBCFE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  womenOnlyTextContainer: {
    flex: 1,
  },
  womenOnlyTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: '#BE185D',
    marginBottom: 2,
  },
  womenOnlyDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: '#9D174D',
  },
  womenOnlyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#FBCFE8',
    gap: Spacing.xs,
  },
  womenOnlyNoteText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: '#9D174D',
    lineHeight: 16,
  },
});
