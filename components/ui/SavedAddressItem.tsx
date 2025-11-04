import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'custom';
  label: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface SavedAddressItemProps {
  icon: 'home' | 'briefcase' | 'location';
  label: string;
  address?: string;
  onPress: () => void;
  onEdit?: () => void; // ← NEW: Edit handler (opens modal to change address)
  onDelete?: () => void; // ← NEW: Delete handler (removes address)
  showAddIcon?: boolean;
}

const SavedAddressItem: React.FC<SavedAddressItemProps> = ({
  icon,
  label,
  address,
  onPress,
  onEdit, // ← NEW: Edit button
  onDelete, // ← NEW: Delete button
  showAddIcon = false,
}) => {
  const getIconName = () => {
    switch (icon) {
      case 'home':
        return 'home' as const;
      case 'briefcase':
        return 'briefcase' as const;
      case 'location':
        return 'location' as const;
      default:
        return 'location' as const;
    }
  };

  // If no address, show as "Add" button (no edit/delete controls)
  if (!address || showAddIcon) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="add" size={20} color="#5d1289" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  }

  // If address exists, show with edit/delete controls
  return (
    <View style={styles.containerWithControls}>
      {/* Main touchable area - tap to use address */}
      <TouchableOpacity
        style={styles.mainArea}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={20} color="#5d1289" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.address} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Edit/Delete controls */}
      <View style={styles.controls}>
        {/* Edit button */}
        {onEdit && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={onEdit}
            activeOpacity={0.6}
          >
            <Ionicons name="pencil" size={18} color="#5d1289" />
          </TouchableOpacity>
        )}

        {/* Delete button */}
        {onDelete && (
          <TouchableOpacity
            style={[styles.controlButton, styles.deleteButton]}
            onPress={onDelete}
            activeOpacity={0.6}
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  containerWithControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 4,
    paddingRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  mainArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0e6f6',
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0e6f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
});

export default SavedAddressItem;