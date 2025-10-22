import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";

export default function ActiveOffersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Active Ride Offers</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Empty state card */}
        <View style={styles.cardCenter}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.cardTitle}>No Active Ride Offers</Text>
          <Text style={styles.cardDesc}>
            Create a ride offer to share your trip with riders.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/offer")}
          >
            <Text style={styles.primaryBtnTxt}>Create Ride Offer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  link: { color: PURPLE, fontWeight: "700" },

  cardCenter: {
    backgroundColor: "white", borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: BORDER, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 18, color: "#111827", fontWeight: "800", marginBottom: 6, textAlign: "center" },
  cardDesc: { color: "#6B7280", textAlign: "center", fontSize: 13, marginBottom: 14 },
  primaryBtn: {
    backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignSelf: "stretch",
  },
  primaryBtnTxt: { color: "white", fontWeight: "800", textAlign: "center" },
});
