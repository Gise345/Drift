import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function UploadDocumentScreen() {
  const { documentType } = useLocalSearchParams();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (!result.canceled) {
      if (side === 'front') setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!frontImage) {
      Alert.alert('Required', 'Please upload front of document');
      return;
    }
    Alert.alert('Success', 'Document uploaded successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Document</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>Please upload clear photos of your {documentType}</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('front')}>
          {frontImage ? (
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          ) : (
            <Ionicons name="camera" size={48} color={Colors.gray[400]} />
          )}
          <Text style={styles.uploadText}>Front of Document</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('back')}>
          {backImage ? (
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          ) : (
            <Ionicons name="camera" size={48} color={Colors.gray[400]} />
          )}
          <Text style={styles.uploadText}>Back of Document</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit for Verification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  subtitle: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600], padding: Spacing.md, textAlign: 'center' },
  uploadBox: { backgroundColor: Colors.gray[50], borderRadius: 16, padding: Spacing['3xl'], margin: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: Colors.gray[200], borderStyle: 'dashed' },
  uploadText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semibold, color: Colors.gray[700], marginTop: Spacing.sm },
  submitButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.md, margin: Spacing.md, alignItems: 'center', ...Shadows.md },
  submitText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
});