import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const Colors = {
  background: '#FFFFFF',
  white: '#FFFFFF',
  dark: '#000000',
  gray: '#6B7280',
  lightGray: '#F9FAFB',
  border: '#E5E7EB',
  warning: '#F59E0B',
};

/** app\(driver)\legal\privacy.tsx
 * DRIFT DRIVER - PRIVACY POLICY
 * 
 * Compliant with:
 * - Cayman Islands Data Protection Act (2021 Revision)
 * - Apple App Store Privacy Requirements
 * - Google Play Store Data Safety Requirements
 * 
 * Last Updated: November 29, 2024
 * Effective Date: December 1, 2024
 */

export default function DriverPrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Effective Date */}
        <View style={styles.effectiveDate}>
          <Text style={styles.effectiveDateText}>Effective Date: December 1, 2024</Text>
          <Text style={styles.effectiveDateText}>Last Updated: November 29, 2024</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.title}>Driver Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Drift Ltd. ("Drift," "we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your personal data when you use the Drift mobile application ("App") as a driver.
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy complies with the Cayman Islands Data Protection Act (2021 Revision) ("DPA") and applies to all drivers using our Platform within the Cayman Islands.
          </Text>
        </View>

        {/* Data Controller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Data Controller</Text>
          <Text style={styles.paragraph}>
            Drift Ltd. is the data controller responsible for your personal data collected through the Platform.
          </Text>
          <Text style={styles.contactInfo}>Drift Ltd.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: privacy@drift.ky</Text>
          <Text style={styles.contactInfo}>Data Protection Officer: dpo@drift.ky</Text>
        </View>

        {/* Personal Data Collection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Personal Data We Collect from Drivers</Text>
          <Text style={styles.paragraph}>
            As a driver, we collect additional information beyond what we collect from riders to verify your identity, ensure safety, and comply with legal requirements:
          </Text>

          <Text style={styles.subSectionTitle}>2.1 Identity and Account Information</Text>
          <Text style={styles.bulletPoint}>• Full legal name</Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Phone number</Text>
          <Text style={styles.bulletPoint}>• Date of birth</Text>
          <Text style={styles.bulletPoint}>• Residential address</Text>
          <Text style={styles.bulletPoint}>• Profile photograph</Text>
          <Text style={styles.bulletPoint}>• Account credentials (encrypted)</Text>

          <Text style={styles.subSectionTitle}>2.2 Driver Verification Documents</Text>
          <Text style={styles.bulletPoint}>• Driver's license (front and back images)</Text>
          <Text style={styles.bulletPoint}>• License number and expiry date</Text>
          <Text style={styles.bulletPoint}>• License issuing country/territory</Text>
          <Text style={styles.bulletPoint}>• Taxi permit (if applicable)</Text>
          <Text style={styles.bulletPoint}>• National ID or passport (for identity verification)</Text>

          <Text style={styles.subSectionTitle}>2.3 Vehicle Information</Text>
          <Text style={styles.bulletPoint}>• Vehicle make, model, and year</Text>
          <Text style={styles.bulletPoint}>• Vehicle color and license plate number</Text>
          <Text style={styles.bulletPoint}>• Vehicle registration document</Text>
          <Text style={styles.bulletPoint}>• Vehicle photos (exterior and interior)</Text>
          <Text style={styles.bulletPoint}>• Vehicle identification number (VIN)</Text>

          <Text style={styles.subSectionTitle}>2.4 Insurance Information</Text>
          <Text style={styles.bulletPoint}>• Insurance provider name</Text>
          <Text style={styles.bulletPoint}>• Policy number</Text>
          <Text style={styles.bulletPoint}>• Coverage dates and expiry</Text>
          <Text style={styles.bulletPoint}>• Proof of insurance documents</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Note:</Text> We verify that you have insurance but do not access your full policy details.
          </Text>

          <Text style={styles.subSectionTitle}>2.5 Background Check Information</Text>
          <Text style={styles.bulletPoint}>• Driving record/history</Text>
          <Text style={styles.bulletPoint}>• Traffic violations and accidents</Text>
          <Text style={styles.bulletPoint}>• Criminal background check results (where legally permitted)</Text>
          <Text style={styles.bulletPoint}>• Previous employment verification (if applicable)</Text>

          <Text style={styles.subSectionTitle}>2.6 Payment and Financial Information</Text>
          <Text style={styles.bulletPoint}>• PayPal account information</Text>
          <Text style={styles.bulletPoint}>• Payment card details (for Platform Access Fee)</Text>
          <Text style={styles.bulletPoint}>• Last 4 digits of card</Text>
          <Text style={styles.bulletPoint}>• Transaction history (fees paid, contributions received)</Text>
          <Text style={styles.bulletPoint}>• Payout preferences</Text>

          <Text style={styles.subSectionTitle}>2.7 Location and Trip Data</Text>
          <Text style={styles.bulletPoint}>• Real-time GPS location (when online)</Text>
          <Text style={styles.bulletPoint}>• Historical location data</Text>
          <Text style={styles.bulletPoint}>• Trip routes and distances</Text>
          <Text style={styles.bulletPoint}>• Pickup and drop-off locations</Text>
          <Text style={styles.bulletPoint}>• Time spent online/offline</Text>
          <Text style={styles.bulletPoint}>• Areas where you frequently drive</Text>

          <Text style={styles.subSectionTitle}>2.8 Performance and Ratings</Text>
          <Text style={styles.bulletPoint}>• Your average driver rating</Text>
          <Text style={styles.bulletPoint}>• Individual ratings from riders</Text>
          <Text style={styles.bulletPoint}>• Reviews and feedback</Text>
          <Text style={styles.bulletPoint}>• Acceptance and cancellation rates</Text>
          <Text style={styles.bulletPoint}>• Completion rates</Text>
          <Text style={styles.bulletPoint}>• Response times</Text>

          <Text style={styles.subSectionTitle}>2.9 Communications</Text>
          <Text style={styles.bulletPoint}>• In-app messages with riders</Text>
          <Text style={styles.bulletPoint}>• Customer support communications</Text>
          <Text style={styles.bulletPoint}>• Incident reports</Text>
          <Text style={styles.bulletPoint}>• Safety-related communications</Text>

          <Text style={styles.subSectionTitle}>2.10 Device and Technical Data</Text>
          <Text style={styles.bulletPoint}>• Device type, model, and OS version</Text>
          <Text style={styles.bulletPoint}>• Device identifiers (IDFA, Android ID)</Text>
          <Text style={styles.bulletPoint}>• IP address</Text>
          <Text style={styles.bulletPoint}>• App version and settings</Text>
          <Text style={styles.bulletPoint}>• Crash logs and diagnostic data</Text>
          <Text style={styles.bulletPoint}>• Mobile network information</Text>
        </View>

        {/* How We Use Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Personal Data</Text>
          
          <Text style={styles.subSectionTitle}>3.1 Driver Verification and Onboarding</Text>
          <Text style={styles.bulletPoint}>• Verifying your identity and eligibility</Text>
          <Text style={styles.bulletPoint}>• Conducting background checks</Text>
          <Text style={styles.bulletPoint}>• Reviewing driving records</Text>
          <Text style={styles.bulletPoint}>• Validating insurance coverage</Text>
          <Text style={styles.bulletPoint}>• Approving your driver account</Text>

          <Text style={styles.subSectionTitle}>3.2 Platform Operations</Text>
          <Text style={styles.bulletPoint}>• Connecting you with riders</Text>
          <Text style={styles.bulletPoint}>• Displaying your availability to riders</Text>
          <Text style={styles.bulletPoint}>• Processing carpool requests</Text>
          <Text style={styles.bulletPoint}>• Providing navigation and routing</Text>
          <Text style={styles.bulletPoint}>• Facilitating communication with riders</Text>
          <Text style={styles.bulletPoint}>• Processing Platform Access Fee payments</Text>

          <Text style={styles.subSectionTitle}>3.3 Payment Processing</Text>
          <Text style={styles.bulletPoint}>• Processing cost-sharing contributions to you</Text>
          <Text style={styles.bulletPoint}>• Charging weekly Platform Access Fees</Text>
          <Text style={styles.bulletPoint}>• Maintaining transaction records</Text>
          <Text style={styles.bulletPoint}>• Detecting and preventing fraud</Text>

          <Text style={styles.subSectionTitle}>3.4 Safety and Security</Text>
          <Text style={styles.bulletPoint}>• Monitoring for safety incidents</Text>
          <Text style={styles.bulletPoint}>• Investigating complaints and reports</Text>
          <Text style={styles.bulletPoint}>• Preventing fraud and abuse</Text>
          <Text style={styles.bulletPoint}>• Ensuring platform integrity</Text>
          <Text style={styles.bulletPoint}>• Verifying insurance remains current</Text>

          <Text style={styles.subSectionTitle}>3.5 Performance Monitoring</Text>
          <Text style={styles.bulletPoint}>• Tracking ratings and reviews</Text>
          <Text style={styles.bulletPoint}>• Calculating acceptance rates</Text>
          <Text style={styles.bulletPoint}>• Monitoring service quality</Text>
          <Text style={styles.bulletPoint}>• Providing performance feedback</Text>

          <Text style={styles.subSectionTitle}>3.6 Legal Compliance</Text>
          <Text style={styles.bulletPoint}>• Complying with Cayman Islands laws</Text>
          <Text style={styles.bulletPoint}>• Responding to lawful requests</Text>
          <Text style={styles.bulletPoint}>• Maintaining required records</Text>
          <Text style={styles.bulletPoint}>• Enforcing our agreements</Text>

          <Text style={styles.subSectionTitle}>3.7 Communications (With Consent)</Text>
          <Text style={styles.bulletPoint}>• Sending driver-related updates</Text>
          <Text style={styles.bulletPoint}>• Notifying about new features</Text>
          <Text style={styles.bulletPoint}>• Sharing tips and best practices</Text>
          <Text style={styles.bulletPoint}>• Conducting surveys</Text>
        </View>

        {/* Legal Basis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Legal Basis for Processing</Text>
          <Text style={styles.paragraph}>
            Under the Cayman Islands DPA, we process your data based on:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Contract Performance:</Text> To provide Platform access and services
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Legitimate Interests:</Text> Safety, fraud prevention, service improvement
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Legal Obligation:</Text> Compliance with Cayman Islands laws
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Consent:</Text> Marketing and optional features
          </Text>
        </View>

        {/* Data Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. How We Share Your Data</Text>
          
          <Text style={styles.subSectionTitle}>5.1 With Riders</Text>
          <Text style={styles.paragraph}>
            When you accept a carpool request, we share:
          </Text>
          <Text style={styles.bulletPoint}>• Your first name and profile photo</Text>
          <Text style={styles.bulletPoint}>• Your driver rating</Text>
          <Text style={styles.bulletPoint}>• Your vehicle information (make, model, color, plate)</Text>
          <Text style={styles.bulletPoint}>• Real-time location during active trips</Text>
          <Text style={styles.bulletPoint}>• Estimated arrival time</Text>

          <Text style={styles.subSectionTitle}>5.2 With Service Providers</Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>PayPal:</Text> Payment processing (financial information)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Google Maps:</Text> Navigation services (location data)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Firebase:</Text> Infrastructure and database (all Platform data)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Background Check Providers:</Text> Verification services (identity, driving record)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Cloud Hosting:</Text> Secure data storage
          </Text>

          <Text style={styles.subSectionTitle}>5.3 For Legal Reasons</Text>
          <Text style={styles.paragraph}>
            We may disclose data when:
          </Text>
          <Text style={styles.bulletPoint}>• Required by law or legal process</Text>
          <Text style={styles.bulletPoint}>• Responding to government requests</Text>
          <Text style={styles.bulletPoint}>• Protecting safety or rights</Text>
          <Text style={styles.bulletPoint}>• Preventing fraud or illegal activity</Text>

          <Text style={styles.subSectionTitle}>5.4 Business Transfers</Text>
          <Text style={styles.paragraph}>
            If Drift is acquired or merged, your data may transfer to the new owner with prior notice.
          </Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Security</Text>
          <Text style={styles.paragraph}>
            We protect your data with:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption in transit and at rest</Text>
          <Text style={styles.bulletPoint}>• Secure authentication systems</Text>
          <Text style={styles.bulletPoint}>• Access controls and monitoring</Text>
          <Text style={styles.bulletPoint}>• Regular security audits</Text>
          <Text style={styles.bulletPoint}>• Employee training</Text>
          <Text style={styles.bulletPoint}>• Incident response procedures</Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Retention</Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Account Data:</Text> Active account + 12 months after closure
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Verification Documents:</Text> 7 years (legal requirement)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Trip Records:</Text> 7 years (financial reporting)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Financial Records:</Text> 7 years (Cayman Islands law)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Location Data:</Text> 90 days after trip
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Background Checks:</Text> 3 years or until account closure
          </Text>
        </View>

        {/* Driver Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Your Data Protection Rights</Text>
          
          <Text style={styles.subSectionTitle}>8.1 Right of Access</Text>
          <Text style={styles.paragraph}>
            Request a copy of your personal data. Access most data through App settings.
          </Text>

          <Text style={styles.subSectionTitle}>8.2 Right to Rectification</Text>
          <Text style={styles.paragraph}>
            Correct inaccurate data. Update most information in App settings.
          </Text>

          <Text style={styles.subSectionTitle}>8.3 Right to Erasure</Text>
          <Text style={styles.paragraph}>
            Request deletion of your data. Delete account through App settings. Data deleted within 30 days except where legally required.
          </Text>

          <Text style={styles.subSectionTitle}>8.4 Right to Restrict Processing</Text>
          <Text style={styles.paragraph}>
            Request limited use of your data in certain circumstances.
          </Text>

          <Text style={styles.subSectionTitle}>8.5 Right to Data Portability</Text>
          <Text style={styles.paragraph}>
            Receive your data in machine-readable format.
          </Text>

          <Text style={styles.subSectionTitle}>8.6 Right to Object</Text>
          <Text style={styles.paragraph}>
            Object to processing based on legitimate interests or direct marketing.
          </Text>

          <Text style={styles.subSectionTitle}>8.7 Right to Withdraw Consent</Text>
          <Text style={styles.paragraph}>
            Withdraw consent at any time for consent-based processing.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>To Exercise Rights:</Text>
          </Text>
          <Text style={styles.contactInfo}>Email: privacy@drift.ky</Text>
          <Text style={styles.contactInfo}>Subject: Driver Data Request</Text>
          <Text style={styles.paragraph}>
            We respond within 30 days. ID verification may be required.
          </Text>
        </View>

        {/* International Transfers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your data is primarily stored in the Cayman Islands. Some service providers may process data outside the Cayman Islands with adequate safeguards in place.
          </Text>
        </View>

        {/* Data Breaches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Data Breach Notification</Text>
          <Text style={styles.paragraph}>
            If a breach occurs that poses high risk to your rights:
          </Text>
          <Text style={styles.bulletPoint}>• We notify the Cayman Islands Ombudsman within 72 hours</Text>
          <Text style={styles.bulletPoint}>• We notify affected drivers without undue delay</Text>
          <Text style={styles.bulletPoint}>• We provide information about the breach and protective measures</Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            Drivers must be 21+. We do not knowingly collect data from individuals under 21.
          </Text>
        </View>

        {/* Changes to Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this policy. Material changes will be communicated via:
          </Text>
          <Text style={styles.bulletPoint}>• In-app notification</Text>
          <Text style={styles.bulletPoint}>• Email to registered address</Text>
          <Text style={styles.bulletPoint}>• Notice in the App</Text>
          <Text style={styles.paragraph}>
            Continued use after changes constitutes acceptance.
          </Text>
        </View>

        {/* Supervisory Authority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Supervisory Authority</Text>
          <Text style={styles.paragraph}>
            You may lodge complaints with:
          </Text>
          <Text style={styles.contactInfo}>Office of the Ombudsman</Text>
          <Text style={styles.contactInfo}>Grand Cayman, Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: info@ombudsman.ky</Text>
          <Text style={styles.contactInfo}>Website: www.ombudsman.ky</Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Contact Us</Text>
          <Text style={styles.contactInfo}>Data Protection Officer</Text>
          <Text style={styles.contactInfo}>Drift Ltd.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: privacy@drift.ky</Text>
          <Text style={styles.contactInfo}>DPO: dpo@drift.ky</Text>
          <Text style={styles.contactInfo}>Driver Support: drivers@drift.ky</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drift Driver Privacy Policy v1.0</Text>
          <Text style={styles.footerText}>Effective: December 1, 2024</Text>
          <Text style={styles.footerText}>© 2024 Drift Ltd. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  effectiveDate: {
    backgroundColor: Colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  effectiveDateText: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark,
    marginLeft: 12,
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark,
    marginLeft: 12,
  },
  footer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray,
    marginBottom: 4,
  },
});