import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: October 25, 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Platform Nature</Text>
          <Text style={styles.paragraph}>
            Drift is a technology platform that facilitates peer-to-peer carpooling connections. We are NOT a transportation provider, taxi service, or for-hire vehicle operator. All rides arranged through Drift are private, voluntary arrangements between independent users.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
          <Text style={styles.paragraph}>
            As a user, you agree to: {'\n'}
            • Maintain valid insurance coverage{'\n'}
            • Comply with all local traffic laws{'\n'}
            • Verify the identity of your ride partners{'\n'}
            • Accept full liability for your actions{'\n'}
            • Not use the platform for commercial transport
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Cost Sharing</Text>
          <Text style={styles.paragraph}>
            Cost contributions are voluntary and should reflect actual trip expenses (fuel, tolls, parking). Drift does not set prices or fares. Any financial arrangements are solely between users. We process payments as a convenience service only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Liability Disclaimer</Text>
          <Text style={styles.paragraph}>
            Drift provides a platform only and assumes NO liability for: {'\n'}
            • User conduct or safety{'\n'}
            • Vehicle condition or accidents{'\n'}
            • Personal injury or property damage{'\n'}
            • Insurance coverage disputes{'\n'}
            • Financial transactions between users
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Account Termination</Text>
          <Text style={styles.paragraph}>
            We reserve the right to suspend or terminate accounts for violations of these terms, fraudulent activity, or behavior that compromises safety or platform integrity.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Collection</Text>
          <Text style={styles.paragraph}>
            We collect location data, trip information, and user interactions as described in our Privacy Policy. By using Drift, you consent to this data collection and processing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Governing Law</Text>
          <Text style={styles.paragraph}>
            These terms are governed by the laws of the Cayman Islands. Any disputes shall be resolved through arbitration in George Town, Grand Cayman.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
          <Text style={styles.paragraph}>
            We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
          </Text>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions about these terms?</Text>
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