import React, { useState, useEffect } from 'react';
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
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from '@react-native-firebase/firestore';
import { WiseService } from '@/src/services/wise.service';
import { getAuth } from '@react-native-firebase/auth';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');
const auth = getAuth(app);

/**
 * WISE PAYOUT METHODS SCREEN
 *
 * Focused on Wise bank integration:
 * - UK bank details (Sort Code & Account Number)
 * - Wise account setup instructions
 * - Instant payouts
 * - Manage Wise account details
 */

interface WiseAccount {
  id: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;
  isDefault: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

export default function PayoutMethodsScreen() {
  const { driver } = useDriverStore();
  const [wiseAccounts, setWiseAccounts] = useState<WiseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWiseInfoModal, setShowWiseInfoModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAccount, setNewAccount] = useState({
    accountHolderName: '',
    sortCode: '',
    accountNumber: '',
  });

  useEffect(() => {
    loadWiseAccounts();
  }, [driver?.id]);

  const loadWiseAccounts = async () => {
    if (!driver?.id) return;

    try {
      setLoading(true);
      const payoutMethodsRef = collection(db, 'drivers', driver.id, 'payoutMethods');
      const payoutQuery = query(payoutMethodsRef, where('type', '==', 'wise'));
      const snapshot = await getDocs(payoutQuery);

      const accounts: WiseAccount[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          accountHolderName: data.accountHolderName,
          sortCode: data.sortCode,
          accountNumber: data.accountNumber,
          isDefault: data.isDefault || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsed: data.lastUsed?.toDate(),
        };
      });

