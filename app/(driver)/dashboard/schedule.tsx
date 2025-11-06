import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

type TimeSlot = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export default function Schedule() {
  const router = useRouter();
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  
  const [schedule, setSchedule] = useState<TimeSlot[]>([
    { day: 'Monday', enabled: true, startTime: '08:00 AM', endTime: '05:00 PM' },
    { day: 'Tuesday', enabled: true, startTime: '08:00 AM', endTime: '05:00 PM' },
    { day: 'Wednesday', enabled: true, startTime: '08:00 AM', endTime: '05:00 PM' },
    { day: 'Thursday', enabled: true, startTime: '08:00 AM', endTime: '05:00 PM' },
    { day: 'Friday', enabled: true, startTime: '08:00 AM', endTime: '05:00 PM' },
    { day: 'Saturday', enabled: false, startTime: '10:00 AM', endTime: '08:00 PM' },
    { day: 'Sunday', enabled: false, startTime: '10:00 AM', endTime: '08:00 PM' },
  ]);

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const totalHours = schedule
    .filter((s) => s.enabled)
    .reduce((sum, s) => {
      const start = parseInt(s.startTime);
      const end = parseInt(s.endTime);
      return sum + (end - start);
    }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity>
          <Ionicons name="checkmark" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Schedule Toggle */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <View style={styles.toggleIcon}>
              <Ionicons name="calendar" size={24} color={Colors.primary} />
            </View>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Set Driving Schedule</Text>
              <Text style={styles.toggleDescription}>
                Plan your driving hours in advance
              </Text>
            </View>
          </View>
          <Switch
            value={scheduleEnabled}
            onValueChange={setScheduleEnabled}
            trackColor={{ false: Colors.gray[300], true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>

        {scheduleEnabled && (
          <>
            {/* Weekly Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Ionicons name="time-outline" size={24} color={Colors.primary} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryValue}>{totalHours} hrs</Text>
                  <Text style={styles.summaryLabel}>Per Week</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryValue}>
                    {schedule.filter((s) => s.enabled).length} days
                  </Text>
                  <Text style={styles.summaryLabel}>Active</Text>
                </View>
              </View>
            </View>

            {/* Weekly Schedule */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Schedule</Text>

              {schedule.map((slot, index) => (
                <View
                  key={slot.day}
                  style={[
                    styles.dayCard,
                    !slot.enabled && styles.dayCardDisabled,
                  ]}
                >
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, !slot.enabled && styles.dayNameDisabled]}>
                      {slot.day}
                    </Text>
                    <Switch
                      value={slot.enabled}
                      onValueChange={() => toggleDay(index)}
                      trackColor={{ false: Colors.gray[300], true: Colors.success }}
                      thumbColor={Colors.white}
                    />
                  </View>

                  {slot.enabled && (
                    <View style={styles.timeRow}>
                      <TouchableOpacity style={styles.timeButton}>
                        <Ionicons name="time-outline" size={16} color={Colors.primary} />
                        <Text style={styles.timeText}>{slot.startTime}</Text>
                      </TouchableOpacity>
                      <Ionicons name="arrow-forward" size={16} color={Colors.gray[400]} />
                      <TouchableOpacity style={styles.timeButton}>
                        <Ionicons name="time-outline" size={16} color={Colors.primary} />
                        <Text style={styles.timeText}>{slot.endTime}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Quick Templates */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Templates</Text>

              <View style={styles.templatesGrid}>
                <TouchableOpacity style={styles.templateCard}>
                  <Ionicons name="sunny" size={24} color={Colors.primary} />
                  <Text style={styles.templateName}>Weekdays</Text>
                  <Text style={styles.templateDesc}>Mon-Fri, 9-5</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.templateCard}>
                  <Ionicons name="moon" size={24} color={Colors.purple} />
                  <Text style={styles.templateName}>Evenings</Text>
                  <Text style={styles.templateDesc}>5PM-10PM</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.templateCard}>
                  <Ionicons name="calendar" size={24} color={Colors.success} />
                  <Text style={styles.templateName}>Weekends</Text>
                  <Text style={styles.templateDesc}>Sat-Sun</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.templateCard}>
                  <Ionicons name="time" size={24} color={Colors.warning} />
                  <Text style={styles.templateName}>Custom</Text>
                  <Text style={styles.templateDesc}>Set hours</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>About Schedules</Text>
                <Text style={styles.infoText}>
                  Your schedule helps you plan driving hours, but you can still go online or offline
                  anytime. This is just a helpful guide for your weekly goals.
                </Text>
              </View>
            </View>
          </>
        )}

        {!scheduleEnabled && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Schedule Set</Text>
            <Text style={styles.emptyMessage}>
              Enable scheduling to plan your driving hours and track your weekly goals.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  scrollContent: {
    paddingBottom: Spacing['3xl'],
  },
  toggleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.lg,
    margin: Spacing.xl,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    padding: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryInfo: {
    marginLeft: Spacing.md,
  },
  summaryValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.gray[300],
    marginHorizontal: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  dayCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  dayCardDisabled: {
    opacity: 0.5,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dayName: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
  },
  dayNameDisabled: {
    color: Colors.gray[600],
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  templateCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  templateName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  templateDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[700],
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: Colors.black,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    textAlign: 'center',
  },
});