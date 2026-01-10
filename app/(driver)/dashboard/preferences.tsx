import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

const PREFERENCES_KEY = '@drift_driver_preferences';

export default function Preferences() {
  const router = useRouter();
  const [autoAcceptRequests, setAutoAcceptRequests] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [longTripsOnly, setLongTripsOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setAutoAcceptRequests(prefs.autoAccept ?? false);
        setLongTripsOnly(prefs.longTripsOnly ?? false);
        setSoundEnabled(prefs.soundEnabled ?? true);
        setVibrationEnabled(prefs.vibrationEnabled ?? true);
        setNightMode(prefs.nightMode ?? false);
        setMaxDistance(parseInt(prefs.maxPickupDistance) || 10);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      // Load existing preferences first to preserve other settings
      const existingPrefs = await AsyncStorage.getItem(PREFERENCES_KEY);
      const prefs = existingPrefs ? JSON.parse(existingPrefs) : {};

      const updatedPreferences = {
        ...prefs,
        autoAccept: autoAcceptRequests,
        longTripsOnly,
        soundEnabled,
        vibrationEnabled,
        nightMode,
        maxPickupDistance: maxDistance.toString(),
      };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      Alert.alert('Success', 'Preferences saved!');
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Request Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Settings</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="flash" size={20} color={Colors.primary} />
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Auto-Accept Requests</Text>
                  <Text style={styles.preferenceDescription}>
                    Automatically accept ride requests
                  </Text>
                </View>
              </View>
              <Switch
                value={autoAcceptRequests}
                onValueChange={setAutoAcceptRequests}
                trackColor={{ false: Colors.gray[300], true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="navigate" size={20} color={Colors.primary} />
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Long Trips Only</Text>
                  <Text style={styles.preferenceDescription}>
                    Only accept trips over 5km
                  </Text>
                </View>
              </View>
              <Switch
                value={longTripsOnly}
                onValueChange={setLongTripsOnly}
                trackColor={{ false: Colors.gray[300], true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="volume-high" size={20} color={Colors.primary} />
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Sound Alerts</Text>
                  <Text style={styles.preferenceDescription}>
                    Play sound for new requests
                  </Text>
                </View>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: Colors.gray[300], true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="phone-portrait" size={20} color={Colors.primary} />
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Vibration</Text>
                  <Text style={styles.preferenceDescription}>
                    Vibrate for new requests
                  </Text>
                </View>
              </View>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ false: Colors.gray[300], true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <Ionicons name="moon" size={20} color={Colors.primary} />
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Night Mode</Text>
                  <Text style={styles.preferenceDescription}>
                    Dark theme for night driving
                  </Text>
                </View>
              </View>
              <Switch
                value={nightMode}
                onValueChange={setNightMode}
                trackColor={{ false: Colors.gray[300], true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Distance Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance Settings</Text>
          
          <View style={styles.preferenceCard}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Ionicons name="location" size={20} color={Colors.primary} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>Maximum Pickup Distance</Text>
                  <Text style={styles.optionValue}>{maxDistance} km</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
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
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  preferenceCard: {
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  preferenceDescription: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.gray[200],
    marginVertical: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  optionValue: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.white,
  },
});