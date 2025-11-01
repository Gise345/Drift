import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SAVED ADDRESS ITEM COMPONENT
 * 
 * Reusable component for displaying and managing saved addresses
 * Used for: Home, Work, and Custom saved places
 * 
 * Features:
 * ✅ Icon-based visual identity
 * ✅ Add/Edit states
 * ✅ Consistent styling
 * ✅ Touch feedback
 */

export interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface SavedAddressItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  address?: string;
  onPress: () => void;
  showAddIcon?: boolean;
}

const SavedAddressItem: React.FC<SavedAddressItemProps> = ({
  icon,
  label,
  address,
  onPress,
  showAddIcon = false,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#5d1289" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.address}>
          {address || `Add ${label.toLowerCase()} address`}
        </Text>
      </View>
      {showAddIcon && (
        <Ionicons name="add-circle-outline" size={24} color="#5d1289" />
      )}
      {!showAddIcon && address && (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
});

export default SavedAddressItem;