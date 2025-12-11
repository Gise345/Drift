import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/src/stores/auth-store';
import { firebaseDb, firebaseAuth } from '@/src/config/firebase';
import { doc, updateDoc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Request permissions on component mount
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow access to your photo library to change your profile picture.'
          );
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadImage(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Create a unique filename
      const filename = `profile_${user.id}_${Date.now()}.jpg`;
      const storageRef = storage().ref(`profile-photos/${filename}`);

      // Upload file
      await storageRef.putFile(uri);

      // Get download URL
      const downloadURL = await storageRef.getDownloadURL();

      // Update local state
      setProfilePhoto(downloadURL);

      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    // Basic validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);

      const userRef = doc(firebaseDb, 'users', user.id);
      
      const updates: any = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        updatedAt: serverTimestamp(),
      };

      // Only update profile photo if it changed
      // Save to both photoURL and profilePhoto for consistency
      if (profilePhoto !== user.profilePhoto && profilePhoto !== user.photoURL) {
        updates.profilePhoto = profilePhoto;
        updates.photoURL = profilePhoto;
      }

      // Use setDoc with merge to create document if it doesn't exist
      await setDoc(userRef, updates, { merge: true });

      // Update local auth store with both photoURL and profilePhoto
      setUser({
        ...user,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profilePhoto: profilePhoto,
        photoURL: profilePhoto, // Keep both fields in sync
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayPhoto = profilePhoto || user?.profilePhoto;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#5d1289ff" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={styles.photo}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={60} color="#9CA3AF" />
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.photoOverlay}>
                  <ActivityIndicator size="large" color="#FFF" />
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={styles.changePhotoButton} 
              onPress={pickImage}
              disabled={uploadingPhoto || loading}
            >
              <Ionicons name="camera" size={20} color="#5d1289ff" />
              <Text style={styles.changePhotoText}>
                {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 345 555 1234"
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Add bottom padding for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#000' 
  },
  saveText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#5d1289ff' 
  },
  content: { 
    flex: 1 
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoSection: { 
    alignItems: 'center', 
    paddingVertical: 32 
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  changePhotoText: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#5d1289ff' 
  },
  form: { 
    paddingHorizontal: 24 
  },
  inputContainer: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 15, 
    color: '#000',
    backgroundColor: '#FFF',
  },
});