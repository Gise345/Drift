import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BORDER = "#E5E7EB";
const MUTED = "#6B7280";

export default function ScheduledCarpoolsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Scheduled Carpools</Text>

        <View style={styles.cardCenter}>
          <Text style={styles.emoji}>📅</Text>
          <Text style={styles.cardTitle}>No Scheduled Carpools</Text>
          <Text style={styles.cardDesc}>
            Your upcoming carpool trips will appear here.
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

  cardCenter: {
    backgroundColor: "white", borderRadius: 16, padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: BORDER, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 18, color: "#111827", fontWeight: "800", marginBottom: 6, textAlign: "center" },
  cardDesc: { color: MUTED, textAlign: "center", fontSize: 13 },
});
