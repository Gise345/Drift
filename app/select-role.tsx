import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * ROLE SELECTION SCREEN
 * 
 * Let users choose between Rider and Driver modes
 */
export default function SelectRole() {
  const router = useRouter();

  const handleRiderMode = () => {
    // Go to rider app (tabs)
    router.replace('/(tabs)');
  };

  const handleDriverMode = () => {
    // Check if driver is registered
    // For now, go straight to driver dashboard
    // You can add registration check here later
    router.replace('/(driver)/dashboard/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Drift</Text>
        <Text style={styles.subtitle}>How would you like to use Drift today?</Text>

        {/* Rider Option */}
        <TouchableOpacity style={styles.optionCard} onPress={handleRiderMode}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '15' }]}>
            <Ionicons name="car-sport" size={48} color={Colors.primary} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>I'm a Rider</Text>
            <Text style={styles.optionDescription}>
              Find rides and travel around the island
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.gray[400]} />
        </TouchableOpacity>

        {/* Driver Option */}
        <TouchableOpacity style={styles.optionCard} onPress={handleDriverMode}>
          <View style={[styles.iconContainer, { backgroundColor: Colors.success + '15' }]}>
            <Ionicons name="car" size={48} color={Colors.success} />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>I'm a Driver</Text>
            <Text style={styles.optionDescription}>
              Accept rides and earn money
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.gray[400]} />
        </TouchableOpacity>

        <Text style={styles.note}>
          You can switch between rider and driver modes anytime in your profile
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  note: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[500],
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
});