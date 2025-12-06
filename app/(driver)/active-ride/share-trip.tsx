import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

export default function ShareTrip() {
  const router = useRouter();
  const { activeRide } = useDriverStore();
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tripLink, setTripLink] = useState<string>('');

  // Generate the tracking link when component mounts or activeRide changes
  useEffect(() => {
    if (activeRide?.id) {
      // Use the trip ID directly - track.html now supports both trackingSessions and trips collections
      const link = `https://drift-global.web.app/track?session=${activeRide.id}`;
      setTripLink(link);
    }
  }, [activeRide?.id]);

  const handleShare = async () => {
    if (!tripLink) {
      Alert.alert('Error', 'No active trip to share');
      return;
    }

    try {
      setLoading(true);
      const result = await Share.share({
        message: `Track my Drift ride in real-time: ${tripLink}\n\nI'm currently on a trip and wanted to share my live location with you for safety.`,
        title: 'Track My Ride - Drift',
      });

      if (result.action === Share.sharedAction) {
        setIsSharing(true);
        Alert.alert('Shared!', 'Your trip tracking link has been shared.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!tripLink) {
      Alert.alert('Error', 'No tracking link available');
      return;
    }

    try {
      await Clipboard.setStringAsync(tripLink);
      Alert.alert('Copied!', 'Trip tracking link copied to clipboard.');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy link.');
    }
  };

  const handleStopSharing = () => {
    setIsSharing(false);
    Alert.alert(
      'Sharing Stopped',
      'Your trip is no longer being actively shared. Existing links will still work until the trip ends.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  if (!activeRide) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share Trip</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color={Colors.gray[400]} />
          <Text style={styles.errorText}>No active trip to share</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Trip</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name="share-social" size={80} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Share Live Location</Text>
        <Text style={styles.subtitle}>
          Share your trip with friends or family for added safety
        </Text>

        {isSharing ? (
          <>
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
              <Text style={styles.statusText}>Trip sharing is active</Text>
            </View>

            <View style={styles.linkCard}>
              <Text style={styles.linkLabel}>Share Link</Text>
              <Text style={styles.linkText} numberOfLines={2}>{tripLink}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                <Ionicons name="copy" size={16} color={Colors.primary} />
                <Text style={styles.copyText}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.shareAgainButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={Colors.primary} />
              <Text style={styles.shareAgainText}>Share Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.stopButton} onPress={handleStopSharing}>
              <Text style={styles.stopText}>Done</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="location" size={24} color={Colors.primary} />
                <Text style={styles.featureText}>Real-time location updates</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="time" size={24} color={Colors.primary} />
                <Text style={styles.featureText}>ETA tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="car" size={24} color={Colors.primary} />
                <Text style={styles.featureText}>Driver & vehicle info</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <Text style={styles.featureText}>Enhanced safety</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.shareButton, loading && styles.shareButtonDisabled]}
              onPress={() => {
                setIsSharing(true);
                handleShare();
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="share-social" size={20} color={Colors.white} />
                  <Text style={styles.shareText}>Share Trip</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyOnlyButton} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={20} color={Colors.primary} />
              <Text style={styles.copyOnlyText}>Copy Link Only</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'] },
  icon: { alignItems: 'center', marginBottom: Spacing.xl },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  statusCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.success,
    marginTop: Spacing.md,
  },
  linkCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  linkLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    marginBottom: Spacing.xs,
  },
  linkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
  },
  copyText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  featuresList: { marginBottom: Spacing.xl },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.black,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  shareButtonDisabled: {
    opacity: 0.7,
  },
  shareText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  shareAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  shareAgainText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  copyOnlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  copyOnlyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  stopButton: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  stopText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: Colors.gray[500],
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});
