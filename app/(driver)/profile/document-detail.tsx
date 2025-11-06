import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';

export default function DocumentDetailScreen() {
  const { documentId } = useLocalSearchParams();

  const document = {
    id: documentId,
    type: 'license',
    name: "Driver's License",
    status: 'verified',
    uploadDate: '2024-01-15',
    expiryDate: '2026-12-31',
    verifiedDate: '2024-01-16',
    imageUrl: null, // Mock - would be actual image
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={Colors.black} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Document Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          <Text style={styles.statusText}>Verified</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Document Type</Text>
          <Text style={styles.value}>{document.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Upload Date</Text>
          <Text style={styles.value}>{new Date(document.uploadDate).toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Expiry Date</Text>
          <Text style={styles.value}>{new Date(document.expiryDate).toLocaleDateString()}</Text>
        </View>

        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => router.push({ pathname: '/(driver)/profile/upload-document', params: { documentType: document.type } })}
        >
          <Text style={styles.updateText}>Update Document</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  headerTitle: { fontSize: Typography.fontSize['2xl'], fontFamily: Typography.fontFamily.bold, color: Colors.black },
  statusCard: { alignItems: 'center', padding: Spacing['2xl'], backgroundColor: `${Colors.success}15`, margin: Spacing.md, borderRadius: 16 },
  statusText: { fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: Colors.success, marginTop: Spacing.sm },
  section: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray[200] },
  label: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular, color: Colors.gray[600], marginBottom: 4 },
  value: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semibold, color: Colors.black },
  updateButton: { backgroundColor: Colors.primary, borderRadius: 12, padding: Spacing.md, margin: Spacing.md, alignItems: 'center', ...Shadows.md },
  updateText: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.black },
});