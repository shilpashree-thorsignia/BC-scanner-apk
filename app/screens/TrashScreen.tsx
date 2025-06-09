import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { getDeletedBusinessCards, restoreBusinessCard, permanentDeleteBusinessCard, emptyTrash } from '../lib/api';
import type { BusinessCard } from '../lib/api';

interface DeletedCardItemProps {
  item: BusinessCard;
  onRestore: (id: number) => void;
  onPermanentDelete: (id: number) => void;
}

const DeletedCardItem: React.FC<DeletedCardItemProps> = ({ item, onRestore, onPermanentDelete }) => {
  const { colors, isDark } = useTheme();

  const formatDeletedDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Deleted today';
    } else if (diffDays <= 7) {
      return `Deleted ${diffDays} days ago`;
    } else {
      return `Deleted on ${date.toLocaleDateString()}`;
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Card',
      'Are you sure you want to restore this business card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => onRestore(item.id),
        },
      ]
    );
  };

  const handlePermanentDelete = () => {
    Alert.alert(
      'Permanently Delete',
      'This action cannot be undone. Are you sure you want to permanently delete this business card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => onPermanentDelete(item.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.cardBackground, borderColor: colors.divider }]}>
      <View style={styles.cardContent}>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, { color: isDark ? '#fff' : colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardDetails, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.company || 'No company'} • {item.email || 'No email'}
          </Text>
          <Text style={[styles.deletedDate, { color: colors.secondaryText }]}>
            {formatDeletedDate(item.deleted_at)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.restoreButton]}
            onPress={handleRestore}
          >
            <MaterialIcons name="restore" size={20} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handlePermanentDelete}
          >
            <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const TrashScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [deletedCards, setDeletedCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeletedCards = async () => {
    try {
      const cards = await getDeletedBusinessCards();
      setDeletedCards(cards);
    } catch (error) {
      console.error('Error fetching deleted cards:', error);
      Alert.alert('Error', 'Failed to load deleted cards. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeletedCards();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeletedCards();
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreBusinessCard(id);
      Alert.alert('Success', 'Business card restored successfully');
      fetchDeletedCards(); // Refresh the list
    } catch (error) {
      console.error('Error restoring card:', error);
      Alert.alert('Error', 'Failed to restore business card. Please try again.');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await permanentDeleteBusinessCard(id);
      Alert.alert('Success', 'Business card permanently deleted');
      fetchDeletedCards(); // Refresh the list
    } catch (error) {
      console.error('Error permanently deleting card:', error);
      Alert.alert('Error', 'Failed to permanently delete business card. Please try again.');
    }
  };

  const handleEmptyTrash = () => {
    if (deletedCards.length === 0) {
      Alert.alert('Info', 'Trash is already empty');
      return;
    }

    Alert.alert(
      'Empty Trash',
      `This will permanently delete all ${deletedCards.length} cards in trash. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              await emptyTrash();
              Alert.alert('Success', 'Trash emptied successfully');
              setDeletedCards([]);
            } catch (error) {
              console.error('Error emptying trash:', error);
              Alert.alert('Error', 'Failed to empty trash. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trash</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Loading deleted cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trash</Text>
        {deletedCards.length > 0 && (
          <TouchableOpacity onPress={handleEmptyTrash} style={styles.emptyTrashButton}>
            <Text style={[styles.emptyTrashText, { color: '#EF4444' }]}>Empty</Text>
          </TouchableOpacity>
        )}
      </View>

      {deletedCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="delete-outline" size={80} color={colors.secondaryText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Trash is Empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
            Deleted business cards will appear here
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: colors.secondaryText }]}>
              {deletedCards.length} card{deletedCards.length !== 1 ? 's' : ''} in trash
            </Text>
            <Text style={[styles.infoSubtext, { color: colors.secondaryText }]}>
              Cards are automatically deleted after 30 days
            </Text>
          </View>
          <FlatList
            data={deletedCards}
            renderItem={({ item }) => (
              <DeletedCardItem
                item={item}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyTrashButton: {
    padding: 8,
  },
  emptyTrashText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    padding: 16,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  deletedDate: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  restoreButton: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  deleteButton: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});

export default TrashScreen; 