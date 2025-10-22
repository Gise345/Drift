import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/stores/auth-store";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  // createdAt can be a Date, number, or Firestore timestamp-like
  let memberSince = "N/A";
  if (user?.createdAt) {
    try {
      const d =
        user.createdAt instanceof Date
          ? user.createdAt
          : new Date(
              // handle firestore timestamp {seconds, nanoseconds}
              ((user.createdAt as any).seconds
                ? (user.createdAt as any).seconds * 1000
                : user.createdAt) as number
            );
      memberSince = isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
    } catch {
      memberSince = "N/A";
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          {/* Avatar + name */}
          <View style={styles.centerBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTxt}>
                {user?.name?.[0]?.toUpperCase() || "U"}
              </Text>
            </View>
            <Text style={styles.name}>{user?.name || "User"}</Text>
            <Text style={styles.email}>{user?.email || "user@drift.com"}</Text>
          </View>

          {/* Details */}
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user?.phone || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rating</Text>
            <Text style={styles.value}>⭐ {user?.rating || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Member Since</Text>
            <Text style={styles.value}>{memberSince}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const PURPLE = "#7C3AED";
const BORDER = "#E5E7EB";
const TEXT_MUTED = "#6B7280";

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
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  centerBlock: { alignItems: "center", marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PURPLE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarTxt: { color: "white", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 18, fontWeight: "800", color: "#111827" },
  email: { fontSize: 14, color: TEXT_MUTED, marginTop: 2 },

  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  label: { color: TEXT_MUTED },
  value: { color: "#111827", fontWeight: "600" },

  signOutBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutTxt: { color: "white", fontWeight: "700", fontSize: 16 },
});
