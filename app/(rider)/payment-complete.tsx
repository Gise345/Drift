import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentCompleteScreen() {
  const router = useRouter();

  const tripDetails = {
    id: 'TRIP-2025-001',
    date: 'Oct 25, 2025',
    time: '2:30 PM',
    from: 'George Town',
    to: 'Seven Mile Beach',
    distance: '4.2 km',
    duration: '12 minutes',
    costShare: '$15.00',
    paymentMethod: 'Visa •••• 4242',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color="#FFF" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your contribution has been processed</Text>

        {/* Payment Card */}
        <View style={styles.paymentCard}>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amount}>{tripDetails.costShare}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{tripDetails.paymentMethod}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{tripDetails.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{tripDetails.date} at {tripDetails.time}</Text>
          </View>
        </View>

        {/* Trip Summary */}
        <View style={styles.tripCard}>
          <Text style={styles.cardTitle}>Trip Summary</Text>

          <View style={styles.routeContainer}>
            <View style={styles.routeIcons}>
              <View style={styles.greenDot} />
              <View style={styles.dottedLine} />
              <View style={styles.redSquare} />
            </View>
            <View style={styles.addresses}>
              <Text style={styles.address}>{tripDetails.from}</Text>
              <Text style={styles.address}>{tripDetails.to}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="navigate-outline" size={16} color="#6B7280" />
              <Text style={styles.statText}>{tripDetails.distance}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.statText}>{tripDetails.duration}</Text>
            </View>
          </View>
        </View>

        {/* Receipt Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="mail-outline" size={20} color="#5d1289ff" />
          <Text style={styles.noticeText}>
            A receipt has been sent to your email
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
          <Text style={styles.disclaimerText}>
            This is a cost-sharing contribution for a private carpool ride, not a commercial transaction.
          </Text>
        </View>

        {/* Actions */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {/* Download receipt */}}
          activeOpacity={0.7}
        >
          <Ionicons name="download-outline" size={20} color="#5d1289ff" />
          <Text style={styles.secondaryButtonText}>Download Receipt</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  iconContainer: { alignItems: 'center', paddingVertical: 32 },
  successCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  paymentCard: { backgroundColor: '#FFF', marginHorizontal: 24, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  amountContainer: { alignItems: 'center', paddingBottom: 20 },
  amountLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  amount: { fontSize: 36, fontWeight: '700', color: '#000' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#000' },
  tripCard: { backgroundColor: '#F9FAFB', marginHorizontal: 24, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16 },
  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  routeIcons: { alignItems: 'center', marginRight: 12, width: 20 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginBottom: 4 },
  dottedLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  redSquare: { width: 10, height: 10, backgroundColor: '#EF4444', marginTop: 4 },
  addresses: { flex: 1, justifyContent: 'space-between' },
  address: { fontSize: 15, color: '#000', fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: '#6B7280' },
  noticeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', marginHorizontal: 24, padding: 16, borderRadius: 12, marginBottom: 16 },
  noticeText: { fontSize: 14, color: '#5d1289ff', marginLeft: 12, flex: 1 },
  disclaimer: { flexDirection: 'row', alignItems: 'flex-start', marginHorizontal: 24, padding: 12, marginBottom: 24 },
  disclaimerText: { fontSize: 12, color: '#6B7280', marginLeft: 8, flex: 1, lineHeight: 18 },
  primaryButton: { backgroundColor: '#000', marginHorizontal: 24, paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 12 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 24, paddingVertical: 14, marginBottom: 24 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: '#5d1289ff', marginLeft: 8 },
});