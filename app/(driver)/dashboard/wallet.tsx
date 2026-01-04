import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import {
  TransactionService,
  Transaction,
  WalletBalance,
} from '@/src/services/transaction.service';

export default function Wallet() {
  const router = useRouter();
  const { driver, balance: storeBalance, earnings } = useDriverStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load wallet data from Firebase
  useEffect(() => {
    loadWalletData();
  }, [driver?.id]);

  const loadWalletData = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const [balance, txns] = await Promise.all([
        TransactionService.getWalletBalance(driver.id),
        TransactionService.getRecentTransactions(driver.id),
      ]);

      setWalletBalance(balance);
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading wallet...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentBalance = walletBalance?.available || 0;
  const pendingBalance = walletBalance?.pending || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/(driver)/settings/payout-methods')}>
          <Ionicons name="settings-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <View style={styles.balanceAmount}>
            <Text style={styles.currencySymbol}>CI$</Text>
            <Text style={styles.balanceValue}>{currentBalance.toFixed(2)}</Text>
          </View>
          <Text style={styles.pendingText}>
            Pending: CI${pendingBalance.toFixed(2)}
          </Text>
          <View style={styles.payoutInfoBox}>
            <Ionicons name="calendar-outline" size={18} color={Colors.white} />
            <Text style={styles.payoutInfoText}>
              Payouts are processed weekly to your Wise account
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>CI${earnings.today.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>CI${earnings.thisWeek.toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>CI${earnings.thisMonth.toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Payout History */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Payout History</Text>

          {transactions.filter(t => t.type === 'cashout').length > 0 ? (
            transactions
              .filter(t => t.type === 'cashout')
              .map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIconContainer,
                        { backgroundColor: Colors.success + '15' },
                      ]}
                    >
                      <Ionicons name="wallet-outline" size={20} color={Colors.success} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>Weekly Payout</Text>
                      <Text style={styles.transactionDate}>
                        {transaction.createdAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[styles.transactionAmount, { color: Colors.success }]}>
                      CI${Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                    <Text style={styles.completedBadge}>
                      {transaction.status === 'completed' ? 'Sent' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.emptyPayouts}>
              <Ionicons name="time-outline" size={40} color={Colors.gray[400]} />
              <Text style={styles.emptyPayoutsTitle}>No payouts yet</Text>
              <Text style={styles.emptyPayoutsText}>
                Your weekly payouts will appear here once processed
              </Text>
            </View>
          )}
        </View>

        {/* Payment Methods */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={styles.paymentCard}
            onPress={() => router.push('/(driver)/settings/payout-methods')}
          >
            <View style={styles.paymentLeft}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>Bank Account</Text>
                <Text style={styles.paymentDetails}>****1234</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  balanceCard: {
    backgroundColor: Colors.purple,
    borderRadius: 20,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white + 'CC',
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.xs,
  },
  balanceValue: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: '700',
    color: Colors.white,
  },
  pendingText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white + 'AA',
    marginBottom: Spacing.md,
  },
  payoutInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  payoutInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  transactionsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
    marginBottom: 2,
  },
  pendingBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },
  completedBadge: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: '600',
  },
  emptyPayouts: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyPayoutsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.gray[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyPayoutsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    textAlign: 'center',
  },
  paymentSection: {
    marginBottom: Spacing.xl,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentInfo: {
    marginLeft: Spacing.md,
  },
  paymentName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  paymentDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
});