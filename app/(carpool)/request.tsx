import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";

export default function RequestCarpoolScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Find a Ride</Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>🎯</Text>
          <Text style={styles.subtitle}>
            Carpool with drivers heading your way
          </Text>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Pickup Location</Text>
            <Text style={styles.inputGhost}>📍 Tap to select location</Text>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Dropoff Location</Text>
            <Text style={styles.inputGhost}>🎯 Tap to select destination</Text>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>When?</Text>
            <Text style={styles.inputGhost}>🕐 Select departure time</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => console.log("Finding carpool match...")}
          >
            <Text style={styles.primaryBtnTxt}>Find Available Matches</Text>
          </TouchableOpacity>

          <View style={styles.helper}>
            <Text style={styles.helperTxt}>
              💡 We'll connect you with drivers heading your way. You'll see your cost before confirming.
            </Text>
          </View>
        </View>

        {/* Optional: quick tips or recent searches could go here */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 12 },

  card: {
    backgroundColor: "white", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  emoji: { fontSize: 44, textAlign: "center", marginBottom: 8 },
  subtitle: { color: MUTED, fontSize: 13, textAlign: "center", marginBottom: 16 },

  inputBlock: {
    backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: BORDER, marginBottom: 10,
  },
  inputLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  inputGhost: { fontSize: 14, color: "#9CA3AF" },

  primaryBtn: {
    backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 14, marginTop: 10,
  },
  primaryBtnTxt: { color: "white", fontWeight: "800", textAlign: "center" },

  helper: {
    backgroundColor: "#F5F3FF", borderColor: "#DDD6FE", borderWidth: 1,
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  helperTxt: { color: "#4C1D95", fontSize: 12, textAlign: "center" },
});
