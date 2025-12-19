import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme-helper';
import { useDriverStore } from '@/src/stores/driver-store';
import { useAuthStore } from '@/src/stores/auth-store';

export default function ProfileViewScreen() {
  const { user } = useAuthStore();
  const { driver, vehicle, documents, stats, loadDriverProfile } = useDriverStore();

  // Reload driver profile when screen is focused (e.g., returning from photo upload)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('📸 Profile view focused - reloading driver profile');
        loadDriverProfile(user.id);
      }
    }, [user?.id, loadDriverProfile])
  );

  // Show loading state while fetching data
  if (!driver || !vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[Typography.body, { marginTop: Spacing.md, color: Colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Format member since date
  const memberSince = driver.createdAt
    ? new Date(driver.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A';

  // Calculate level based on total trips
  const getDriverLevel = (trips: number) => {
    if (trips >= 500) return 'Platinum';
    if (trips >= 200) return 'Gold';
    if (trips >= 50) return 'Silver';
    return 'Bronze';
  };

  // Calculate badges based on achievements
  const getBadges = () => {
    const badges: string[] = [];
    if (driver.rating >= 4.9) badges.push('5-Star');
    if (driver.totalTrips >= 100) badges.push('100 Trips');
    if (driver.totalTrips >= 500) badges.push('Top Earner');
    return badges;
  };

  // Map document status from Firebase
  const getDocumentStatus = (docType: 'license' | 'insurance' | 'registration' | 'inspection') => {
    const doc = documents.find((d) => d.type === docType);
    return {
      status: doc?.status === 'approved' ? 'verified' : doc?.status || 'pending',
      expiry: doc?.expiryDate || 'N/A',
    };
  };

  const DocumentStatus = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'verified':
          return Colors.success;
        case 'pending':
          return Colors.warning;
        case 'expired':
          return Colors.error;
        default:
          return Colors.textSecondary;
      }
    };

    const getStatusIcon = () => {
      switch (status) {
        case 'verified':
          return 'checkmark-circle';
        case 'pending':
          return 'time';
        case 'expired':
          return 'alert-circle';
        default:
          return 'help-circle';
      }
    };

    return (
      <View style={styles.statusBadge}>
        <Ionicons name={getStatusIcon()} size={14} color={getStatusColor()} />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity
            onPress={() => router.push('/(driver)/profile/edit')}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={() => router.push('/(driver)/profile/upload-photo')}
          >
            {(driver.photoUrl || user?.photoURL || user?.profilePhoto) ? (
            <Image source={{ uri: driver.photoUrl || user?.photoURL || user?.profilePhoto }} style={styles.profilePhotoImage} />
          ) : (
            <View style={styles.profilePhotoPlaceholder}>
              <Text style={styles.profilePhotoText}>
                {driver.firstName[0]}{driver.lastName[0]}
              </Text>
            </View>
          )}
            <View style={styles.photoEditBadge}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.driverName}>{driver.firstName} {driver.lastName}</Text>

          <View style={styles.levelBadge}>
            <Ionicons name="trophy" size={16} color={Colors.warning} />
            <Text style={styles.levelText}>{getDriverLevel(driver.totalTrips)} Driver</Text>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(driver.rating) ? 'star' : 'star-outline'}
                  size={20}
                  color={Colors.warning}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{driver.rating.toFixed(1)} • {driver.totalTrips} trips</Text>
          </View>

          <View style={styles.badgesContainer}>
            {getBadges().map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(100 - (stats?.cancellationRate || 0))}%</Text>
              <Text style={styles.statLabel}>Completion</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats?.acceptanceRate || 0)}%</Text>
              <Text style={styles.statLabel}>Acceptance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats?.cancellationRate || 0)}%</Text>
              <Text style={styles.statLabel}>Cancellation</Text>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{driver.email}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{driver.phone}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{memberSince}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <TouchableOpacity
              onPress={() => router.push('/(driver)/profile/vehicle')}
            >
              <Text style={styles.viewAllText}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-sport" size={32} color={Colors.primary} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.vehicleDetails}>
                {vehicle.color} • {vehicle.licensePlate}
              </Text>
              <Text style={styles.vehicleSeats}>{vehicle.seats} seats</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.textSecondary} />
          </View>
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <TouchableOpacity
              onPress={() => router.push('/(driver)/profile/documents')}
            >
              <Text style={styles.viewAllText}>Manage</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.documentsCard}>
            <View style={styles.documentRow}>
              <View style={styles.documentIcon}>
                <Ionicons name="card-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Driver's License</Text>
                <Text style={styles.documentExpiry}>Expires: {getDocumentStatus('license').expiry}</Text>
              </View>
              <DocumentStatus status={getDocumentStatus('license').status} />
            </View>
            <View style={styles.documentDivider} />
            <View style={styles.documentRow}>
              <View style={styles.documentIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Insurance</Text>
                <Text style={styles.documentExpiry}>Expires: {getDocumentStatus('insurance').expiry}</Text>
              </View>
              <DocumentStatus status={getDocumentStatus('insurance').status} />
            </View>
            <View style={styles.documentDivider} />
            <View style={styles.documentRow}>
              <View style={styles.documentIcon}>
                <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>Registration</Text>
                <Text style={styles.documentExpiry}>Expires: {getDocumentStatus('registration').expiry}</Text>
              </View>
              <DocumentStatus status={getDocumentStatus('registration').status} />
            </View>
          </View>
        </View>

        {/* Quick Actions - Commented out for now
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/profile/ratings')}
            >
              <Ionicons name="star-outline" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>My Ratings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/profile/stats')}
            >
              <Ionicons name="analytics-outline" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Statistics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/profile/achievements')}
            >
              <Ionicons name="trophy-outline" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Achievements</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(driver)/profile/referrals')}
            >
              <Ionicons name="people-outline" size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Referrals</Text>
            </TouchableOpacity>
          </View>
        </View>
        */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  editButton: {
    padding: Spacing.xs,
  },
  profileCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profilePhoto: {
    fontSize: 80,
  },
  profilePhotoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhotoText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  driverName: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.warning}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  levelText: {
    ...Typography.body,
    color: Colors.warning,
    fontWeight: '600',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  viewAllText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    ...Colors.shadow,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleDetails: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  vehicleSeats: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  documentsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.md,
    ...Colors.shadow,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  documentExpiry: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  documentDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Colors.shadow,
  },
  actionText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});