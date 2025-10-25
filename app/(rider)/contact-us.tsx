import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ContactUsScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    Alert.alert('Success', 'Your message has been sent! We\'ll get back to you soon.', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>We'd love to hear from you!</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="What's this about?"
            value={subject}
            onChangeText={setSubject}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us what's on your mind..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Send Message</Text>
          <Ionicons name="send" size={18} color="#FFF" />
        </TouchableOpacity>

        {/* Contact Methods */}
        <View style={styles.alternativeContact}>
          <Text style={styles.alternativeTitle}>Or reach us directly:</Text>
          
          <View style={styles.contactMethodCard}>
            <Ionicons name="mail" size={20} color="#5d1289ff" />
            <View style={styles.contactMethodText}>
              <Text style={styles.contactMethodLabel}>Email</Text>
              <Text style={styles.contactMethodValue}>support@driftcayman.com</Text>
            </View>
          </View>

          <View style={styles.contactMethodCard}>
            <Ionicons name="call" size={20} color="#5d1289ff" />
            <View style={styles.contactMethodText}>
              <Text style={styles.contactMethodLabel}>Phone</Text>
              <Text style={styles.contactMethodValue}>+1 (345) 555-DRIFT</Text>
            </View>
          </View>

          <View style={styles.contactMethodCard}>
            <Ionicons name="time" size={20} color="#5d1289ff" />
            <View style={styles.contactMethodText}>
              <Text style={styles.contactMethodLabel}>Hours</Text>
              <Text style={styles.contactMethodValue}>Mon-Fri: 9AM - 6PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 24 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 24 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#000' },
  textArea: { height: 120, paddingTop: 14 },
  submitButton: { flexDirection: 'row', backgroundColor: '#000', paddingVertical: 16, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginRight: 8 },
  alternativeContact: { paddingTop: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  alternativeTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 16 },
  contactMethodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, marginBottom: 12 },
  contactMethodText: { marginLeft: 12, flex: 1 },
  contactMethodLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  contactMethodValue: { fontSize: 14, fontWeight: '600', color: '#000' },
});