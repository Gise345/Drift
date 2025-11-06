import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function EmergencySOS() {
  const router = useRouter();

  const handleCall911 = () => {
    Alert.alert(
      'Call Emergency Services?',
      'This will call 911 immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call 911',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:911'),
        },
      ]
    );
  };

  const handleShareLocation = () => {
    Alert.alert('Success', 'Your location has been shared with emergency contacts');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.sosIcon}>
          <Ionicons name="alert-circle" size={100} color={Colors.error} />
        </View>

        <Text style={styles.title}>Emergency Assistance</Text>
        <Text style={styles.subtitle}>
          Get immediate help in case of emergency
        </Text>

        <TouchableOpacity style={styles.call911Button} onPress={handleCall911}>
          <Ionicons name="call" size={32} color={Colors.white} />
          <Text style={styles.call911Text}>Call 911</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.actionsList}>
          <TouchableOpacity style={styles.actionCard} onPress={handleShareLocation}>
            <Ionicons name="location" size={32} color={Colors.primary} />
            <Text style={styles.actionTitle}>Share Location</Text>
            <Text style={styles.actionDescription}>
              Send your live location to emergency contacts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            <Text style={styles.actionTitle}>Contact Support</Text>
            <Text style={styles.actionDescription}>
              Reach Drift's 24/7 safety team
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="warning" size={32} color={Colors.primary} />
            <Text style={styles.actionTitle}>Report Incident</Text>
            <Text style={styles.actionDescription}>
              Report a safety concern immediately
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl },
  sosIcon: { alignItems: 'center', marginBottom: Spacing.xl },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  call911Button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.error,
    borderRadius: 16,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  call911Text: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray[300] },
  dividerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginHorizontal: Spacing.md,
  },
  actionsList: { gap: Spacing.md },
  actionCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  actionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});