import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import { useDriverStore } from '@/src/stores/driver-store';
import { softDeleteAccount } from '@/src/services/firebase-auth-service';

/**
 * ACCOUNT SETTINGS SCREEN
 *
 * Manage account settings:
 * - Personal information
 * - Email and phone
 * - Account status
 * - Deactivate/Delete account
 */

export default function AccountSettingsScreen() {
  const { user, logout } = useAuthStore();
  const { driver } = useDriverStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState(driver?.firstName || user?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(driver?.lastName || user?.displayName?.split(' ')[1] || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(driver?.phone || user?.phoneNumber || '');

  const handleSaveChanges = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please enter your first and last name.');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Implement actual save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      Alert.alert('Success', 'Your account information has been updated.');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Deactivating your account will temporarily disable your driver profile. You can reactivate it at any time by logging back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement account deactivation
              Alert.alert(
                'Account Deactivated',
                'Your account has been deactivated. You can reactivate it by logging in again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      logout();
                      router.replace('/(auth)/welcome');
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to deactivate account.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? Your data will be preserved for legal purposes but you will no longer be able to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This action cannot be undone. Are you absolutely sure you want to delete your account?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await softDeleteAccount('User requested deletion from account settings');
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been deleted. Thank you for using Drift.',
                        [
                          {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/welcome'),
                          },
                        ]
                      );
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account.');
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleChangeEmail = () => {
    Alert.alert(
      'Change Email',
      'A verification link will be sent to your new email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert('Coming Soon', 'Email change will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleChangePhone = () => {
    Alert.alert(
      'Change Phone Number',
      'You will need to verify your new phone number.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            Alert.alert('Coming Soon', 'Phone number change will be available in a future update.');
          },
        },
      ]
    );
  };

  if (isDeleting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Deleting account...</Text>
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
        <Text style={styles.headerTitle}>Account Settings</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSaveChanges();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={Colors.success}
            />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>Account Active</Text>
            <Text style={styles.statusSubtitle}>
              Member since {new Date(user?.metadata?.creationTime || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.sectionContent}>
            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.gray[400]}
                />
              ) : (
                <Text style={styles.inputValue}>{firstName || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.inputItem}>
              <Text style={styles.inputLabel}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.gray[400]}
                />
              ) : (
                <Text style={styles.inputValue}>{lastName || 'Not set'}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleChangeEmail}
              disabled={isEditing}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{email || 'Not set'}</Text>
              </View>
              {!isEditing && (
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleChangePhone}
              disabled={isEditing}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>Phone Number</Text>
                <Text style={styles.contactValue}>{phone || 'Not set'}</Text>
              </View>
              {!isEditing && (
                <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(driver)/settings/privacy')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Privacy & Security</Text>
                <Text style={styles.actionDescription}>
                  Manage your privacy settings
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(driver)/profile/documents')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Documents</Text>
                <Text style={styles.actionDescription}>
                  View and update your documents
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/(driver)/profile/vehicle')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="car" size={20} color={Colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Vehicle Information</Text>
                <Text style={styles.actionDescription}>
                  Update your vehicle details
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.dangerItem}
              onPress={handleDeactivateAccount}
            >
              <View style={[styles.actionIcon, styles.warningIcon]}>
                <Ionicons name="pause-circle" size={20} color={Colors.warning} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.warningText]}>
                  Deactivate Account
                </Text>
                <Text style={styles.actionDescription}>
                  Temporarily disable your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerItem}
              onPress={handleDeleteAccount}
            >
              <View style={[styles.actionIcon, styles.errorIcon]}>
                <Ionicons name="trash" size={20} color={Colors.error} />
              </View>
              <View style={styles.actionContent}>
                <Text style={[styles.actionTitle, styles.errorText]}>
                  Delete Account
                </Text>
                <Text style={styles.actionDescription}>
                  Permanently delete your account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.info}
          />
          <Text style={styles.infoText}>
            If you deactivate your account, your profile will be hidden from riders
            and you won't receive ride requests. You can reactivate at any time.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
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
  editButton: {
    padding: Spacing.xs,
  },
  editButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  statusIcon: {
    marginRight: Spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.success,
    marginBottom: Spacing.xs / 2,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
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
  dangerTitle: {
    color: Colors.error,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  inputItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  inputLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  inputValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
  },
  textInput: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    backgroundColor: Colors.gray[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
    marginBottom: Spacing.xs / 2,
  },
  contactValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  warningIcon: {
    backgroundColor: Colors.warningLight,
  },
  errorIcon: {
    backgroundColor: Colors.errorLight,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  warningText: {
    color: Colors.warning,
  },
  errorText: {
    color: Colors.error,
  },
  actionDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
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
});
