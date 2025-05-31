import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HamburgerScreen from './HamburgerScreen';
import { getAllBusinessCards, BusinessCard } from '../lib/api';
import BusinessCardList from '../components/BusinessCardList';

const NavbarScreen: React.FC = () => {
  const router = useRouter();
  const [isHamburgerVisible, setIsHamburgerVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<'today' | 'lastWeek' | 'thisMonth'>('today');

  const loadCards = async () => {
    try {
      setLoading(true);
      const fetchedCards = await getAllBusinessCards();
      setCards(fetchedCards);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleFilterChange = (filter: 'today' | 'lastWeek' | 'thisMonth') => {
    setCurrentFilter(filter);
  };

  const TopBar = () => (
    <View style={styles.topBar}>
      <View style={styles.topBarContent}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setIsHamburgerVisible(true)}
        >
          <Ionicons name="menu-outline" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Cards"
            placeholderTextColor="#999"
          />
        </View>
      </View>
    </View>
  );

  const NavigationBar = () => (
    <View style={styles.navigationBar}>
      <View style={styles.navigationBarContent}>
        <TouchableOpacity
          style={[
            styles.navigationButton,
            activeTab === 'home' && styles.activeNavigationButton
          ]}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons
            name={activeTab === 'home' ? 'home' : 'home-outline'}
            size={24}
            color="#fff"
          />
          <Text style={styles.navigationButtonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.navigationButton,
            activeTab === 'add' && styles.activeNavigationButton
          ]}
          onPress={() => {
            setActiveTab('add');
            router.push('/screens/AddManually' as any);
          }}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.navigationButtonText}>Add</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navigationButton,
            activeTab === 'settings' && styles.activeNavigationButton
          ]}
          onPress={() => {
            setActiveTab('settings');
            router.push('/settings' as any);
          }}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.navigationButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" translucent />
      <View style={styles.content}>
        <TopBar />
        
        {cards.length === 0 && !loading ? (
          <View style={styles.emptyContent}>
            <Image
              source={require('../../assets/images/Mask_group.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No Card Found</Text>
          </View>
        ) : (
          <BusinessCardList
            cards={cards}
            onRefresh={loadCards}
            refreshing={loading}
            onFilterChange={handleFilterChange}
          />
        )}
        
        <NavigationBar />
        <HamburgerScreen 
          isVisible={isHamburgerVisible}
          onClose={() => setIsHamburgerVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  topBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hamburgerButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#1f2937',
  },
  navigationBar: {
    backgroundColor: '#8ac041',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navigationBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navigationButton: {
    alignItems: 'center',
    padding: 8,
  },
  activeNavigationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default NavbarScreen; 