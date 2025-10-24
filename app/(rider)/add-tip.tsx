import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const Colors = {
  primary: '#D4E700',
  purple: '#5d1289ff',
  black: '#000000',
  white: '#FFFFFF',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: '#10B981',
  error: '#EF4444',
};

export default function AddTipScreen() {
  const router = useRouter();
  
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState('');
  const [loading, setLoading] = useState(false);

  const driver = {
    name: 'John Smith',
    photo: '👤',
  };

  const suggestedTips = [3, 5, 7, 10];

  const handleTipSelect = (amount: number) => {
    setSelectedTip(amount);
    setCustomTip('');
  };

  const handleCustomTipChange = (text: string) => {
    // Only allow numbers and decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    setCustomTip(cleaned);
    setSelectedTip(null);
  };

  const getTipAmount = (): number => {
    if (selectedTip !== null) return selectedTip;
    return parseFloat(customTip) || 0;
  };

  const handleAddTip = async () => {
    const tipAmount = getTipAmount();
    
    if (tipAmount <= 0) {
      Alert.alert('Invalid Tip', 'Please enter a valid tip amount');
      return;
    }

    setLoading(true);

    try {
      // Simulate API call to process tip
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Tip Added',
        `$${tipAmount.toFixed(2)} tip added for ${driver.name}`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Add a Tip</Text>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Driver Info */}
          <View style={styles.driverContainer}>
            <View style={styles.driverPhoto}>
              <Text style={styles.driverPhotoText}>{driver.photo}</Text>
            </View>
            <Text style={styles.driverName}>{driver.name}</Text>
            <Text style={styles.subtitle}>
              Show your appreciation with a tip
            </Text>
          </View>

          {/* Suggested Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.sectionTitle}>Suggested Amounts</Text>
            <View style={styles.tipsGrid}>
              {suggestedTips.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.tipButton,
                    selectedTip === amount && styles.tipButtonSelected,
                  ]}
                  onPress={() => handleTipSelect(amount)}
                >
                  <Text style={[
                    styles.tipAmount,
                    selectedTip === amount && styles.tipAmountSelected,
                  ]}>
                    ${amount}
                  </Text>
                  <Text style={[
                    styles.tipLabel,
                    selectedTip === amount && styles.tipLabelSelected,
                  ]}>
                    KYD
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Tip */}
          <View style={styles.customContainer}>
            <Text style={styles.sectionTitle}>Or Enter Custom Amount</Text>
            <View style={styles.customInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.customInput}
                placeholder="0.00"
                placeholderTextColor={Colors.gray[400]}
                value={customTip}
                onChangeText={handleCustomTipChange}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currencyCode}>KYD</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              💡 Tips are optional and go 100% to your driver as a token of appreciation for great service.
            </Text>
          </View>
        </ScrollView>

        {/* Add Tip Button */}
        <View style={styles.bottomContainer}>
          {getTipAmount() > 0 && (
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Tip</Text>
              <Text style={styles.totalAmount}>
                ${getTipAmount().toFixed(2)} KYD
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              styles.addButton,
              (getTipAmount() <= 0 || loading) && styles.addButtonDisabled,
            ]}
            onPress={handleAddTip}
            disabled={getTipAmount() <= 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.addButtonText}>Add Tip</Text>
                <Text style={styles.addButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: Colors.black,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.black,
    textAlign: 'center',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  driverContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  driverPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverPhotoText: {
    fontSize: 40,
  },
  driverName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.gray[600],
  },
  tipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 16,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tipButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tipAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 4,
  },
  tipAmountSelected: {
    color: Colors.black,
  },
  tipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray[600],
  },
  tipLabelSelected: {
    color: Colors.black,
  },
  customContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.black,
    padding: 0,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[600],
    marginLeft: 8,
  },
  infoCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[700],
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.black,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginRight: 8,
  },
  addButtonArrow: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: '700',
  },
});