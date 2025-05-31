import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { scanBusinessCard, getAllBusinessCards, createBusinessCard, BusinessCard, CreateCardData } from './lib/api';
import AddCardModal from './components/AddCardModal';
import BusinessCardList from './components/BusinessCardList';

export default function ScanScreen() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'today' | 'lastWeek' | 'thisMonth'>('today');

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCards = await getAllBusinessCards();
      setCards(fetchedCards);
    } catch (err) {
      console.error('Error loading cards:', err);
      setError('Failed to load business cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleScan = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setScanning(true);
        setError(null);
        const scannedCard = await scanBusinessCard(result.assets[0].uri);
        setCards(prevCards => [scannedCard, ...prevCards]);
        setCurrentFilter('today'); // Show today's cards after scanning
      }
    } catch (err) {
      console.error('Error scanning card:', err);
      setError('Failed to scan business card');
      Alert.alert('Error', 'Failed to scan business card');
    } finally {
      setScanning(false);
    }
  };

  const handleManualAdd = async (cardData: CreateCardData) => {
    try {
      setError(null);
      const newCard = await createBusinessCard(cardData);
      setCards(prevCards => [newCard, ...prevCards]);
      setCurrentFilter('today'); // Show today's cards after adding
      setShowAddModal(false);
      Alert.alert('Success', 'Business card added successfully');
    } catch (err) {
      console.error('Error adding card:', err);
      setError('Failed to add business card');
      Alert.alert('Error', 'Failed to add business card');
    }
  };

  const handleFilterChange = (filter: 'today' | 'lastWeek' | 'thisMonth') => {
    setCurrentFilter(filter);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.button, styles.scanButton]}
          onPress={handleScan}
          disabled={scanning}
        >
          <Text style={styles.buttonText}>
            {scanning ? 'Scanning...' : 'Scan Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.addButton]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.buttonText}>Add Manually</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cards...</Text>
        </View>
      ) : (
        <BusinessCardList
          cards={cards}
          onRefresh={loadCards}
          refreshing={loading}
          onFilterChange={handleFilterChange}
        />
      )}

      <AddCardModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleManualAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#007AFF',
  },
  addButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
}); 