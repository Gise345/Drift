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
  primary: '#5d1289',
};

/**
 * DRIFT DRIVER AGREEMENT
 * 
 * Independent Contractor Agreement establishing the relationship
 * between Drift and drivers using the platform.
 * 
 * Last Updated: November 29, 2024
 * Effective Date: December 1, 2024
 */

export default function DriverAgreementScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Agreement</Text>
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

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.title}>Driver Agreement</Text>
          <Text style={styles.subtitle}>Independent Private Individual Relationship</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties to This Agreement</Text>
          <Text style={styles.paragraph}>
            This Driver Agreement ("Agreement") is entered into between:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>("Drift")</Text>
          </Text>
          <Text style={styles.contactInfo}>Drift Ltd.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.paragraph}>
            AND
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>You ("Driver")</Text> - an independent private individual using the Drift Platform
          </Text>
        </View>

        {/* Recitals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Background and Purpose</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>WHEREAS:</Text>
          </Text>
          <Text style={styles.bulletPoint}>
            • Drift operates a technology platform that facilitates private carpooling arrangements between independent individuals in the Cayman Islands
          </Text>
          <Text style={styles.bulletPoint}>
            • Driver is an independent private individual who wishes to use the Platform to make their availability known for private carpooling
          </Text>
          <Text style={styles.bulletPoint}>
            • Driver acknowledges they are NOT an employee, contractor, agent, or representative of Drift
          </Text>
          <Text style={styles.bulletPoint}>
            • All parties agree this is a technology service relationship, not an employment or transportation service relationship
          </Text>
        </View>

        {/* 1. Independent Relationship */}
        <View style={[styles.section, styles.criticalSection]}>
          <View style={styles.criticalHeader}>
            <Ionicons name="document-text" size={24} color={Colors.primary} />
            <Text style={styles.criticalTitle}>1. Independent Private Individual Status</Text>
          </View>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.1 Nature of Relationship</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver is an independent private individual, not an employee, contractor, partner, joint venturer, agent, franchisee, or representative of Drift. This Agreement does not create any employment relationship.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.2 No Employment Benefits</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver is not entitled to:
          </Text>
          <Text style={styles.bulletPoint}>• Employment benefits of any kind</Text>
          <Text style={styles.bulletPoint}>• Health insurance or medical benefits</Text>
          <Text style={styles.bulletPoint}>• Paid time off or vacation pay</Text>
          <Text style={styles.bulletPoint}>• Retirement or pension benefits</Text>
          <Text style={styles.bulletPoint}>• Workers' compensation coverage</Text>
          <Text style={styles.bulletPoint}>• Unemployment insurance benefits</Text>
          <Text style={styles.bulletPoint}>• Any other employee-related benefits</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.3 No Supervision or Control</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift does not and will not:
          </Text>
          <Text style={styles.bulletPoint}>• Supervise, direct, or control Driver's daily activities</Text>
          <Text style={styles.bulletPoint}>• Set Driver's work schedule or hours</Text>
          <Text style={styles.bulletPoint}>• Require Driver to accept any carpool request</Text>
          <Text style={styles.bulletPoint}>• Impose performance quotas or requirements</Text>
          <Text style={styles.bulletPoint}>• Require exclusive use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Control how Driver interacts with Riders</Text>
          <Text style={styles.bulletPoint}>• Dictate driving routes or methods</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.4 Complete Independence</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver maintains complete independence and autonomy in:
          </Text>
          <Text style={styles.bulletPoint}>• Deciding when and whether to use the Platform</Text>
          <Text style={styles.bulletPoint}>• Choosing which requests to accept or decline</Text>
          <Text style={styles.bulletPoint}>• Setting their own availability and schedule</Text>
          <Text style={styles.bulletPoint}>• Selecting driving routes and preferences</Text>
          <Text style={styles.bulletPoint}>• Managing their vehicle and business expenses</Text>
          <Text style={styles.bulletPoint}>• Providing carpooling services as they see fit</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.5 Right to Engage in Other Activities</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver is free to:
          </Text>
          <Text style={styles.bulletPoint}>• Use other carpooling or ride-sharing platforms</Text>
          <Text style={styles.bulletPoint}>• Engage in other business activities</Text>
          <Text style={styles.bulletPoint}>• Accept other employment</Text>
          <Text style={styles.bulletPoint}>• Refuse any work through the Platform</Text>
        </View>

        {/* 2. Platform Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Platform Access and Services</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 Technology Platform</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift provides Driver with access to a technology platform that:
          </Text>
          <Text style={styles.bulletPoint}>• Connects independent drivers with riders seeking carpools</Text>
          <Text style={styles.bulletPoint}>• Facilitates communication between users</Text>
          <Text style={styles.bulletPoint}>• Provides GPS navigation and routing</Text>
          <Text style={styles.bulletPoint}>• Processes optional cost-sharing contributions</Text>
          <Text style={styles.bulletPoint}>• Offers safety features and reporting tools</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.2 Not a Transportation Service</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver acknowledges and agrees that:
          </Text>
          <Text style={styles.bulletPoint}>• Drift is NOT a transportation provider</Text>
          <Text style={styles.bulletPoint}>• Drift does NOT provide, arrange, or broker rides</Text>
          <Text style={styles.bulletPoint}>• All carpooling is private arrangement between users</Text>
          <Text style={styles.bulletPoint}>• Drift is NOT a taxi, for-hire, or commercial transport service</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.3 Platform Service Fee</Text>
          </Text>
          <Text style={styles.paragraph}>
            A 19% platform service fee is applied to all cost-sharing contributions processed through the Platform. This fee covers:
          </Text>
          <Text style={styles.bulletPoint}>• Payment processing costs (~4%): PayPal fees, transaction security, fraud prevention</Text>
          <Text style={styles.bulletPoint}>• Platform maintenance (~15%): Software engineering, server hosting, Google Maps API, customer support, safety features</Text>
          <Text style={styles.paragraph}>
            Driver receives 81% of each cost-sharing contribution. This fee structure is transparent and deducted automatically from each transaction.
          </Text>
        </View>

        {/* 3. Driver Obligations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Driver Obligations and Requirements</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Legal Requirements</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver represents and warrants that they:
          </Text>
          <Text style={styles.bulletPoint}>• Are at least 21 years of age</Text>
          <Text style={styles.bulletPoint}>• Hold a valid Cayman Islands or recognized driver's license</Text>
          <Text style={styles.bulletPoint}>• Are legally authorized to operate in the Cayman Islands</Text>
          <Text style={styles.bulletPoint}>• Have legal capacity to enter this Agreement</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Insurance Requirements</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver MUST maintain, at their own expense:
          </Text>
          <Text style={styles.bulletPoint}>• Valid motor vehicle insurance meeting Cayman Islands requirements</Text>
          <Text style={styles.bulletPoint}>• Coverage for passenger transportation</Text>
          <Text style={styles.bulletPoint}>• Adequate liability coverage</Text>
          <Text style={styles.bulletPoint}>• Current policy in good standing</Text>
          <Text style={styles.paragraph}>
            Driver must provide proof of insurance upon request and notify Drift immediately if coverage lapses.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Vehicle Requirements</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver's vehicle must:
          </Text>
          <Text style={styles.bulletPoint}>• Be registered in the Cayman Islands</Text>
          <Text style={styles.bulletPoint}>• Pass safety inspections as required by law</Text>
          <Text style={styles.bulletPoint}>• Be maintained in safe, roadworthy condition</Text>
          <Text style={styles.bulletPoint}>• Be clean and presentable</Text>
          <Text style={styles.bulletPoint}>• Have working seatbelts for all passengers</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.4 Conduct and Compliance</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver agrees to:
          </Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable Cayman Islands laws</Text>
          <Text style={styles.bulletPoint}>• Drive safely and responsibly at all times</Text>
          <Text style={styles.bulletPoint}>• Treat all Riders with respect and courtesy</Text>
          <Text style={styles.bulletPoint}>• Maintain professional conduct</Text>
          <Text style={styles.bulletPoint}>• Not discriminate against any Rider</Text>
          <Text style={styles.bulletPoint}>• Not engage in illegal or harmful activity</Text>
        </View>

        {/* 4. Financial Arrangements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Financial Arrangements</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Cost-Sharing Contributions</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver may receive voluntary cost-sharing contributions from Riders to offset expenses such as fuel, maintenance, and vehicle wear. These contributions are:
          </Text>
          <Text style={styles.bulletPoint}>• Voluntary payments between private individuals</Text>
          <Text style={styles.bulletPoint}>• NOT commercial fares or taxi rates</Text>
          <Text style={styles.bulletPoint}>• Based on suggested amounts (subject to mutual agreement)</Text>
          <Text style={styles.bulletPoint}>• Subject to 19% platform service fee (Driver receives 81%)</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Payment Processing & Fee Structure</Text>
          </Text>
          <Text style={styles.paragraph}>
            All cost-sharing contributions are processed through the Platform's secure payment system:
          </Text>
          <Text style={styles.bulletPoint}>• Payments are processed by PayPal (third-party)</Text>
          <Text style={styles.bulletPoint}>• 19% platform service fee is deducted (4% transaction fees + 15% platform maintenance)</Text>
          <Text style={styles.bulletPoint}>• Driver receives 81% of rider's contribution</Text>
          <Text style={styles.bulletPoint}>• Funds are transferred to Driver's registered PayPal account</Text>
          <Text style={styles.bulletPoint}>• All payments must be processed through the in-app system for safety</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 No Guaranteed Earnings</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift makes NO guarantees regarding:
          </Text>
          <Text style={styles.bulletPoint}>• Amount of earnings or income</Text>
          <Text style={styles.bulletPoint}>• Number of carpool opportunities</Text>
          <Text style={styles.bulletPoint}>• Frequency of requests</Text>
          <Text style={styles.bulletPoint}>• Rider participation or demand</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.4 Taxes and Reporting</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver is solely responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Determining tax obligations on any income received</Text>
          <Text style={styles.bulletPoint}>• Filing all required tax returns</Text>
          <Text style={styles.bulletPoint}>• Paying all applicable taxes</Text>
          <Text style={styles.bulletPoint}>• Maintaining records for tax purposes</Text>
          <Text style={styles.bulletPoint}>• Consulting with tax professionals as needed</Text>
          <Text style={styles.paragraph}>
            Drift is NOT responsible for withholding taxes, issuing tax forms, or providing tax advice.
          </Text>
        </View>

        {/* 5. Insurance and Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Insurance and Liability</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Driver's Insurance Obligation</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver acknowledges they are SOLELY responsible for obtaining and maintaining adequate insurance coverage at their own expense.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 No Platform-Provided Coverage</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift does NOT provide:
          </Text>
          <Text style={styles.bulletPoint}>• Auto insurance of any kind</Text>
          <Text style={styles.bulletPoint}>• Liability coverage</Text>
          <Text style={styles.bulletPoint}>• Medical or health insurance</Text>
          <Text style={styles.bulletPoint}>• Workers' compensation</Text>
          <Text style={styles.bulletPoint}>• Commercial auto insurance</Text>
          <Text style={styles.bulletPoint}>• Any other insurance coverage</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Driver Assumes All Risk</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver assumes ALL risks associated with:
          </Text>
          <Text style={styles.bulletPoint}>• Operating their vehicle</Text>
          <Text style={styles.bulletPoint}>• Transporting passengers</Text>
          <Text style={styles.bulletPoint}>• Vehicle accidents or incidents</Text>
          <Text style={styles.bulletPoint}>• Personal injury or property damage</Text>
          <Text style={styles.bulletPoint}>• Equipment failure or malfunction</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.4 Driver's Full Liability</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver is fully liable for all claims, damages, injuries, and losses arising from their use of the Platform and participation in carpooling.
          </Text>
        </View>

        {/* 6. Indemnification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Indemnification</Text>
          <Text style={styles.paragraph}>
            Driver agrees to indemnify, defend, and hold harmless Drift, its directors, officers, employees, and affiliates from and against ALL claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising from or related to:
          </Text>
          <Text style={styles.bulletPoint}>• Driver's use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Driver's participation in carpooling</Text>
          <Text style={styles.bulletPoint}>• Vehicle accidents or incidents</Text>
          <Text style={styles.bulletPoint}>• Personal injury or property damage</Text>
          <Text style={styles.bulletPoint}>• Driver's violation of this Agreement</Text>
          <Text style={styles.bulletPoint}>• Driver's violation of applicable laws</Text>
          <Text style={styles.bulletPoint}>• Claims by Riders or third parties</Text>
          <Text style={styles.bulletPoint}>• Insurance coverage disputes</Text>
          <Text style={styles.bulletPoint}>• Regulatory investigations or actions</Text>
        </View>

        {/* 7. Term and Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Term and Termination</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Term</Text>
          </Text>
          <Text style={styles.paragraph}>
            This Agreement begins when Driver creates an account and continues until terminated by either party.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Termination by Driver</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver may terminate this Agreement at any time by closing their account. Termination is effective immediately.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 Termination by Drift</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift may terminate this Agreement immediately if Driver:
          </Text>
          <Text style={styles.bulletPoint}>• Violates this Agreement</Text>
          <Text style={styles.bulletPoint}>• Violates Platform policies</Text>
          <Text style={styles.bulletPoint}>• Engages in fraudulent or illegal activity</Text>
          <Text style={styles.bulletPoint}>• Poses a safety risk</Text>
          <Text style={styles.bulletPoint}>• Fails to maintain required insurance</Text>
          <Text style={styles.bulletPoint}>• License or registration expires/revoked</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.4 Effect of Termination</Text>
          </Text>
          <Text style={styles.bulletPoint}>• Platform access immediately revoked</Text>
          <Text style={styles.bulletPoint}>• Outstanding payments processed</Text>
          <Text style={styles.bulletPoint}>• Surviving provisions remain in effect</Text>
        </View>

        {/* 8. General Provisions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. General Provisions</Text>
          
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.1 Entire Agreement</Text>
          </Text>
          <Text style={styles.paragraph}>
            This Agreement, together with the Driver Terms of Service and Privacy Policy, constitutes the entire agreement between Driver and Drift.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.2 Amendments</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift may amend this Agreement at any time. Driver will be notified of material changes and continued use constitutes acceptance.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.3 Governing Law</Text>
          </Text>
          <Text style={styles.paragraph}>
            This Agreement is governed by the laws of the Cayman Islands.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.4 Dispute Resolution</Text>
          </Text>
          <Text style={styles.paragraph}>
            Disputes shall be resolved through binding arbitration in George Town, Grand Cayman.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.5 Severability</Text>
          </Text>
          <Text style={styles.paragraph}>
            If any provision is found invalid, remaining provisions remain in full effect.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.6 No Waiver</Text>
          </Text>
          <Text style={styles.paragraph}>
            Failure to enforce any right does not constitute a waiver.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.7 Assignment</Text>
          </Text>
          <Text style={styles.paragraph}>
            Driver may not assign this Agreement. Drift may assign without restriction.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contact Information</Text>
          <Text style={styles.contactInfo}>Drift Ltd.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: drivers@drift.ky</Text>
          <Text style={styles.contactInfo}>Legal: legal@drift.ky</Text>
        </View>

        {/* Acknowledgment */}
        <View style={[styles.section, styles.acknowledgmentSection]}>
          <Text style={styles.acknowledgmentTitle}>Driver Acknowledgment</Text>
          <Text style={styles.paragraph}>
            By accepting this Driver Agreement, you acknowledge and agree that:
          </Text>
          <Text style={styles.bulletPoint}>✓ You have read and understood this entire Agreement</Text>
          <Text style={styles.bulletPoint}>✓ You are an independent private individual, NOT an employee</Text>
          <Text style={styles.bulletPoint}>✓ You are solely responsible for insurance and taxes</Text>
          <Text style={styles.bulletPoint}>✓ Drift provides technology only, not transportation services</Text>
          <Text style={styles.bulletPoint}>✓ You assume all risks of carpooling</Text>
          <Text style={styles.bulletPoint}>✓ You maintain complete independence in all activities</Text>
          <Text style={styles.bulletPoint}>✓ No earnings or income are guaranteed</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drift Driver Agreement v1.0</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray,
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
  criticalSection: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  criticalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
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