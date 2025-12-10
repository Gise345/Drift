import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * HELP CENTER & FAQ SCREEN
 * 
 * Help resources:
 * - Searchable FAQ
 * - Common questions by category
 * - Quick help articles
 * - Contact support link
 */

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  count: number;
}

export default function HelpCenterScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket',
      count: 8,
    },
    {
      id: 'earnings',
      title: 'Earnings & Payments',
      icon: 'cash',
      count: 12,
    },
    {
      id: 'rides',
      title: 'Accepting Rides',
      icon: 'car',
      count: 15,
    },
    {
      id: 'documents',
      title: 'Documents & Verification',
      icon: 'document-text',
      count: 6,
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: 'person',
      count: 10,
    },
    {
      id: 'safety',
      title: 'Safety & Security',
      icon: 'shield-checkmark',
      count: 7,
    },
  ];

  // Import comprehensive FAQ data
  // NOTE: Update import path based on your project structure
  // For now, using inline data - in production, import from driver-faq-data.ts
  
  const faqs: FAQ[] = [
    // GETTING STARTED
    {
      id: 'gs-1',
      question: 'How do I become a Drift driver in the Cayman Islands?',
      answer: 'To become a Drift driver, you must: (1) Be at least 21 years old, (2) Have a valid Cayman Islands driver\'s license, (3) Own or lease a vehicle that meets our requirements, (4) Have valid vehicle insurance, and (5) Complete the online registration process. The approval process typically takes 3-5 business days.',
      category: 'Getting Started',
    },
    {
      id: 'gs-2',
      question: 'How do I start accepting rides?',
      answer: 'Once your registration is approved: (1) Open the Drift Driver app, (2) Go to your Dashboard, (3) Toggle the "Go Online" switch to start receiving ride requests in your area. When you receive a request, you\'ll have 15 seconds to accept or decline. Make sure you\'re in a safe location when going online.',
      category: 'Getting Started',
    },
    {
      id: 'gs-3',
      question: 'What hours can I drive?',
      answer: 'You can drive whenever you want - Drift operates 24/7 in the Cayman Islands. However, peak demand hours are typically: (1) Weekday mornings 7:00-9:00 AM, (2) Weekday evenings 5:00-7:00 PM, (3) Friday and Saturday nights 9:00 PM-2:00 AM, and (4) Cruise ship days near the port.',
      category: 'Getting Started',
    },
    
    // EARNINGS
    {
      id: 'earn-1',
      question: 'How much can I earn driving for Drift?',
      answer: 'On average, Drift drivers in the Cayman Islands earn CI$15-25 per hour after expenses. Peak times (mornings, evenings, weekends) can earn CI$25-35 per hour. Cruise ship days can be especially profitable. Your earnings depend on: trip distance, time, surge pricing, and tips.',
      category: 'Earnings',
    },
    {
      id: 'earn-2',
      question: 'When do I get paid?',
      answer: 'Drift pays drivers weekly every Tuesday for the previous week\'s trips (Monday-Sunday). Payments are automatically deposited to your registered bank account. The minimum payout is CI$25.00. If you earn less than CI$25 in a week, your earnings roll over to the next week.',
      category: 'Earnings',
    },
    {
      id: 'earn-3',
      question: 'How is the cost-sharing contribution calculated?',
      answer: 'The platform suggests cost-sharing contributions based on: (1) Distance traveled, (2) Estimated time, (3) Current fuel costs. A 20% platform service fee is deducted (4% for transaction processing + 16% for platform maintenance), so you receive 80% of each contribution.',
      category: 'Earnings',
    },
    {
      id: 'earn-4',
      question: 'Do I keep all of my tips?',
      answer: 'Yes! You keep 100% of all tips. Tips are added to your earnings within 24 hours and paid out with your weekly earnings. Riders can tip in the app after the trip or in cash. Cash tips are yours to keep immediately.',
      category: 'Earnings',
    },
    
    // RIDES
    {
      id: 'rides-1',
      question: 'How do ride requests work?',
      answer: 'When you\'re online, you\'ll receive ride requests based on your location. Each request shows: rider name and rating, pickup location and distance, destination, estimated earnings, and trip details. You have 15 seconds to accept or decline. Try to maintain an 85%+ acceptance rate.',
      category: 'Rides',
    },
    {
      id: 'rides-2',
      question: 'What if the rider doesn\'t show up?',
      answer: 'If you arrive at the pickup location and the rider doesn\'t appear: (1) Tap "I\'ve Arrived" in the app, (2) Wait 5 minutes at the location, (3) Try calling or texting the rider, (4) After 5 minutes, you can mark "Rider No-Show" and receive a CI$5.00 cancellation fee.',
      category: 'Rides',
    },
    {
      id: 'rides-3',
      question: 'Can I cancel a ride after accepting?',
      answer: 'Yes, but frequent cancellations hurt your rating. Valid cancellation reasons: (1) Rider requests to cancel, (2) Rider is taking too long (5+ minutes), (3) Safety concerns, (4) Vehicle emergency. Your cancellation rate should stay below 5%.',
      category: 'Rides',
    },
    {
      id: 'rides-4',
      question: 'What if a rider leaves something in my car?',
      answer: 'If a rider leaves an item: (1) Check "Lost & Found" in the trip details, (2) If the rider reported it, you\'ll see their contact info, (3) Contact them to arrange return, (4) If valuable, you can drop it at the Drift office at 142 Dorcy Drive, George Town. Keep items secure for up to 48 hours.',
      category: 'Rides',
    },
    
    // VEHICLE
    {
      id: 'vehicle-1',
      question: 'What are the vehicle requirements?',
      answer: 'Your vehicle must: (1) Be 2015 or newer, (2) Have 4 doors and seat at least 4 passengers, (3) Pass annual vehicle inspection, (4) Have valid registration and insurance, (5) Be in good condition (no damage, clean interior), (6) Have working AC (essential in Cayman!).',
      category: 'Vehicle',
    },
    {
      id: 'vehicle-2',
      question: 'What insurance do I need?',
      answer: 'You need comprehensive vehicle insurance that covers ride-sharing. Drift provides insurance during active trips (from pickup to drop-off), but you need personal insurance for when you\'re offline or waiting for rides. Contact local insurers like Cayman First, Brittanic, or Atlas for ride-sharing coverage.',
      category: 'Vehicle',
    },
    {
      id: 'vehicle-3',
      question: 'How often do I need vehicle inspection?',
      answer: 'Your vehicle must pass a vehicle inspection annually. You\'ll receive a reminder 30 days before your inspection expires. Cost is typically CI$30-50. Upload your updated inspection certificate in the app within 7 days of expiry.',
      category: 'Vehicle',
    },
    
    // SAFETY
    {
      id: 'safety-1',
      question: 'What should I do if I feel unsafe during a trip?',
      answer: 'Your safety is priority #1. If you feel unsafe: (1) Trust your instincts, (2) Tap the Emergency SOS button in the app, (3) Drive to a well-lit, public area if possible, (4) Call 911 if necessary, (5) End the trip and ask the rider to exit, (6) Report the incident to Drift support immediately.',
      category: 'Safety',
    },
    {
      id: 'safety-2',
      question: 'What if I\'m in an accident during a trip?',
      answer: 'If you\'re in an accident during a trip: (1) Check everyone is safe - call 911 if injuries, (2) Call RCIPS if required (345-949-4222), (3) Take photos of damage, (4) Use the in-app incident report immediately, (5) Contact Drift support (345-945-7433). Drift\'s insurance will handle claims.',
      category: 'Safety',
    },
    {
      id: 'safety-3',
      question: 'Can I install a dashcam?',
      answer: 'Yes, dashcams are highly recommended! They protect you in case of accidents, false claims, or disputes. Requirements: (1) Must inform riders with visible signage, (2) Audio recording may require consent in Cayman. Cost: CI$50-200 for good quality.',
      category: 'Safety',
    },
    
    // ACCOUNT
    {
      id: 'account-1',
      question: 'How does the rating system work?',
      answer: 'After each trip, riders rate you 1-5 stars. Your overall rating is the average of your last 100 trips. Maintain 4.7+ stars to stay in good standing. Ratings below 4.5 may result in account review. Tips: be polite, keep vehicle clean, drive safely, arrive on time.',
      category: 'Account',
    },
    {
      id: 'account-2',
      question: 'Can I change my payout bank account?',
      answer: 'Yes! Go to Settings > Payout Methods, add your new bank account details, verify your account, set as default. Changes take effect on the next payout. Make sure the account is in your name and a Cayman Islands bank.',
      category: 'Account',
    },
    
    // TECHNICAL
    {
      id: 'tech-1',
      question: 'What if the app isn\'t working properly?',
      answer: 'If you experience app issues: (1) Check your internet connection, (2) Close and restart the app, (3) Update to the latest version, (4) Restart your phone, (5) Clear app cache, (6) Reinstall if problems persist. For urgent issues during a trip, contact support at 345-945-7433.',
      category: 'Technical',
    },
    {
      id: 'tech-2',
      question: 'What if GPS navigation isn\'t accurate?',
      answer: 'GPS accuracy can vary in Cayman. Tips: (1) Enable "High Accuracy" location in phone settings, (2) Ensure location permissions are "Always Allow", (3) Use Wi-Fi to improve accuracy, (4) You can use Google Maps or Waze alongside Drift, (5) Report GPS issues to support.',
      category: 'Technical',
    },
  ];

  const filteredFAQs = searchQuery
    ? faqs.filter(
        faq =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
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
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={Colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        {!searchQuery && (
          <>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(driver)/support/contact')}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons
                    name="chatbubbles"
                    size={24}
                    color={Colors.primary[500]}
                  />
                </View>
                <Text style={styles.quickActionTitle}>Contact Support</Text>
                <Text style={styles.quickActionText}>Get help from our team</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(driver)/active-ride/emergency-sos')}
              >
                <View style={[styles.quickActionIcon, styles.emergencyIcon]}>
                  <Ionicons name="alert" size={24} color={Colors.error[500]} />
                </View>
                <Text style={styles.quickActionTitle}>Emergency</Text>
                <Text style={styles.quickActionText}>Call 911 or get help</Text>
              </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Browse by Category</Text>
              <View style={styles.categoriesGrid}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      // Filter FAQs by category
                      console.log('Filter by:', category.id);
                    }}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={category.icon as any}
                        size={24}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryCount}>
                      {category.count} articles
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? 'Search Results' : 'Frequently Asked Questions'}
          </Text>
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={Colors.gray[400]}
              />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyText}>
                Try a different search term or browse categories
              </Text>
            </View>
          ) : (
            <View style={styles.faqList}>
              {filteredFAQs.map(faq => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={
                        expandedFAQ === faq.id
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
                      size={20}
                      color={Colors.gray[400]}
                    />
                  </View>
                  {expandedFAQ === faq.id && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Still Need Help */}
        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={40} color={Colors.primary[500]} />
          <Text style={styles.helpCardTitle}>Still need help?</Text>
          <Text style={styles.helpCardText}>
            Can't find what you're looking for? Our support team is here to help.
          </Text>
          <TouchableOpacity
            style={styles.helpCardButton}
            onPress={() => router.push('/(driver)/support/contact')}
          >
            <Text style={styles.helpCardButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
    marginLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyIcon: {
    backgroundColor: Colors.error[50],
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  categoryCount: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  faqList: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  faqCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    marginTop: Spacing.md,
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: Colors.white,
    padding: Spacing.xl * 2,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  helpCard: {
    backgroundColor: Colors.primary[50],
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  helpCardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  helpCardText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  helpCardButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 12,
  },
  helpCardButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});