import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

/**
 * LANGUAGE SETTINGS SCREEN
 *
 * Select app language:
 * - English (default)
 * - Spanish
 * - More languages coming soon
 */

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  available: boolean;
}

const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    available: true,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    available: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    available: false,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    available: false,
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    available: false,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    available: false,
  },
];

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleSelectLanguage = (language: Language) => {
    if (!language.available) {
      Alert.alert(
        'Coming Soon',
        `${language.name} will be available in a future update.`
      );
      return;
    }

    if (language.code !== selectedLanguage) {
      Alert.alert(
        'Change Language',
        `Are you sure you want to change the app language to ${language.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Change',
            onPress: () => {
              setSelectedLanguage(language.code);
              Alert.alert(
                'Language Changed',
                `App language has been changed to ${language.name}. Some changes may require restarting the app.`
              );
            },
          },
        ]
      );
    }
  };

  const saveLanguage = () => {
    Alert.alert('Success', 'Language preference saved!');
    router.back();
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
        <Text style={styles.headerTitle}>Language</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Language */}
        <View style={styles.currentSection}>
          <View style={styles.currentIcon}>
            <Ionicons name="language" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.currentTitle}>App Language</Text>
          <Text style={styles.currentSubtitle}>
            {LANGUAGES.find(l => l.code === selectedLanguage)?.name || 'English'}
          </Text>
        </View>

        {/* Available Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Languages</Text>
          <View style={styles.sectionContent}>
            {LANGUAGES.filter(l => l.available).map(language => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  selectedLanguage === language.code && styles.languageItemSelected,
                ]}
                onPress={() => handleSelectLanguage(language)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageContent}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNative}>{language.nativeName}</Text>
                </View>
                {selectedLanguage === language.code && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Coming Soon Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coming Soon</Text>
          <View style={styles.sectionContent}>
            {LANGUAGES.filter(l => !l.available).map(language => (
              <TouchableOpacity
                key={language.code}
                style={[styles.languageItem, styles.languageItemDisabled]}
                onPress={() => handleSelectLanguage(language)}
              >
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <View style={styles.languageContent}>
                  <Text style={[styles.languageName, styles.languageNameDisabled]}>
                    {language.name}
                  </Text>
                  <Text style={[styles.languageNative, styles.languageNativeDisabled]}>
                    {language.nativeName}
                  </Text>
                </View>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Changing the language will update all text in the app. Some content
            from riders and support may still appear in their original language.
          </Text>
        </View>

        {/* Request Language */}
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => {
            Alert.alert(
              'Request a Language',
              'Would you like to request support for another language? We\'ll consider adding it in a future update.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit Request',
                  onPress: () => {
                    Alert.alert('Thank You', 'Your request has been submitted.');
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.requestButtonText}>Request a Language</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveLanguage}>
          <Text style={styles.saveButtonText}>Save Preference</Text>
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
  currentSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[200],
  },
  currentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  currentTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  currentSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
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
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  languageItemSelected: {
    backgroundColor: Colors.primaryLight + '20',
  },
  languageItemDisabled: {
    opacity: 0.7,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
    marginBottom: Spacing.xs / 2,
  },
  languageNameDisabled: {
    color: Colors.gray[500],
  },
  languageNative: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[600],
  },
  languageNativeDisabled: {
    color: Colors.gray[400],
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  comingSoonBadge: {
    backgroundColor: Colors.gray[200],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.gray[600],
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight + '30',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray[700],
    marginLeft: Spacing.sm,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  requestButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  footer: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  saveButton: {
    backgroundColor: Colors.primary,
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
