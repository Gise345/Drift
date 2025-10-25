import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const paymentMethods = [
    { id: '1', type: 'Visa', last4: '4242', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '5555', isDefault: false },
  ];

  const handleSetDefault = (id: string) => {
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {} },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {paymentMethods.map((method) => (
            <View
              // @ts-expect-error - key prop is valid in React but TS defs don't reflect this
              key={method.id}
              style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="card" size={24} color="#5d1289ff" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>{method.type} •••• {method.last4}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.cardActions}>
              {!method.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Text style={styles.actionText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(method.id)}
              >
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            </View>
            </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(rider)/add-card')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#5d1289ff" />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        <View style={styles.cashOption}>
          <View style={styles.cashHeader}>
            <Ionicons name="cash" size={24} color="#10B981" />
            <Text style={styles.cashTitle}>Cash Payment</Text>
          </View>
          <Text style={styles.cashDescription}>
            You can also pay your driver directly with cash
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardType: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  defaultBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  defaultText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  deleteButton: { backgroundColor: '#FEE2E2' },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 16 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#5d1289ff', marginLeft: 8 },
  cashOption: { backgroundColor: '#F0FDF4', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  cashHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cashTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginLeft: 12 },
  cashDescription: { fontSize: 14, color: '#15803D', lineHeight: 20 },
});