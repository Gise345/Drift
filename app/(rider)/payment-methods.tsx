import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const cardMethods = [
    { id: 'c1', type: 'Visa', last4: '4242', isDefault: true, isCard: true },
    { id: 'c2', type: 'Mastercard', last4: '5555', isDefault: false, isCard: true },
  ];

  const digitalMethods = [
    { id: 'd1', type: 'Google Pay', icon: 'logo-google', isDefault: false, connected: true, isCard: false },
    { id: 'd2', type: 'Apple Pay', icon: 'logo-apple', isDefault: false, connected: true, isCard: false },
    { id: 'd3', type: 'PayPal', icon: 'logo-paypal', isDefault: false, connected: false, isCard: false },
  ];

  const allPaymentMethods = [...cardMethods, ...digitalMethods];

  const handleSetDefault = (id: string) => {
    Alert.alert('Success', 'Default payment method updated');
  };

  const handleDisconnect = (id: string) => {
    Alert.alert('Disconnect Payment Method', 'Are you sure you want to disconnect this payment method?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => {} },
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
        {/* Traditional Cards Section */}
        <Text style={styles.sectionTitle}>Cards</Text>
        {cardMethods.map((method) => (
            <View
              {...{ key: method.id } as any}
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
                onPress={() => handleDisconnect(method.id)}
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

        {/* Digital Wallets Section */}
        <Text style={styles.sectionTitle}>Digital Wallets</Text>
        {digitalMethods.map((method) => (
            <View
              {...{ key: method.id } as any}
              style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.cardIconContainer,
                method.type === 'Google Pay' && styles.googlePayBg,
                method.type === 'Apple Pay' && styles.applePayBg,
                method.type === 'PayPal' && styles.paypalBg,
              ]}>
                <Ionicons
                  name={method.icon as any}
                  size={24}
                  color={method.type === 'Apple Pay' ? '#000' : '#FFF'}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>{method.type}</Text>
                <View style={styles.badges}>
                  {method.connected && (
                    <View style={styles.connectedBadge}>
                      <Text style={styles.connectedText}>Connected</Text>
                    </View>
                  )}
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.cardActions}>
              {method.connected ? (
                <>
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
                    onPress={() => handleDisconnect(method.id)}
                  >
                    <Text style={styles.deleteText}>Disconnect</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.connectButton]}
                  onPress={() => Alert.alert('Connect', `Connect ${method.type} coming soon`)}
                >
                  <Text style={styles.connectText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
            </View>
        ))}
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  googlePayBg: { backgroundColor: '#4285F4' },
  applePayBg: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  paypalBg: { backgroundColor: '#0070BA' },
  cardInfo: { flex: 1 },
  cardType: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 8 },
  connectedBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  connectedText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },
  defaultBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  defaultText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  deleteButton: { backgroundColor: '#FEE2E2' },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  connectButton: { backgroundColor: '#EDE9FE' },
  connectText: { fontSize: 14, fontWeight: '600', color: '#5d1289ff' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 16 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#5d1289ff', marginLeft: 8 },
});