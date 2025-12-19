import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Drift</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Drift</Text>
          <Text style={styles.tagline}>Cayman's Private Carpool Network</Text>
        </View>

        {/* Version */}
        <View style={styles.versionCard}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.buildNumber}>Build 2025.10.1</Text>
        </View>

        {/* About Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is Drift?</Text>
          <Text style={styles.paragraph}>
            Drift is a decentralized peer-to-peer mobility platform that connects independent drivers and riders for
            private, cost-sharing journeys across the Cayman Islands.
          </Text>
          <Text style={styles.paragraph}>
            We facilitate communication and coordination between community members who want to share rides and split costs.
            Drift is NOT a taxi service or for-hire transport provider—it's a technology platform enabling voluntary carpooling.
          </Text>
        </View>

        {/* Mission */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            To create a sustainable, community-driven transportation network that reduces traffic congestion, lowers carbon
            emissions, reduces drink-driving, provides a safe way to travel, and makes mobility more affordable for everyone in Cayman.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          {[
            { icon: 'shield-checkmark', title: 'Safety First', desc: 'Verified users and secure platform' },
            { icon: 'people', title: 'Community', desc: 'Building connections through shared rides' },
            { icon: 'leaf', title: 'Sustainability', desc: 'Reducing our environmental impact' },
            { icon: 'speedometer', title: 'Transparency', desc: 'Clear terms and honest communication' },
          ].map((value, index) => (
            <View key={index} style={styles.valueItem}>
              <View style={styles.valueIcon}>
                <Ionicons name={value.icon as any} size={24} color="#5d1289ff" />
              </View>
              <View style={styles.valueText}>
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDesc}>{value.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="mail-outline" size={20} color="#5d1289ff" />
            <Text style={styles.contactText}>info@drift-global.com</Text>
          </TouchableOpacity>
          
        </View>

        {/* Legal Links */}
        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => router.push('/(rider)/terms')}>
            <Text style={styles.linkText}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>•</Text>
          <TouchableOpacity onPress={() => router.push('/(rider)/privacy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>© 2025 Drift. All rights reserved.</Text>
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
  logoContainer: { alignItems: 'center', paddingVertical: 32 },
  logo: { fontSize: 48, fontWeight: '700', color: '#5d1289ff' },
  tagline: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  versionCard: { alignItems: 'center', backgroundColor: '#F9FAFB', paddingVertical: 12, marginHorizontal: 24, borderRadius: 12, marginBottom: 24 },
  version: { fontSize: 14, fontWeight: '600', color: '#000' },
  buildNumber: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12 },
  paragraph: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 12 },
  valueItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  valueIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  valueText: { flex: 1, paddingTop: 4 },
  valueTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 2 },
  valueDesc: { fontSize: 13, color: '#6B7280' },
  contactItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  contactText: { fontSize: 14, color: '#5d1289ff', marginLeft: 12, fontWeight: '500' },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  linkText: { fontSize: 13, color: '#5d1289ff', fontWeight: '500' },
  separator: { fontSize: 13, color: '#D1D5DB', marginHorizontal: 8 },
  copyright: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },
});