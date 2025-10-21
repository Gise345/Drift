import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/stores/auth-store";

const { width } = Dimensions.get("window");
const BG = "#0B0620";
const CARD_BG = "rgba(255,255,255,0.06)";
const BORDER = "rgba(255,255,255,0.10)";
const PURPLE = "#7C3AED";

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
        {/* Top row: Logo + avatar */}
        <View style={styles.topRow}>
          <Image
            source={require("@/assets/logo.png")} // make sure this path matches your project
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

        {/* Mode pill switch */}
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

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() =>
            router.push(isRider ? "/(carpool)/request" : "/(carpool)/offer")
          }
          activeOpacity={0.9}
          style={styles.primaryCta}
        >
          <View style={[styles.primaryCtaInner, { backgroundColor: PURPLE }]}>
            <Text style={styles.ctaTitle}>✨ Find a Ride</Text>
            <Text style={styles.ctaSubtitle}>
              Carpool with drivers heading your way
            </Text>
          </View>
        </TouchableOpacity>

        {/* Two dark cards */}
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/scheduled")}
            style={[styles.darkCard, { marginRight: 10 }]}
          >
            <Text style={styles.cardEmoji}>📅</Text>
            <Text style={styles.cardTitle}>My Bookings</Text>
            <Text style={styles.cardDesc}>View your upcoming rides</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(carpool)/saved-routes")}
            style={[styles.darkCard, { marginLeft: 10 }]}
          >
            <Text style={styles.cardEmoji}>⭐</Text>
            <Text style={styles.cardTitle}>Saved Routes</Text>
            <Text style={styles.cardDesc}>Quick access to frequent trips</Text>
          </TouchableOpacity>
        </View>

        {/* Mini Map view */}
        <View style={styles.mapWrap}>
          <Text style={styles.mapLabel}>Map view</Text>
          <MapView
            style={styles.map}
            pointerEvents="none"
            initialRegion={{
              latitude: 19.3133,
              longitude: -81.2546,
              latitudeDelta: 0.07,
              longitudeDelta: 0.07,
            }}
          >
            <Marker
              coordinate={{ latitude: 19.3133, longitude: -81.2546 }}
              title="Grand Cayman"
              description="Example location"
            />
          </MapView>
        </View>

        {/* Legal / extra content below the map */}
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
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  logo: { width: 120, height: 42, resizeMode: "contain" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  avatarTxt: { color: "white", fontWeight: "800", fontSize: 16 },

  modeTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
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
  modeBtnActive: { backgroundColor: "white" },
  modeTxt: { color: "white", fontWeight: "600" },
  modeTxtActive: { color: "#3B2A7E", fontWeight: "700" },

  primaryCta: { borderRadius: 18, overflow: "hidden", marginBottom: 14 },
  primaryCtaInner: { paddingVertical: 18, paddingHorizontal: 18 },
  ctaTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  ctaSubtitle: { color: "#E9E4FF", fontSize: 12, marginTop: 4 },

  row: { flexDirection: "row", marginTop: 6, marginBottom: 16 },
  darkCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardEmoji: { fontSize: 20, marginBottom: 8 },
  cardTitle: { color: "white", fontWeight: "800", fontSize: 16 },
  cardDesc: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },

  mapWrap: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 18,
  },
  mapLabel: {
    color: "white",
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 2,
  },
  map: { height: 160, borderRadius: 14 },

  notice: {
    backgroundColor: "#F5F3FF20",
    borderColor: "#DDD6FE33",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },
  noticeText: { color: "#E9E4FF", fontSize: 12, lineHeight: 18 },
});
