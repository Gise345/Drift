import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTripStore } from '@/src/stores/trip-store';

interface Contact {
  name: string;
  phone: string;
  email?: string;
}

interface ShareTripModalProps {
  visible: boolean;
  tripId: string;
  onClose: () => void;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  visible,
  tripId,
  onClose,
}) => {
  const { shareTrip } = useTripStore();
  const [contacts, setContacts] = useState<Contact[]>([{ name: '', phone: '', email: '' }]);
  const [loading, setLoading] = useState(false);

  const addContact = () => {
    setContacts([...contacts, { name: '', phone: '', email: '' }]);
  };

  const removeContact = (index: number) => {
    const newContacts = contacts.filter((_, i) => i !== index);
    setContacts(newContacts.length > 0 ? newContacts : [{ name: '', phone: '', email: '' }]);
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
  };

  const validateContacts = (): boolean => {
    for (const contact of contacts) {
      if (!contact.name.trim()) {
        Alert.alert('Error', 'Please enter a name for all contacts');
        return false;
      }
      
      if (!contact.phone.trim() || contact.phone.replace(/\D/g, '').length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number for all contacts');
        return false;
      }
    }
    return true;
  };

  const handleShare = async () => {
    if (!validateContacts()) return;

    try {
      setLoading(true);
      await shareTrip(tripId, contacts);
      Alert.alert(
        'Trip Shared!',
        `Your trip has been shared with ${contacts.length} contact(s). They can track your ride in real-time.`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to share trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Share Trip</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#5d1289" />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Safe Ride Sharing</Text>
            <Text style={styles.infoDescription}>
              Share your trip with trusted contacts. They'll get a link to track your ride in real-time for safety.
            </Text>
          </View>
        </View>

        {/* Contacts List */}
        <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
          {contacts.map((contact, index) => (
            <View {...{ key: index } as any} style={styles.contactCard}>
              <View style={styles.contactHeader}>
                <Text style={styles.contactNumber}>Contact {index + 1}</Text>
                {contacts.length > 1 && (
                  <TouchableOpacity onPress={() => removeContact(index)}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={contact.name}
                  onChangeText={(text) => updateContact(index, 'name', text)}
                  autoCapitalize="words"
                />
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={contact.phone}
                  onChangeText={(text) => updateContact(index, 'phone', text)}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email Input (Optional) */}
              <View style={styles.inputGroup}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email (optional)"
                  value={contact.email}
                  onChangeText={(text) => updateContact(index, 'email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}

          {/* Add Contact Button */}
          {contacts.length < 5 && (
            <TouchableOpacity style={styles.addContactButton} onPress={addContact}>
              <Ionicons name="add-circle-outline" size={24} color="#5d1289" />
              <Text style={styles.addContactText}>Add Another Contact</Text>
            </TouchableOpacity>
          )}

          {/* What They'll Receive */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>What they'll receive:</Text>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.infoItemText}>SMS/Email with secure tracking link</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.infoItemText}>Real-time location updates</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.infoItemText}>Trip details and estimated arrival</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.infoItemText}>Notification when you arrive safely</Text>
            </View>
          </View>
        </ScrollView>

        {/* Share Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.shareButton, loading && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="share-social" size={20} color="white" />
                <Text style={styles.shareButtonText}>
                  Share with {contacts.length} Contact{contacts.length > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0e6f6',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contactCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  addContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#5d1289',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 24,
  },
  addContactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5d1289',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  shareButton: {
    backgroundColor: '#5d1289',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});