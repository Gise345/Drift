import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StripeService, StripePaymentMethod } from '@/src/services/stripe.service';
import { useAuthStore } from '@/src/stores/auth-store';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cardMethods, setCardMethods] = useState<StripePaymentMethod[]>([]);

  // Digital wallets - these are handled through Stripe Payment Sheet
  const digitalMethods = [
    { id: 'd1', type: 'Google Pay', icon: 'logo-google', connected: true, isCard: false },
    { id: 'd2', type: 'Apple Pay', icon: 'logo-apple', connected: true, isCard: false },
  ];

  const loadPaymentMethods = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const methods = await StripeService.getPaymentMethods(user.id);
      setCardMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      if (!isExpoGo) {
        Alert.alert('Error', 'Failed to load payment methods');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
    }, [user?.id])
  );

  const handleSetDefault = async (methodId: string) => {
    if (!user?.id) return;

    setActionLoading(methodId);
    try {
      await StripeService.setDefaultMethod(user.id, methodId);

      // Update local state
      setCardMethods(prev => prev.map(m => ({
        ...m,
        isDefault: m.id === methodId
      })));

      Alert.alert('Success', 'Default payment method updated');
    } catch (error: any) {
      console.error('Error setting default:', error);
      Alert.alert('Error', error.message || 'Failed to update default payment method');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (methodId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(methodId);
            try {
              await StripeService.removePaymentMethod(user.id, methodId);

              // Remove from local state
              setCardMethods(prev => prev.filter(m => m.id !== methodId));

              Alert.alert('Success', 'Card removed successfully');
            } catch (error: any) {
              console.error('Error removing card:', error);
              Alert.alert('Error', error.message || 'Failed to remove card');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'amex':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const formatBrand = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      case 'discover':
        return 'Discover';
      default:
        return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
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
        {/* Cards Section */}
        <Text style={styles.sectionTitle}>Cards</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5d1289ff" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : cardMethods.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No cards saved yet</Text>
            <Text style={styles.emptySubtext}>Add a card to make payments easier</Text>
          </View>
        ) : (
          cardMethods.map((method) => (
            <View key={method.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                  <Ionicons name={getCardIcon(method.brand)} size={24} color="#5d1289ff" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardType}>
                    {formatBrand(method.brand)} •••• {method.last4}
                  </Text>
                  {method.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.cardActions}>
                {actionLoading === method.id ? (
                  <View style={styles.actionLoading}>
                    <ActivityIndicator size="small" color="#5d1289ff" />
                  </View>
                ) : (
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
                      onPress={() => handleRemove(method.id)}
                    >
                      <Text style={styles.deleteText}>Remove</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(rider)/add-card')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#5d1289ff" />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        {/* Digital Wallets Section */}
        <Text style={styles.sectionTitle}>Digital Wallets</Text>
        <View style={styles.walletInfo}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.walletInfoText}>
            Google Pay and Apple Pay are automatically available when you make a payment.
          </Text>
        </View>

        {digitalMethods.map((method) => (
          <View key={method.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.cardIconContainer,
                method.type === 'Google Pay' && styles.googlePayBg,
                method.type === 'Apple Pay' && styles.applePayBg,
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
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>Available at checkout</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Test Mode Notice for Development */}
        {isExpoGo && (
          <View style={styles.testModeNotice}>
            <Ionicons name="flask-outline" size={20} color="#92400E" />
            <Text style={styles.testModeText}>
              Running in Expo Go. Card management requires a development build.
            </Text>
          </View>
        )}
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
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 32, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  googlePayBg: { backgroundColor: '#4285F4' },
  applePayBg: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  cardInfo: { flex: 1 },
  cardType: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  badges: { flexDirection: 'row', gap: 8 },
  availableBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  availableText: { fontSize: 11, fontWeight: '600', color: '#1D4ED8' },
  defaultBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  defaultText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionLoading: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  actionButton: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  deleteButton: { backgroundColor: '#FEE2E2' },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', marginBottom: 16 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#5d1289ff', marginLeft: 8 },
  walletInfo: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  walletInfoText: { flex: 1, fontSize: 13, color: '#6B7280', marginLeft: 8 },
  testModeNotice: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginTop: 16, marginBottom: 32, alignItems: 'center' },
  testModeText: { flex: 1, fontSize: 13, color: '#92400E', marginLeft: 8 },
});
