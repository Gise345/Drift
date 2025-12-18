import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = '@drift_language';

type Language = 'en' | 'es' | 'fr';

interface LanguageOption {
  id: Language;
  label: string;
  nativeLabel: string;
}

const languageOptions: LanguageOption[] = [
  {
    id: 'en',
    label: 'English',
    nativeLabel: 'English',
  },
  {
    id: 'es',
    label: 'Spanish',
    nativeLabel: 'Espanol',
  },
  {
    id: 'fr',
    label: 'French',
    nativeLabel: 'Francais',
  },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === 'en' || savedLanguage === 'es' || savedLanguage === 'fr') {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const handleSelectLanguage = async (language: Language) => {
    setSelectedLanguage(language);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionDescription}>
          Select your preferred language for the app.
        </Text>

        <View style={styles.optionsContainer}>
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionRow,
                selectedLanguage === option.id && styles.optionRowSelected,
              ]}
              onPress={() => handleSelectLanguage(option.id)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  selectedLanguage === option.id && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionNativeLabel}>{option.nativeLabel}</Text>
              </View>
              {selectedLanguage === option.id && (
                <View style={styles.checkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#5d1289ff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.noteText}>
          Note: Language support is coming soon. Currently only English is fully supported.
        </Text>
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
  optionNativeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkContainer: {
    marginLeft: 12,
  },
  noteText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 24,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
