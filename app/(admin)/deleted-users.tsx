/**
 * DELETED USERS ADMIN SCREEN
 * View and manage deleted user accounts
 * Data is preserved for legal/compliance purposes
 *
 * ✅ Using React Native Firebase v22+ Modular API
 * ✅ Using 'main' database
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, getDoc } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

interface DeletedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  gender?: string;
  deletedAt: Date;
  deletionReason?: string;
  totalTrips?: number;
  rating?: number;
  createdAt?: Date;
  wasDriver?: boolean;
}

export default function DeletedUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeletedUsers();
  }, []);

  const loadDeletedUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const deletedQuery = query(
        usersRef,
        where('isDeleted', '==', true)
      );
      const snapshot = await getDocs(deletedQuery);

      const deletedUsers: DeletedUser[] = [];

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        // Check if they were also a driver
        let wasDriver = false;
        try {
          const driverRef = doc(db, 'drivers', docSnapshot.id);
          const driverDoc = await getDoc(driverRef);
          wasDriver = driverDoc.exists === true || (typeof driverDoc.exists === 'function' && driverDoc.exists());
        } catch (e) {
          // Driver doc doesn't exist
        }

        deletedUsers.push({
          id: docSnapshot.id,
          name: data.name || 'Unknown',
          email: data.email || 'No email',
          phone: data.phone,
          roles: data.roles || [],
          gender: data.gender,
          deletedAt: data.deletedAt?.toDate() || new Date(),
          deletionReason: data.deletionReason || 'No reason provided',
          totalTrips: data.totalTrips || 0,
          rating: data.rating || 0,
          createdAt: data.createdAt?.toDate(),
          wasDriver,
        });
      }

      // Sort by deletion date, most recent first
      deletedUsers.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());

      setUsers(deletedUsers);
      console.log(`✅ Loaded ${deletedUsers.length} deleted users`);
    } catch (error) {
      console.error('❌ Error loading deleted users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDeletedUsers();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DRIVER':
        return Colors.success;
      case 'RIDER':
        return Colors.info;
      case 'ADMIN':
        return Colors.error;
      default:
        return Colors.gray[500];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Deleted Users</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} account{users.length !== 1 ? 's' : ''} deleted
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.infoBannerText}>
          User data is preserved for legal compliance. Auth accounts have been deleted.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading deleted users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color={Colors.success} />
          <Text style={styles.emptyTitle}>No Deleted Users</Text>
          <Text style={styles.emptySubtitle}>
            No users have deleted their accounts yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              {/* User Header */}
              <View style={styles.userHeader}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={24} color={Colors.gray[400]} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>

              {/* Roles */}
              <View style={styles.rolesContainer}>
                {user.roles.map((role, index) => (
                  <View
                    key={index}
                    style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(role) + '20' }]}
                  >
                    <Text style={[styles.roleBadgeText, { color: getRoleBadgeColor(role) }]}>
                      {role}
                    </Text>
                  </View>
                ))}
                {user.wasDriver && !user.roles.includes('DRIVER') && (
                  <View style={[styles.roleBadge, { backgroundColor: Colors.warning + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: Colors.warning }]}>
                      HAD DRIVER PROFILE
                    </Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.gray[500]} />
                  <Text style={styles.detailLabel}>Deleted:</Text>
                  <Text style={styles.detailValue}>{formatDate(user.deletedAt)}</Text>
                </View>

                {user.createdAt && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={Colors.gray[500]} />
                    <Text style={styles.detailLabel}>Member since:</Text>
                    <Text style={styles.detailValue}>{formatDate(user.createdAt)}</Text>
                  </View>
                )}

                {user.phone && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={Colors.gray[500]} />
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{user.phone}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="car-outline" size={16} color={Colors.gray[500]} />
                  <Text style={styles.detailLabel}>Total Trips:</Text>
                  <Text style={styles.detailValue}>{user.totalTrips}</Text>
                </View>

                {user.gender && (
                  <View style={styles.detailRow}>
                    <Ionicons name={user.gender === 'female' ? 'female' : 'male'} size={16} color={Colors.gray[500]} />
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>{user.gender}</Text>
                  </View>
                )}
              </View>

              {/* Deletion Reason */}
              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>Deletion Reason:</Text>
                <Text style={styles.reasonText}>{user.deletionReason}</Text>
              </View>

              {/* User ID (for reference) */}
              <View style={styles.userIdContainer}>
                <Text style={styles.userIdLabel}>User ID:</Text>
                <Text style={styles.userIdValue}>{user.id}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  refreshButton: {
    padding: Spacing.xs,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.info + '15',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.info,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  roleBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
    paddingTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[600],
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    flex: 1,
  },
  reasonContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIdLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[500],
    marginRight: Spacing.xs,
  },
  userIdValue: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[400],
    flex: 1,
  },
});
