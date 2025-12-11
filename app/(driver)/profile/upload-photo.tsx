import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Shadows } from '@/src/constants/theme';
import { useAuthStore } from '@/src/stores/auth-store';
import { useDriverStore } from '@/src/stores/driver-store';
import { firebaseDb } from '@/src/config/firebase';
import { doc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Helper function to upload image that works across platforms
async function uploadImageToStorage(uri: string, storagePath: string): Promise<string> {
  const storageRef = storage().ref(storagePath);

  // Try putFile first (works best on Android)
  if (Platform.OS === 'android') {
    try {
      await storageRef.putFile(uri);
      return await storageRef.getDownloadURL();
    } catch (error) {
      console.log('putFile failed, trying blob method:', error);
    }
  }

  // Use fetch + blob method (works reliably on iOS and as fallback)
  const response = await fetch(uri);
  const blob = await response.blob();
  await storageRef.put(blob);
  return await storageRef.getDownloadURL();
}

export default function UploadPhotoScreen() {
  const { user, setUser } = useAuthStore();
  const { driver, setDriver } = useDriverStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!imageUri) {
      Alert.alert('No Photo', 'Please select or take a photo');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    try {
      setUploading(true);

      // Create a unique filename and path
      const filename = `driver_profile_${user.id}_${Date.now()}.jpg`;
      const storagePath = `profile-photos/${filename}`;

      // Upload file using cross-platform helper
      const downloadURL = await uploadImageToStorage(imageUri, storagePath);

      // Update user document in Firestore
      const userRef = doc(firebaseDb, 'users', user.id);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        profilePhoto: downloadURL,
        updatedAt: serverTimestamp(),
      });

      // Update driver document if exists
      if (driver?.id) {
        const driverRef = doc(firebaseDb, 'drivers', user.id);
        await updateDoc(driverRef, {
          photoUrl: downloadURL,
          profilePhotoUrl: downloadURL,
          updatedAt: serverTimestamp(),
        });

        // Update local driver store
        setDriver({
          ...driver,
          photoUrl: downloadURL,
        });
      }

      // Update local auth store
      setUser({
        ...user,
        photoURL: downloadURL,
        profilePhoto: downloadURL,
      });

      Alert.alert('Success', 'Profile photo updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Photo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.photoContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} />
          ) : (driver?.photoUrl || user?.photoURL || user?.profilePhoto) ? (
            <Image source={{ uri: driver?.photoUrl || user?.photoURL || user?.profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={80} color={Colors.gray[400]} />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons name="images" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Choose from Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons name="camera" size={24} color={Colors.primary} />
            <Text style={styles.actionText}>Take Photo</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <TouchableOpacity
            style={[styles.saveButton, uploading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <Text style={styles.saveText}>Save Photo</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  backButton: { padding: Spacing.xs },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
  placeholder: { width: 40 },
  content: { flex: 1, padding: Spacing.md },
  photoContainer: {
    alignItems: 'center',
    marginVertical: Spacing['3xl'],
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  photoPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: Spacing.md },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  actionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.black,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
  },
});