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

/**
 * DRIFT RIDER - PRIVACY POLICY
 * 
 * Compliant with:
 * - Cayman Islands Data Protection Act (2021 Revision)
 * - Apple App Store Privacy Requirements
 * - Google Play Store Data Safety Requirements
 * - GDPR (where applicable to Cayman Islands)
 * 
 * Last Updated: November 29, 2024
 * Effective Date: December 1, 2024
 */

export default function RiderPrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Effective Date */}
        <View style={styles.effectiveDate}>
          <Text style={styles.effectiveDateText}>Effective Date: December 1, 2025</Text>
          <Text style={styles.effectiveDateText}>Last Updated: November 29, 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.title}>Drift Privacy Policy</Text>
          <Text style={styles.paragraph}>
            Invovibe Tech Ltd / I.T Cayman. ("Drift," "we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and share your personal data when you use the Drift mobile application ("App") as a rider.
          </Text>
          <Text style={styles.paragraph}>
            This Privacy Policy complies with the Cayman Islands Data Protection Act (2021 Revision) ("DPA") and applies to all riders using our Platform within the Cayman Islands.
          </Text>
        </View>

        {/* Data Controller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Data Controller</Text>
          <Text style={styles.paragraph}>
            Invovibe Tech Ltd / I.T Cayman. is the data controller responsible for your personal data collected through the Platform.
          </Text>
          <Text style={styles.contactInfo}>Invovibe Tech Ltd / I.T Cayman.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: info@drift-global.com</Text>
          <Text style={styles.contactInfo}>Data Protection Officer: info@drift-global.com</Text>
        </View>

        {/* Personal Data We Collect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Personal Data We Collect</Text>
          <Text style={styles.paragraph}>
            We collect the following categories of personal data:
          </Text>

          <Text style={styles.subSectionTitle}>2.1 Account Information</Text>
          <Text style={styles.bulletPoint}>• Full name</Text>
          <Text style={styles.bulletPoint}>• Email address</Text>
          <Text style={styles.bulletPoint}>• Phone number</Text>
          <Text style={styles.bulletPoint}>• Profile photograph (optional)</Text>
          <Text style={styles.bulletPoint}>• Date of birth (to verify you are 18+)</Text>
          <Text style={styles.bulletPoint}>• Account credentials (encrypted password)</Text>

          <Text style={styles.subSectionTitle}>2.2 Location Data</Text>
          <Text style={styles.bulletPoint}>• Precise GPS location (when using the App)</Text>
          <Text style={styles.bulletPoint}>• Pickup and destination addresses</Text>
          <Text style={styles.bulletPoint}>• Saved favorite locations</Text>
          <Text style={styles.bulletPoint}>• Location history for completed trips</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Purpose:</Text> Location data is essential for matching you with nearby drivers, providing accurate pickup locations, and displaying trip routes. We only collect location data when you are actively using the App.
          </Text>

          <Text style={styles.subSectionTitle}>2.3 Trip Information</Text>
          <Text style={styles.bulletPoint}>• Trip date, time, and duration</Text>
          <Text style={styles.bulletPoint}>• Pickup and drop-off locations</Text>
          <Text style={styles.bulletPoint}>• Driver information for your trips</Text>
          <Text style={styles.bulletPoint}>• Trip route and distance</Text>
          <Text style={styles.bulletPoint}>• Cost-sharing contribution amounts</Text>
          <Text style={styles.bulletPoint}>• Trip status (requested, accepted, completed, cancelled)</Text>

          <Text style={styles.subSectionTitle}>2.4 Payment Information</Text>
          <Text style={styles.bulletPoint}>• Payment card type (Visa, Mastercard, etc.)</Text>
          <Text style={styles.bulletPoint}>• Last 4 digits of card number</Text>
          <Text style={styles.bulletPoint}>• Payment transaction history</Text>
          <Text style={styles.bulletPoint}>• Billing address</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Important:</Text> We do NOT store your full payment card details. All payment processing is handled securely by Stripe, a PCI DSS-compliant third-party payment processor.
          </Text>

          <Text style={styles.subSectionTitle}>2.5 Communications and Ratings</Text>
          <Text style={styles.bulletPoint}>• In-app messages with drivers</Text>
          <Text style={styles.bulletPoint}>• Ratings and reviews you provide</Text>
          <Text style={styles.bulletPoint}>• Your average rating from drivers</Text>
          <Text style={styles.bulletPoint}>• Customer support communications</Text>
          <Text style={styles.bulletPoint}>• Feedback and survey responses</Text>

          <Text style={styles.subSectionTitle}>2.6 Device and Technical Information</Text>
          <Text style={styles.bulletPoint}>• Device type and model (iPhone, Android phone)</Text>
          <Text style={styles.bulletPoint}>• Operating system version</Text>
          <Text style={styles.bulletPoint}>• Device identifiers (IDFA, Android ID)</Text>
          <Text style={styles.bulletPoint}>• IP address</Text>
          <Text style={styles.bulletPoint}>• App version</Text>
          <Text style={styles.bulletPoint}>• Mobile network information</Text>
          <Text style={styles.bulletPoint}>• App crash logs and performance data</Text>

          <Text style={styles.subSectionTitle}>2.7 Usage Data</Text>
          <Text style={styles.bulletPoint}>• App features you use</Text>
          <Text style={styles.bulletPoint}>• Time spent in the App</Text>
          <Text style={styles.bulletPoint}>• Searches and preferences</Text>
          <Text style={styles.bulletPoint}>• Settings and preferences</Text>
          <Text style={styles.bulletPoint}>• Notification interaction</Text>
        </View>

        {/* How We Use Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. How We Use Your Personal Data</Text>
          <Text style={styles.paragraph}>
            We process your personal data for the following purposes, in accordance with the Cayman Islands DPA:
          </Text>

          <Text style={styles.subSectionTitle}>3.1 Service Provision (Performance of Contract)</Text>
          <Text style={styles.bulletPoint}>• Creating and managing your account</Text>
          <Text style={styles.bulletPoint}>• Matching you with available drivers</Text>
          <Text style={styles.bulletPoint}>• Facilitating carpool arrangements</Text>
          <Text style={styles.bulletPoint}>• Processing cost-sharing contributions</Text>
          <Text style={styles.bulletPoint}>• Providing customer support</Text>
          <Text style={styles.bulletPoint}>• Sending trip notifications and updates</Text>

          <Text style={styles.subSectionTitle}>3.2 Safety and Security (Legitimate Interest)</Text>
          <Text style={styles.bulletPoint}>• Verifying user identities</Text>
          <Text style={styles.bulletPoint}>• Preventing fraud and abuse</Text>
          <Text style={styles.bulletPoint}>• Investigating safety incidents</Text>
          <Text style={styles.bulletPoint}>• Maintaining platform integrity</Text>
          <Text style={styles.bulletPoint}>• Detecting and preventing security threats</Text>

          <Text style={styles.subSectionTitle}>3.3 Platform Improvement (Legitimate Interest)</Text>
          <Text style={styles.bulletPoint}>• Analyzing usage patterns and trends</Text>
          <Text style={styles.bulletPoint}>• Improving app features and performance</Text>
          <Text style={styles.bulletPoint}>• Developing new features</Text>
          <Text style={styles.bulletPoint}>• Conducting research and analytics</Text>
          <Text style={styles.bulletPoint}>• Fixing bugs and technical issues</Text>

          <Text style={styles.subSectionTitle}>3.4 Legal Compliance (Legal Obligation)</Text>
          <Text style={styles.bulletPoint}>• Complying with Cayman Islands laws</Text>
          <Text style={styles.bulletPoint}>• Responding to lawful requests from authorities</Text>
          <Text style={styles.bulletPoint}>• Enforcing our Terms of Service</Text>
          <Text style={styles.bulletPoint}>• Protecting our legal rights</Text>
          <Text style={styles.bulletPoint}>• Maintaining records as required by law</Text>

          <Text style={styles.subSectionTitle}>3.5 Marketing (Consent)</Text>
          <Text style={styles.bulletPoint}>• Sending promotional offers (with your consent)</Text>
          <Text style={styles.bulletPoint}>• Notifying you of new features</Text>
          <Text style={styles.bulletPoint}>• Conducting surveys and feedback requests</Text>
          <Text style={styles.paragraph}>
            You can opt out of marketing communications at any time through App settings or by clicking "unsubscribe" in our emails.
          </Text>
        </View>

        {/* Legal Basis for Processing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Legal Basis for Processing</Text>
          <Text style={styles.paragraph}>
            Under the Cayman Islands DPA, we process your personal data based on the following legal grounds:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Contract Performance:</Text> Processing necessary to provide services you requested (creating your account, facilitating carpools)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Legitimate Interests:</Text> Processing necessary for our legitimate business interests (safety, fraud prevention, service improvement)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Legal Obligation:</Text> Processing required by Cayman Islands law or regulatory requirements
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Consent:</Text> Processing based on your explicit consent (marketing communications, optional features)
          </Text>
        </View>

        {/* How We Share Your Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. How We Share Your Personal Data</Text>
          <Text style={styles.paragraph}>
            We do NOT sell your personal data. We share your data only in the following limited circumstances:
          </Text>

          <Text style={styles.subSectionTitle}>5.1 With Drivers</Text>
          <Text style={styles.paragraph}>
            When you request a carpool match, we share limited information with drivers:
          </Text>
          <Text style={styles.bulletPoint}>• Your first name and profile photo</Text>
          <Text style={styles.bulletPoint}>• Your pickup location (when match is accepted)</Text>
          <Text style={styles.bulletPoint}>• Your destination (when match is accepted)</Text>
          <Text style={styles.bulletPoint}>• Your rider rating</Text>
          <Text style={styles.bulletPoint}>• Real-time location during active trips</Text>

          <Text style={styles.subSectionTitle}>5.2 With Service Providers</Text>
          <Text style={styles.paragraph}>
            We share data with trusted third-party service providers who assist us in operating the Platform:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Stripe:</Text> Payment processing (card information, transaction amounts)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Google Maps:</Text> Location services and mapping (location data)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Firebase (Google):</Text> App infrastructure, authentication, database (account info, usage data)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Cloud Hosting:</Text> Secure data storage (all Platform data)
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Analytics Providers:</Text> App performance and usage analytics (device info, usage data)
          </Text>
          <Text style={styles.paragraph}>
            All service providers are contractually required to protect your data and use it only for specified purposes.
          </Text>

          <Text style={styles.subSectionTitle}>5.3 For Legal Reasons</Text>
          <Text style={styles.paragraph}>
            We may disclose your personal data when required by law or to:
          </Text>
          <Text style={styles.bulletPoint}>• Comply with legal obligations or court orders</Text>
          <Text style={styles.bulletPoint}>• Respond to lawful requests from government authorities</Text>
          <Text style={styles.bulletPoint}>• Protect our rights, property, or safety</Text>
          <Text style={styles.bulletPoint}>• Protect user safety or public safety</Text>
          <Text style={styles.bulletPoint}>• Prevent fraud or illegal activity</Text>

          <Text style={styles.subSectionTitle}>5.4 Business Transfers</Text>
          <Text style={styles.paragraph}>
            If Drift is involved in a merger, acquisition, or sale of assets, your personal data may be transferred to the new owner. We will notify you before your data is transferred and becomes subject to a different privacy policy.
          </Text>

          <Text style={styles.subSectionTitle}>5.5 With Your Consent</Text>
          <Text style={styles.paragraph}>
            We may share your data with other parties when you explicitly consent, such as sharing trip details with emergency contacts.
          </Text>
        </View>

        {/* International Data Transfers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. International Data Transfers</Text>
          <Text style={styles.paragraph}>
            Your personal data is primarily stored and processed in the Cayman Islands. However, some service providers may process data outside the Cayman Islands.
          </Text>
          <Text style={styles.paragraph}>
            When we transfer personal data to countries outside the Cayman Islands, we ensure adequate protection through:
          </Text>
          <Text style={styles.bulletPoint}>• Contractual safeguards (Standard Contractual Clauses)</Text>
          <Text style={styles.bulletPoint}>• Service providers certified under recognized frameworks</Text>
          <Text style={styles.bulletPoint}>• Countries deemed adequate by Cayman Islands authorities</Text>
          <Text style={styles.paragraph}>
            In accordance with the Cayman Islands DPA, we ensure that international transfers provide equivalent protection to that required in the Cayman Islands.
          </Text>
        </View>

        {/* Data Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, loss, destruction, or alteration:
          </Text>
          <Text style={styles.bulletPoint}>• Encryption of data in transit (TLS/SSL)</Text>
          <Text style={styles.bulletPoint}>• Encryption of data at rest</Text>
          <Text style={styles.bulletPoint}>• Secure authentication (password hashing)</Text>
          <Text style={styles.bulletPoint}>• Regular security audits and testing</Text>
          <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
          <Text style={styles.bulletPoint}>• Employee training on data protection</Text>
          <Text style={styles.bulletPoint}>• Incident response procedures</Text>
          <Text style={styles.paragraph}>
            While we strive to protect your personal data, no method of transmission or storage is 100% secure. You are responsible for keeping your account credentials confidential.
          </Text>
        </View>

        {/* Data Retention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain your personal data only as long as necessary for the purposes described in this Privacy Policy or as required by law:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Account Information:</Text> Retained while your account is active plus 12 months after account closure
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Trip Records:</Text> Retained for 7 years to comply with financial reporting requirements
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Payment Information:</Text> Retained for 7 years as required by Cayman Islands law
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Communications:</Text> Retained for 3 years for customer support purposes
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Location Data:</Text> Retained for 90 days after trip completion
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Usage Analytics:</Text> Retained in aggregated, anonymized form indefinitely
          </Text>
          <Text style={styles.paragraph}>
            After the retention period, we securely delete or anonymize your personal data so it can no longer identify you.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Your Data Protection Rights</Text>
          <Text style={styles.paragraph}>
            Under the Cayman Islands Data Protection Act (2021 Revision), you have the following rights:
          </Text>

          <Text style={styles.subSectionTitle}>9.1 Right of Access</Text>
          <Text style={styles.paragraph}>
            You have the right to request a copy of your personal data we hold. You can access most of your data directly through the App settings.
          </Text>

          <Text style={styles.subSectionTitle}>9.2 Right to Rectification</Text>
          <Text style={styles.paragraph}>
            You have the right to correct inaccurate or incomplete personal data. You can update most information through the App settings.
          </Text>

          <Text style={styles.subSectionTitle}>9.3 Right to Erasure (Right to be Forgotten)</Text>
          <Text style={styles.paragraph}>
            You have the right to request deletion of your personal data. You can delete your account at any time through App settings. We will delete your data within 30 days, except where retention is required by law.
          </Text>

          <Text style={styles.subSectionTitle}>9.4 Right to Restrict Processing</Text>
          <Text style={styles.paragraph}>
            You have the right to request that we limit how we use your data in certain circumstances.
          </Text>

          <Text style={styles.subSectionTitle}>9.5 Right to Data Portability</Text>
          <Text style={styles.paragraph}>
            You have the right to receive your personal data in a structured, commonly used, machine-readable format and transmit it to another data controller.
          </Text>

          <Text style={styles.subSectionTitle}>9.6 Right to Object</Text>
          <Text style={styles.paragraph}>
            You have the right to object to processing based on legitimate interests or for direct marketing purposes.
          </Text>

          <Text style={styles.subSectionTitle}>9.7 Right to Withdraw Consent</Text>
          <Text style={styles.paragraph}>
            Where we process your data based on consent, you have the right to withdraw consent at any time. This will not affect the lawfulness of processing before withdrawal.
          </Text>

          <Text style={styles.subSectionTitle}>9.8 Right to Complain</Text>
          <Text style={styles.paragraph}>
            You have the right to lodge a complaint with the Cayman Islands Ombudsman if you believe we have violated your data protection rights.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>To Exercise Your Rights:</Text>
          </Text>
          <Text style={styles.contactInfo}>Email: info@drift-global.com</Text>
          <Text style={styles.contactInfo}>Subject: Data Protection Request</Text>
          <Text style={styles.paragraph}>
            We will respond to all requests within 30 days. We may request identification verification to process your request.
          </Text>
        </View>

        {/* Children's Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
          <Text style={styles.paragraph}>
            The Drift Platform is not intended for children under 18 years of age. We do not knowingly collect personal data from children under 18.
          </Text>
          <Text style={styles.paragraph}>
            If we become aware that we have collected personal data from a child under 18, we will take steps to delete such information immediately.
          </Text>
          <Text style={styles.paragraph}>
            If you believe a child under 18 has provided us with personal data, please contact us at info@drift-global.com.
          </Text>
        </View>

        {/* Cookies and Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Cookies and Tracking Technologies</Text>
          <Text style={styles.paragraph}>
            The Drift mobile app does not use cookies. However, we use similar technologies:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Local Storage:</Text> To store app preferences and session data
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Device Identifiers:</Text> To identify your device for authentication and analytics
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Analytics SDK:</Text> To track app usage and performance
          </Text>
          <Text style={styles.paragraph}>
            You can control some tracking through your device settings:
          </Text>
          <Text style={styles.bulletPoint}>• iOS: Settings → Privacy → Tracking</Text>
          <Text style={styles.bulletPoint}>• Android: Settings → Google → Ads</Text>
        </View>

        {/* Third-Party Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Third-Party Services</Text>
          <Text style={styles.paragraph}>
            Our App integrates with third-party services. Each service has its own privacy policy:
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Stripe:</Text> https://www.Stripe.com/privacy
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Google Maps:</Text> https://policies.google.com/privacy
          </Text>
          <Text style={styles.bulletPoint}>
            <Text style={styles.bold}>Firebase:</Text> https://firebase.google.com/support/privacy
          </Text>
          <Text style={styles.paragraph}>
            We are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies.
          </Text>
        </View>

        {/* Personal Data Breaches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Data Breach Notification</Text>
          <Text style={styles.paragraph}>
            In the event of a personal data breach that poses a risk to your rights and freedoms, we will:
          </Text>
          <Text style={styles.bulletPoint}>• Notify the Cayman Islands Ombudsman within 72 hours of becoming aware</Text>
          <Text style={styles.bulletPoint}>• Notify affected users without undue delay if there is a high risk</Text>
          <Text style={styles.bulletPoint}>• Provide information about the breach and steps being taken</Text>
          <Text style={styles.bulletPoint}>• Advise on measures you can take to protect yourself</Text>
        </View>

        {/* Automated Decision-Making */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Automated Decision-Making</Text>
          <Text style={styles.paragraph}>
            We use automated systems to match you with drivers based on location, availability, and preferences. However:
          </Text>
          <Text style={styles.bulletPoint}>• You have complete freedom to accept or decline any match</Text>
          <Text style={styles.bulletPoint}>• Drivers independently decide whether to accept your request</Text>
          <Text style={styles.bulletPoint}>• No automated decisions are made that significantly affect you</Text>
          <Text style={styles.paragraph}>
            You have the right to request human intervention in automated decision-making processes.
          </Text>
        </View>

        {/* Changes to Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
          </Text>
          <Text style={styles.paragraph}>
            We will notify you of material changes:
          </Text>
          <Text style={styles.bulletPoint}>• Through in-app notification</Text>
          <Text style={styles.bulletPoint}>• Via email to your registered email address</Text>
          <Text style={styles.bulletPoint}>• By displaying a notice on the App</Text>
          <Text style={styles.paragraph}>
            Continued use of the App after changes constitutes acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.
          </Text>
        </View>

        {/* Supervisory Authority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Supervisory Authority</Text>
          <Text style={styles.paragraph}>
            The Cayman Islands Ombudsman is the supervisory authority for data protection matters in the Cayman Islands.
          </Text>
          <Text style={styles.contactInfo}>Office of the Ombudsman</Text>
          <Text style={styles.contactInfo}>Grand Cayman, Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: info@ombudsman.ky</Text>
          <Text style={styles.contactInfo}>Website: www.ombudsman.ky</Text>
          <Text style={styles.paragraph}>
            You have the right to lodge a complaint with the Ombudsman if you believe we have violated your data protection rights.
          </Text>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. Contact Us</Text>
          <Text style={styles.paragraph}>
            For questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact:
          </Text>
          <Text style={styles.contactInfo}>Data Protection Officer</Text>
          <Text style={styles.contactInfo}>Invovibe Tech Ltd / I.T Cayman.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: info@drift-global.com</Text>
          <Text style={styles.contactInfo}>DPO: info@drift-global.com</Text>
          <Text style={styles.contactInfo}>General Support: info@drift-global.com</Text>
        </View>

        {/* Consent */}
        <View style={[styles.section, styles.consentSection]}>
          <Text style={styles.consentTitle}>Your Consent</Text>
          <Text style={styles.paragraph}>
            By using the Drift App, you consent to the collection, use, and disclosure of your personal data as described in this Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            You can withdraw your consent at any time by:
          </Text>
          <Text style={styles.bulletPoint}>• Adjusting app settings</Text>
          <Text style={styles.bulletPoint}>• Disabling location services</Text>
          <Text style={styles.bulletPoint}>• Opting out of marketing communications</Text>
          <Text style={styles.bulletPoint}>• Deleting your account</Text>
        </View>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drift Privacy Policy v1.0</Text>
          <Text style={styles.footerText}>Effective: December 1, 2024</Text>
          <Text style={styles.footerText}>© 2024 Invovibe Tech Ltd / I.T Cayman. All rights reserved.</Text>
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
  consentSection: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 8,
  },
  consentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 12,
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