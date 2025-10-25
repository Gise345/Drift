import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Tab = 'upcoming' | 'past';

interface Trip {
  id: string;
  date: string;
  time: string;
  from: string;
  to: string;
  driver: string;
  cost: string;
  status: 'completed' | 'upcoming' | 'cancelled';
  rating?: number;
}

const MOCK_TRIPS: { upcoming: Trip[]; past: Trip[] } = {
  upcoming: [
    {
      id: '1',
      date: 'Oct 26, 2025',
      time: '09:00 AM',
      from: 'George Town',
      to: 'Seven Mile Beach',
      driver: 'John Smith',
      cost: '$15.00',
      status: 'upcoming',
    },
    {
      id: '2',
      date: 'Oct 27, 2025',
      time: '03:30 PM',
      from: 'Camana Bay',
      to: 'Owen Roberts Airport',
      driver: 'Sarah Johnson',
      cost: '$22.00',
      status: 'upcoming',
    },
  ],
  past: [
    {
      id: '3',
      date: 'Oct 24, 2025',
      time: '02:15 PM',
      from: 'Seven Mile Beach',
      to: 'George Town',
      driver: 'Mike Wilson',
      cost: '$12.00',
      status: 'completed',
      rating: 5,
    },
    {
      id: '4',
      date: 'Oct 20, 2025',
      time: '10:45 AM',
      from: 'George Town',
      to: 'Rum Point',
      driver: 'Emma Davis',
      cost: '$35.00',
      status: 'completed',
      rating: 4,
    },
    {
      id: '5',
      date: 'Oct 18, 2025',
      time: '06:00 PM',
      from: 'Camana Bay',
      to: 'George Town',
      driver: 'James Brown',
      cost: '$8.00',
      status: 'cancelled',
    },
  ],
};

export default function MyTripsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  const renderTripCard = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => router.push({
        pathname: '/(rider)/trip-detail',
        params: { tripId: item.id }
      })}
      activeOpacity={0.7}
    >
      {/* Date Header */}
      <View style={styles.dateHeader}>
        <Ionicons name="calendar-outline" size={16} color="#6B7280" />
        <Text style={styles.dateText}>{item.date} · {item.time}</Text>
        {item.status === 'completed' && (
          <View style={styles.completedBadge}>
            <Text style={styles.badgeText}>Completed</Text>
          </View>
        )}
        {item.status === 'cancelled' && (
          <View style={[styles.completedBadge, styles.cancelledBadge]}>
            <Text style={[styles.badgeText, styles.cancelledText]}>Cancelled</Text>
          </View>
        )}
        {item.status === 'upcoming' && (
          <View style={[styles.completedBadge, styles.upcomingBadge]}>
            <Text style={[styles.badgeText, styles.upcomingText]}>Upcoming</Text>
          </View>
        )}
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeIconsContainer}>
          <View style={styles.greenDot} />
          <View style={styles.dottedLine} />
          <View style={styles.redSquare} />
        </View>
        <View style={styles.addressesContainer}>
          <Text style={styles.address}>{item.from}</Text>
          <Text style={styles.address}>{item.to}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.driverInfo}>
          <Ionicons name="person-outline" size={16} color="#6B7280" />
          <Text style={styles.driverName}>{item.driver}</Text>
        </View>
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Cost Share:</Text>
          <Text style={styles.costValue}>{item.cost}</Text>
        </View>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating}.0</Text>
          </View>
        )}
      </View>

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
        style={styles.chevron}
      />
    </TouchableOpacity>
  );

  const trips = MOCK_TRIPS[activeTab];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}
          >
            Upcoming
          </Text>
          {activeTab === 'upcoming' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}
          >
            Past
          </Text>
          {activeTab === 'past' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      {trips.length > 0 ? (
        <FlatList
          data={trips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="car-outline" size={64} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No {activeTab} trips</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'upcoming'
              ? "You don't have any upcoming rides scheduled"
              : "You haven't taken any trips yet"}
          </Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.bookButtonText}>Book a Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {},
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#5d1289ff',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#5d1289ff',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  cancelledBadge: {
    backgroundColor: '#FEE2E2',
  },
  upcomingBadge: {
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  cancelledText: {
    color: '#DC2626',
  },
  upcomingText: {
    color: '#2563EB',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeIconsContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginBottom: 4,
  },
  dottedLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  redSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    marginTop: 4,
  },
  addressesContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  address: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverName: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  costLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 4,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginLeft: 4,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  bookButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});