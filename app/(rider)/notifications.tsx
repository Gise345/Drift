import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth-store';
import firestore from '@react-native-firebase/firestore';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState({
    rideUpdates: true,
    promotions: false,
    driverMessages: true,
    paymentAlerts: true,
    tripReminders: true,
    emailNotifications: true,
  });
  const [loading, setLoading] = useState(true);

  // Load notification settings from Firebase
  useEffect(() => {
    loadSettings();
  }, [user?.id]);

  const loadSettings = async () => {
    if (!user?.id) return;

    try {
      const doc = await firestore()
        .collection('users')
        .doc(user.id)
        .collection('settings')
        .doc('notifications')
        .get();

      if (doc.exists) {
        const data = doc.data();
        setSettings({
          rideUpdates: data?.rideUpdates ?? true,
          promotions: data?.promotions ?? false,
          driverMessages: data?.driverMessages ?? true,
          paymentAlerts: data?.paymentAlerts ?? true,
          tripReminders: data?.tripReminders ?? true,
          emailNotifications: data?.emailNotifications ?? true,
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    if (!user?.id) return;

    const newValue = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newValue }));

    try {
      // Save to Firebase
      await firestore()
        .collection('users')
        .doc(user.id)
        .collection('settings')
        .doc('notifications')
        .set(
          { [key]: newValue, updatedAt: firestore.FieldValue.serverTimestamp() },
          { merge: true }
        );
    } catch (error) {
      console.error('Error saving notification setting:', error);
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    }
  };

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
        {[
          { key: 'rideUpdates', title: 'Ride Updates', subtitle: 'Trip status and driver location' },
          { key: 'driverMessages', title: 'Driver Messages', subtitle: 'Messages from your driver' },
          { key: 'paymentAlerts', title: 'Payment Alerts', subtitle: 'Transaction confirmations' },
          { key: 'tripReminders', title: 'Trip Reminders', subtitle: 'Upcoming ride notifications' },
          { key: 'promotions', title: 'Promotions & Offers', subtitle: 'Deals and discounts' },
          { key: 'emailNotifications', title: 'Email Notifications', subtitle: 'Trip receipts and updates' },
        ].map((item) => (
            <View
              // @ts-expect-error - key prop is valid in React but TS defs don't reflect this
              key={item.key}
              style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings]}
                onValueChange={() => toggleSetting(item.key as keyof typeof settings)}
                trackColor={{ false: '#E5E7EB', true: '#5d1289ff' }}
                thumbColor="#FFF"
              />
            </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  settingInfo: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  settingSubtitle: { fontSize: 13, color: '#6B7280' },
});