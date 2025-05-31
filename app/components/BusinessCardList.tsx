import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BusinessCard as BusinessCardType } from '../lib/api';
import QRCode from 'react-native-qrcode-svg';

interface BusinessCardProps {
  item: BusinessCardType;
}

const BusinessCardComponent: React.FC<BusinessCardProps> = ({ item }) => {
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
      await Share.share({
        message: `${item.name} - ${item.job_title}\n${item.email}\n${item.mobile}`,
        title: `Contact details for ${item.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.mainContent}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.jobTitle}>{item.job_title || ''}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.phone}>{item.mobile}</Text>
            </View>
          </View>
          <View style={styles.qrContainer}>
            <QRCode
              value={`MECARD:N:${item.name};TEL:${item.mobile || ''};EMAIL:${item.email || ''};URL:${item.website || ''};NOTE:${item.job_title || ''};`}
              size={65}
              color="black"
              backgroundColor="white"
            />
            <Text style={styles.qrText}>Connect on WhatsApp</Text>
          </View>
        </View>

        <Text style={styles.description}>
          "I help businesses like yours scale and succeed with GTM strategy, innovative development, and AI-driven automation."
        </Text>

        <View style={styles.bottomSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/thor-signia-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={styles.actionButton}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleCall}
              style={styles.actionButton}
            >
              <Ionicons name="call-outline" size={18} color="#2563EB" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleShare}
              style={styles.actionButton}
            >
              <Ionicons name="share-social-outline" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

interface BusinessCardListProps {
  cards: BusinessCardType[];
  onRefresh?: () => void;
  refreshing?: boolean;
  onFilterChange?: (filter: FilterPeriod) => void;
}

type FilterPeriod = 'today' | 'lastWeek' | 'thisMonth';

const BusinessCardList: React.FC<BusinessCardListProps> = ({
  cards,
  onRefresh,
  refreshing = false,
  onFilterChange,
}) => {
  const [selectedFilter, setSelectedFilter] = React.useState<FilterPeriod>('today');

  const handleFilterChange = (filter: FilterPeriod) => {
    setSelectedFilter(filter);
    onFilterChange?.(filter);
  };

  const filterCards = (period: FilterPeriod) => {
    const now = new Date();
    const cardDate = (card: BusinessCardType) => new Date(card.created_at);
    
    switch (period) {
      case 'today':
        return cards.filter(card => 
          cardDate(card).toDateString() === now.toDateString()
        );
      case 'lastWeek':
        const lastWeek = new Date(now.setDate(now.getDate() - 7));
        return cards.filter(card => cardDate(card) >= lastWeek);
      case 'thisMonth':
        return cards.filter(card => 
          cardDate(card).getMonth() === now.getMonth() &&
          cardDate(card).getFullYear() === now.getFullYear()
        );
      default:
        return cards;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'today' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('today')}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === 'today' && styles.filterTextActive,
          ]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'lastWeek' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('lastWeek')}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === 'lastWeek' && styles.filterTextActive,
          ]}>Last week</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'thisMonth' && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterChange('thisMonth')}
        >
          <Text style={[
            styles.filterText,
            selectedFilter === 'thisMonth' && styles.filterTextActive,
          ]}>This Month</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filterCards(selectedFilter)}
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#8ac041',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '500',
  },
  list: {
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mainContent: {
    flex: 1,
    marginRight: 12,
  },
  nameSection: {
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  contactInfo: {
    marginTop: 4,
  },
  email: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 1,
  },
  phone: {
    fontSize: 12,
    color: '#4B5563',
  },
  description: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  qrContainer: {
    alignItems: 'center',
    width: 65,
  },
  qrText: {
    fontSize: 8,
    color: '#4B5563',
    marginTop: 2,
    textAlign: 'center',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  logoContainer: {
    alignItems: 'flex-start',
  },
  logo: {
    height: 100,
    width: 110,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});

export default BusinessCardList;