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
 * DRIFT RIDER - TERMS OF SERVICE
 * 
 * Compliant with:
 * - Apple App Store Review Guidelines (Section 5.1.1)
 * - Google Play Developer Distribution Agreement
 * - Cayman Islands Data Protection Act (2021 Revision)
 * - Cayman Islands Motor Vehicle Insurance Law
 * 
 * Last Updated: November 29, 2024
 * Effective Date: December 1, 2024
 */

export default function RiderTermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
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
          <Text style={styles.title}>Drift Rider Terms of Service</Text>
          <Text style={styles.paragraph}>
            Welcome to Drift. These Terms of Service ("Terms") govern your access to and use of the Drift mobile application ("App") as a rider seeking to connect with other individuals for private carpooling arrangements within the Cayman Islands.
          </Text>
          <Text style={styles.paragraph}>
            By creating an account or using the App, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the App.
          </Text>
        </View>

        {/* Critical Understanding */}
        <View style={[styles.section, styles.importantSection]}>
          <View style={styles.importantHeader}>
            <Ionicons name="alert-circle" size={24} color={Colors.warning} />
            <Text style={styles.importantTitle}>Important: Peer-to-Peer Network</Text>
          </View>
          <Text style={styles.paragraph}>
            Drift is a technology platform that facilitates private carpooling arrangements between independent individuals. Drift does NOT:
          </Text>
          <Text style={styles.bulletPoint}>• Provide transportation services</Text>
          <Text style={styles.bulletPoint}>• Employ or contract drivers</Text>
          <Text style={styles.bulletPoint}>• Own or operate vehicles</Text>
          <Text style={styles.bulletPoint}>• Act as a taxi, for-hire, or commercial transport service</Text>
          <Text style={styles.bulletPoint}>• Set fares or determine pricing</Text>
          <Text style={styles.bulletPoint}>• Guarantee the safety or reliability of any carpool arrangement</Text>
        </View>

        {/* 1. Definitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Definitions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Platform"</Text> means the Drift mobile application and related services.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Rider"</Text> or <Text style={styles.bold}>"You"</Text> means an individual who uses the Platform to request carpool matches.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Driver"</Text> means an independent individual who makes their availability known on the Platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Carpool Match"</Text> means a connection facilitated by the Platform between a Rider and Driver.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Cost-Sharing Contribution"</Text> means a voluntary payment between users to offset travel expenses.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Personal Data"</Text> means information relating to you as defined by the Cayman Islands Data Protection Act (2021 Revision).
          </Text>
        </View>

        {/* 2. Eligibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility and Account Creation</Text>
          <Text style={styles.paragraph}>
            To use the Platform as a Rider, you must:
          </Text>
          <Text style={styles.bulletPoint}>• Be at least 18 years of age</Text>
          <Text style={styles.bulletPoint}>• Have the legal capacity to enter into binding contracts</Text>
          <Text style={styles.bulletPoint}>• Provide accurate and complete registration information</Text>
          <Text style={styles.bulletPoint}>• Maintain the security of your account credentials</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable laws in the Cayman Islands</Text>
          <Text style={styles.paragraph}>
            You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </Text>
        </View>

        {/* 3. Nature of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Nature of the Platform</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Technology Service Only</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift provides technology that connects individuals for private carpooling. All transportation is provided by independent private individuals acting in their personal capacity.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 No Transportation Provider</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift does not provide, arrange, or broker transportation services. We do not employ drivers, own vehicles, or operate as a transportation company.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Private Arrangements</Text>
          </Text>
          <Text style={styles.paragraph}>
            All carpool arrangements made through the Platform are private, voluntary agreements between you and the Driver. Drift is not a party to these arrangements.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.4 Independent Decision-Making</Text>
          </Text>
          <Text style={styles.paragraph}>
            You maintain complete independence in deciding whether to request a carpool match, which Driver to connect with, and whether to proceed with any arrangement.
          </Text>
        </View>

        {/* 4. Using the Platform */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Using the Platform as a Rider</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Requesting Carpool Matches</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may request carpool matches by entering pickup and destination locations. The Platform will display available Drivers who may be traveling similar routes.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 No Guaranteed Service</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift does not guarantee that any Driver will accept your request, that matches will be available, or that any carpool arrangement will be completed as planned.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 Communication</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may communicate with Drivers through the Platform to coordinate pickup details and confirm arrangements. All communication must be respectful and lawful.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.4 Location Services</Text>
          </Text>
          <Text style={styles.paragraph}>
            You grant permission for the Platform to access your device location to facilitate carpool matches and provide location-based services. You may disable location services, but this may limit Platform functionality.
          </Text>
        </View>

        {/* 5. Cost-Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Cost-Sharing Contributions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Voluntary Contributions</Text>
          </Text>
          <Text style={styles.paragraph}>
            Cost-sharing contributions are voluntary payments between Riders and Drivers to offset travel expenses such as fuel, vehicle maintenance, and wear.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Not Commercial Fares</Text>
          </Text>
          <Text style={styles.paragraph}>
            Cost-sharing contributions are NOT commercial fares, taxi rates, or payment for transportation services. They represent shared expenses in a private carpooling arrangement.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Payment Processing</Text>
          </Text>
          <Text style={styles.paragraph}>
            If you choose to make cost-sharing contributions through the Platform, payments are processed by PayPal, a third-party payment processor. Drift does not handle, store, or process payment card information.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.4 Platform Technology Fee</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift may charge a technology service fee for facilitating connections and processing payments. This fee covers platform operation, maintenance, and support—NOT transportation services.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.5 Refund Policy</Text>
          </Text>
          <Text style={styles.paragraph}>
            Cost-sharing contributions are between you and the Driver. Refund requests must be made within 24 hours of the scheduled pickup time. Drift will mediate disputes but does not guarantee refunds.
          </Text>
        </View>

        {/* 6. User Conduct */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. User Conduct and Responsibilities</Text>
          <Text style={styles.paragraph}>
            As a Rider, you agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Treat all Drivers and other users with respect and courtesy</Text>
          <Text style={styles.bulletPoint}>• Provide accurate pickup and destination information</Text>
          <Text style={styles.bulletPoint}>• Arrive at the designated pickup location on time</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable Cayman Islands laws</Text>
          <Text style={styles.bulletPoint}>• Not engage in illegal, harmful, or abusive behavior</Text>
          <Text style={styles.bulletPoint}>• Not misuse the Platform for fraudulent purposes</Text>
          <Text style={styles.bulletPoint}>• Not harass, threaten, or harm other users</Text>
          <Text style={styles.bulletPoint}>• Not damage vehicles or property</Text>
          <Text style={styles.bulletPoint}>• Maintain appropriate conduct at all times</Text>
          <Text style={styles.paragraph}>
            Violation of these conduct standards may result in account suspension or termination.
          </Text>
        </View>

        {/* 7. Safety and Insurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Safety and Insurance</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Your Safety Responsibility</Text>
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for your own safety when using the Platform. You should exercise good judgment when deciding to participate in any carpool arrangement.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Driver Responsibility</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drivers are independent individuals responsible for maintaining valid insurance coverage. Drift does not verify insurance coverage or provide insurance for carpool arrangements.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 No Guarantee of Safety</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift cannot and does not guarantee the safety, reliability, or legality of any carpool arrangement. You participate in carpooling at your own risk.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.4 Emergency Features</Text>
          </Text>
          <Text style={styles.paragraph}>
            The Platform includes safety features such as trip sharing and emergency contact notification. However, these features do not eliminate risks associated with carpooling.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.5 Reporting Issues</Text>
          </Text>
          <Text style={styles.paragraph}>
            You must immediately report any safety concerns, accidents, or incidents through the Platform's reporting feature or contact local authorities if there is an emergency.
          </Text>
        </View>

        {/* 8. Ratings and Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Ratings and Reviews</Text>
          <Text style={styles.paragraph}>
            You may rate and review Drivers after completing a carpool arrangement. All ratings and reviews must be honest, accurate, and respectful. You may not post false, misleading, defamatory, or abusive content.
          </Text>
          <Text style={styles.paragraph}>
            Drift reserves the right to remove ratings or reviews that violate these Terms or Platform guidelines.
          </Text>
        </View>

        {/* 9. Intellectual Property */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            The Platform, including all content, features, trademarks, logos, and intellectual property, is owned by Drift Ltd. and protected by copyright, trademark, and other laws.
          </Text>
          <Text style={styles.paragraph}>
            You are granted a limited, non-exclusive, non-transferable license to use the Platform for personal, non-commercial purposes. You may not copy, modify, distribute, sell, or reverse engineer any part of the Platform.
          </Text>
        </View>

        {/* 10. Privacy and Data Protection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Privacy and Data Protection</Text>
          <Text style={styles.paragraph}>
            Drift processes your Personal Data in accordance with the Cayman Islands Data Protection Act (2021 Revision) and our Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            By using the Platform, you consent to the collection, use, and disclosure of your Personal Data as described in our Privacy Policy, which is incorporated into these Terms by reference.
          </Text>
          <Text style={styles.paragraph}>
            We collect and process:
          </Text>
          <Text style={styles.bulletPoint}>• Account information (name, email, phone number)</Text>
          <Text style={styles.bulletPoint}>• Location data for carpool matching</Text>
          <Text style={styles.bulletPoint}>• Trip history and preferences</Text>
          <Text style={styles.bulletPoint}>• Payment information (processed by PayPal)</Text>
          <Text style={styles.bulletPoint}>• Ratings and reviews</Text>
          <Text style={styles.bulletPoint}>• Device information and app usage data</Text>
        </View>

        {/* 11. Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>11.1 No Liability for User Actions</Text>
          </Text>
          <Text style={styles.paragraph}>
            DRIFT, ITS DIRECTORS, OFFICERS, EMPLOYEES, AND AFFILIATES ARE NOT LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM:
          </Text>
          <Text style={styles.bulletPoint}>• Your use of the Platform or inability to use the Platform</Text>
          <Text style={styles.bulletPoint}>• Any carpool arrangement facilitated through the Platform</Text>
          <Text style={styles.bulletPoint}>• Actions or omissions of any Driver or other user</Text>
          <Text style={styles.bulletPoint}>• Personal injury, property damage, or death</Text>
          <Text style={styles.bulletPoint}>• Loss of data, revenue, or profits</Text>
          <Text style={styles.bulletPoint}>• Vehicle accidents or incidents</Text>
          <Text style={styles.bulletPoint}>• Insurance coverage disputes</Text>
          <Text style={styles.bulletPoint}>• Failure of payment systems</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>11.2 Maximum Liability</Text>
          </Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by Cayman Islands law, Drift's total liability to you for all claims arising from your use of the Platform shall not exceed the lesser of: (a) CI$100, or (b) the total amount of cost-sharing contributions you have paid through the Platform in the 12 months preceding the claim.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>11.3 As-Is Service</Text>
          </Text>
          <Text style={styles.paragraph}>
            THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </Text>
        </View>

        {/* 12. Indemnification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify, defend, and hold harmless Drift, its directors, officers, employees, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
          </Text>
          <Text style={styles.bulletPoint}>• Your use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Your violation of these Terms</Text>
          <Text style={styles.bulletPoint}>• Your violation of any applicable law</Text>
          <Text style={styles.bulletPoint}>• Any carpool arrangement you participate in</Text>
          <Text style={styles.bulletPoint}>• Your interactions with other users</Text>
          <Text style={styles.bulletPoint}>• Any personal injury or property damage</Text>
        </View>

        {/* 13. Account Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Account Suspension and Termination</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>13.1 Termination by You</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may terminate your account at any time through the Platform settings. Upon termination, you will no longer have access to your account or Platform features.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>13.2 Termination by Drift</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift reserves the right to suspend or terminate your account immediately, without notice, if:
          </Text>
          <Text style={styles.bulletPoint}>• You violate these Terms</Text>
          <Text style={styles.bulletPoint}>• You engage in fraudulent or illegal activity</Text>
          <Text style={styles.bulletPoint}>• You receive multiple negative ratings</Text>
          <Text style={styles.bulletPoint}>• You pose a safety risk to other users</Text>
          <Text style={styles.bulletPoint}>• You provide false or misleading information</Text>
          <Text style={styles.bulletPoint}>• Required by law or regulatory authority</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>13.3 Effect of Termination</Text>
          </Text>
          <Text style={styles.paragraph}>
            Upon termination, your right to use the Platform immediately ceases. Sections of these Terms that by their nature should survive termination shall survive, including liability limitations, indemnification, and dispute resolution.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>13.4 Account Deletion and Data Rights</Text>
          </Text>
          <Text style={styles.paragraph}>
            You have the right to request deletion of your account and Personal Data in accordance with the Cayman Islands Data Protection Act (2021 Revision). We will delete your data within 30 days, except where retention is required by law.
          </Text>
        </View>

        {/* 14. Dispute Resolution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Dispute Resolution and Arbitration</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>14.1 Informal Resolution</Text>
          </Text>
          <Text style={styles.paragraph}>
            If you have a dispute with Drift, you agree to first contact us at legal@drift.ky to attempt informal resolution.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>14.2 Binding Arbitration</Text>
          </Text>
          <Text style={styles.paragraph}>
            Any dispute that cannot be resolved informally shall be resolved through binding arbitration in George Town, Grand Cayman, in accordance with the Cayman Islands Arbitration Act (2012 Revision).
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>14.3 Class Action Waiver</Text>
          </Text>
          <Text style={styles.paragraph}>
            You waive any right to participate in a class action lawsuit or class-wide arbitration against Drift.
          </Text>
        </View>

        {/* 15. Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Governing Law and Jurisdiction</Text>
          <Text style={styles.paragraph}>
            These Terms shall be governed by and construed in accordance with the laws of the Cayman Islands, without regard to conflict of law principles.
          </Text>
          <Text style={styles.paragraph}>
            Any legal action or proceeding arising from these Terms or your use of the Platform shall be brought exclusively in the courts of the Cayman Islands, and you consent to the jurisdiction of such courts.
          </Text>
        </View>

        {/* 16. Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>16. Modifications to Terms</Text>
          <Text style={styles.paragraph}>
            Drift reserves the right to modify these Terms at any time. We will notify you of material changes through the Platform or via email.
          </Text>
          <Text style={styles.paragraph}>
            Continued use of the Platform after changes constitutes acceptance of the modified Terms. If you do not agree to the modified Terms, you must stop using the Platform and close your account.
          </Text>
        </View>

        {/* 17. General Provisions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>17. General Provisions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>17.1 Entire Agreement</Text>
          </Text>
          <Text style={styles.paragraph}>
            These Terms, together with the Privacy Policy, constitute the entire agreement between you and Drift regarding use of the Platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>17.2 Severability</Text>
          </Text>
          <Text style={styles.paragraph}>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>17.3 No Waiver</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift's failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>17.4 Assignment</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may not assign or transfer these Terms or your account without Drift's prior written consent. Drift may assign these Terms without restriction.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>17.5 Force Majeure</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift shall not be liable for any failure to perform due to causes beyond our reasonable control, including natural disasters, war, terrorism, riots, labor disputes, or government actions.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>18. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Terms, please contact:
          </Text>
          <Text style={styles.contactInfo}>Drift Ltd.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: legal@drift.ky</Text>
          <Text style={styles.contactInfo}>Support: support@drift.ky</Text>
          <Text style={styles.contactInfo}>Website: www.drift.ky</Text>
        </View>

        {/* Acknowledgment */}
        <View style={[styles.section, styles.acknowledgmentSection]}>
          <Text style={styles.acknowledgmentTitle}>Acknowledgment</Text>
          <Text style={styles.paragraph}>
            By creating an account or using the Drift Platform, you acknowledge that:
          </Text>
          <Text style={styles.bulletPoint}>✓ You have read and understood these Terms</Text>
          <Text style={styles.bulletPoint}>✓ You agree to be bound by these Terms</Text>
          <Text style={styles.bulletPoint}>✓ You understand Drift is a technology platform only</Text>
          <Text style={styles.bulletPoint}>✓ All carpool arrangements are private agreements between users</Text>
          <Text style={styles.bulletPoint}>✓ You participate in carpooling at your own risk</Text>
          <Text style={styles.bulletPoint}>✓ Drift is not a transportation provider</Text>
        </View>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drift Rider Terms of Service v1.0</Text>
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
  importantSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 8,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark,
    marginLeft: 12,
  },
  acknowledgmentSection: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 8,
  },
  acknowledgmentTitle: {
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