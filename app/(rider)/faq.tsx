import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function FAQScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'What is Drift?',
      answer: 'Drift is a peer-to-peer carpooling platform that connects riders and drivers for cost-sharing rides. We facilitate private arrangements between community members.',
    },
    {
      id: 2,
      question: 'How do I request a ride?',
      answer: 'Open the app, enter your destination, select a vehicle type, choose your payment method, and tap "Request Ride". You\'ll be matched with a nearby driver.',
    },
    {
      id: 3,
      question: 'Is Drift a taxi service?',
      answer: 'No. Drift is NOT a taxi or for-hire transport service. We\'re a technology platform that facilitates private carpooling between independent users.',
    },
    {
      id: 4,
      question: 'How does cost-sharing work?',
      answer: 'Cost contributions are voluntary and should reflect actual trip expenses like fuel and parking. Drift processes payments as a convenience only.',
    },
    {
      id: 5,
      question: 'How do I become a driver?',
      answer: 'Download the Drift driver app, complete the registration process, upload required documents (license, insurance), and wait for approval.',
    },
    {
      id: 6,
      question: 'What if I need to cancel?',
      answer: 'You can cancel a ride from the trip screen. Note that frequent cancellations may affect your account standing.',
    },
    {
      id: 7,
      question: 'How do I contact my driver?',
      answer: 'Once matched, you can call or message your driver directly through the app using the contact buttons.',
    },
    {
      id: 8,
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards (Visa, Mastercard) and cash. You can add payment methods in your profile settings.',
    },
    {
      id: 9,
      question: 'How is my data protected?',
      answer: 'We follow strict data protection standards and comply with GDPR. Location data is only collected during active trips. See our Privacy Policy for details.',
    },
    {
      id: 10,
      question: 'What if I have a safety concern?',
      answer: 'Use the in-app SOS button for emergencies. For non-urgent issues, contact our support team immediately.',
    },
  ];

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Frequently Asked Questions</Text>

        {faqs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={styles.faqCard}
            onPress={() => toggleExpand(faq.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.question}>{faq.question}</Text>
              <Ionicons
                name={expandedId === faq.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#5d1289ff"
              />
            </View>
            {expandedId === faq.id && (
              <Text style={styles.answer}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Didn't find what you're looking for?</Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(rider)/contact-us')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
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
  faqCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  question: { fontSize: 16, fontWeight: '600', color: '#000', flex: 1, marginRight: 12 },
  answer: { fontSize: 14, color: '#6B7280', marginTop: 12, lineHeight: 22 },
  helpCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 16, alignItems: 'center', marginTop: 12, marginBottom: 24 },
  helpTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 16, textAlign: 'center' },
  contactButton: { backgroundColor: '#5d1289ff', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 },
  contactButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});