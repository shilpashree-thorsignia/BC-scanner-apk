import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  FlatList,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BusinessCard as BusinessCardType } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface BusinessCardProps {
  item: BusinessCardType;
  onDelete?: (id: number) => void;
  onShowSnackbar?: (message: string, action?: () => void, actionText?: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
}

interface BusinessCardRef {
  captureCard: () => Promise<string>;
}

const BusinessCardComponent = React.forwardRef<BusinessCardRef, BusinessCardProps>(({ 
  item, 
  onDelete, 
  onShowSnackbar, 
  isSelectionMode = false, 
  isSelected = false, 
  onSelect 
}, ref) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const cardRef = useRef<View>(null);

  // Expose the capture function to parent
  React.useImperativeHandle(ref, () => ({
    captureCard: async () => {
      if (!cardRef.current) {
        throw new Error('Card ref not available');
      }
      return await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });
    }
  }), []);
  
  const handleCardPress = () => {
    if (isSelectionMode) {
      // In selection mode, toggle selection
      if (onSelect) {
        onSelect(item.id);
      }
    } else {
      // Normal mode, show options
      Alert.alert(
        'Card Options',
        'What would you like to do with this business card?',
        [
          {
            text: 'Edit',
            onPress: () => {
              // Navigate to edit screen with card data
              router.push({
                pathname: '/screens/EditBusinessCard',
                params: { card: JSON.stringify(item) }
              });
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Card',
                'Are you sure you want to delete this business card?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const { deleteBusinessCard, restoreBusinessCard } = await import('../lib/api');
                        const result = await deleteBusinessCard(item.id);
                        
                        // Call the onDelete callback to refresh the list
                        if (onDelete) {
                          onDelete(item.id);
                        }

                        // Show snackbar with restore option
                        if (onShowSnackbar) {
                          onShowSnackbar(
                            'Business card moved to trash',
                            async () => {
                              try {
                                await restoreBusinessCard(item.id);
                                // Refresh the list after restore
                                if (onDelete) {
                                  onDelete(-1); // Use -1 as a signal to refresh the entire list
                                }
                              } catch (error) {
                                console.error('Error restoring card:', error);
                                Alert.alert('Error', 'Failed to restore business card. Please try again.');
                              }
                            },
                            'UNDO'
                          );
                        }
                      } catch (error) {
                        console.error('Error deleting card:', error);
                        Alert.alert('Error', 'Failed to delete business card. Please try again.');
                      }
                    },
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleWhatsApp = () => {
    if (item.mobile) {
      Linking.openURL(`https://wa.me/${item.mobile}`);
    }
  };

  const handleCall = () => {
    if (item.mobile) {
      Linking.openURL(`tel:${item.mobile}`);
    }
  };

  const handleShare = async () => {
    try {
      if (!cardRef.current) {
        Alert.alert('Error', 'Unable to capture business card image');
        return;
      }

      // Capture the business card as an image
      const uri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Share ${item.name || 'Business Card'}`,
        });
      } else {
        // Fallback to native Share API with the image URI
        await Share.share({
          url: uri,
          title: `Business Card - ${item.name || 'Contact'}`,
        });
      }
    } catch (error) {
      console.error('Error sharing business card image:', error);
      Alert.alert('Error', 'Failed to share business card. Please try again.');
    }
  };

  const handleWebsitePress = (website: string) => {
    if (website) {
      // Ensure the URL has a protocol
      let url = website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      Linking.openURL(url).catch(err => {
        console.error('Error opening website:', err);
      });
    }
  };

  // Use full name instead of splitting it
  // For QR scanned cards, show "QR Code Data" instead of generic names like "Web Link"
  const fullName = item.type === 'qr_business_card' && (item.name === 'Web Link' || item.name === 'Website' || !item.name) 
    ? 'QR Code Data' 
    : item.name || 'Not Provided';

  // Format the created date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // Format as time if today
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Format as date otherwise
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };
  
  const createdDate = formatDate(item.created_at);

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        ref={cardRef}
        style={[
          styles.card, 
          { 
            backgroundColor: colors.cardBackground, 
            borderColor: isSelected ? '#22C55E' : colors.accent,
            borderWidth: isSelected ? 3 : 2,
            opacity: isSelectionMode && !isSelected ? 0.6 : 1
          }
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {isSelectionMode && (
            <View style={styles.selectionIndicator}>
              <Ionicons 
                name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={isSelected ? "#22C55E" : "#9CA3AF"} 
              />
            </View>
          )}
          
          {/* Business Card Header */}
          <View style={styles.businessCardHeader}>
            <View style={styles.nameSection}>
              <Text style={[styles.businessCardName, { color: isDark ? '#fff' : '#1F2937' }]} numberOfLines={1} ellipsizeMode="tail">
                {fullName}
              </Text>
              {/* Only show job title if it exists */}
              {item.job_title && (
                <Text style={[styles.businessCardTitle, { color: isDark ? '#B0B0B0' : '#6B7280' }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.job_title}
                </Text>
              )}
              {/* Only show company if it exists */}
              {item.company && (
                <Text style={[styles.businessCardCompany, { color: isDark ? '#A0A0A0' : '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
                  {item.company}
                </Text>
              )}
            </View>
            <View style={styles.dateSection}>
              <Text style={[styles.dateText, { color: isDark ? '#888' : '#9CA3AF' }]}>{createdDate}</Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <View style={styles.contactGrid}>
              {/* Only show email if it exists */}
              {item.email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail-outline" size={14} color="#6B7280" style={styles.contactIcon} />
                  <Text style={[styles.contactText, { color: isDark ? '#fff' : '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
                    {item.email}
                  </Text>
                </View>
              )}
              
              {/* Only show phone if it exists */}
              {item.mobile && (
                <View style={styles.contactItem}>
                  <Ionicons name="call-outline" size={14} color="#6B7280" style={styles.contactIcon} />
                  <Text style={[styles.contactText, { color: isDark ? '#fff' : '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
                    {item.mobile}
                  </Text>
                </View>
              )}
              
              {/* Show website for regular cards */}
              {item.type !== 'qr_business_card' && item.website && (
                <View style={styles.contactItem}>
                  <Ionicons name="globe-outline" size={14} color="#6B7280" style={styles.contactIcon} />
                  <TouchableOpacity onPress={() => handleWebsitePress(item.website!)}>
                    <Text style={[styles.contactText, styles.websiteLink, { color: '#2563EB' }]} numberOfLines={1} ellipsizeMode="tail">
                      {item.website}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* QR Code Section - Only for QR scanned cards */}
          {item.type === 'qr_business_card' && (
            <View style={styles.qrSection}>
              <View style={styles.qrHeader}>
                <Ionicons name="qr-code-outline" size={16} color="#22C55E" style={styles.qrIcon} />
                <Text style={[styles.qrTitle, { color: isDark ? '#22C55E' : '#16A085' }]}>
                  Scanned QR Code
                </Text>
              </View>
              {item.website && (
                <TouchableOpacity onPress={() => handleWebsitePress(item.website!)} style={styles.qrContent}>
                  <Text style={[styles.qrData, { color: isDark ? '#60A5FA' : '#2563EB' }]} numberOfLines={2} ellipsizeMode="tail">
                    {item.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity onPress={handleWhatsApp} style={styles.actionButtonNoBg}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleCall} style={styles.actionButtonNoBg}>
              <Ionicons name="call-outline" size={20} color="#2563EB" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleShare} style={styles.actionButtonNoBg}>
              <Ionicons name="share-social-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

type FilterOption = 'all' | 'today' | 'week' | 'month';

interface BusinessCardListProps {
  cards: BusinessCardType[];
  onRefresh?: () => void;
  refreshing?: boolean;
  filter?: FilterOption;
  onCardDelete?: (id: number) => void;
  externalSelectionMode?: boolean;
  onSelectionModeChange?: (isSelectionMode: boolean) => void;
  externalFilter?: 'today' | 'lastWeek' | 'thisMonth' | 'all';
  sortOrder?: 'asc' | 'desc';
}

interface FilterOptionProps {
  label: string;
  value: FilterOption;
  isActive: boolean;
  onPress: (value: FilterOption) => void;
}

const FilterOptionButton: React.FC<FilterOptionProps> = ({ label, value, isActive, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.filterOption, 
        { backgroundColor: isActive ? colors.accent : colors.filterBackground },
      ]}
      onPress={() => onPress(value)}
    >
      <Text 
        style={[
          styles.filterOptionText, 
          { color: isActive ? colors.buttonText : colors.secondaryText }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// Snackbar component
interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  action?: () => void;
  actionText?: string;
}

const Snackbar: React.FC<SnackbarProps> = ({ visible, message, onDismiss, action, actionText }) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto dismiss after 5 seconds if no action
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.snackbar,
        {
          backgroundColor: isDark ? '#333' : '#323232',
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.snackbarText, { color: '#fff' }]}>{message}</Text>
      {action && actionText && (
        <TouchableOpacity onPress={action} style={styles.snackbarAction}>
          <Text style={[styles.snackbarActionText, { color: colors.accent }]}>{actionText}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={onDismiss} style={styles.snackbarClose}>
        <MaterialIcons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const BusinessCardList: React.FC<BusinessCardListProps> = ({
  cards,
  onRefresh,
  refreshing = false,
  onCardDelete,
  externalSelectionMode = false,
  onSelectionModeChange,
  externalFilter = 'all',
  sortOrder = 'asc',
}) => {
  const { colors } = useTheme();

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarAction, setSnackbarAction] = useState<(() => void) | undefined>();
  const [snackbarActionText, setSnackbarActionText] = useState<string | undefined>();
  const [isSelectionMode, setIsSelectionMode] = useState(externalSelectionMode);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, BusinessCardRef>>(new Map());

  // Sync with external selection mode
  useEffect(() => {
    setIsSelectionMode(externalSelectionMode);
    if (!externalSelectionMode) {
      setSelectedCards(new Set());
    }
  }, [externalSelectionMode]);

  const showSnackbar = (message: string, action?: () => void, actionText?: string) => {
    setSnackbarMessage(message);
    setSnackbarAction(() => action);
    setSnackbarActionText(actionText);
    setSnackbarVisible(true);
  };

  const hideSnackbar = () => {
    setSnackbarVisible(false);
    setSnackbarMessage('');
    setSnackbarAction(undefined);
    setSnackbarActionText(undefined);
  };

  const toggleSelectionMode = () => {
    const newSelectionMode = !isSelectionMode;
    setIsSelectionMode(newSelectionMode);
    setSelectedCards(new Set());
    if (onSelectionModeChange) {
      onSelectionModeChange(newSelectionMode);
    }
  };

  const handleCardSelect = (cardId: number) => {
    const newSelectedCards = new Set(selectedCards);
    if (newSelectedCards.has(cardId)) {
      newSelectedCards.delete(cardId);
    } else {
      newSelectedCards.add(cardId);
    }
    setSelectedCards(newSelectedCards);
  };

  const selectAllCards = () => {
    const filteredCardIds = new Set(filteredCards.map(card => card.id));
    setSelectedCards(filteredCardIds);
  };

  const deselectAllCards = () => {
    setSelectedCards(new Set());
  };

  const deleteSelectedCards = async () => {
    if (selectedCards.size === 0) {
      Alert.alert('No Cards Selected', 'Please select at least one card to move to trash.');
      return;
    }

    const selectedCardsArray = cards.filter(card => selectedCards.has(card.id));
    const cardCount = selectedCardsArray.length;
    
    console.log('🗑️ Selected cards for deletion:', selectedCardsArray.map(c => ({ id: c.id, name: c.name })));

    // Show confirmation dialog
    Alert.alert(
      'Move to Trash',
      `Are you sure you want to move ${cardCount} business card${cardCount > 1 ? 's' : ''} to trash? You can restore them later.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting deletion process for', cardCount, 'cards');
              
                             // Delete each selected card using the same soft delete logic as individual cards
               const { deleteBusinessCard, restoreBusinessCard } = await import('../lib/api');
               
               for (const card of selectedCardsArray) {
                 console.log(`🗑️ Soft deleting card: ${card.name} (ID: ${card.id})`);
                 await deleteBusinessCard(card.id);
                 
                 // Call the onDelete callback to refresh the list
                 if (onCardDelete) {
                   onCardDelete(card.id);
                 }
               }

                             // Show success message with restore option (same as individual card delete)
               const message = cardCount === 1 
                 ? `Business card moved to trash`
                 : `${cardCount} business cards moved to trash`;
               
               showSnackbar(
                 message,
                 async () => {
                   try {
                     // Restore all deleted cards
                     for (const card of selectedCardsArray) {
                       console.log(`🔄 Restoring card: ${card.name} (ID: ${card.id})`);
                       await restoreBusinessCard(card.id);
                     }
                     
                     // Refresh the list after restore
                     if (onCardDelete) {
                       onCardDelete(-1); // Use -1 as a signal to refresh the entire list
                     }
                     
                     console.log('✅ Successfully restored', cardCount, 'cards');
                   } catch (error) {
                     console.error('❌ Error restoring cards:', error);
                     Alert.alert('Error', 'Failed to restore some business cards. Please try again.');
                   }
                 },
                 'UNDO'
               );
               
               console.log('✅ Successfully moved', cardCount, 'cards to trash');

                             // Exit selection mode after deletion
               const newSelectionMode = false;
               setIsSelectionMode(newSelectionMode);
               setSelectedCards(new Set());
               if (onSelectionModeChange) {
                 onSelectionModeChange(newSelectionMode);
               }
            } catch (error) {
              console.error('❌ Error deleting selected cards:', error);
              Alert.alert('Error', 'Failed to delete some cards. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const getFilteredAndSortedCards = () => {
    let filteredCards = cards;
    
    // Apply filter
    if (externalFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filteredCards = cards.filter(card => {
        const cardDate = new Date(card.created_at);
        
        switch (externalFilter) {
          case 'today':
            return cardDate >= today;
          
          case 'lastWeek':
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return cardDate >= weekAgo;
          
          case 'thisMonth':
            const monthAgo = new Date(now);
            monthAgo.setDate(now.getDate() - 30);
            return cardDate >= monthAgo;
          
          default:
            return true;
        }
      });
    }
    
    // Apply sorting
    const sortedCards = [...filteredCards].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
    
    return sortedCards;
  };
  
  const filteredCards = getFilteredAndSortedCards();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSelectionMode ? (
        <View style={[styles.selectionHeader, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.selectionHeaderLeft}>
            <TouchableOpacity onPress={toggleSelectionMode} style={styles.selectionButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.selectionCount, { color: colors.text }]}>
              {selectedCards.size} selected
            </Text>
          </View>
          <View style={styles.selectionHeaderRight}>
            {selectedCards.size > 0 && (
              <TouchableOpacity onPress={deleteSelectedCards} style={styles.selectionButton}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={selectedCards.size === filteredCards.length ? deselectAllCards : selectAllCards} 
              style={styles.selectionButton}
            >
              <Ionicons 
                name={selectedCards.size === filteredCards.length ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={colors.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
      <FlatList
        data={filteredCards}
        renderItem={({ item }) => (
          <BusinessCardComponent 
            ref={(ref) => {
              if (ref) {
                cardRefs.current.set(item.id, ref);
              } else {
                cardRefs.current.delete(item.id);
              }
            }}
            item={item} 
            onDelete={onCardDelete} 
            onShowSnackbar={showSnackbar}
            isSelectionMode={isSelectionMode}
            isSelected={selectedCards.has(item.id)}
            onSelect={handleCardSelect}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={hideSnackbar}
        action={snackbarAction}
        actionText={snackbarActionText}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: '#f3f4f6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  company: {
    fontSize: 10,
    color: '#4B5563',
    flex: 1,
    flexShrink: 1,
  },
  website: {
    fontSize: 10,
    color: '#4B5563',
    textDecorationLine: 'underline',
    flex: 1,
    flexShrink: 1,
  },
  clickableLink: {
    textDecorationLine: 'underline',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  topSection: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameAndTitleSection: {
    flex: 1,
    paddingRight: 12,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    lineHeight: 24,
    flexShrink: 1,
    width: '100%',
    flexWrap: 'nowrap',
  },
  jobTitle: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  middleSection: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  email: {
    fontSize: 10,
    color: '#4B5563',
    flex: 1,
    flexShrink: 1,
  },
  phone: {
    fontSize: 10,
    color: '#4B5563',
    flex: 1,
    flexShrink: 1,
  },
  highlightGreen: {
    color: '#22C55E',
    fontWeight: '600',
  },
  highlightTeal: {
    color: '#14B8A6',
    fontWeight: '600',
  },
  verticalDottedLine: {
    width: 1,
    backgroundColor: '#14B8A6',
    height: 36,
    marginHorizontal: 10,
    opacity: 0.8,
  },
  horizontalGreenLine: {
    height: 1,
    backgroundColor: '#22C55E',
    marginBottom: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButtonsInline: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonNoBg: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  leftContentSection: {
    flex: 1,
    paddingRight: 12,
  },
  rightContentSection: {
    flex: 1,
    paddingLeft: 12,
    alignItems: 'flex-start',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'nowrap',
  },
  contactLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    minWidth: 50,
    flexShrink: 0,
  },
  dateInline: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#323232',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  snackbarText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  snackbarAction: {
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  snackbarActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  snackbarClose: {
    marginLeft: 8,
    padding: 4,
  },
  // Removed multiCardView and hiddenView styles - no longer needed for multi-delete functionality
  // Business Card Styles
  businessCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  nameSection: {
    flex: 1,
    paddingRight: 12,
  },
  businessCardName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
    lineHeight: 22,
  },
  businessCardTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 1,
    fontWeight: '500',
  },
  businessCardCompany: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  dateSection: {
    alignItems: 'flex-end',
  },
  contactSection: {
    marginBottom: 12,
  },
  contactGrid: {
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  contactIcon: {
    marginRight: 8,
    width: 16,
  },
  contactText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
  },
  websiteLink: {
    textDecorationLine: 'underline',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  qrSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrIcon: {
    marginRight: 8,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A085',
  },
  qrContent: {
    paddingLeft: 24,
  },
  qrData: {
    fontSize: 13,
    color: '#2563EB',
    textDecorationLine: 'underline',
    lineHeight: 18,
  },
});

export default BusinessCardList;