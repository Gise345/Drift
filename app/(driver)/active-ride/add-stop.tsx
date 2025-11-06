import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/src/constants/theme';

export default function AddStop() {
  const router = useRouter();
  const [stopAddress, setStopAddress] = useState('');
  const [searchResults, setSearchResults] = useState([
    'Camana Bay, Grand Cayman',
    'Foster\'s Food Fair, Seven Mile Beach',
    'Kirk Supermarket, George Town',
  ]);

  const handleAddStop = (address: string) => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Stop</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            value={stopAddress}
            onChangeText={setStopAddress}
            placeholder="Search for a place..."
            placeholderTextColor={Colors.gray[400]}
            autoFocus
          />
          {stopAddress.length > 0 && (
            <TouchableOpacity onPress={() => setStopAddress('')}>
              <Ionicons name="close-circle" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        <ScrollView style={styles.results}>
          {searchResults.map((result, index) => (
            <TouchableOpacity
              key={index}
              style={styles.resultCard}
              onPress={() => handleAddStop(result)}
            >
              <View style={styles.resultIcon}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.resultText}>
                <Text style={styles.resultTitle}>{result}</Text>
                <Text style={styles.resultDistance}>0.8 km away</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.black,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.black,
    marginLeft: Spacing.md,
  },
  results: { flex: 1 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultText: { flex: 1 },
  resultTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.black,
    marginBottom: 2,
  },
  resultDistance: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[600],
  },
});