import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";

export default function OfferRideScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Offer a Ride</Text>

        <View style={styles.card}>
          <Text style={styles.emoji}>🚗</Text>
          <Text style={styles.subtitle}>
            Share your trip and split costs with riders heading your way
          </Text>

          {/* Inputs (placeholders) */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Starting From</Text>
            <Text style={styles.inputGhost}>📍 Tap to select start location</Text>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Destination</Text>
            <Text style={styles.inputGhost}>🎯 Tap to select destination</Text>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Departure Time</Text>
            <Text style={styles.inputGhost}>🕐 Select when you're leaving</Text>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Available Seats</Text>
            <Text style={styles.inputGhost}>💺 How many seats to share?</Text>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Suggested Cost Share (per seat)</Text>
            <Text style={styles.inputGhost}>💰 Based on distance and fuel</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => console.log("Creating ride offer...")}
          >
            <Text style={styles.primaryBtnTxt}>Create Ride Offer</Text>
          </TouchableOpacity>

          <View style={styles.helper}>
            <Text style={styles.helperTxt}>
              💡 Share your trip details and connect with riders. You'll split travel costs privately.
            </Text>
          </View>
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
    backgroundColor: PURPLE, borderRadius: 12, paddingVertical: 14, marginTop: 10,
  },
  primaryBtnTxt: { color: "white", fontWeight: "800", textAlign: "center" },

  helper: {
    backgroundColor: "#F5F3FF", borderColor: "#DDD6FE", borderWidth: 1,
    borderRadius: 12, padding: 12, marginTop: 14,
  },
  helperTxt: { color: "#4C1D95", fontSize: 12, textAlign: "center" },
});
