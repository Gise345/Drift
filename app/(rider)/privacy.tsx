import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: October 25, 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            We collect information you provide directly, including: {'\n'}
            • Account information (name, email, phone){'\n'}
            • Profile details and photos{'\n'}
            • Payment information{'\n'}
            • Location data during trips{'\n'}
            • Trip history and preferences
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            Your data is used to: {'\n'}
            • Facilitate carpool connections{'\n'}
            • Process payments and receipts{'\n'}
            • Improve platform features{'\n'}
            • Ensure safety and security{'\n'}
            • Comply with legal obligations
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Location Data</Text>
          <Text style={styles.paragraph}>
            We collect location data only when you use the app and during active trips. This helps match you with nearby users, calculate routes, and provide accurate trip information. You can disable location services, but this will limit platform functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Sharing</Text>
          <Text style={styles.paragraph}>
            We share your data with: {'\n'}
            • Other users (limited to trip details){'\n'}
            • Payment processors (Stripe){'\n'}
            • Cloud service providers (Firebase){'\n'}
            • Law enforcement (when required){'\n'}
            We never sell your personal information.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard security measures including encryption, secure servers, and regular security audits. However, no system is 100% secure, and we cannot guarantee absolute security.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.paragraph}>
            You have the right to: {'\n'}
            • Access your personal data{'\n'}
            • Request data correction or deletion{'\n'}
            • Opt out of marketing communications{'\n'}
            • Export your trip history{'\n'}
            • Close your account at any time
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your data for as long as your account is active and for up to 5 years after closure for legal and safety purposes. Trip data is anonymized after 2 years.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Compliance</Text>
          <Text style={styles.paragraph}>
            We comply with the Cayman Islands Data Protection Act and GDPR requirements for European users. For data protection inquiries, contact privacy@driftcayman.com
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Privacy concerns?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(rider)/contact-us')}
          >
            <Text style={styles.contactButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1 },
  lastUpdated: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16, backgroundColor: '#F9FAFB' },
  section: { paddingHorizontal: 24, paddingVertical: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#374151', lineHeight: 22 },
  contactSection: { padding: 24, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 16 },
  contactTitle: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  contactButton: { backgroundColor: '#5d1289ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  contactButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});