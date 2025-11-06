import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * PAYOUT METHODS SCREEN
 * 
 * Manage payout methods:
 * - Bank account details
 * - Default payout method
 * - Add new payment method
 * - Edit/delete methods
 * - Payout schedule
 */

interface PaymentMethod {
  id: string;
  type: 'bank' | 'card';
  name: string;
  accountNumber: string;
  isDefault: boolean;
  lastUsed?: string;
}

export default function PayoutMethodsScreen() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'bank',
      name: 'Cayman National Bank',
      accountNumber: '****1234',
      isDefault: true,
      lastUsed: '2024-11-01',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethod, setNewMethod] = useState({
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleDeleteMethod = (id: string) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isDefault) {
      Alert.alert('Error', 'Cannot delete default payment method');
      return;
    }

    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(m => m.id !== id));
          },
        },
      ]
    );
  };

  const handleAddMethod = () => {
    if (
      !newMethod.bankName ||
      !newMethod.accountNumber ||
      !newMethod.accountHolderName
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: 'bank',
      name: newMethod.bankName,
      accountNumber: `****${newMethod.accountNumber.slice(-4)}`,
      isDefault: paymentMethods.length === 0,
    };

    setPaymentMethods(prev => [...prev, method]);
    setShowAddModal(false);
    setNewMethod({
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      accountHolderName: '',
    });
    Alert.alert('Success', 'Payment method added successfully');
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
        <Text style={styles.headerTitle}>Payout Methods</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-circle" size={28} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Payout Schedule Info */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Ionicons name="calendar" size={24} color={Colors.primary[500]} />
            <Text style={styles.scheduleTitle}>Payout Schedule</Text>
          </View>
          <Text style={styles.scheduleText}>
            Automatic payouts occur every Tuesday for the previous week's
            earnings. Minimum payout amount is CI$25.00.
          </Text>
          <TouchableOpacity style={styles.scheduleButton}>
            <Text style={styles.scheduleButtonText}>View Payout History</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptyText}>
                Add a bank account to receive your earnings
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.addButtonText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map(method => (
                <View key={method.id} style={styles.methodCard}>
                  <View style={styles.methodIcon}>
                    <Ionicons
                      name={method.type === 'bank' ? 'business' : 'card'}
                      size={24}
                      color={Colors.primary[500]}
                    />
                  </View>
                  <View style={styles.methodContent}>
                    <View style={styles.methodHeader}>
                      <Text style={styles.methodName}>{method.name}</Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.methodAccount}>
                      Account {method.accountNumber}
                    </Text>
                    {method.lastUsed && (
                      <Text style={styles.methodLastUsed}>
                        Last used: {new Date(method.lastUsed).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.methodActions}>
                    {!method.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(method.id)}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color={Colors.gray[600]}
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteMethod(method.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={Colors.error[500]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={Colors.success[500]}
          />
          <Text style={styles.infoText}>
            Your payment information is encrypted and secure. We never store
            your full account details.
          </Text>
        </View>

        {/* Requirements */}
        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>
            Payment Method Requirements
          </Text>
          <View style={styles.requirement}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Colors.success[500]}
            />
            <Text style={styles.requirementText}>
              Must be a valid Cayman Islands bank account
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Colors.success[500]}
            />
            <Text style={styles.requirementText}>
              Account must be in driver's name
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={Colors.success[500]}
            />
            <Text style={styles.requirementText}>
              Verification may take 1-2 business days
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <TouchableOpacity onPress={handleAddMethod}>
              <Text style={styles.modalSave}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name *</Text>
              <TextInput
                style={styles.input}
                value={newMethod.bankName}
                onChangeText={text =>
                  setNewMethod(prev => ({ ...prev, bankName: text }))
                }
                placeholder="e.g., Cayman National Bank"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                value={newMethod.accountHolderName}
                onChangeText={text =>
                  setNewMethod(prev => ({ ...prev, accountHolderName: text }))
                }
                placeholder="Full name as on account"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={styles.input}
                value={newMethod.accountNumber}
                onChangeText={text =>
                  setNewMethod(prev => ({ ...prev, accountNumber: text }))
                }
                placeholder="12-digit account number"
                keyboardType="number-pad"
                placeholderTextColor={Colors.gray[400]}
                maxLength={12}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Routing Number</Text>
              <TextInput
                style={styles.input}
                value={newMethod.routingNumber}
                onChangeText={text =>
                  setNewMethod(prev => ({ ...prev, routingNumber: text }))
                }
                placeholder="Optional"
                keyboardType="number-pad"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            <View style={styles.modalInfo}>
              <Ionicons
                name="information-circle"
                size={20}
                color={Colors.primary[500]}
              />
              <Text style={styles.modalInfoText}>
                Your bank account will be verified before your first payout.
                This usually takes 1-2 business days.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  scheduleCard: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    marginLeft: Spacing.sm,
  },
  scheduleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  scheduleButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary[500],
    marginRight: Spacing.xs,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Spacing.xl * 2,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  addButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  methodsList: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  methodContent: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  methodName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  defaultBadge: {
    backgroundColor: Colors.success[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  methodAccount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.xs / 2,
  },
  methodLastUsed: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
  },
  methodActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.success[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.success[500],
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.success[700],
    marginLeft: Spacing.sm,
  },
  requirementsCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  requirementsTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  requirementText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  modalSave: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[500],
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
  },
  modalInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  modalInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    marginLeft: Spacing.sm,
  },
});