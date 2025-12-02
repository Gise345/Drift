import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function ShareTrip() {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const tripLink = 'https://drift-global.com/live/ABC123XYZ';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Track my ride on Drift: ${tripLink}`,
        title: 'Track My Ride',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopyLink = () => {
    // Copy to clipboard
    alert('Link copied to clipboard!');
  };

  const handleStopSharing = () => {
    setIsSharing(false);
    router.back();
  };

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
              <Text style={styles.linkText}>{tripLink}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                <Ionicons name="copy" size={16} color={Colors.primary} />
                <Text style={styles.copyText}>Copy Link</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.stopButton} onPress={handleStopSharing}>
              <Text style={styles.stopText}>Stop Sharing</Text>
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
                <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                <Text style={styles.featureText}>Enhanced safety</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                setIsSharing(true);
                handleShare();
              }}
            >
              <Ionicons name="share-social" size={20} color={Colors.white} />
              <Text style={styles.shareText}>Share Trip</Text>
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
    marginBottom: Spacing.xl,
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
  },
  shareText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
  stopButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.error,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  stopText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.error,
  },
});