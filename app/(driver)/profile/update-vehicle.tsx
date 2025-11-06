import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function UpdateVehicleScreen() {
  const [formData, setFormData] = useState({
    make: 'Toyota',
    model: 'Camry',
    year: '2022',
    color: 'Silver',
    plate: 'CAY 12345',
    seats: '4',
  });

  const handleSave = () => {
    Alert.alert('Success', 'Vehicle information updated!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Update Vehicle</Text>
          <View style={{ width: 40 }} />
        </View>

        {['make', 'model', 'year', 'color', 'plate', 'seats'].map((field) => (
          <View key={field} style={styles.inputContainer}>
            <Text style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</Text>
            <TextInput
              style={styles.input}
              value={formData[field as keyof typeof formData]}
              onChangeText={(text) => setFormData({ ...formData, [field]: text })}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  inputContainer: { padding: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semibold, color: Colors.gray[700], marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.gray[50], borderRadius: 12, padding: Spacing.md, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.regular, color: Colors.black, borderWidth: 1, borderColor: Colors.gray[200] },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.md, margin: Spacing.md, alignItems: 'center', ...Shadows.md },
  saveText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
});