import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const BORDER = "#E5E7EB";
const PURPLE = "#7C3AED";
const MUTED = "#6B7280";

export default function SavedRoutesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Saved Routes</Text>

        <View style={styles.cardCenter}>
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.cardTitle}>No Saved Routes</Text>
          <Text style={styles.cardDesc}>
            Save your frequent trips for faster matching.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/request")}
            style={styles.outlineBtn}
          >
            <Text style={styles.outlineTxt}>Create Your First Route</Text>
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
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 12 },

  cardCenter: {
    backgroundColor: "white", borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: BORDER, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardTitle: { fontSize: 18, color: "#111827", fontWeight: "800", marginBottom: 6, textAlign: "center" },
  cardDesc: { color: MUTED, textAlign: "center", fontSize: 13, marginBottom: 14 },

  outlineBtn: {
    borderWidth: 1, borderColor: PURPLE, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  outlineTxt: { color: PURPLE, fontWeight: "800" },
});
