import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

const PREFERENCES_KEY = '@drift_driver_preferences';

/**
 * DRIVING PREFERENCES SCREEN
 * 
 * Configure driving preferences:
 * - Auto-accept rides
 * - Trip types (short/long distance)
 * - Preferred areas
 * - Maximum pickup distance
 * - Minimum fare acceptance
 */

export default function DrivingPreferencesScreen() {
  const [autoAccept, setAutoAccept] = useState(false);
  const [longTripsOnly, setLongTripsOnly] = useState(false);
  const [returnTripsOnly, setReturnTripsOnly] = useState(false);
  const [maxPickupDistance, setMaxPickupDistance] = useState('10'); // km
  const [minFare, setMinFare] = useState('5'); // CI$
  const [isLoading, setIsLoading] = useState(true);

  const distanceOptions = ['5', '10', '15', '20', '25+'];
  const fareOptions = ['5', '10', '15', '20', '25+'];

  // Load saved preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem(PREFERENCES_KEY);
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences);
        setAutoAccept(prefs.autoAccept ?? false);
        setLongTripsOnly(prefs.longTripsOnly ?? false);
        setReturnTripsOnly(prefs.returnTripsOnly ?? false);
        setMaxPickupDistance(prefs.maxPickupDistance ?? '10');
        setMinFare(prefs.minFare ?? '5');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      // Load existing preferences first to preserve other settings (sound, vibration, night mode)
      const existingPrefs = await AsyncStorage.getItem(PREFERENCES_KEY);
      const prefs = existingPrefs ? JSON.parse(existingPrefs) : {};

      const updatedPreferences = {
        ...prefs,
        autoAccept,
        longTripsOnly,
        returnTripsOnly,
        maxPickupDistance,
        minFare,
      };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      Alert.alert('Success', 'Driving preferences saved!');
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driving Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Auto Accept */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ride Acceptance</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="flash"
                  size={20}
                  color={autoAccept ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Auto-Accept Rides</Text>
                <Text style={styles.settingDescription}>
                  Automatically accept matching ride requests
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={setAutoAccept}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>

            {autoAccept && (
              <View style={styles.warningBox}>
                <Ionicons
                  name="warning"
                  size={16}
                  color={Colors.warning[500]}
                />
                <Text style={styles.warningText}>
                  Auto-accept will accept rides based on your preferences below.
                  Make sure your settings are correct.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Trip Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Types</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="navigate"
                  size={20}
                  color={longTripsOnly ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Long Trips Only</Text>
                <Text style={styles.settingDescription}>
                  Only receive trips over 10 km
                </Text>
              </View>
              <Switch
                value={longTripsOnly}
                onValueChange={setLongTripsOnly}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={returnTripsOnly ? Colors.primary[500] : Colors.gray[400]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Return Trips Preferred</Text>
                <Text style={styles.settingDescription}>
                  Prioritize trips heading back to your area
                </Text>
              </View>
              <Switch
                value={returnTripsOnly}
                onValueChange={setReturnTripsOnly}
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary[500],
                }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </View>

        {/* Distance Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maximum Pickup Distance</Text>
          <View style={styles.sectionContent}>
            <View style={styles.optionGrid}>
              {distanceOptions.map(distance => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.optionButton,
                    maxPickupDistance === distance && styles.optionButtonActive,
                  ]}
                  onPress={() => setMaxPickupDistance(distance)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      maxPickupDistance === distance && styles.optionTextActive,
                    ]}
                  >
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>
              You won't receive requests beyond this distance
            </Text>
          </View>
        </View>

        {/* Minimum Fare */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Fare</Text>
          <View style={styles.sectionContent}>
            <View style={styles.optionGrid}>
              {fareOptions.map(fare => (
                <TouchableOpacity
                  key={fare}
                  style={[
                    styles.optionButton,
                    minFare === fare && styles.optionButtonActive,
                  ]}
                  onPress={() => setMinFare(fare)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      minFare === fare && styles.optionTextActive,
                    ]}
                  >
                    CI${fare}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>
              Only receive requests with estimated fare above this amount
            </Text>
          </View>
        </View>

        {/* Preferred Areas (Coming Soon) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Areas</Text>
          <TouchableOpacity style={styles.comingSoonCard}>
            <Ionicons name="map" size={40} color={Colors.gray[400]} />
            <Text style={styles.comingSoonTitle}>Area Preferences</Text>
            <Text style={styles.comingSoonText}>
              Set your preferred driving areas. Coming soon!
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary[500]}
          />
          <Text style={styles.infoText}>
            Setting strict preferences may reduce the number of ride requests
            you receive. Adjust based on your driving goals.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: Colors.warning[50],
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning[500],
  },
  warningText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.warning[700],
    marginLeft: Spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    minWidth: '28%',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  optionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[700],
  },
  optionTextActive: {
    color: Colors.primary[500],
    fontFamily: Typography.fontFamily.bold,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  comingSoonCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.gray[700],
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary[700],
    marginLeft: Spacing.sm,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});