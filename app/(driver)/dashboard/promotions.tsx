import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

type Promotion = {
  id: string;
  title: string;
  description: string;
  type: 'bonus' | 'streak' | 'referral' | 'peak';
  reward: string;
  progress?: { current: number; target: number };
  expiresAt?: Date;
  status: 'active' | 'completed' | 'expired';
};

export default function Promotions() {
  const router = useRouter();

  const promotions: Promotion[] = [
    {
      id: '1',
      title: 'Weekend Warrior',
      description: 'Complete 20 trips this weekend',
      type: 'bonus',
      reward: 'CI$50 bonus',
      progress: { current: 12, target: 20 },
      expiresAt: new Date(Date.now() + 172800000),
      status: 'active',
    },
    {
      id: '2',
      title: 'Peak Hour Pro',
      description: 'Drive during peak hours (6-9 AM, 5-8 PM)',
      type: 'peak',
      reward: '1.5x earnings',
      status: 'active',
    },
    {
      id: '3',
      title: '5-Day Streak',
      description: 'Drive 5 consecutive days',
      type: 'streak',
      reward: 'CI$25 bonus',
      progress: { current: 3, target: 5 },
      status: 'active',
    },
    {
      id: '4',
      title: 'Refer a Driver',
      description: 'Invite friends to drive with Drift',
      type: 'referral',
      reward: 'CI$100 per driver',
      status: 'active',
    },
    {
      id: '5',
      title: 'Holiday Special',
      description: 'December bonus promotion',
      type: 'bonus',
      reward: 'CI$75 bonus',
      progress: { current: 20, target: 20 },
      status: 'completed',
    },
  ];

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'bonus':
        return 'gift';
      case 'streak':
        return 'flame';
      case 'referral':
        return 'people';
      case 'peak':
        return 'trending-up';
    }
  };

  const getPromotionColor = (type: string) => {
    switch (type) {
      case 'bonus':
        return Colors.success;
      case 'streak':
        return Colors.warning;
      case 'referral':
        return Colors.primary;
      case 'peak':
        return Colors.purple;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return Colors.success;
      case 'completed':
        return Colors.primary;
      case 'expired':
        return Colors.gray[400];
    }
  };

  const activePromotions = promotions.filter((p) => p.status === 'active');
  const completedPromotions = promotions.filter((p) => p.status === 'completed');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promotions</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Promotions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Promotions</Text>
          
          {activePromotions.map((promo) => (
            <TouchableOpacity key={promo.id} style={styles.promoCard}>
              <View
                style={[
                  styles.promoIcon,
                  { backgroundColor: getPromotionColor(promo.type) + '20' },
                ]}
              >
                <Ionicons
                  name={getPromotionIcon(promo.type)}
                  size={28}
                  color={getPromotionColor(promo.type)}
                />
              </View>

              <View style={styles.promoContent}>
                <View style={styles.promoHeader}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(promo.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(promo.status) },
                      ]}
                    >
                      {promo.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.promoDescription}>{promo.description}</Text>

                <View style={styles.promoReward}>
                  <Ionicons name="trophy" size={16} color={Colors.primary} />
                  <Text style={styles.rewardText}>{promo.reward}</Text>
                </View>

                {promo.progress && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressInfo}>
                      <Text style={styles.progressText}>
                        {promo.progress.current} of {promo.progress.target}
                      </Text>
                      <Text style={styles.progressPercent}>
                        {Math.round((promo.progress.current / promo.progress.target) * 100)}%
                      </Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${(promo.progress.current / promo.progress.target) * 100}%`,
                            backgroundColor: getPromotionColor(promo.type),
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

                {promo.expiresAt && (
                  <View style={styles.expiryInfo}>
                    <Ionicons name="time-outline" size={14} color={Colors.gray[600]} />
                    <Text style={styles.expiryText}>
                      Expires in {Math.ceil((promo.expiresAt.getTime() - Date.now()) / 86400000)}{' '}
                      days
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Completed */}
        {completedPromotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            
            {completedPromotions.map((promo) => (
              <View key={promo.id} style={[styles.promoCard, styles.promoCardCompleted]}>
                <View
                  style={[
                    styles.promoIcon,
                    { backgroundColor: Colors.gray[200] },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                </View>

                <View style={styles.promoContent}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoDescription}>{promo.description}</Text>
                  <View style={styles.promoReward}>
                    <Ionicons name="trophy" size={16} color={Colors.success} />
                    <Text style={[styles.rewardText, { color: Colors.success }]}>
                      {promo.reward} earned!
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Promotions Work</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>1</Text>
              </View>
              <Text style={styles.infoItemText}>
                Check active promotions and their requirements
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>2</Text>
              </View>
              <Text style={styles.infoItemText}>
                Complete trips to progress toward your goal
              </Text>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoNumber}>
                <Text style={styles.infoNumberText}>3</Text>
              </View>
              <Text style={styles.infoItemText}>
                Earn bonuses automatically when completed
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
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
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  promoCardCompleted: {
    opacity: 0.7,
  },
  promoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  promoContent: {
    flex: 1,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  promoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  promoDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.sm,
  },
  promoReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  rewardText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressSection: {
    marginBottom: Spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  progressPercent: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: Colors.black,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  infoCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: Spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoNumberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: Colors.white,
  },
  infoItemText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
});