import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DriftButton } from '@/components/ui/DriftButton';
import { Colors, Typography, Spacing } from '@/src/constants/theme';
import { useDriverStore } from '@/src/stores/driver-store';

/**
 * LEGAL CONSENT SCREEN
 * 
 * Driver must agree to terms and understand peer-to-peer model
 * Critical for legal compliance in Cayman Islands
 */

export default function LegalConsent() {
  const router = useRouter();
  const { updateRegistrationData, setRegistrationStep } = useDriverStore();
  
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPeerToPeer, setAgreedToPeerToPeer] = useState(false);
  const [agreedToInsurance, setAgreedToInsurance] = useState(false);

  const canContinue = agreedToTerms && agreedToPeerToPeer && agreedToInsurance;

  const handleContinue = () => {
    const currentPersonalInfo = useDriverStore.getState().registrationData.personalInfo;
    updateRegistrationData({
      personalInfo: {
        firstName: currentPersonalInfo?.firstName || '',
        lastName: currentPersonalInfo?.lastName || '',
        email: currentPersonalInfo?.email || '',
        phone: currentPersonalInfo?.phone || '',
        dateOfBirth: currentPersonalInfo?.dateOfBirth || '',
        address: currentPersonalInfo?.address || {
          street: '',
          city: '',
          postalCode: '',
          country: ''
        },
      },
    });
    setRegistrationStep(2);
    router.push('/(driver)/registration/personal-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal Agreement</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '7%' }]} />
        </View>
        <Text style={styles.progressText}>Step 1 of 14</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Terms & Conditions</Text>
        <Text style={styles.subtitle}>
          Please read and agree to the following terms to continue
        </Text>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <Ionicons
            name="information-circle"
            size={24}
            color={Colors.primary}
            style={styles.noticeIcon}
          />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Peer-to-Peer Network</Text>
            <Text style={styles.noticeText}>
              Drift is not a taxi or for-hire service. You are an independent individual
              voluntarily sharing rides with others for cost contribution.
            </Text>
          </View>
        </View>

        {/* Terms List */}
        <View style={styles.termsContainer}>
          {/* Term 1: Terms of Service */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && (
                <Ionicons name="checkmark" size={18} color={Colors.white} />
              )}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>
                I agree to Drift's{' '}
                <Text style={styles.link}>Terms of Service</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Term 2: Peer-to-Peer Understanding */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToPeerToPeer(!agreedToPeerToPeer)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToPeerToPeer && styles.checkboxChecked]}>
              {agreedToPeerToPeer && (
                <Ionicons name="checkmark" size={18} color={Colors.white} />
              )}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>
                I understand this is a <Text style={styles.bold}>private carpool network</Text>,
                not a commercial transport service. I am sharing rides as an independent
                individual.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Term 3: Insurance */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToInsurance(!agreedToInsurance)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToInsurance && styles.checkboxChecked]}>
              {agreedToInsurance && (
                <Ionicons name="checkmark" size={18} color={Colors.white} />
              )}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>
                I confirm I have valid vehicle insurance and understand I am responsible
                for maintaining appropriate coverage for 3rd party.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Term 4: Taxes & Reporting
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTaxes(!agreedToTaxes)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTaxes && styles.checkboxChecked]}>
              {agreedToTaxes && (
                <Ionicons name="checkmark" size={18} color={Colors.white} />
              )}
            </View>
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>
                I understand I am responsible for any applicable taxes on cost contributions
                received and will comply with Cayman Islands tax regulations.
              </Text>
            </View>
          </TouchableOpacity> */}
        </View>

        {/* Key Points */}
        <View style={styles.keyPointsCard}>
          <Text style={styles.keyPointsTitle}>Key Points to Remember:</Text>
          
          <View style={styles.keyPoint}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.keyPointText}>
              Digital marketplace connecting independent users for carpooling
            </Text>
          </View>

          <View style={styles.keyPoint}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.keyPointText}>
              You set your own schedule and availability
            </Text>
          </View>

          <View style={styles.keyPoint}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.keyPointText}>
              19% platform service fee is applied to cover bank fees and operational costs to keep the app running
            </Text>
          </View>

          <View style={styles.keyPoint}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.keyPointText}>
              You maintain your own insurance and vehicle
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <DriftButton
          title="I Agree - Continue"
          onPress={handleContinue}
          disabled={!canContinue}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />

        {/* Footer */}
        <Text style={styles.footerText}>
          By continuing, you acknowledge that you have read and understood all terms
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  noticeIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  noticeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  termsContainer: {
    marginBottom: Spacing.xl,
  },
  checkboxRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: Colors.black,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
  keyPointsCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  keyPointsTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  keyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  keyPointText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 18,
  },
});