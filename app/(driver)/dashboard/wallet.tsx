import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
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

  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ride':
        return 'car';
      case 'tip':
        return 'heart';
      case 'bonus':
        return 'gift';
      case 'cashout':
        return 'arrow-down';
      case 'fee':
        return 'remove-circle';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'ride':
      case 'tip':
      case 'bonus':
        return Colors.success;
      case 'cashout':
      case 'fee':
        return Colors.error;
      default:
        return Colors.gray[600];
    }
  };

  const handleCashout = async () => {
    if (!driver?.id || !cashoutAmount) return;

    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount < 25) {
      alert('Please enter a valid amount (minimum CI$25)');
      return;
    }

    if (!walletBalance || walletBalance.available < amount) {
      alert('Insufficient balance');
      return;
    }

    try {
      setProcessing(true);
      await TransactionService.requestCashout(driver.id, amount, 'bank_account');

      // Reload wallet data
      await loadWalletData();

      setShowCashoutModal(false);
      setCashoutAmount('');
      alert('Cashout requested successfully!');
    } catch (error: any) {
      console.error('Error requesting cashout:', error);
      alert(error.message || 'Failed to request cashout');
    } finally {
      setProcessing(false);
    }
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
          <TouchableOpacity
            style={styles.cashoutButton}
            onPress={() => setShowCashoutModal(true)}
            disabled={currentBalance < 25}
          >
            <Ionicons name="arrow-down-circle" size={20} color={Colors.white} />
            <Text style={styles.cashoutButtonText}>Cash Out</Text>
          </TouchableOpacity>
          {currentBalance < 25 && (
            <Text style={styles.minimumText}>Minimum CI$25 required to cash out</Text>
          )}
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

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIconContainer,
                    { backgroundColor: getTransactionColor(transaction.type) + '15' },
                  ]}
                >
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={20}
                    color={getTransactionColor(transaction.type)}
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>
                    {transaction.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.amount > 0 ? Colors.success : Colors.error },
                  ]}
                >
                  {transaction.amount > 0 ? '+' : ''}CI${Math.abs(transaction.amount).toFixed(2)}
                </Text>
                {transaction.status === 'pending' && (
                  <Text style={styles.pendingBadge}>Pending</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
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

      {/* Cashout Modal */}
      <Modal
        visible={showCashoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCashoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cash Out</Text>
              <TouchableOpacity onPress={() => setShowCashoutModal(false)}>
                <Ionicons name="close" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.availableBalance}>
                Available: CI${currentBalance.toFixed(2)}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Amount to cash out</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>CI$</Text>
                  <TextInput
                    style={styles.input}
                    value={cashoutAmount}
                    onChangeText={setCashoutAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.gray[400]}
                  />
                </View>
              </View>

              <View style={styles.quickAmounts}>
                <TouchableOpacity
                  style={styles.quickAmountButton}
                  onPress={() => setCashoutAmount('50')}
                >
                  <Text style={styles.quickAmountText}>CI$50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountButton}
                  onPress={() => setCashoutAmount('100')}
                >
                  <Text style={styles.quickAmountText}>CI$100</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickAmountButton}
                  onPress={() => setCashoutAmount(currentBalance.toString())}
                >
                  <Text style={styles.quickAmountText}>All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>
                  Funds will be transferred to your bank account within 1-3 business days
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (processing || !cashoutAmount || parseFloat(cashoutAmount) < 25) && styles.confirmButtonDisabled,
                ]}
                onPress={handleCashout}
                disabled={processing || !cashoutAmount || parseFloat(cashoutAmount) < 25}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Cash Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.lg,
  },
  cashoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  cashoutButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.purple,
  },
  minimumText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.white + 'AA',
    textAlign: 'center',
    marginTop: Spacing.sm,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.black + '80',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
  },
  modalBody: {
    padding: Spacing.xl,
  },
  availableBalance: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  inputPrefix: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.gray[600],
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    paddingVertical: Spacing.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickAmountButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  quickAmountText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
  confirmButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});