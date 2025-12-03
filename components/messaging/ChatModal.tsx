import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { ChatScreen } from './ChatScreen';

interface ChatModalProps {
  visible: boolean;
  tripId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userType: 'rider' | 'driver';
  otherUserName: string;
  onClose: () => void;
  isEnabled?: boolean;
}

/**
 * Modal wrapper for the chat screen
 */
export function ChatModal({
  visible,
  tripId,
  userId,
  userName,
  userPhoto,
  userType,
  otherUserName,
  onClose,
  isEnabled = true,
}: ChatModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ChatScreen
          tripId={tripId}
          userId={userId}
          userName={userName}
          userPhoto={userPhoto}
          userType={userType}
          otherUserName={otherUserName}
          onClose={onClose}
          isEnabled={isEnabled}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ChatModal;
