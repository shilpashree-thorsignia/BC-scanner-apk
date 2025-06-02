import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  FlatList,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BusinessCard as BusinessCardType } from '../lib/api';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';

interface BusinessCardProps {
  item: BusinessCardType;
}

const BusinessCardComponent: React.FC<BusinessCardProps> = ({ item }) => {
  const { colors, isDark } = useTheme();
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

  // Split name into parts if possible (assuming first name and surname)
  const nameParts = item.name ? item.name.split(' ') : ['Not', 'Provided'];
  const firstName = nameParts.length > 0 ? nameParts[0] : 'Not';
  const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Provided';

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

  // Create QR code value with available data
  const qrValue = `MECARD:N:${item.name || 'Not Provided'};${item.mobile ? 'TEL:' + item.mobile + ';' : ''}${item.email ? 'EMAIL:' + item.email + ';' : ''}${item.website ? 'URL:' + item.website + ';' : ''}${item.address ? 'ADR:' + item.address + ';' : ''}`;

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.accent }]}>
        <View style={styles.cardContent}>
          {/* Top Section - Name and Title */}
          <View style={styles.topSection}>
            <View style={styles.nameAndTitleSection}>
              <Text style={[styles.name, { color: colors.text }]}>{firstName}</Text>
              <Text style={[styles.surname, { color: colors.text }]}>{surname}</Text>
              <Text style={[styles.jobTitle, { color: colors.secondaryText }]}>{item.job_title || 'Not provided'}</Text>
            </View>
            {/* Created Date and QR Code */}
            <View style={styles.dateAndQrContainer}>
              <Text style={[styles.dateText, { color: colors.secondaryText }]}>{createdDate}</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={qrValue}
                  size={64}
                  color={isDark ? 'white' : 'black'}
                  backgroundColor={colors.qrBackground}
                />
              </View>
              <View style={styles.qrTextContainer}>
                <Text style={[styles.qrHeaderText, { color: colors.secondaryText }]}>Connect</Text>
                <Text style={[styles.qrSubText, { color: colors.secondaryText }]}>Access to tools & resources</Text>
              </View>
            </View>
          </View>

          {/* Middle Section - Contact and Quote */}
          <View style={styles.middleSection}>
            {/* Contact and Quote */}
            <View style={styles.contentSection}>
              <View style={styles.contactSection}>
                <Text style={[styles.email, { color: colors.secondaryText }]}>{item.email || 'Email not provided'}</Text>
                <Text style={[styles.phone, { color: colors.secondaryText }]}>{item.mobile || 'Phone not provided'}</Text>
                {item.company && <Text style={[styles.company, { color: colors.secondaryText }]}>{item.company}</Text>}
                {item.website && <Text style={styles.website}>{item.website}</Text>}
              </View>
              <View style={styles.quoteSection}>
                <Text style={styles.quoteText}>
                  {item.notes || "No additional notes provided"}
                </Text>
              </View>
            </View>
            
            {/* We've moved the QR code section to the top right */}
          </View>

          {/* Horizontal green line */}
          <View style={styles.horizontalGreenLine} />

          {/* Bottom Section - Logos and WhatsApp */}
          <View style={styles.bottomSection}>
            <View style={styles.bottomLeftSection}>
              {/* Thor Signia Logo with tagline */}
              <View style={styles.thorContainer}>
                <View style={styles.thorTitleContainer}>
                  <Text style={styles.thorPrefix}>Thor</Text>
                  <Text style={styles.thorSuffix}>Signia</Text>
                </View>
                <Text style={styles.thorTagline}>Committed Towards Progress</Text>
              </View>
              
              {/* ATSAIC text */}
              <Text style={styles.atsaicText}>ATSAIC</Text>
            </View>
            <Text style={styles.connectWhatsApp}>Connect on WhatsApp</Text>
          </View>
        </View>
      </View>
      
      {/* Action buttons below the card */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          onPress={handleWhatsApp}
          style={styles.actionButton}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleCall}
          style={styles.actionButton}
        >
          <Ionicons name="call-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleShare}
          style={styles.actionButton}
        >
          <Ionicons name="share-social-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Define filter options as a type
type FilterOption = 'all' | 'today' | 'week' | 'month';

interface BusinessCardListProps {
  cards: BusinessCardType[];
  onRefresh?: () => void;
  refreshing?: boolean;
  filter?: FilterOption;
}

// Filter option component
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

const BusinessCardList: React.FC<BusinessCardListProps> = ({
  cards,
  onRefresh,
  refreshing = false,
}) => {
  const { colors } = useTheme();
  // State for the current filter
  const [currentFilter, setCurrentFilter] = useState<FilterOption>('all');
  
  // Handle filter change
  const handleFilterChange = (filter: FilterOption) => {
    setCurrentFilter(filter);
  };
  // Function to filter cards based on the selected filter
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
          // Cards created today
          return cardDate >= today;
        
        case 'week':
          // Cards created in the last 7 days
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return cardDate >= weekAgo;
        
        case 'month':
          // Cards created in the last 30 days
          const monthAgo = new Date(now);
          monthAgo.setDate(now.getDate() - 30);
          return cardDate >= monthAgo;
        
        default:
          return true;
      }
    });
  };
  
  // Get filtered cards based on the current filter
  const filteredCards = getFilteredCards();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter options */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterContainer, { backgroundColor: colors.cardBackground }]}>
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
      
      <FlatList
        data={filteredCards}
        renderItem={({ item }) => <BusinessCardComponent item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  dateAndQrContainer: {
    position: 'absolute',
    right: 4,
    top: 4,
    padding: 4,
    alignItems: 'center',
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrTextContainer: {
    alignItems: 'center',
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  activeFilterOption: {
    backgroundColor: '#3B82F6',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeFilterOptionText: {
    color: '#ffffff',
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
  },
  nameAndTitleSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 18,
  },
  surname: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 18,
  },
  jobTitle: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  middleSection: {
    marginBottom: 8,
  },
  contentSection: {
    paddingRight: 85, /* Make room for the QR code */
  },
  contactSection: {
    marginBottom: 6,
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
  quoteSection: {
  },
  quoteText: {
    fontSize: 9,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 11,
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
  qrSection: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 1,
  },
  qrHeaderText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  qrSubText: {
    fontSize: 7,
    color: '#4B5563',
    textAlign: 'center',
    width: '100%',
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: -2,
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
  bottomLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  thorContainer: {
    alignItems: 'flex-start',
  },
  thorTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thorPrefix: {
    fontSize: 11,
    fontWeight: '400',
    color: '#22C55E',
    lineHeight: 13,
  },
  thorSuffix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14B8A6',
    lineHeight: 13,
  },
  thorTagline: {
    fontSize: 7,
    color: '#666',
    marginTop: 1,
  },
  atsaicText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1.1,
  },
  connectWhatsApp: {
    fontSize: 7,
    color: '#4B5563',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
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
});

export default BusinessCardList;