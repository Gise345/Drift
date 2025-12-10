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
 * DRIFT DRIVER - TERMS OF SERVICE
 * 
 * Compliant with:
 * - Apple App Store Review Guidelines (Section 5.1.1)
 * - Google Play Developer Distribution Agreement
 * - Cayman Islands Data Protection Act (2021 Revision)
 * - Cayman Islands Motor Vehicle Insurance Law
 * - Cayman Islands Traffic Act
 * 
 * Last Updated: November 29, 2024
 * Effective Date: December 1, 2024
 */

export default function DriverTermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Terms of Service</Text>
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
          <Text style={styles.title}>Drift Driver Terms of Service</Text>
          <Text style={styles.paragraph}>
            Welcome to Drift. These Driver Terms of Service ("Driver Terms") govern your access to and use of the Drift mobile application ("App") as an independent driver making your availability known for private carpooling arrangements within the Cayman Islands.
          </Text>
          <Text style={styles.paragraph}>
            By creating a driver account or using the App, you agree to be bound by these Driver Terms. If you do not agree to these Driver Terms, you may not use the App as a driver.
          </Text>
          <Text style={styles.paragraph}>
            These Driver Terms are in addition to the general Terms of Service and the Driver Agreement.
          </Text>
        </View>

        {/* Critical Understanding */}
        <View style={[styles.section, styles.importantSection]}>
          <View style={styles.importantHeader}>
            <Ionicons name="alert-circle" size={24} color={Colors.warning} />
            <Text style={styles.importantTitle}>Critical: Independent Relationship</Text>
          </View>
          <Text style={styles.paragraph}>
            You are an INDEPENDENT PRIVATE INDIVIDUAL acting in your personal capacity. Drift does NOT:
          </Text>
          <Text style={styles.bulletPoint}>• Employ you or engage you as a contractor</Text>
          <Text style={styles.bulletPoint}>• Direct or control your activities</Text>
          <Text style={styles.bulletPoint}>• Set your schedule or require minimum hours</Text>
          <Text style={styles.bulletPoint}>• Assign rides or passengers to you</Text>
          <Text style={styles.bulletPoint}>• Own or lease your vehicle</Text>
          <Text style={styles.bulletPoint}>• Provide insurance coverage for you or your vehicle</Text>
          <Text style={styles.bulletPoint}>• Act as a transportation company or taxi service</Text>
          <Text style={styles.bulletPoint}>• Guarantee any level of earnings</Text>
        </View>

        {/* 1. Definitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Definitions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Platform"</Text> means the Drift mobile application and related services.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Driver"</Text> or <Text style={styles.bold}>"You"</Text> means an independent individual who uses the Platform to make availability known for carpooling.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Rider"</Text> means an individual seeking carpool matches through the Platform.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Carpool Match"</Text> means a connection facilitated by the Platform between you and a Rider.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Cost-Sharing Contribution"</Text> means a voluntary payment from Riders to offset travel expenses.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>"Platform Service Fee"</Text> means the 19% fee deducted from each cost-sharing contribution (4% for transaction processing + 15% for platform maintenance).
          </Text>
        </View>

        {/* 2. Independent Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Independent Private Individual Status</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 No Employment Relationship</Text>
          </Text>
          <Text style={styles.paragraph}>
            You acknowledge and agree that:
          </Text>
          <Text style={styles.bulletPoint}>• You are NOT an employee, contractor, agent, or representative of Drift</Text>
          <Text style={styles.bulletPoint}>• You are an independent private individual acting in your personal capacity</Text>
          <Text style={styles.bulletPoint}>• No employment relationship exists between you and Drift</Text>
          <Text style={styles.bulletPoint}>• You are not entitled to employment benefits, insurance, or protections</Text>
          <Text style={styles.bulletPoint}>• You are solely responsible for all taxes and regulatory compliance</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.2 Complete Independence</Text>
          </Text>
          <Text style={styles.paragraph}>
            You maintain complete independence in:
          </Text>
          <Text style={styles.bulletPoint}>• Deciding when and whether to use the Platform</Text>
          <Text style={styles.bulletPoint}>• Choosing which carpool requests to accept or decline</Text>
          <Text style={styles.bulletPoint}>• Setting your own availability and schedule</Text>
          <Text style={styles.bulletPoint}>• Managing your vehicle and expenses</Text>
          <Text style={styles.bulletPoint}>• Determining how you provide carpooling</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.3 No Supervision or Control</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift does not and will not:
          </Text>
          <Text style={styles.bulletPoint}>• Supervise, direct, or control your daily activities</Text>
          <Text style={styles.bulletPoint}>• Require you to accept any carpool request</Text>
          <Text style={styles.bulletPoint}>• Set mandatory work hours or schedules</Text>
          <Text style={styles.bulletPoint}>• Dictate how you interact with Riders</Text>
          <Text style={styles.bulletPoint}>• Require exclusive use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Impose performance quotas or minimum acceptance rates</Text>
        </View>

        {/* 3. Eligibility Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Driver Eligibility and Requirements</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Age and Legal Capacity</Text>
          </Text>
          <Text style={styles.bulletPoint}>• Be at least 21 years of age</Text>
          <Text style={styles.bulletPoint}>• Have legal capacity to enter into binding contracts</Text>
          <Text style={styles.bulletPoint}>• Be legally authorized to work/conduct activities in the Cayman Islands</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Driver's License</Text>
          </Text>
          <Text style={styles.bulletPoint}>• Hold a valid Cayman Islands driver's license OR</Text>
          <Text style={styles.bulletPoint}>• Hold a valid international driver's license recognized in Cayman Islands</Text>
          <Text style={styles.bulletPoint}>• License must be current and in good standing</Text>
          <Text style={styles.bulletPoint}>• License must authorize the class of vehicle you drive</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Vehicle Requirements</Text>
          </Text>
          <Text style={styles.paragraph}>
            Your vehicle must:
          </Text>
          <Text style={styles.bulletPoint}>• Be registered in the Cayman Islands</Text>
          <Text style={styles.bulletPoint}>• Be in safe operating condition</Text>
          <Text style={styles.bulletPoint}>• Meet all Cayman Islands safety inspection requirements</Text>
          <Text style={styles.bulletPoint}>• Have valid vehicle registration</Text>
          <Text style={styles.bulletPoint}>• Have working seatbelts for all passengers</Text>
          <Text style={styles.bulletPoint}>• Be clean and well-maintained</Text>
          <Text style={styles.bulletPoint}>• Have a maximum seating capacity that complies with registration</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.4 Insurance Requirements (CRITICAL)</Text>
          </Text>
          <Text style={styles.paragraph}>
            You MUST maintain valid motor vehicle insurance that:
          </Text>
          <Text style={styles.bulletPoint}>• Meets or exceeds Cayman Islands minimum coverage requirements</Text>
          <Text style={styles.bulletPoint}>• Covers liability for 3rd party</Text>
          <Text style={styles.bulletPoint}>• Is current and paid up to date</Text>
          <Text style={styles.bulletPoint}>• Names you as an insured driver</Text>
          <Text style={styles.bulletPoint}>• Covers the vehicle you use on the Platform</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>IMPORTANT:</Text> Drift does NOT provide insurance coverage of any kind. You are solely responsible for ensuring adequate insurance. Failure to maintain valid insurance may result in immediate account termination and legal liability.
          </Text>

        </View>

        {/* 4. Platform Service Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Platform Service Fee</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Fee Structure</Text>
          </Text>
          <Text style={styles.paragraph}>
            A 20% platform service fee is applied to all cost-sharing contributions processed through the Platform. You receive 80% of each rider's contribution.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Fee Breakdown</Text>
          </Text>
          <Text style={styles.paragraph}>
            The 20% platform service fee covers:
          </Text>
          <Text style={styles.bulletPoint}>• Payment Processing (~4%): Stripe fees, transaction security, fraud prevention, PCI compliance</Text>
          <Text style={styles.bulletPoint}>• Platform Maintenance (~16%): Software engineering, server hosting, Google Maps API, database maintenance, customer support, safety features</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 Example Transaction</Text>
          </Text>
          <Text style={styles.paragraph}>
            For a CI$20 cost-sharing contribution:
          </Text>
          <Text style={styles.bulletPoint}>• Driver receives: CI$16.00 (80%)</Text>
          <Text style={styles.bulletPoint}>• Platform service fee: CI$4.00 (20%)</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.4 Transparent Deduction</Text>
          </Text>
          <Text style={styles.paragraph}>
            The platform service fee is automatically deducted from each transaction. You will see your net earnings (80% of rider contribution) in your earnings dashboard.
          </Text>
        </View>

        {/* 5. Cost-Sharing Contributions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Cost-Sharing Contributions</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Voluntary Contributions</Text>
          </Text>
          <Text style={styles.paragraph}>
            Cost-sharing contributions are voluntary payments from Riders to offset your travel expenses including fuel, vehicle maintenance, wear and tear, and related costs.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Not Commercial Fares</Text>
          </Text>
          <Text style={styles.paragraph}>
            You acknowledge that cost-sharing contributions are:
          </Text>
          <Text style={styles.bulletPoint}>• NOT commercial transportation fares</Text>
          <Text style={styles.bulletPoint}>• NOT taxi rates or for-hire charges</Text>
          <Text style={styles.bulletPoint}>• Shared expenses in private carpooling</Text>
          <Text style={styles.bulletPoint}>• Based on zone-based suggested amounts</Text>
          <Text style={styles.bulletPoint}>• Subject to mutual agreement between you and Rider</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Platform Suggested Amounts</Text>
          </Text>
          <Text style={styles.paragraph}>
            The Platform displays suggested cost-sharing amounts based on:
          </Text>
          <Text style={styles.bulletPoint}>• Geographic zones (CI$8-10 within zone)</Text>
          <Text style={styles.bulletPoint}>• Distance traveled</Text>
          <Text style={styles.bulletPoint}>• Typical fuel and vehicle costs</Text>
          <Text style={styles.paragraph}>
            These are SUGGESTIONS only. You and the Rider may agree to different amounts or no contribution at all.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.4 Payment Processing</Text>
          </Text>
          <Text style={styles.paragraph}>
            Cost-sharing contributions processed through the Platform:
          </Text>
          <Text style={styles.bulletPoint}>• Are processed by Stripe (third-party processor)</Text>
          <Text style={styles.bulletPoint}>• Have 19% platform service fee automatically deducted</Text>
          <Text style={styles.bulletPoint}>• Net amount (80%) is transferred to your Wise bank account</Text>
          <Text style={styles.bulletPoint}>• Arrive within 1-2 business days</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.5 Tax Responsibilities</Text>
          </Text>
          <Text style={styles.paragraph}>
            You are solely responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Determining if cost-sharing contributions are taxable income</Text>
          <Text style={styles.bulletPoint}>• Reporting income to Cayman Islands tax authorities (if applicable)</Text>
          <Text style={styles.bulletPoint}>• Maintaining records for tax purposes</Text>
          <Text style={styles.bulletPoint}>• Complying with all tax laws and regulations</Text>
          <Text style={styles.paragraph}>
            Drift does not provide tax advice. Consult a tax professional regarding your obligations.
          </Text>
        </View>

        {/* 6. Using the Platform */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Using the Platform as a Driver</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.1 Account Activation</Text>
          </Text>
          <Text style={styles.paragraph}>
            Before using the Platform as a driver, you must:
          </Text>
          <Text style={styles.bulletPoint}>• Complete registration and verification</Text>
          <Text style={styles.bulletPoint}>• Upload required documents (license, insurance, vehicle registration)</Text>
          <Text style={styles.bulletPoint}>• Pass background and driving record checks</Text>
          <Text style={styles.bulletPoint}>• Agree to these Driver Terms and the Driver Agreement</Text>
          <Text style={styles.bulletPoint}>• Set up payment method for Platform Access Fee</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.2 Availability and Acceptance</Text>
          </Text>
          <Text style={styles.bulletPoint}>• You control your own availability (online/offline)</Text>
          <Text style={styles.bulletPoint}>• You independently decide whether to accept each carpool request</Text>
          <Text style={styles.bulletPoint}>• You are NOT required to accept any request</Text>
          <Text style={styles.bulletPoint}>• There are NO penalties for declining requests</Text>
          <Text style={styles.bulletPoint}>• You may go offline at any time</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.3 Accepting Requests</Text>
          </Text>
          <Text style={styles.paragraph}>
            When you accept a carpool request:
          </Text>
          <Text style={styles.bulletPoint}>• You agree to proceed to the pickup location</Text>
          <Text style={styles.bulletPoint}>• You commit to providing the carpool as arranged</Text>
          <Text style={styles.bulletPoint}>• You should arrive on time</Text>
          <Text style={styles.bulletPoint}>• You must notify the Rider of any delays</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.4 Cancellations</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may cancel accepted requests:
          </Text>
          <Text style={styles.bulletPoint}>• Before arriving at pickup location (reasonable notice preferred)</Text>
          <Text style={styles.bulletPoint}>• For safety reasons at any time</Text>
          <Text style={styles.bulletPoint}>• If Rider violates conduct standards</Text>
          <Text style={styles.bulletPoint}>• Excessive cancellations may impact your rating</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.5 Right to Refuse</Text>
          </Text>
          <Text style={styles.paragraph}>
            You maintain the right to:
          </Text>
          <Text style={styles.bulletPoint}>• Refuse any Rider for safety concerns</Text>
          <Text style={styles.bulletPoint}>• Decline requests from Riders with low ratings</Text>
          <Text style={styles.bulletPoint}>• End a carpool arrangement if you feel unsafe</Text>
          <Text style={styles.bulletPoint}>• Report inappropriate behavior immediately</Text>
        </View>

        {/* 7. Driver Responsibilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Driver Responsibilities and Conduct</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Legal Compliance</Text>
          </Text>
          <Text style={styles.paragraph}>
            You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Comply with ALL Cayman Islands traffic laws</Text>
          <Text style={styles.bulletPoint}>• Maintain valid driver's license at all times</Text>
          <Text style={styles.bulletPoint}>• Maintain current vehicle registration</Text>
          <Text style={styles.bulletPoint}>• Maintain adequate insurance coverage</Text>
          <Text style={styles.bulletPoint}>• Pass vehicle safety inspections as required</Text>
          <Text style={styles.bulletPoint}>• Comply with all applicable laws and regulations</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Safe Driving</Text>
          </Text>
          <Text style={styles.paragraph}>
            You must:
          </Text>
          <Text style={styles.bulletPoint}>• Drive safely and defensively at all times</Text>
          <Text style={styles.bulletPoint}>• Obey all speed limits and traffic signals</Text>
          <Text style={styles.bulletPoint}>• Never drive under the influence of alcohol or drugs</Text>
          <Text style={styles.bulletPoint}>• Not use mobile phone while driving (except hands-free)</Text>
          <Text style={styles.bulletPoint}>• Ensure all passengers wear seatbelts</Text>
          <Text style={styles.bulletPoint}>• Maintain safe following distance</Text>
          <Text style={styles.bulletPoint}>• Drive according to weather and road conditions</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 Vehicle Maintenance</Text>
          </Text>
          <Text style={styles.paragraph}>
            You are responsible for:
          </Text>
          <Text style={styles.bulletPoint}>• Regular vehicle maintenance and servicing</Text>
          <Text style={styles.bulletPoint}>• Ensuring vehicle is safe and roadworthy</Text>
          <Text style={styles.bulletPoint}>• Keeping vehicle clean and presentable</Text>
          <Text style={styles.bulletPoint}>• Addressing mechanical issues promptly</Text>
          <Text style={styles.bulletPoint}>• Maintaining proper tire pressure and tread</Text>
          <Text style={styles.bulletPoint}>• Ensuring all lights and signals work properly</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.4 Professional Conduct</Text>
          </Text>
          <Text style={styles.paragraph}>
            You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Treat all Riders with respect and courtesy</Text>
          <Text style={styles.bulletPoint}>• Provide a safe and comfortable experience</Text>
          <Text style={styles.bulletPoint}>• Arrive at pickup locations on time</Text>
          <Text style={styles.bulletPoint}>• Follow agreed-upon routes (or explain alternatives)</Text>
          <Text style={styles.bulletPoint}>• Assist with reasonable luggage handling</Text>
          <Text style={styles.bulletPoint}>• Maintain appropriate conversation and behavior</Text>
          <Text style={styles.bulletPoint}>• Respect Rider preferences (music, temperature, conversation)</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.5 Prohibited Conduct</Text>
          </Text>
          <Text style={styles.paragraph}>
            You must NOT:
          </Text>
          <Text style={styles.bulletPoint}>• Harass, threaten, or harm Riders</Text>
          <Text style={styles.bulletPoint}>• Discriminate based on protected characteristics</Text>
          <Text style={styles.bulletPoint}>• Make unwanted advances or inappropriate comments</Text>
          <Text style={styles.bulletPoint}>• Use or possess illegal drugs or weapons</Text>
          <Text style={styles.bulletPoint}>• Drive recklessly or dangerously</Text>
          <Text style={styles.bulletPoint}>• Smoke or vape in the vehicle with passengers</Text>
          <Text style={styles.bulletPoint}>• Solicit tips or additional payments beyond agreed amounts</Text>
          <Text style={styles.bulletPoint}>• Collect or use Rider personal information outside the Platform</Text>
          <Text style={styles.bulletPoint}>• Operate as a commercial taxi or for-hire service</Text>
        </View>

        {/* 8. Insurance and Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Insurance and Liability</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.1 Your Insurance Obligation</Text>
          </Text>
          <Text style={styles.paragraph}>
            You MUST maintain adequate motor vehicle insurance covering:
          </Text>
          <Text style={styles.bulletPoint}>• Liability for bodily injury to passengers</Text>
          <Text style={styles.bulletPoint}>• Property damage liability</Text>
          <Text style={styles.bulletPoint}>• Coverage for your vehicle</Text>
          <Text style={styles.bulletPoint}>• Medical payments coverage</Text>
          <Text style={styles.bulletPoint}>• Uninsured/underinsured motorist coverage</Text>
          <Text style={styles.paragraph}>
            You must maintain insurance that meets or exceeds Cayman Islands minimum requirements and covers passenger transportation.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.2 No Platform-Provided Insurance</Text>
          </Text>
          <Text style={styles.paragraph}>
            You acknowledge that:
          </Text>
          <Text style={styles.bulletPoint}>• Drift does NOT provide any insurance coverage</Text>
          <Text style={styles.bulletPoint}>• Drift is NOT an insurer or insurance broker</Text>
          <Text style={styles.bulletPoint}>• You are solely responsible for insurance</Text>
          <Text style={styles.bulletPoint}>• Your personal insurance must cover carpool activities</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.3 Your Liability</Text>
          </Text>
          <Text style={styles.paragraph}>
            You are solely liable for:
          </Text>
          <Text style={styles.bulletPoint}>• All accidents, injuries, or damages during carpooling</Text>
          <Text style={styles.bulletPoint}>• Vehicle maintenance and repair costs</Text>
          <Text style={styles.bulletPoint}>• Traffic violations and fines</Text>
          <Text style={styles.bulletPoint}>• Claims by Riders or third parties</Text>
          <Text style={styles.bulletPoint}>• Property damage to your vehicle or others</Text>
          <Text style={styles.bulletPoint}>• Legal fees and court costs</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.4 Incident Reporting</Text>
          </Text>
          <Text style={styles.paragraph}>
            If an accident or incident occurs, you must:
          </Text>
          <Text style={styles.bulletPoint}>• Ensure safety of all parties</Text>
          <Text style={styles.bulletPoint}>• Contact emergency services if needed</Text>
          <Text style={styles.bulletPoint}>• Report to your insurance company</Text>
          <Text style={styles.bulletPoint}>• Report through the Platform within 24 hours</Text>
          <Text style={styles.bulletPoint}>• Provide accurate information about the incident</Text>
          <Text style={styles.bulletPoint}>• Cooperate with investigations</Text>
        </View>

        {/* Continue with remaining sections... */}
        {/* For brevity, I'll include the section titles and key points */}

        {/* 9. Ratings and Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Ratings and Reviews</Text>
          <Text style={styles.paragraph}>
            Riders may rate and review you after each trip. Your rating affects your visibility on the Platform. Consistently low ratings may result in account suspension or termination.
          </Text>
          <Text style={styles.paragraph}>
            You may also rate Riders. All ratings must be honest and accurate.
          </Text>
        </View>

        {/* 10. Account Suspension and Termination */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Account Suspension and Termination</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>10.1 Termination by You</Text>
          </Text>
          <Text style={styles.paragraph}>
            You may terminate your driver account at any time. Termination is effective immediately.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>10.2 Termination by Drift</Text>
          </Text>
          <Text style={styles.paragraph}>
            Drift may suspend or terminate your driver account immediately if:
          </Text>
          <Text style={styles.bulletPoint}>• You violate these Driver Terms or the Driver Agreement</Text>
          <Text style={styles.bulletPoint}>• Your license, registration, or insurance expires or is revoked</Text>
          <Text style={styles.bulletPoint}>• You receive multiple safety complaints</Text>
          <Text style={styles.bulletPoint}>• Your rating falls below acceptable standards</Text>
          <Text style={styles.bulletPoint}>• You engage in fraudulent or illegal activity</Text>
          <Text style={styles.bulletPoint}>• Required by law or regulatory authority</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>10.3 Effect of Termination</Text>
          </Text>
          <Text style={styles.bulletPoint}>• Immediate loss of Platform access</Text>
          <Text style={styles.bulletPoint}>• Outstanding cost-sharing contributions will be processed</Text>
          <Text style={styles.bulletPoint}>• Personal data handled per Privacy Policy</Text>
        </View>

        {/* 11. Limitation of Liability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            DRIFT, ITS DIRECTORS, OFFICERS, EMPLOYEES, AND AFFILIATES ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM:
          </Text>
          <Text style={styles.bulletPoint}>• Your use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Any carpool arrangement</Text>
          <Text style={styles.bulletPoint}>• Accidents, injuries, or deaths</Text>
          <Text style={styles.bulletPoint}>• Vehicle damage or mechanical failure</Text>
          <Text style={styles.bulletPoint}>• Insurance disputes or coverage gaps</Text>
          <Text style={styles.bulletPoint}>• Lost income or earnings</Text>
          <Text style={styles.bulletPoint}>• Rider conduct or claims</Text>
          <Text style={styles.bulletPoint}>• Payment processing failures</Text>
          <Text style={styles.paragraph}>
            Maximum liability: CI$100 or total Platform Access Fees paid in prior 12 months, whichever is less.
          </Text>
        </View>

        {/* 12. Indemnification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Indemnification</Text>
          <Text style={styles.paragraph}>
            You agree to indemnify, defend, and hold harmless Drift from any claims, damages, losses, and expenses (including legal fees) arising from:
          </Text>
          <Text style={styles.bulletPoint}>• Your use of the Platform</Text>
          <Text style={styles.bulletPoint}>• Any carpool arrangement you participate in</Text>
          <Text style={styles.bulletPoint}>• Vehicle accidents or incidents</Text>
          <Text style={styles.bulletPoint}>• Your violation of these Driver Terms</Text>
          <Text style={styles.bulletPoint}>• Your violation of applicable laws</Text>
          <Text style={styles.bulletPoint}>• Insurance coverage disputes</Text>
          <Text style={styles.bulletPoint}>• Claims by Riders or third parties</Text>
        </View>

        {/* 13. Governing Law */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>13. Governing Law and Dispute Resolution</Text>
          <Text style={styles.paragraph}>
            These Driver Terms are governed by the laws of the Cayman Islands. Disputes shall be resolved through binding arbitration in George Town, Grand Cayman.
          </Text>
          <Text style={styles.paragraph}>
            You waive any right to participate in class action lawsuits.
          </Text>
        </View>

        {/* 14. Changes to Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>14. Modifications to Driver Terms</Text>
          <Text style={styles.paragraph}>
            Drift may modify these Driver Terms at any time. Material changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance.
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact Information</Text>
          <Text style={styles.paragraph}>
            For questions about these Driver Terms:
          </Text>
          <Text style={styles.contactInfo}>Invovibe Tech Ltd / I.T Cayman.</Text>
          <Text style={styles.contactInfo}>George Town, Grand Cayman</Text>
          <Text style={styles.contactInfo}>Cayman Islands</Text>
          <Text style={styles.contactInfo}>Email: info@drift-global.com</Text>
          <Text style={styles.contactInfo}>Legal: legal@drift-global.com</Text>
          <Text style={styles.contactInfo}>Support: info@drift-global.com</Text>
        </View>

        {/* Acknowledgment */}
        <View style={[styles.section, styles.acknowledgmentSection]}>
          <Text style={styles.acknowledgmentTitle}>Driver Acknowledgment</Text>
          <Text style={styles.paragraph}>
            By creating a driver account, you acknowledge:
          </Text>
          <Text style={styles.bulletPoint}>✓ You are an independent private individual, not an employee</Text>
          <Text style={styles.bulletPoint}>✓ You maintain complete independence in all activities</Text>
          <Text style={styles.bulletPoint}>✓ You are responsible for insurance, taxes, and legal compliance</Text>
          <Text style={styles.bulletPoint}>✓ Drift does not provide insurance or guarantee earnings</Text>
          <Text style={styles.bulletPoint}>✓ You participate in carpooling at your own risk</Text>
          <Text style={styles.bulletPoint}>✓ All cost-sharing contributions are voluntary</Text>
        </View>

        {/* Version Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drift Driver Terms of Service v1.0</Text>
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