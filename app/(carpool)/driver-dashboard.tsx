import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";

export default function DriverDashboardScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Driver Dashboard</Text>

        {/* Stats grid */}
        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🚗</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Total Rides Shared</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: PURPLE }]}>$0.00</Text>
            <Text style={styles.statLabel}>Cost Sharing Received</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={styles.statValue}>0 mi</Text>
            <Text style={styles.statLabel}>Total Distance</Text>
          </View>
        </View>

        {/* Info notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            💡 Your stats will appear here once you start sharing rides.
            Remember: all cost sharing is handled privately between you and riders.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 12 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "48%", backgroundColor: "white", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  notice: {
    backgroundColor: "#F9FAFB", borderColor: BORDER, borderWidth: 1,
    borderRadius: 14, padding: 12, marginTop: 16,
  },
  noticeText: { color: "#4B5563", fontSize: 13, lineHeight: 18, textAlign: "center" },
});
