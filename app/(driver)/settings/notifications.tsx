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

/**
 * NOTIFICATION PREFERENCES SCREEN
 * 
 * Manage notification settings:
 * - Push notifications on/off
 * - Ride requests
 * - Earnings updates
 * - Promotions
 * - System updates
 * - Sound and vibration
 */

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: string;
}

export default function NotificationPreferencesScreen() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'master',
      title: 'Push Notifications',
      description: 'Enable all push notifications',
      enabled: true,
      icon: 'notifications',
    },
    {
      id: 'ride_requests',
      title: 'Ride Requests',
      description: 'New ride request notifications',
      enabled: true,
      icon: 'car',
    },
    {
      id: 'ride_updates',
      title: 'Ride Updates',
      description: 'Updates on active rides',
      enabled: true,
      icon: 'information-circle',
    },
    {
      id: 'earnings',
      title: 'Earnings',
      description: 'Payment confirmations and earnings updates',
      enabled: true,
      icon: 'cash',
    },
    {
      id: 'promotions',
      title: 'Promotions',
      description: 'Special offers and bonuses',
      enabled: true,
      icon: 'pricetag',
    },
    {
      id: 'tips',
      title: 'Tips & Feedback',
      description: 'Rider tips and feedback notifications',
      enabled: true,
      icon: 'star',
    },
    {
      id: 'system',
      title: 'System Updates',
      description: 'App updates and important announcements',
      enabled: true,
      icon: 'construct',
    },
    {
      id: 'reminders',
      title: 'Reminders',
      description: 'Document expiry and scheduled reminders',
      enabled: true,
      icon: 'alarm',
    },
  ]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  const toggleSetting = (id: string) => {
    if (id === 'master') {
      const newValue = !settings.find(s => s.id === 'master')?.enabled;
      setSettings(prev =>
        prev.map(setting => ({ ...setting, enabled: newValue }))
      );
      if (!newValue) {
        Alert.alert(
          'Disable Notifications',
          'You will not receive any notifications. You may miss ride requests.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Disable', style: 'destructive' },
          ]
        );
      }
    } else {
      setSettings(prev =>
        prev.map(setting =>
          setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
        )
      );
    }
  };

  const saveSettings = () => {
    // TODO: Save to Firebase/AsyncStorage
    Alert.alert('Success', 'Notification preferences saved!');
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Master Switch */}
        <View style={styles.masterSection}>
          <View style={styles.masterIcon}>
            <Ionicons
              name="notifications"
              size={32}
              color={settings[0].enabled ? Colors.primary[500] : Colors.gray[400]}
            />
          </View>
          <View style={styles.masterContent}>
            <Text style={styles.masterTitle}>Push Notifications</Text>
            <Text style={styles.masterSubtitle}>
              {settings[0].enabled
                ? 'All notifications enabled'
                : 'All notifications disabled'}
            </Text>
          </View>
          <Switch
            value={settings[0].enabled}
            onValueChange={() => toggleSetting('master')}
            trackColor={{
              false: Colors.gray[300],
              true: Colors.primary[500],
            }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
          <View style={styles.sectionContent}>
            {settings.slice(1).map(setting => (
              <View key={setting.id} style={styles.settingItem}>
                <View
                  style={[
                    styles.settingIcon,
                    !settings[0].enabled && styles.settingIconDisabled,
                  ]}
                >
                  <Ionicons
                    name={setting.icon as any}
                    size={20}
                    color={
                      settings[0].enabled && setting.enabled
                        ? Colors.primary[500]
                        : Colors.gray[400]
                    }
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text
                    style={[
                      styles.settingTitle,
                      !settings[0].enabled && styles.settingTitleDisabled,
                    ]}
                  >
                    {setting.title}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {setting.description}
                  </Text>
                </View>
                <Switch
                  value={setting.enabled && settings[0].enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  disabled={!settings[0].enabled}
                  trackColor={{
                    false: Colors.gray[300],
                    true: Colors.primary[500],
                  }}
                  thumbColor={Colors.white}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Alert Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Settings</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="volume-high"
                  size={20}
                  color={soundEnabled ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound for notifications
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                disabled={!settings[0].enabled}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="phone-portrait"
                  size={20}
                  color={vibrationEnabled ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Vibration</Text>
                <Text style={styles.settingDescription}>
                  Vibrate for notifications
                </Text>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                disabled={!settings[0].enabled}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="chatbox"
                  size={20}
                  color={inAppEnabled ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>In-App Notifications</Text>
                <Text style={styles.settingDescription}>
                  Show notifications while using the app
                </Text>
              </View>
              <Switch
                value={inAppEnabled}
                onValueChange={setInAppEnabled}
                disabled={!settings[0].enabled}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary[500]}
          />
          <Text style={styles.infoText}>
            Disabling ride request notifications may cause you to miss ride
            opportunities. We recommend keeping this enabled while online.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  masterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  masterIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  masterContent: {
    flex: 1,
  },
  masterTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  masterSubtitle: {
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
  settingIconDisabled: {
    opacity: 0.5,
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
  settingTitleDisabled: {
    color: Colors.gray[400],
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    marginLeft: Spacing.sm,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
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