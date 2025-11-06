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

export default function BackgroundCheck() {
  const router = useRouter();
  const { updateRegistrationData, setRegistrationStep } = useDriverStore();
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [understandProcess, setUnderstandProcess] = useState(false);
  const [accurateInfo, setAccurateInfo] = useState(false);

  const canContinue = consentGiven && understandProcess && accurateInfo;

  const handleContinue = () => {
    updateRegistrationData({
      backgroundCheck: {
        consented: true,
        consentedAt: new Date(),
        status: 'pending',
      },
    });
    setRegistrationStep(10);
    router.push('/(driver)/registration/bank-details');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Background Check</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '64%' }]} />
        </View>
        <Text style={styles.progressText}>Step 9 of 14</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Background Check</Text>
        <Text style={styles.subtitle}>
          We conduct background checks to ensure the safety of our community
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Safety First</Text>
            <Text style={styles.infoText}>
              Background checks help us maintain a safe, trusted community for all Drift users.
            </Text>
          </View>
        </View>

        {/* What We Check */}
        <View style={styles.checkSection}>
          <Text style={styles.sectionTitle}>What we check:</Text>
          
          <View style={styles.checkItem}>
            <View style={styles.checkIcon}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkLabel}>Criminal Record</Text>
              <Text style={styles.checkText}>
                We check for serious criminal offenses
              </Text>
            </View>
          </View>

          <View style={styles.checkItem}>
            <View style={styles.checkIcon}>
              <Ionicons name="car" size={20} color={Colors.primary} />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkLabel}>Driving History</Text>
              <Text style={styles.checkText}>
                We verify your driving record and license status
              </Text>
            </View>
          </View>

          <View style={styles.checkItem}>
            <View style={styles.checkIcon}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkLabel}>Identity Verification</Text>
              <Text style={styles.checkText}>
                We confirm your identity matches provided documents
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Processing time:</Text>
          <Text style={styles.timelineText}>
            Background checks typically take <Text style={styles.bold}>1-2 business days</Text>. 
            You'll be notified once the process is complete.
          </Text>
        </View>

        {/* Consent Checkboxes */}
        <View style={styles.consentSection}>
          <Text style={styles.consentTitle}>Your Consent:</Text>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setConsentGiven(!consentGiven)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
              {consentGiven && <Ionicons name="checkmark" size={18} color={Colors.white} />}
            </View>
            <Text style={styles.consentText}>
              I authorize Drift to conduct a background check as part of my driver application
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setUnderstandProcess(!understandProcess)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, understandProcess && styles.checkboxChecked]}>
              {understandProcess && <Ionicons name="checkmark" size={18} color={Colors.white} />}
            </View>
            <Text style={styles.consentText}>
              I understand this check may include criminal and driving history
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAccurateInfo(!accurateInfo)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, accurateInfo && styles.checkboxChecked]}>
              {accurateInfo && <Ionicons name="checkmark" size={18} color={Colors.white} />}
            </View>
            <Text style={styles.consentText}>
              I certify that all information I've provided is accurate and complete
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Ionicons name="lock-closed" size={20} color={Colors.gray[600]} />
          <Text style={styles.privacyText}>
            Your information is handled securely and in compliance with data protection laws. 
            Results are kept confidential.
          </Text>
        </View>

        <DriftButton
          title="Authorize Background Check"
          onPress={handleContinue}
          disabled={!canContinue}
          variant="black"
          icon={<Ionicons name="arrow-forward" size={20} color="white" />}
        />
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
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '15',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  checkSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  checkItem: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  checkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContent: {
    flex: 1,
  },
  checkLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  checkText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  timelineCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  timelineText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: Colors.black,
  },
  consentSection: {
    marginBottom: Spacing.xl,
  },
  consentTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.lg,
  },
  consentRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[700],
    lineHeight: 20,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
    lineHeight: 18,
  },
});