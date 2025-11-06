import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Share } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function ReferralProgramScreen() {
  const referralCode = 'DRIFT-JS2024';
  const totalEarned = 250.00;
  const activeReferrals = 5;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Drift and earn money driving! Use my code ${referralCode} to get a bonus. Download: https://drift.ky`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>CI${totalEarned.toFixed(2)}</Text>
          <Text style={styles.earningsLabel}>Total Referral Earnings</Text>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <Text style={styles.code}>{referralCode}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={Colors.white} />
            <Text style={styles.shareText}>Share Code</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsValue}>{activeReferrals}</Text>
          <Text style={styles.statsLabel}>Active Referrals</Text>
        </View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How It Works</Text>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepText}>1</Text></View>
            <Text style={styles.stepDesc}>Share your code with other drivers</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepText}>2</Text></View>
            <Text style={styles.stepDesc}>They sign up and complete 10 trips</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}><Text style={styles.stepText}>3</Text></View>
            <Text style={styles.stepDesc}>You both earn CI$50 bonus!</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  earningsCard: { backgroundColor: Colors.success, padding: Spacing['2xl'], margin: Spacing.md, borderRadius: 16, alignItems: 'center', ...Shadows.lg },
  earningsAmount: { fontSize: Typography.fontSize['4xl'], fontFamily: Typography.fontFamily.bold, color: Colors.white, marginBottom: 4 },
  earningsLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.white },
  codeCard: { backgroundColor: Colors.gray[50], padding: Spacing.lg, margin: Spacing.md, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' },
  codeLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600], marginBottom: Spacing.xs },
  code: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.primary, marginBottom: Spacing.md, letterSpacing: 2 },
  shareButton: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs },
  shareText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.white },
  statsCard: { backgroundColor: Colors.gray[50], padding: Spacing.lg, margin: Spacing.md, borderRadius: 12, alignItems: 'center' },
  statsValue: { fontSize: Typography.fontSize['3xl'], fontFamily: Typography.fontFamily.bold, color: Colors.primary, marginBottom: 4 },
  statsLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.gray[700] },
  howItWorks: { padding: Spacing.md },
  howTitle: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginBottom: Spacing.md },
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
  stepDesc: { flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.gray[700] },
});