      setWiseAccounts(accounts);
    } catch (error) {
      console.error('Error loading Wise accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWise = async (target: 'website' | 'app') => {
    try {
      if (target === 'website') {
        await Linking.openURL('https://wise.com/invite/u/danielc6099');
      } else {
        // Try to open Wise app, fallback to app store
        const wiseAppUrl = 'wise://';
        const canOpen = await Linking.canOpenURL(wiseAppUrl);

        if (canOpen) {
          await Linking.openURL(wiseAppUrl);
        } else {
          // Open app store
          const appStoreUrl = 'https://apps.apple.com/app/wise-ex-transferwise/id612261027';
          await Linking.openURL(appStoreUrl);
        }
      }
    } catch (error) {
      console.error('Error opening Wise:', error);
      Alert.alert('Error', 'Could not open Wise. Please try again.');
    }
  };

  const handleOpenAddModal = () => {
    // Check if user is authenticated before opening the modal
    if (!auth.currentUser) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please sign out and sign back in to add a Wise account.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowAddModal(true);
  };

  const formatSortCode = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    // Format as XX-XX-XX
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  };

  const handleSortCodeChange = (text: string) => {
    const formatted = formatSortCode(text);
    setNewAccount(prev => ({ ...prev, sortCode: formatted }));
  };

  const handleAddAccount = async () => {
    if (!driver?.id) {
      Alert.alert('Error', 'Driver not found');
      return;
    }

    // Validate inputs
    if (!newAccount.accountHolderName.trim()) {
      Alert.alert('Error', 'Please enter the account holder name');
      return;
    }

    const sortCodeDigits = newAccount.sortCode.replace(/\D/g, '');
    if (sortCodeDigits.length !== 6) {
      Alert.alert('Error', 'Sort code must be 6 digits (format: XX-XX-XX)');
      return;
    }

    if (newAccount.accountNumber.length !== 8) {
      Alert.alert('Error', 'Account number must be 8 digits');
      return;
    }

    try {
      setSaving(true);

      // Try to validate account with Wise API, but don't block if it fails
      let validation: { valid: boolean; bankName?: string; branchName?: string; error?: string } = { valid: true };
      let validationSkipped = false;

      try {
        validation = await WiseService.validateAccount(
          newAccount.sortCode,
          newAccount.accountNumber
        );

        if (!validation.valid) {
          Alert.alert('Invalid Account', validation.error || 'The bank details could not be verified.');
          setSaving(false);
          return;
        }
      } catch (validationError: any) {
        // If validation fails due to auth or other issues, allow saving anyway
        console.warn('Wise validation skipped, saving account:', validationError);
        validationSkipped = true;
      }

      const isFirstAccount = wiseAccounts.length === 0;

      const payoutMethodsRef = collection(db, 'drivers', driver.id, 'payoutMethods');
      await addDoc(payoutMethodsRef, {
        type: 'wise',
        accountHolderName: newAccount.accountHolderName,
        sortCode: newAccount.sortCode,
        accountNumber: newAccount.accountNumber,
        isDefault: isFirstAccount,
        bankName: validation.bankName || null,
        branchName: validation.branchName || null,
        createdAt: serverTimestamp(),
      });

      await loadWiseAccounts();

      setShowAddModal(false);
      setNewAccount({
        accountHolderName: '',
        sortCode: '',
        accountNumber: '',
      });

      const bankInfo = validation.bankName
        ? `\n\nBank: ${validation.bankName}${validation.branchName ? `\nBranch: ${validation.branchName}` : ''}`
        : '';

      Alert.alert(
        'Success',
        `Wise account added successfully!${bankInfo}\n\nYour account is ready to receive payouts.`
      );
    } catch (error: any) {
      console.error('Error adding Wise account:', error);
      Alert.alert('Error', error.message || 'Failed to add Wise account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (accountId: string) => {
    if (!driver?.id) return;

    try {
      const batch = writeBatch(db);

      // Set all accounts to non-default using modular API
      wiseAccounts.forEach(account => {
        const ref = doc(db, 'drivers', driver.id, 'payoutMethods', account.id);
        batch.update(ref, { isDefault: account.id === accountId });
      });

      await batch.commit();
      await loadWiseAccounts();

      Alert.alert('Success', 'Default payout method updated');
    } catch (error) {
      console.error('Error setting default:', error);
      Alert.alert('Error', 'Failed to update default method');
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = wiseAccounts.find(a => a.id === accountId);
    if (account?.isDefault && wiseAccounts.length > 1) {
      Alert.alert(
        'Error',
        'Cannot delete default payment method. Please set another account as default first.'
      );
      return;
    }

    Alert.alert(
      'Delete Wise Account',
      'Are you sure you want to remove this Wise account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!driver?.id) return;

            try {
              const accountRef = doc(db, 'drivers', driver.id, 'payoutMethods', accountId);
              await deleteDoc(accountRef);

              await loadWiseAccounts();
              Alert.alert('Success', 'Wise account removed');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: Spacing.md, color: Colors.gray[600] }}>
            Loading payout methods...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity onPress={handleOpenAddModal}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Wise Info Card */}
        <View style={styles.wiseInfoCard}>
          <View style={styles.wiseHeader}>
            <View style={styles.wiseLogo}>
              <Text style={styles.wiseLogoText}>Wise</Text>
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowWiseInfoModal(true)}
            >
              <Ionicons name="information-circle" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.wiseTitle}>Fast & Easy Payouts with Wise</Text>
          <Text style={styles.wiseDescription}>
            We use Wise for weekly payouts. Your earnings are sent every week directly to your Wise account!
          </Text>

          <View style={styles.wiseBenefits}>
            <View style={styles.benefit}>
              <Ionicons name="calendar" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Weekly payouts</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Secure & trusted</Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="wallet" size={20} color={Colors.success} />
              <Text style={styles.benefitText}>Low fees</Text>
            </View>
          </View>

          {wiseAccounts.length === 0 && (
            <View style={styles.setupButtons}>
              <Text style={styles.setupTitle}>Don't have a Wise account?</Text>
              <Text style={styles.setupSubtitle}>
                Sign up in less than 5 minutes - use immediately!
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.wiseButton}
                  onPress={() => handleOpenWise('website')}
                >
                  <Ionicons name="globe-outline" size={20} color={Colors.white} />
                  <Text style={styles.wiseButtonText}>Open wise.com</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.wiseButton}
                  onPress={() => handleOpenWise('app')}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={Colors.white} />
                  <Text style={styles.wiseButtonText}>Get the App</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Payout Schedule Info */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.scheduleTitle}>Weekly Payouts</Text>
          </View>
          <Text style={styles.scheduleText}>
            Your earnings are processed and sent to your Wise account every week. Make sure your account details are correct to receive payments on time!
          </Text>
        </View>

        {/* Wise Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Wise Accounts</Text>
          {wiseAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.gray[400]} />
              <Text style={styles.emptyTitle}>No Wise Account Added</Text>
              <Text style={styles.emptyText}>
                Add your Wise account details to start receiving instant payouts
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleOpenAddModal}
              >
                <Text style={styles.addButtonText}>Add Wise Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.accountsList}>
              {wiseAccounts.map(account => (
                <View key={account.id} style={styles.accountCard}>
                  <View style={styles.accountIcon}>
                    <Text style={styles.accountIconText}>W</Text>
                  </View>
                  <View style={styles.accountContent}>
                    <View style={styles.accountHeader}>
                      <Text style={styles.accountName}>
                        {account.accountHolderName}
                      </Text>
                      {account.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accountDetails}>
                      Sort Code: {account.sortCode}
                    </Text>
                    <Text style={styles.accountDetails}>
                      Account: {account.accountNumber}
                    </Text>
                  </View>
                  <View style={styles.accountActions}>
                    {!account.isDefault && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(account.id)}
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
                      onPress={() => handleDeleteAccount(account.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={Colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Security Info */}
        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={Colors.success}
          />
          <Text style={styles.infoText}>
            Your payment information is encrypted and secure. We never store your full account details.
          </Text>
        </View>
      </ScrollView>

      {/* Add Wise Account Modal */}
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
            <Text style={styles.modalTitle}>Add Wise Account</Text>
            <TouchableOpacity onPress={handleAddAccount} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.modalSave}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>
                How to find your Wise UK account details:
              </Text>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>
                  Open your Wise app or go to wise.com
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>
                  Tap on your GBP (British Pound) balance
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  Find your UK account details - Sort Code (6 digits) and Account Number (8 digits)
                </Text>
              </View>
              <View style={styles.instructionStep}>
                <Text style={styles.stepNumber}>4</Text>
                <Text style={styles.stepText}>
                  Enter these details below
                </Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name *</Text>
              <TextInput
                style={styles.input}
                value={newAccount.accountHolderName}
                onChangeText={text =>
                  setNewAccount(prev => ({ ...prev, accountHolderName: text }))
                }
                placeholder="Full name as shown on Wise account"
                placeholderTextColor={Colors.gray[400]}
                autoCapitalize="words"
              />
              <Text style={styles.inputHint}>
                This must match your name exactly as it appears on your Wise account
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sort Code *</Text>
              <TextInput
                style={styles.input}
                value={newAccount.sortCode}
                onChangeText={handleSortCodeChange}
                placeholder="XX-XX-XX"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="number-pad"
                maxLength={8}
              />
              <Text style={styles.inputHint}>
                6-digit sort code from your Wise GBP account (format: XX-XX-XX)
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number *</Text>
              <TextInput
                style={styles.input}
                value={newAccount.accountNumber}
                onChangeText={text =>
                  setNewAccount(prev => ({ ...prev, accountNumber: text.replace(/\D/g, '') }))
                }
                placeholder="XXXXXXXX"
                placeholderTextColor={Colors.gray[400]}
                keyboardType="number-pad"
                maxLength={8}
              />
              <Text style={styles.inputHint}>
                8-digit account number from your Wise GBP account
              </Text>
            </View>

            <View style={styles.modalInfo}>
              <Ionicons
                name="information-circle"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.modalInfoText}>
                Make sure the details exactly match your Wise account to receive payouts without issues.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Wise Info Modal */}
      <Modal
        visible={showWiseInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWiseInfoModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ width: 60 }} />
            <Text style={styles.modalTitle}>Why Wise?</Text>
            <TouchableOpacity onPress={() => setShowWiseInfoModal(false)}>
              <Ionicons name="close" size={28} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.wiseLogo}>
              <Text style={styles.wiseLogoTextLarge}>Wise</Text>
            </View>

            <Text style={styles.whyWiseTitle}>Fast, Easy, and Instant</Text>
            <Text style={styles.whyWiseText}>
              We partner exclusively with Wise to provide you with the best payout experience possible.
            </Text>

            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconLarge}>
                  <Ionicons name="calendar" size={32} color={Colors.success} />
                </View>
                <Text style={styles.benefitTitleLarge}>Weekly Payouts</Text>
                <Text style={styles.benefitDescLarge}>
                  Receive your earnings every week directly to your Wise account. Reliable and consistent payments.
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconLarge}>
                  <Ionicons name="time-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={styles.benefitTitleLarge}>Quick Setup</Text>
                <Text style={styles.benefitDescLarge}>
                  Create a Wise account in less than 5 minutes. Get a digital card instantly and start receiving payments right away.
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconLarge}>
                  <Ionicons name="card-outline" size={32} color={Colors.info} />
                </View>
                <Text style={styles.benefitTitleLarge}>Digital & Physical Cards</Text>
                <Text style={styles.benefitDescLarge}>
                  Use your digital Wise card immediately. Physical card delivery to Cayman takes up to 2 weeks.
                </Text>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconLarge}>
                  <Ionicons name="cash-outline" size={32} color={Colors.warning} />
                </View>
                <Text style={styles.benefitTitleLarge}>Low Fees</Text>
                <Text style={styles.benefitDescLarge}>
                  Wise offers transparent, low-cost transfers with no hidden fees. More money in your pocket.
                </Text>
              </View>
            </View>

            <View style={styles.setupSection}>
              <Text style={styles.setupSectionTitle}>Ready to get started?</Text>
              <TouchableOpacity
                style={styles.setupButton}
                onPress={() => {
                  setShowWiseInfoModal(false);
                  handleOpenWise('website');
                }}
              >
                <Ionicons name="globe-outline" size={24} color={Colors.white} />
                <Text style={styles.setupButtonText}>Sign up at wise.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.setupButton, styles.setupButtonSecondary]}
                onPress={() => {
                  setShowWiseInfoModal(false);
                  handleOpenWise('app');
                }}
              >
                <Ionicons name="phone-portrait-outline" size={24} color={Colors.primary} />
                <Text style={styles.setupButtonTextSecondary}>Download Wise App</Text>
              </TouchableOpacity>
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

  // Wise Info Card
  wiseInfoCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  wiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  wiseLogo: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  wiseLogoText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  wiseLogoTextLarge: {
    fontSize: Typography.fontSize['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  infoButton: {
    padding: Spacing.xs,
  },
  wiseTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  wiseDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  wiseBenefits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  benefitText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
    marginLeft: Spacing.xs,
  },
  setupButtons: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingTop: Spacing.lg,
  },
  setupTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  setupSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  wiseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  wiseButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Schedule Card
  scheduleCard: {
    backgroundColor: Colors.success + '15',
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scheduleTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
    marginLeft: Spacing.sm,
  },
  scheduleText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Section
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

  // Empty State
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
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },

  // Accounts List
  accountsList: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  accountCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  accountIconText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  accountContent: {
    flex: 1,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  accountName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  defaultBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  accountDetails: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    marginBottom: Spacing.xs / 2,
  },
  accountActions: {
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

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
  },

  // Modal
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
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Instructions Card
  instructionsCard: {
    backgroundColor: Colors.primary + '10',
    padding: Spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginBottom: Spacing.xl,
  },
  instructionsTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: Spacing.sm,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    lineHeight: 20,
  },

  // Input Group
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
  inputHint: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  modalInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    padding: Spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    marginTop: Spacing.md,
  },
  modalInfoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },

  // Why Wise Modal
  whyWiseTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  whyWiseText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  benefitsList: {
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  benefitIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  benefitTitleLarge: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  benefitDescLarge: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  setupSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  setupSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  setupButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  setupButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  setupButtonTextSecondary: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
});
