/**
 * ADMIN MESSAGE CENTER
 * Send push notifications and in-app messages to drivers
 *
 * Features:
 * - Send to all drivers, online drivers, or specific drivers
 * - Pre-defined message templates
 * - Custom message composition
 * - Message history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  AdminMessageService,
  MESSAGE_TEMPLATES,
  MessageType,
  AdminMessage,
} from '@/src/services/admin-message.service';

type RecipientType = 'all' | 'online' | 'specific';

interface DriverOption {
  id: string;
  name: string;
  isOnline: boolean;
}

export default function MessageCenterScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('custom');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);

  // UI state
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Data state
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [messageHistory, setMessageHistory] = useState<AdminMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load driver counts on mount
  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [online, total] = await Promise.all([
        AdminMessageService.getOnlineDriverCount(),
        AdminMessageService.getTotalDriverCount(),
      ]);
      setOnlineCount(online);
      setTotalCount(total);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const loadDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const driverList = await AdminMessageService.getApprovedDrivers();
      setDrivers(driverList);
    } catch (error) {
      console.error('Error loading drivers:', error);
      Alert.alert('Error', 'Failed to load drivers');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await AdminMessageService.getMessageHistory();
      setMessageHistory(history);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    setTitle(template.title);
    setBody(template.body);
    setMessageType(template.type);
    setShowTemplates(false);
  };

  const handleOpenDriverPicker = async () => {
    await loadDrivers();
    setShowDriverPicker(true);
  };

  const handleToggleDriver = (driverId: string) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const handleSelectAllOnline = () => {
    const onlineDriverIds = drivers.filter(d => d.isOnline).map(d => d.id);
    setSelectedDrivers(onlineDriverIds);
  };

  const handleClearSelection = () => {
    setSelectedDrivers([]);
  };

  const handleOpenHistory = async () => {
    await loadHistory();
    setShowHistory(true);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a message title');
      return false;
    }
    if (!body.trim()) {
      Alert.alert('Error', 'Please enter a message body');
      return false;
    }
    if (recipientType === 'specific' && selectedDrivers.length === 0) {
      Alert.alert('Error', 'Please select at least one driver');
      return false;
    }
    return true;
  };

  const getRecipientCount = (): number => {
    switch (recipientType) {
      case 'all':
        return totalCount;
      case 'online':
        return onlineCount;
      case 'specific':
        return selectedDrivers.length;
      default:
        return 0;
    }
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    const recipientCount = getRecipientCount();
    const recipientLabel = recipientType === 'all' ? 'all drivers' :
                          recipientType === 'online' ? 'online drivers' :
                          `${selectedDrivers.length} selected driver(s)`;

    Alert.alert(
      'Confirm Send',
      `Send this message to ${recipientLabel} (${recipientCount} total)?\n\nTitle: ${title}\n\nMessage: ${body}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const result = await AdminMessageService.sendMessage(
                title,
                body,
                messageType,
                recipientType,
                user?.id || 'unknown',
                user?.name || 'Admin',
                recipientType === 'specific' ? selectedDrivers : undefined
              );

              if (result.success) {
                Alert.alert(
                  'Message Sent!',
                  `Successfully sent to ${result.deliveredCount} driver(s).`,
                  [{ text: 'OK', onPress: resetForm }]
                );
              } else {
                Alert.alert('Error', 'Failed to send message');
              }
            } catch (error) {
              console.error('Error sending message:', error);
              Alert.alert('Error', 'Failed to send message. Please try again.');
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle('');
    setBody('');
    setMessageType('custom');
    setRecipientType('all');
    setSelectedDrivers([]);
    loadCounts();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageTypeColor = (type: MessageType): string => {
    switch (type) {
      case 'carpool_nudge':
        return '#10B981';
      case 'announcement':
        return '#3B82F6';
      case 'promotion':
        return '#F59E0B';
      case 'urgent':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message Center</Text>
        <TouchableOpacity onPress={handleOpenHistory} style={styles.historyButton}>
          <Ionicons name="time-outline" size={24} color="#5D1289" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={24} color="#5D1289" />
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Drivers</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOnline]}>
            <Ionicons name="radio-button-on" size={24} color="#10B981" />
            <Text style={styles.statNumber}>{onlineCount}</Text>
            <Text style={styles.statLabel}>Online Now</Text>
          </View>
        </View>

        {/* Template Button */}
        <TouchableOpacity
          style={styles.templateButton}
          onPress={() => setShowTemplates(true)}
        >
          <Ionicons name="documents-outline" size={20} color="#5D1289" />
          <Text style={styles.templateButtonText}>Use Template</Text>
          <Ionicons name="chevron-forward" size={20} color="#5D1289" />
        </TouchableOpacity>

        {/* Message Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Compose Message</Text>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter message title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Body Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter your message to drivers"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{body.length}/500</Text>
          </View>

          {/* Message Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Message Type</Text>
            <View style={styles.typeButtons}>
              {[
                { type: 'carpool_nudge', label: 'Carpool', icon: 'car-sport' },
                { type: 'announcement', label: 'Announce', icon: 'megaphone' },
                { type: 'promotion', label: 'Promo', icon: 'gift' },
                { type: 'urgent', label: 'Urgent', icon: 'warning' },
                { type: 'custom', label: 'Custom', icon: 'mail' },
              ].map(item => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeButton,
                    messageType === item.type && styles.typeButtonActive,
                  ]}
                  onPress={() => setMessageType(item.type as MessageType)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={16}
                    color={messageType === item.type ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      messageType === item.type && styles.typeButtonTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipients */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Send To</Text>
            <View style={styles.recipientButtons}>
              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  recipientType === 'all' && styles.recipientButtonActive,
                ]}
                onPress={() => setRecipientType('all')}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={recipientType === 'all' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.recipientButtonText,
                    recipientType === 'all' && styles.recipientButtonTextActive,
                  ]}
                >
                  All ({totalCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  recipientType === 'online' && styles.recipientButtonActive,
                ]}
                onPress={() => setRecipientType('online')}
              >
                <Ionicons
                  name="radio-button-on"
                  size={18}
                  color={recipientType === 'online' ? '#fff' : '#10B981'}
                />
                <Text
                  style={[
                    styles.recipientButtonText,
                    recipientType === 'online' && styles.recipientButtonTextActive,
                  ]}
                >
                  Online ({onlineCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recipientButton,
                  recipientType === 'specific' && styles.recipientButtonActive,
                ]}
                onPress={() => {
                  setRecipientType('specific');
                  handleOpenDriverPicker();
                }}
              >
                <Ionicons
                  name="person-add"
                  size={18}
                  color={recipientType === 'specific' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.recipientButtonText,
                    recipientType === 'specific' && styles.recipientButtonTextActive,
                  ]}
                >
                  Select ({selectedDrivers.length})
                </Text>
              </TouchableOpacity>
            </View>

            {recipientType === 'specific' && selectedDrivers.length > 0 && (
              <TouchableOpacity
                style={styles.editSelectionButton}
                onPress={handleOpenDriverPicker}
              >
                <Text style={styles.editSelectionText}>
                  {selectedDrivers.length} driver(s) selected - Tap to edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>
                Send to {getRecipientCount()} Driver{getRecipientCount() !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Message Templates</Text>
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {MESSAGE_TEMPLATES.map(template => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateItem}
                onPress={() => handleSelectTemplate(template)}
              >
                <View style={[styles.templateIcon, { backgroundColor: getMessageTypeColor(template.type) + '20' }]}>
                  <Ionicons
                    name={template.icon as any}
                    size={24}
                    color={getMessageTypeColor(template.type)}
                  />
                </View>
                <View style={styles.templateContent}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateBody} numberOfLines={2}>
                    {template.body}
                  </Text>
                  <View style={[styles.templateBadge, { backgroundColor: getMessageTypeColor(template.type) }]}>
                    <Text style={styles.templateBadgeText}>{template.type.replace('_', ' ')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Driver Picker Modal */}
      <Modal
        visible={showDriverPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDriverPicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Drivers</Text>
            <TouchableOpacity onPress={() => setShowDriverPicker(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerActions}>
            <TouchableOpacity style={styles.pickerActionButton} onPress={handleSelectAllOnline}>
              <Ionicons name="radio-button-on" size={16} color="#10B981" />
              <Text style={styles.pickerActionText}>Select Online</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerActionButton} onPress={handleClearSelection}>
              <Ionicons name="close-circle" size={16} color="#EF4444" />
              <Text style={styles.pickerActionText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {loadingDrivers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5D1289" />
            </View>
          ) : (
            <FlatList
              data={drivers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.driverItem,
                    selectedDrivers.includes(item.id) && styles.driverItemSelected,
                  ]}
                  onPress={() => handleToggleDriver(item.id)}
                >
                  <View style={styles.driverInfo}>
                    <View style={styles.driverAvatar}>
                      <Text style={styles.driverAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.driverName}>{item.name}</Text>
                      <View style={styles.driverStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: item.isOnline ? '#10B981' : '#9CA3AF' },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {item.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {selectedDrivers.includes(item.id) && (
                    <Ionicons name="checkmark-circle" size={24} color="#5D1289" />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}

          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={styles.pickerDoneButton}
              onPress={() => setShowDriverPicker(false)}
            >
              <Text style={styles.pickerDoneText}>
                Done ({selectedDrivers.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistory(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Message History</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5D1289" />
            </View>
          ) : messageHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateText}>No messages sent yet</Text>
            </View>
          ) : (
            <FlatList
              data={messageHistory}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={[styles.historyBadge, { backgroundColor: getMessageTypeColor(item.type) }]}>
                      <Text style={styles.historyBadgeText}>{item.type.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.historyDate}>{formatDate(item.sentAt)}</Text>
                  </View>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyBody} numberOfLines={2}>{item.body}</Text>
                  <View style={styles.historyStats}>
                    <Text style={styles.historyStatText}>
                      Sent to {item.recipientType === 'all' ? 'all drivers' :
                              item.recipientType === 'online' ? 'online drivers' :
                              `${item.recipientIds?.length || 0} specific drivers`}
                    </Text>
                    <Text style={styles.historyStatText}>
                      {item.deliveredCount} delivered
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  historyButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statCardOnline: {
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Template button
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  templateButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#5D1289',
    marginLeft: 10,
  },

  // Form
  formSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  // Type buttons
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  typeButtonActive: {
    backgroundColor: '#5D1289',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },

  // Recipient buttons
  recipientButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  recipientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  recipientButtonActive: {
    backgroundColor: '#5D1289',
  },
  recipientButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  recipientButtonTextActive: {
    color: '#fff',
  },
  editSelectionButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F3E8FF',
    borderRadius: 6,
  },
  editSelectionText: {
    fontSize: 13,
    color: '#5D1289',
    textAlign: 'center',
  },

  // Send button
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D1289',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#5D1289',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Templates
  templateItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  templateBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 8,
  },
  templateBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  templateBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },

  // Driver picker
  pickerActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    gap: 6,
  },
  pickerActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  driverItemSelected: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#5D1289',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5D1289',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  driverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  pickerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pickerDoneButton: {
    backgroundColor: '#5D1289',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // History
  historyItem: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  historyBody: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  historyStatText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Loading & Empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
