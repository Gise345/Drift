import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';

/**
 * PRIVACY & SECURITY SETTINGS SCREEN
 *
 * Manage privacy and security settings:
 * - Location sharing
 * - Data sharing preferences
 * - Two-factor authentication
 * - Login activity
 * - Connected devices
 */

export default function PrivacySecurityScreen() {
  const { user } = useAuthStore();

  // Privacy settings
  const [shareLocationWithRiders, setShareLocationWithRiders] = useState(true);
  const [shareProfilePhoto, setShareProfilePhoto] = useState(true);
  const [shareRating, setShareRating] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleToggleTwoFactor = () => {
    if (!twoFactorEnabled) {
      Alert.alert(
        'Enable Two-Factor Authentication',
        'This will add an extra layer of security to your account. You will need to verify your identity when logging in from a new device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setTwoFactorEnabled(true);
              Alert.alert('Success', 'Two-factor authentication has been enabled.');
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => setTwoFactorEnabled(false),
          },
        ]
      );
    }
  };

  const handleToggleBiometric = () => {
    if (!biometricEnabled) {
      Alert.alert(
        'Enable Biometric Login',
        'Use Face ID or fingerprint to quickly and securely access your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: () => {
              setBiometricEnabled(true);
              Alert.alert('Success', 'Biometric login has been enabled.');
            },
          },
        ]
      );
    } else {
      setBiometricEnabled(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email address.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: () => {
            Alert.alert('Email Sent', 'Check your email for the password reset link.');
          },
        },
      ]
    );
  };

  const handleViewLoginActivity = () => {
    Alert.alert('Coming Soon', 'Login activity tracking will be available in a future update.');
  };

  const handleManageDevices = () => {
    Alert.alert('Coming Soon', 'Device management will be available in a future update.');
  };

  const handleDownloadData = () => {
    Alert.alert(
      'Download Your Data',
      'We will prepare a copy of your data. This may take up to 48 hours. You will receive an email when it\'s ready.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Download',
          onPress: () => {
            Alert.alert('Request Submitted', 'You will receive an email when your data is ready to download.');
          },
        },
      ]
    );
  };

  const saveSettings = () => {
    Alert.alert('Success', 'Privacy settings saved!');
    router.back();
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
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.sectionContent}>
            {/* <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="location"
                  size={20}
                  color={shareLocationWithRiders ? Colors.primary : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Share Location with Riders</Text>
                <Text style={styles.settingDescription}>
                  Allow riders to see your location during trips
                </Text>
              </View>
              <Switch
                value={shareLocationWithRiders}
                onValueChange={setShareLocationWithRiders}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View> */}

            {/* <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="person-circle"
                  size={20}
                  color={shareProfilePhoto ? Colors.primary : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Show Profile Photo</Text>
                <Text style={styles.settingDescription}>
                  Display your photo to riders
                </Text>
              </View>
              <Switch
                value={shareProfilePhoto}
                onValueChange={setShareProfilePhoto}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View> */}

            {/* <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="star"
                  size={20}
                  color={shareRating ? Colors.primary : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Show Rating</Text>
                <Text style={styles.settingDescription}>
                  Display your rating to riders
                </Text>
              </View>
              <Switch
                value={shareRating}
                onValueChange={setShareRating}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View> */}

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="analytics"
                  size={20}
                  color={allowAnalytics ? Colors.primary : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Analytics & Improvements</Text>
                <Text style={styles.settingDescription}>
                  Help us improve by sharing usage data
                </Text>
              </View>
              <Switch
                value={allowAnalytics}
                onValueChange={setAllowAnalytics}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={twoFactorEnabled ? Colors.success : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>
                  {twoFactorEnabled ? 'Enabled - Extra security active' : 'Add extra security to your account'}
                </Text>
              </View>
              <Switch
                value={twoFactorEnabled}
                onValueChange={handleToggleTwoFactor}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.success,
                }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="finger-print"
                  size={20}
                  color={biometricEnabled ? Colors.primary : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Biometric Login</Text>
                <Text style={styles.settingDescription}>
                  Use Face ID or fingerprint to login
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleToggleBiometric}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary,
                }}
                thumbColor={Colors.white}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={handleChangePassword}>
              <View style={styles.settingIcon}>
                <Ionicons name="key" size={20} color={Colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingDescription}>
                  Update your account password
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
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Your privacy matters to us. We only collect data necessary to provide
            our services. You can request a copy of your data or delete your account
            at any time.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
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
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight + '30',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
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
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
