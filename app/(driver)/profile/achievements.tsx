import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function AchievementsScreen() {
  const achievements = [
    { id: '1', title: 'First Trip', icon: 'car', unlocked: true, date: '2024-01-15' },
    { id: '2', title: '10 Trips', icon: 'trending-up', unlocked: true, date: '2024-01-25' },
    { id: '3', title: '5-Star Pro', icon: 'star', unlocked: true, date: '2024-02-10' },
    { id: '4', title: 'Century Club', icon: 'trophy', unlocked: true, date: '2024-05-01' },
    { id: '5', title: '500 Trips', icon: 'medal', unlocked: false },
    { id: '6', title: 'Top Earner', icon: 'flash', unlocked: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Achievements</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.stats}>
          <Text style={styles.statsText}>{achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked</Text>
        </View>

        <View style={styles.grid}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={[styles.card, !achievement.unlocked && styles.cardLocked]}>
              <Ionicons name={achievement.icon as any} size={48} color={achievement.unlocked ? Colors.primary : Colors.gray[400]} />
              <Text style={[styles.title, !achievement.unlocked && styles.titleLocked]}>{achievement.title}</Text>
              {achievement.unlocked && achievement.date && <Text style={styles.date}>{new Date(achievement.date).toLocaleDateString()}</Text>}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  stats: { padding: Spacing.md, alignItems: 'center' },
  statsText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semibold, color: Colors.gray[700] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: Spacing.md },
  card: { width: '47%', backgroundColor: Colors.gray[50], borderRadius: 16, padding: Spacing.md, alignItems: 'center', ...Shadows.sm },
  cardLocked: { opacity: 0.5 },
  title: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black, marginTop: Spacing.sm, textAlign: 'center' },
  titleLocked: { color: Colors.gray[500] },
  date: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600], marginTop: 4 },
});