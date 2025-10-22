import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Activity</Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>📋</Text>
          <Text style={styles.cardText}>
            Your carpool activity will appear here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  scroll: { flex: 1 },
  content: { padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emoji: { fontSize: 48, marginBottom: 12 },
  cardText: { color: "#6B7280", textAlign: "center", fontSize: 14 },
});
