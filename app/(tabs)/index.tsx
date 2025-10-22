import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/auth-store";

const PURPLE = "#5d1289ff";
const LIGHT_PURPLE = "#d8d3ecff";
const BORDER = "#E5E7EB";

export default function HomeScreen() {
  const router = useRouter();
  const { user, currentMode, setMode } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  };

  const isRider = currentMode === "RIDER";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header: logo + avatar */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logo}
          />
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mode Switch */}
        <View style={styles.modeTrack}>
          <TouchableOpacity
            style={[styles.modeBtn, isRider && styles.modeBtnActive]}
            onPress={() => setMode("RIDER")}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeTxt, isRider && styles.modeTxtActive]}>
              Rider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, !isRider && styles.modeBtnActive]}
            onPress={() => setMode("DRIVER")}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeTxt, !isRider && styles.modeTxtActive]}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Call-to-Action */}
        <TouchableOpacity
          onPress={() =>
            router.push(isRider ? "/(carpool)/request" : "/(carpool)/offer")
          }
          activeOpacity={0.9}
          style={styles.primaryCta}
        >
          <Text style={styles.ctaTitle}>✨ Find a Ride</Text>
          <Text style={styles.ctaSubtitle}>
            Carpool with drivers heading your way
          </Text>
        </TouchableOpacity>

        {/* Quick access cards */}
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/scheduled")}
            style={[styles.lightCard, { marginRight: 10 }]}
          >
            <Text style={styles.cardEmoji}>📅</Text>
            <Text style={styles.cardTitle}>My Bookings</Text>
            <Text style={styles.cardDesc}>View your upcoming rides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/saved-routes")}
            style={[styles.lightCard, { marginLeft: 10 }]}
          >
            <Text style={styles.cardEmoji}>⭐</Text>
            <Text style={styles.cardTitle}>Saved Routes</Text>
            <Text style={styles.cardDesc}>Quick access to frequent trips</Text>
          </TouchableOpacity>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapWrap}>
          <Text style={styles.mapLabel}>Nearby area</Text>
          <Image
            source={{
              uri: "https://www.google.com/maps/search/?api=1&query=37.7749,-122.4194 ",
            }}
            style={styles.mapPlaceholder}
            resizeMode="cover"
          />
        </View>

        {/* Activity / Notice Section */}
        <View style={styles.activityCard}>
          <Text style={styles.activityHeader}>Your Activity</Text>
          <Text style={styles.activityText}>
            No recent carpools yet. Start your first trip today!
          </Text>
        </View>

        {/* Legal Info */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            <Text style={{ fontWeight: "700" }}>Peer-to-Peer Platform: </Text>
            Drift connects independent users for private carpools. We’re not a
            transportation company or rideshare service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "white" },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: { width: 120, height: 42, resizeMode: "contain" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "white", fontWeight: "800", fontSize: 16 },

  modeTrack: {
    flexDirection: "row",
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: "white", borderWidth: 1, borderColor: PURPLE },
  modeTxt: { color: PURPLE, fontWeight: "600" },
  modeTxtActive: { color: PURPLE, fontWeight: "700" },

  primaryCta: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    shadowColor: PURPLE,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  ctaTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  ctaSubtitle: { color: "#E9E4FF", fontSize: 12, marginTop: 4 },

  row: { flexDirection: "row", marginBottom: 16 },
  lightCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardEmoji: { fontSize: 20, marginBottom: 8 },
  cardTitle: { color: "#111827", fontWeight: "800", fontSize: 16 },
  cardDesc: { color: "#6B7280", fontSize: 12, marginTop: 2 },

  mapWrap: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },
  mapLabel: {
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 2,
  },
  mapPlaceholder: {
    height: 160,
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },

  activityCard: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    marginBottom: 18,
  },
  activityHeader: { color: PURPLE, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  activityText: { color: "#4B5563", fontSize: 13, lineHeight: 18 },

  notice: {
    backgroundColor: "#F9FAFB",
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },
  noticeText: { color: "#4B5563", fontSize: 12, lineHeight: 18 },
});
