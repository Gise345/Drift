import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';

interface MessageInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  isSending?: boolean;
}

/**
 * Message input component with send button
 */
export function MessageInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  isSending = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    setMessage('');
    Keyboard.dismiss();
    await onSend(trimmedMessage);
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray[400]}
          multiline
          maxLength={500}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={canSend ? Colors.white : Colors.gray[400]}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    ...Shadows.sm,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.gray[100],
    borderRadius: BorderRadius.xl,
    paddingLeft: Spacing.base,
    paddingRight: Spacing.xs,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    minHeight: 44,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray[900],
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 0 : Spacing.xs,
  },

  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
    marginBottom: Platform.OS === 'ios' ? 2 : 0,
  },

  sendButtonActive: {
    backgroundColor: Colors.primary,
  },

  sendButtonDisabled: {
    backgroundColor: Colors.gray[200],
  },
});

export default MessageInput;
