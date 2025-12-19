import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth-store';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';

// Initialize Firebase instances
const app = getApp();
const db = getFirestore(app, 'main');

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    rideUpdates: true,
    driverMessages: true,
    paymentAlerts: true,
    tripReminders: true,
    emailNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Load notification settings from Firebase
  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    // Use id or uid depending on what's available
    const userId = user?.id || (user as any)?.uid;

    if (!userId) {
      console.log('No user ID available for loading settings');
      setLoading(false);
      return;
    }

    try {
      console.log('Loading notification settings for user:', userId);
      // Load from user document directly (more reliable than subcollection)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const notifSettings = userData?.notificationSettings;

        if (notifSettings) {
          console.log('Loaded notification settings:', notifSettings);
          setSettings({
            rideUpdates: notifSettings?.rideUpdates ?? true,
            driverMessages: notifSettings?.driverMessages ?? true,
            paymentAlerts: notifSettings?.paymentAlerts ?? true,
            tripReminders: notifSettings?.tripReminders ?? true,
            emailNotifications: notifSettings?.emailNotifications ?? true,
          });
        } else {
          console.log('No existing notification settings found, using defaults');
        }
      }
    } catch (error: any) {
      console.error('Error loading notification settings:', error?.message || error);
      // Don't show error for common cases
      if (error?.code !== 'permission-denied' && error?.code !== 'not-found') {
        Alert.alert('Error', 'Failed to load notification settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    // Use id or uid depending on what's available
    const userId = user?.id || (user as any)?.uid;

    if (!userId) {
      Alert.alert('Error', 'Please sign in to change notification settings.');
      return;
    }

    const newValue = !settings[key];
    const previousValue = settings[key];

    // Optimistic update
    setSettings(prev => ({ ...prev, [key]: newValue }));
    setSaving(key);

    try {
      console.log('Saving notification setting:', key, '=', newValue, 'for user:', userId);
      // Save to user document directly (more reliable)
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationSettings: {
          ...settings,
          [key]: newValue,
        },
        notificationSettingsUpdatedAt: serverTimestamp(),
      });
      console.log('Successfully saved notification setting');
      // Success - setting was saved
    } catch (error: any) {
      console.error('Error saving notification setting:', error?.message || error, error?.code);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: previousValue }));
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5d1289" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionHeader}>Push Notifications</Text>
        {[
          { key: 'rideUpdates', title: 'Ride Updates', subtitle: 'Trip status and driver location', icon: 'car-outline' },
          { key: 'driverMessages', title: 'Driver Messages', subtitle: 'Messages from your driver', icon: 'chatbubble-outline' },
          { key: 'paymentAlerts', title: 'Payment Alerts', subtitle: 'Transaction confirmations', icon: 'card-outline' },
          { key: 'tripReminders', title: 'Trip Reminders', subtitle: 'Upcoming ride notifications', icon: 'alarm-outline' },
        ].map((item) => (
            <View
              key={item.key}
              style={styles.settingRow}>
              <View style={styles.iconContainer}>
                <Ionicons name={item.icon as any} size={22} color="#5d1289" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              {saving === item.key ? (
                <ActivityIndicator size="small" color="#5d1289" />
              ) : (
                <Switch
                  value={settings[item.key as keyof typeof settings]}
                  onValueChange={() => toggleSetting(item.key as keyof typeof settings)}
                  trackColor={{ false: '#E5E7EB', true: '#5d1289' }}
                  thumbColor="#FFF"
                />
              )}
            </View>
        ))}

        <Text style={styles.sectionHeader}>Email</Text>
        <View style={styles.settingRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={22} color="#5d1289" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Email Notifications</Text>
            <Text style={styles.settingSubtitle}>Trip receipts and updates</Text>
          </View>
          {saving === 'emailNotifications' ? (
            <ActivityIndicator size="small" color="#5d1289" />
          ) : (
            <Switch
              value={settings.emailNotifications}
              onValueChange={() => toggleSetting('emailNotifications')}
              trackColor={{ false: '#E5E7EB', true: '#5d1289' }}
              thumbColor="#FFF"
            />
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Your notification preferences are saved automatically and synced across all your devices.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  content: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  settingSubtitle: { fontSize: 13, color: '#6B7280' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginTop: 8, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
});