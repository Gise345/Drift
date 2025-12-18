import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DISTANCE_UNIT_KEY = '@drift_distance_unit';

type DistanceUnit = 'miles' | 'kilometers';

interface UnitOption {
  id: DistanceUnit;
  label: string;
  description: string;
}

const unitOptions: UnitOption[] = [
  {
    id: 'miles',
    label: 'Miles',
    description: 'Distance shown in miles (mi)',
  },
  {
    id: 'kilometers',
    label: 'Kilometers',
    description: 'Distance shown in kilometers (km)',
  },
];

export default function DistanceUnitScreen() {
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState<DistanceUnit>('miles');

  useEffect(() => {
    loadSavedUnit();
  }, []);

  const loadSavedUnit = async () => {
    try {
      const savedUnit = await AsyncStorage.getItem(DISTANCE_UNIT_KEY);
      if (savedUnit === 'miles' || savedUnit === 'kilometers') {
        setSelectedUnit(savedUnit);
      }
    } catch (error) {
      console.error('Error loading distance unit:', error);
    }
  };

  const handleSelectUnit = async (unit: DistanceUnit) => {
    setSelectedUnit(unit);
    try {
      await AsyncStorage.setItem(DISTANCE_UNIT_KEY, unit);
    } catch (error) {
      console.error('Error saving distance unit:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Distance Unit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionDescription}>
          Choose how distances are displayed throughout the app.
        </Text>

        <View style={styles.optionsContainer}>
          {unitOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                selectedUnit === option.id && styles.optionRowSelected,
              ]}
              onPress={() => handleSelectUnit(option.id)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  selectedUnit === option.id && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {selectedUnit === option.id && (
                <View style={styles.checkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#5d1289ff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionRowSelected: {
    borderColor: '#5d1289ff',
    backgroundColor: '#FAF5FF',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#5d1289ff',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkContainer: {
    marginLeft: 12,
  },
});
