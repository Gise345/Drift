import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: 'card' | 'cash';
  cardNumber?: string;
  cardType?: string;
  isDefault: boolean;
}

interface SwitchPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (paymentMethod: PaymentMethod) => void;
  currentPaymentId: string;
}

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    cardNumber: '•••• 4242',
    cardType: 'Visa',
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    cardNumber: '•••• 5555',
    cardType: 'Mastercard',
    isDefault: false,
  },
  {
    id: '3',
    type: 'cash',
    isDefault: false,
  },
];

export const SwitchPaymentModal: React.FC<SwitchPaymentModalProps> = ({
  visible,
  onClose,
  onSelect,
  currentPaymentId,
}) => {
  const [selectedId, setSelectedId] = useState(currentPaymentId);

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id);
    onSelect(method);
    onClose();
  };

  const getCardIcon = (cardType?: string) => {
    if (cardType?.toLowerCase().includes('visa')) return 'card';
    if (cardType?.toLowerCase().includes('master')) return 'card';
    return 'card-outline';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Switch Payment Method</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Payment Methods List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {MOCK_PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentCard,
                  selectedId === method.id && styles.paymentCardSelected,
                ]}
                onPress={() => handleSelect(method)}
                activeOpacity={0.7}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  {method.type === 'cash' ? (
                    <Ionicons name="cash" size={24} color="#10B981" />
                  ) : (
                    <Ionicons name={getCardIcon(method.cardType) as any} size={24} color="#5d1289ff" />
                  )}
                </View>

                {/* Details */}
                <View style={styles.paymentDetails}>
                  {method.type === 'cash' ? (
                    <>
                      <Text style={styles.paymentTitle}>Cash</Text>
                      <Text style={styles.paymentSubtitle}>Pay driver directly</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.paymentTitle}>
                        {method.cardType} {method.cardNumber}
                      </Text>
                      {method.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultText}>Default</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Checkmark */}
                {selectedId === method.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

            {/* Add New Card */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                onClose();
                // Navigate to add card screen
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={24} color="#5d1289ff" />
              <Text style={styles.addButtonText}>Add New Payment Method</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Info */}
          <View style={styles.info}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              This change applies to this ride only
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentCardSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#5d1289ff',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  paymentSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5d1289ff',
    marginLeft: 8,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
});