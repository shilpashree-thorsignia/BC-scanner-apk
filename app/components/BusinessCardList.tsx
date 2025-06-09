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

interface BusinessCardProps {
  item: BusinessCardType;
  onDelete?: (id: number) => void;
  onShowSnackbar?: (message: string, action?: () => void, actionText?: string) => void;
}

const BusinessCardComponent: React.FC<BusinessCardProps> = ({ item, onDelete, onShowSnackbar }) => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const handleCardPress = () => {
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
      const name = item.name || 'Contact';
      const jobTitle = item.job_title || '';
      const email = item.email || '';
      const mobile = item.mobile || '';
      
      await Share.share({
        message: `${name} ${jobTitle ? '- ' + jobTitle : ''}
        ${email}
        ${mobile}`,
        title: `Contact details for ${name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
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
  const fullName = item.name || 'Not Provided';

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
        style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.accent }]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.topSection}>
            <View style={styles.nameAndTitleSection}>
              <View style={styles.nameContainer}>
                <Text style={[styles.name, { color: isDark ? '#fff' : colors.text }]} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
                <Text style={[styles.dateInline, { color: isDark ? '#fff' : colors.secondaryText }]}>{createdDate}</Text>
              </View>
              <Text style={[styles.jobTitle, { color: isDark ? '#fff' : colors.secondaryText }]}>{item.job_title || 'Not provided'}</Text>
            </View>
          </View>

          <View style={styles.middleSection}>
            <View style={styles.leftContentSection}>
              <Text style={[styles.contactLabel, { color: isDark ? '#fff' : colors.secondaryText }]}>Email:</Text>
              <Text style={[styles.email, { color: isDark ? '#fff' : colors.secondaryText }]}>{item.email || 'Not provided'}</Text>
              <Text style={[styles.contactLabel, { color: isDark ? '#fff' : colors.secondaryText, marginTop: 4 }]}>Phone:</Text>
              <Text style={[styles.phone, { color: isDark ? '#fff' : colors.secondaryText }]}>{item.mobile || 'Not provided'}</Text>
            </View>
            <View style={styles.rightContentSection}>
              <Text style={[styles.contactLabel, { color: isDark ? '#fff' : colors.secondaryText }]}>Company:</Text>
              <Text style={[styles.company, { color: isDark ? '#fff' : colors.secondaryText }]}>{item.company || 'Not provided'}</Text>
              <Text style={[styles.contactLabel, { color: isDark ? '#fff' : colors.secondaryText, marginTop: 4 }]}>Website:</Text>
              {item.website ? (
                <TouchableOpacity onPress={() => handleWebsitePress(item.website!)}>
                  <Text style={[styles.website, styles.clickableLink, { color: '#2563EB' }]}>{item.website}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.website, { color: isDark ? '#fff' : colors.secondaryText }]}>Not provided</Text>
              )}
            </View>
          </View>

          <View style={styles.horizontalGreenLine} />

          <View style={styles.bottomSection}>
            <View style={styles.actionButtonsInline}>
              <TouchableOpacity
                onPress={handleWhatsApp}
                style={styles.actionButtonNoBg}
              >
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleCall}
                style={styles.actionButtonNoBg}
              >
                <Ionicons name="call-outline" size={24} color="#2563EB" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleShare}
                style={styles.actionButtonNoBg}
              >
                <Ionicons name="share-social-outline" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

type FilterOption = 'all' | 'today' | 'week' | 'month';

interface BusinessCardListProps {
  cards: BusinessCardType[];
  onRefresh?: () => void;
  refreshing?: boolean;
  filter?: FilterOption;
  onCardDelete?: (id: number) => void;
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
}) => {
  const { colors } = useTheme();
  const [currentFilter, setCurrentFilter] = useState<FilterOption>('all');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarAction, setSnackbarAction] = useState<(() => void) | undefined>();
  const [snackbarActionText, setSnackbarActionText] = useState<string | undefined>();

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
  
  const handleFilterChange = (filter: FilterOption) => {
    setCurrentFilter(filter);
  };

  const getFilteredCards = () => {
    if (currentFilter === 'all') {
      return cards;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return cards.filter(card => {
      const cardDate = new Date(card.created_at);
      
      switch (currentFilter) {
        case 'today':
          return cardDate >= today;
        
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return cardDate >= weekAgo;
        
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setDate(now.getDate() - 30);
          return cardDate >= monthAgo;
        
        default:
          return true;
      }
    });
  };
  
  const filteredCards = getFilteredCards();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
        <FilterOptionButton 
          label="All Cards" 
          value="all" 
          isActive={currentFilter === 'all'} 
          onPress={handleFilterChange} 
        />
        <FilterOptionButton 
          label="Today" 
          value="today" 
          isActive={currentFilter === 'today'} 
          onPress={handleFilterChange} 
        />
        <FilterOptionButton 
          label="This Week" 
          value="week" 
          isActive={currentFilter === 'week'} 
          onPress={handleFilterChange} 
        />
        <FilterOptionButton 
          label="This Month" 
          value="month" 
          isActive={currentFilter === 'month'} 
          onPress={handleFilterChange} 
        />
        </ScrollView>
      </View>
      <FlatList
        data={filteredCards}
        renderItem={({ item }) => (
          <BusinessCardComponent 
            item={item} 
            onDelete={onCardDelete} 
            onShowSnackbar={showSnackbar}
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
    marginBottom: 2,
  },
  website: {
    fontSize: 10,
    color: '#4B5563',
    textDecorationLine: 'underline',
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
    padding: 10,
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
    marginBottom: 2,
  },
  phone: {
    fontSize: 10,
    color: '#4B5563',
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
  contactLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
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
});

export default BusinessCardList;