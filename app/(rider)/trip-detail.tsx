import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function TripDetailScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();

  const trip = {
    id: tripId || 'TRIP-001',
    status: 'completed',
    date: 'Oct 24, 2025',
    time: '2:15 PM',
    from: { name: 'George Town', coords: { latitude: 19.2866, longitude: -81.3744 } },
    to: { name: 'Seven Mile Beach', coords: { latitude: 19.3133, longitude: -81.2546 } },
    distance: '4.2 km',
    duration: '12 minutes',
    costShare: '$15.00',
    driver: {
      name: 'John Smith',
      photo: 'https://i.pravatar.cc/150?img=12',
      rating: 4.9,
      vehicle: 'Silver Toyota Camry',
      plate: 'CI 1234',
    },
    rating: 5,
    paymentMethod: 'Visa •••• 4242',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: (trip.from.coords.latitude + trip.to.coords.latitude) / 2,
              longitude: (trip.from.coords.longitude + trip.to.coords.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker coordinate={trip.from.coords} title="Pickup" />
            <Marker coordinate={trip.to.coords} title="Destination" />
            <Polyline
              coordinates={[trip.from.coords, trip.to.coords]}
              strokeColor="#5d1289ff"
              strokeWidth={3}
            />
          </MapView>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Completed</Text>
          </View>
        </View>

        {/* Trip Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoTitle}>Trip Information</Text>
            <Text style={styles.tripId}>{trip.id}</Text>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.dateText}>{trip.date} at {trip.time}</Text>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <View style={styles.greenDot} />
              <View style={styles.dottedLine} />
              <View style={styles.redSquare} />
            </View>
            <View style={styles.addresses}>
              <View style={styles.addressRow}>
                <Text style={styles.address}>{trip.from.name}</Text>
              </View>
              <View style={styles.addressRow}>
                <Text style={styles.address}>{trip.to.name}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Ionicons name="navigate-outline" size={18} color="#5d1289ff" />
              <Text style={styles.statValue}>{trip.distance}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="time-outline" size={18} color="#5d1289ff" />
              <Text style={styles.statValue}>{trip.duration}</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="cash-outline" size={18} color="#5d1289ff" />
              <Text style={styles.statValue}>{trip.costShare}</Text>
            </View>
          </View>
        </View>

        {/* Driver Info */}
        <View style={styles.driverCard}>
          <Text style={styles.cardTitle}>Driver</Text>
          <View style={styles.driverRow}>
            <Image source={{ uri: trip.driver.photo }} style={styles.driverPhoto} />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{trip.driver.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{trip.driver.rating}</Text>
              </View>
              <Text style={styles.vehicleText}>{trip.driver.vehicle} • {trip.driver.plate}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Cost Share</Text>
            <Text style={styles.paymentValue}>{trip.costShare}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>{trip.paymentMethod}</Text>
          </View>
          {trip.rating && (
            <View style={styles.ratingSection}>
              <Text style={styles.paymentLabel}>Your Rating</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    // @ts-expect-error - key prop is valid in React but TS defs don't reflect this
                    key={star}
                    name={star <= trip.rating! ? "star" : "star-outline"}
                    size={20}
                    color="#F59E0B"
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="download-outline" size={20} color="#5d1289ff" />
            <Text style={styles.actionText}>Download Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  shareButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  mapContainer: { height: 200, position: 'relative' },
  map: { flex: 1 },
  statusBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  infoCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  tripId: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateText: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  routeIcons: { alignItems: 'center', marginRight: 12, width: 20 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginBottom: 4 },
  dottedLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  redSquare: { width: 10, height: 10, backgroundColor: '#EF4444', marginTop: 4 },
  addresses: { flex: 1, justifyContent: 'space-between' },
  addressRow: { paddingVertical: 4 },
  address: { fontSize: 15, color: '#000', fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, gap: 6 },
  statValue: { fontSize: 13, fontWeight: '600', color: '#000' },
  driverCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverPhoto: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 14, fontWeight: '500', color: '#000', marginLeft: 4 },
  vehicleText: { fontSize: 13, color: '#6B7280' },
  paymentCard: { backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  paymentLabel: { fontSize: 14, color: '#6B7280' },
  paymentValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  ratingSection: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 8 },
  stars: { flexDirection: 'row', gap: 4, marginTop: 8 },
  actions: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 24, gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#5d1289ff' },
});