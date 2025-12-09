import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { softDeleteAccount } from '@/src/services/firebase-auth-service';

export default function SettingsScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This action cannot be undone. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await softDeleteAccount('User requested deletion from settings');
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been deleted. Thank you for using Drift.',
                        [{ text: 'OK', onPress: () => router.replace('/(auth)/welcome') }]
                      );
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
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

  const settingSections = [
    {
      title: 'General',
      items: [
        { icon: 'language', title: 'Language', value: 'English', route: '/(rider)/language' },
        { icon: 'speedometer', title: 'Distance Unit', value: 'Kilometers', route: '/(rider)/units' },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { icon: 'location', title: 'Location Services', toggle: true, value: locationServices, onToggle: setLocationServices },
        { icon: 'notifications', title: 'Notifications', route: '/(rider)/notifications' },
      ],
    },
    {
      title: 'Appearance',
      items: [
        { icon: 'moon', title: 'Dark Mode', toggle: true, value: darkMode, onToggle: setDarkMode },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'trash', title: 'Delete Account', value: '', isDanger: true, action: handleDeleteAccount },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {isDeleting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#5d1289ff" />
            <Text style={styles.loadingText}>Deleting account...</Text>
          </View>
        )}
        {settingSections.map((section, idx) => (
            <View
              // @ts-expect-error - key prop is valid in React but TS defs don't reflect this
              key={idx}
              style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={itemIdx}
                  style={styles.settingRow}
                  onPress={
                    'action' in item && item.action
                      ? item.action
                      : 'route' in item
                      ? () => router.push(item.route as any)
                      : undefined
                  }
                  disabled={('toggle' in item && item.toggle) || isDeleting}
                >
                  <View style={[styles.iconContainer, 'isDanger' in item && item.isDanger && styles.dangerIconContainer]}>
                    <Ionicons name={item.icon as any} size={20} color={'isDanger' in item && item.isDanger ? '#EF4444' : '#5d1289ff'} />
                  </View>
                  <Text style={[styles.settingTitle, 'isDanger' in item && item.isDanger && styles.dangerText]}>{item.title}</Text>
                  {'toggle' in item && item.toggle ? (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#E5E7EB', true: '#5d1289ff' }}
                      thumbColor="#FFF"
                    />
                  ) : (
                    <View style={styles.valueContainer}>
                      <Text style={styles.valueText}>{item.value as string}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dangerIconContainer: { backgroundColor: '#FEE2E2' },
  settingTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#000' },
  dangerText: { color: '#EF4444' },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: 14, color: '#6B7280' },
  loadingOverlay: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#6B7280' },
});