import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * CONTACT SUPPORT SCREEN
 * 
 * Multiple ways to contact support:
 * - Submit ticket with issue category
 * - Call support hotline
 * - Email support
 * - Live chat (if available)
 * - Social media links
 */

interface SupportOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  color?: string;
}

interface IssueCategory {
  id: string;
  label: string;
  icon: string;
}

export default function ContactSupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueCategories: IssueCategory[] = [
    { id: 'ride', label: 'Ride Issue', icon: 'car' },
    { id: 'payment', label: 'Payment Problem', icon: 'cash' },
    { id: 'account', label: 'Account Issue', icon: 'person' },
    { id: 'technical', label: 'Technical Problem', icon: 'bug' },
    { id: 'safety', label: 'Safety Concern', icon: 'shield-checkmark' },
    { id: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const supportOptions: SupportOption[] = [
   
    {
      id: 'email',
      title: 'Email Us',
      subtitle: 'info@drift-global.com',
      icon: 'mail',
      action: () => {
        Linking.openURL('mailto:info@drift-global.com');
      },
      color: Colors.primary[500],
    },
   
    {
      id: 'hours',
      title: 'Support Hours',
      subtitle: 'Mon-Sun: 8:00 AM - 5:00 PM',
      icon: 'time',
      action: () => {},
      color: Colors.gray[500],
    },
  ];

  const handleSubmitTicket = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select an issue category');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please describe your issue');
      return;
    }

    setIsSubmitting(true);
    
    // TODO: Submit to Firebase/API
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Ticket Submitted',
        'Thank you for contacting us. We\'ll respond within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedCategory('');
              setSubject('');
              setMessage('');
              router.back();
            },
          },
        ]
      );
    }, 1500);
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
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactOptions}>
            {supportOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.contactOption}
                onPress={option.action}
                disabled={option.id === 'hours'}
              >
                <View
                  style={[
                    styles.contactIcon,
                    { backgroundColor: `${option.color}20` },
                  ]}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={option.color}
                  />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </View>
                {option.id !== 'hours' && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray[400]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Ticket Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Submit a Ticket</Text>
          <View style={styles.formCard}>
            {/* Issue Category */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Issue Category *</Text>
              <View style={styles.categoriesGrid}>
                {issueCategories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id &&
                        styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={
                        selectedCategory === category.id
                          ? Colors.white
                          : Colors.gray[600]
                      }
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.id &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of the issue"
                placeholderTextColor={Colors.gray[400]}
              />
            </View>

            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Please provide as much detail as possible..."
                placeholderTextColor={Colors.gray[400]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{message.length}/500</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitTicket}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="send" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="alert-circle" size={24} color={Colors.error[500]} />
            <Text style={styles.emergencyTitle}>Emergency?</Text>
          </View>
          <Text style={styles.emergencyText}>
            If you're in an emergency situation during a ride, use the SOS
            button in the app or call 911 immediately.
          </Text>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={() => Linking.openURL('tel:911')}
          >
            <Text style={styles.emergencyButtonText}>Call 911</Text>
          </TouchableOpacity>
        </View>

        {/* Response Time */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary[500]}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Expected Response Time</Text>
            <Text style={styles.infoText}>
              • Urgent issues: Within 2 hours{'\n'}
              • General inquiries: Within 24 hours{'\n'}
              • Account questions: Within 48 hours
            </Text>
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL('https://www.facebook.com/share/1Bjdp59K2i/')
              }
            >
              <Ionicons
                name="logo-facebook"
                size={24}
                color={Colors.primary[500]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/drift.cayman/')
              }
            >
              <Ionicons
                name="logo-instagram"
                size={24}
                color={Colors.primary[500]}
              />
            </TouchableOpacity>
            
          </View>
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
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  contactOptions: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  contactSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  formCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryChipText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray[700],
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.black,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[500],
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  submitButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  emergencyCard: {
    backgroundColor: Colors.error[50],
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.error[500],
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.error[700],
    marginLeft: Spacing.sm,
  },
  emergencyText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error[700],
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: Colors.error[500],
    paddingVertical: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary[700],
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    lineHeight: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
});