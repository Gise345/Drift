import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen() {
  const router = useRouter();

  const helpCategories = [
    { icon: 'help-circle', title: 'FAQ', subtitle: 'Find answers to common questions', route: '/(rider)/faq' },
    { icon: 'mail', title: 'Contact Support', subtitle: 'Get help from our team', route: '/(rider)/contact-us' },
    { icon: 'document-text', title: 'Terms & Conditions', subtitle: 'Read our terms of service', route: '/(rider)/terms' },
    { icon: 'shield-checkmark', title: 'Privacy Policy', subtitle: 'How we protect your data', route: '/(rider)/privacy' },
    { icon: 'information-circle', title: 'About Drift', subtitle: 'Learn more about us', route: '/(rider)/about' },
    { icon: 'warning', title: 'Report Issue', subtitle: 'Report a problem', route: '/(rider)/report-issue' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>How can we help you today?</Text>

        {helpCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryCard}
            onPress={() => router.push(category.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryIconContainer}>
              <Ionicons name={category.icon as any} size={24} color="#5d1289ff" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        <View style={styles.emergencyCard}>
          <Ionicons name="warning" size={24} color="#EF4444" />
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyTitle}>Emergency?</Text>
            <Text style={styles.emergencyText}>Call 911 or local emergency services</Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>Our support team is available 24/7</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  intro: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  categoryIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  categorySubtitle: { fontSize: 13, color: '#6B7280' },
  emergencyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: 16, borderRadius: 16, marginTop: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5' },
  emergencyInfo: { marginLeft: 12, flex: 1 },
  emergencyTitle: { fontSize: 16, fontWeight: '700', color: '#DC2626', marginBottom: 2 },
  emergencyText: { fontSize: 13, color: '#991B1B' },
  contactCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  contactTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 8 },
  contactText: { fontSize: 14, color: '#6B7280', marginBottom: 16, textAlign: 'center' },
  contactButton: { backgroundColor: '#5d1289ff', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  contactButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});