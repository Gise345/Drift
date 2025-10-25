import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmRideModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pickupAddress: string;
  destinationAddress: string;
  estimatedTime: string;
  estimatedCost: string;
  vehicleType: string;
}

export const ConfirmRideModal: React.FC<ConfirmRideModalProps> = ({
  visible,
  onClose,
  onConfirm,
  pickupAddress,
  destinationAddress,
  estimatedTime,
  estimatedCost,
  vehicleType,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>Confirm Your Ride</Text>

          {/* Trip Details */}
          <View style={styles.detailsContainer}>
            {/* Pickup */}
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <View style={styles.greenDot} />
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.address}>{pickupAddress}</Text>
              </View>
            </View>

            {/* Dotted line */}
            <View style={styles.dottedLine} />

            {/* Destination */}
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <View style={styles.redDot} />
              </View>
              <View style={styles.addressContainer}>
                <Text style={styles.label}>Destination</Text>
                <Text style={styles.address}>{destinationAddress}</Text>
              </View>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={20} color="#5d1289ff" />
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{estimatedTime}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="car-outline" size={20} color="#5d1289ff" />
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{vehicleType}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="cash-outline" size={20} color="#5d1289ff" />
              <Text style={styles.infoLabel}>Cost</Text>
              <Text style={styles.infoValue}>{estimatedCost}</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              This is a peer-to-peer carpool platform. Cost sharing is voluntary.
            </Text>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm & Request</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
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
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 4,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  dottedLine: {
    width: 2,
    height: 30,
    marginLeft: 11,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    borderStyle: 'dotted',
    marginVertical: 4,
  },
  addressContainer: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});