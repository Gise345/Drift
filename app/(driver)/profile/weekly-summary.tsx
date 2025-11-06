import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function WeeklySummaryScreen() {
  const summary = {
    week: 'Nov 4-10, 2024',
    totalEarnings: 1250.00,
    totalTrips: 42,
    hoursOnline: 28,
    avgRating: 4.9,
    topDay: 'Friday',
    topDayEarnings: 385.00,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Weekly Summary</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.weekCard}>
          <Text style={styles.weekText}>{summary.week}</Text>
        </View>

        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>CI${summary.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="car" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{summary.totalTrips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{summary.hoursOnline}h</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={24} color={Colors.warning} />
            <Text style={styles.statValue}>{summary.avgRating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Performance</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Best Day</Text>
            <Text style={styles.infoValue}>{summary.topDay} - CI${summary.topDayEarnings.toFixed(2)}</Text>
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
  weekCard: { backgroundColor: Colors.gray[50], padding: Spacing.md, margin: Spacing.md, borderRadius: 12, alignItems: 'center' },
  weekText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semibold, color: Colors.gray[700] },
  earningsCard: { backgroundColor: Colors.success, padding: Spacing['2xl'], margin: Spacing.md, borderRadius: 16, alignItems: 'center', ...Shadows.lg },
  earningsAmount: { fontSize: Typography.fontSize['4xl'], fontFamily: Typography.fontFamily.bold, color: Colors.white, marginBottom: 4 },
  earningsLabel: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.medium, color: Colors.white },
  statsGrid: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.gray[50], borderRadius: 12, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  statValue: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginTop: Spacing.xs, marginBottom: 2 },
  statLabel: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600] },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginBottom: Spacing.sm },
  infoCard: { backgroundColor: Colors.gray[50], borderRadius: 12, padding: Spacing.md },
  infoLabel: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600], marginBottom: 4 },
  infoValue: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
});