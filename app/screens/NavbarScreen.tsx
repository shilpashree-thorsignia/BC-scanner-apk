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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HamburgerScreen from './HamburgerScreen';
import { getAllBusinessCards, BusinessCard } from '../lib/api';
import BusinessCardList from '../components/BusinessCardList';
import { useTheme } from '../context/ThemeContext';

const NavbarScreen: React.FC = () => {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [isHamburgerVisible, setIsHamburgerVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'lastWeek' | 'thisMonth'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filterOptions = [
    { value: 'all', label: 'All Cards' },
    { value: 'today', label: 'Today' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
  ];

  const sortOptions = [
    { value: 'asc', label: 'A to Z' },
    { value: 'desc', label: 'Z to A' },
  ];

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

  const handleFilterChange = (filter: 'all' | 'today' | 'lastWeek' | 'thisMonth') => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setShowSortDropdown(false);
  };

  const TopBar = () => (
    <View style={[styles.topBar, { backgroundColor: isDark ? colors.background : '#fff' }]}>
      <View style={styles.topBarContent}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setIsHamburgerVisible(true)}
        >
          <Ionicons name="menu-outline" size={24} color={isDark ? '#fff' : '#666'} />
        </TouchableOpacity>

        
        {/* Filter Button */}
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            setShowFilterDropdown(!showFilterDropdown);
            setShowSortDropdown(false);
          }}
        >
          <Ionicons name="filter-outline" size={20} color={isDark ? '#fff' : '#666'} />
          <Text style={[styles.filterText, { color: isDark ? '#fff' : '#666' }]}>Filters</Text>
        </TouchableOpacity>

        {/* Sort Button */}
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            setShowSortDropdown(!showSortDropdown);
            setShowFilterDropdown(false);
          }}
        >
          <Ionicons name="swap-vertical-outline" size={20} color={isDark ? '#fff' : '#666'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.trashButton}
          onPress={() => router.push('/screens/TrashScreen' as any)}
        >
          <Ionicons name="trash-outline" size={24} color={isDark ? '#fff' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setIsSelectionMode(!isSelectionMode)}
        >
          <Ionicons 
            name={isSelectionMode ? "close" : "checkmark-circle-outline"} 
            size={24} 
            color={isSelectionMode ? '#FF4444' : (isDark ? '#fff' : '#666')} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdown */}
      {showFilterDropdown && (
        <View style={[styles.dropdown, styles.filterDropdown, { backgroundColor: isDark ? colors.background : '#fff', right: 100 }]}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                selectedFilter === option.value && styles.selectedDropdownItem
              ]}
              onPress={() => handleFilterChange(option.value as 'all' | 'today' | 'lastWeek' | 'thisMonth')}
            >
              <Text style={[
                styles.dropdownItemText, 
                { color: isDark ? '#fff' : '#333' },
                selectedFilter === option.value && styles.selectedDropdownItemText
              ]}>
                {option.label}
              </Text>
              {selectedFilter === option.value && (
                <Ionicons name="checkmark" size={16} color="#8ac041" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Sort Dropdown */}
      {showSortDropdown && (
        <View style={[styles.dropdown, styles.sortDropdown, { backgroundColor: isDark ? colors.background : '#fff', right: 60 }]}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.dropdownItem,
                sortOrder === option.value && styles.selectedDropdownItem
              ]}
              onPress={() => handleSortChange(option.value as 'asc' | 'desc')}
            >
              <Text style={[
                styles.dropdownItemText, 
                { color: isDark ? '#fff' : '#333' },
                sortOrder === option.value && styles.selectedDropdownItemText
              ]}>
                {option.label}
              </Text>
              {sortOrder === option.value && (
                <Ionicons name="checkmark" size={16} color="#8ac041" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const NavigationBar = () => (
    <View style={styles.navigationBar}>
      <View style={styles.navigationBarContent}>
        {/* Home Button */}
        <TouchableOpacity
          style={[
            styles.navigationButton,
            activeTab === 'home' && [styles.activeNavigationButton]
          ]}
          onPress={() => setActiveTab('home')}
        >
          <View style={[styles.iconContainer, activeTab === 'home' && { backgroundColor: '#fff' }]}>
            <Ionicons
              name="home"
              size={24}
              color={activeTab === 'home' ? '#8ac041' : '#fff'}
            />
          </View>
        </TouchableOpacity>

        {/* Scan QR Button (Hidden but preserving logic) */}
        <TouchableOpacity 
          style={[styles.hiddenButton]}
          onPress={() => {
            setActiveTab('scan-qr');
            router.push('/scanner' as any);
          }}
        >
        </TouchableOpacity>

        {/* Scan Card Button (Hidden but preserving logic) */}
        <TouchableOpacity 
          style={[styles.hiddenButton]}
          onPress={() => {
            setActiveTab('scan-card');
            router.push('/screens/ScannerScreen' as any);
          }}
        >
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity 
          style={[
            styles.navigationButton,
            activeTab === 'add' && [styles.activeNavigationButton]
          ]}
          onPress={() => {
            setActiveTab('add');
            router.push('/screens/AddManually' as any);
          }}
        >
          <View style={[styles.iconContainer, activeTab === 'add' && { backgroundColor: '#fff' }]}>
            <Ionicons 
              name="add" 
              size={28} 
              color={activeTab === 'add' ? '#8ac041' : '#fff'} 
            />
          </View>
        </TouchableOpacity>

        {/* Settings Button */}
        <TouchableOpacity
          style={[
            styles.navigationButton,
            activeTab === 'settings' && [styles.activeNavigationButton]
          ]}
          onPress={() => {
            setActiveTab('settings');
            router.push('/settings' as any);
          }}
        >
          <View style={[styles.iconContainer, activeTab === 'settings' && { backgroundColor: '#fff' }]}>
            <Ionicons 
              name="settings" 
              size={24} 
              color={activeTab === 'settings' ? '#8ac041' : '#fff'} 
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? colors.background : '#f8f9fa'} translucent />
      <View style={[styles.content, { backgroundColor: isDark ? colors.background : '#f8f9fa' }]}>
        <TopBar />
        
        {cards.length === 0 && !loading ? (
          <View style={styles.emptyContent}>
            <Image
              source={require('../../assets/images/Mask_group.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={[styles.emptyText, { color: isDark ? colors.text || '#fff' : '#1f2937' }]}>No Card Found</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              setShowFilterDropdown(false);
              setShowSortDropdown(false);
            }}
          >
            <BusinessCardList
              cards={cards}
              onRefresh={loadCards}
              refreshing={loading}
              externalSelectionMode={isSelectionMode}
              onSelectionModeChange={setIsSelectionMode}
              externalFilter={selectedFilter}
              sortOrder={sortOrder}
              onCardDelete={(id) => {
                if (id === -1) {
                  // Special case: refresh all cards (used for restore)
                  loadCards();
                } else {
                  // Normal delete: remove card from local state
                  setCards(prevCards => prevCards.filter(card => card.id !== id));
                }
              }}
            />
          </TouchableOpacity>
        )}
        
        {/* Floating Camera Button */}
        <TouchableOpacity 
          style={styles.floatingCameraButton}
          onPress={() => {
            setActiveTab('scan-card');
            router.push('/screens/ScannerScreen' as any);
          }}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        
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

  trashButton: {
    padding: 8,
    marginLeft: 8,
  },
  selectButton: {
    padding: 8,
    marginLeft: 8,
  },
  navigationBar: {
    backgroundColor: '#8ac041',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navigationBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navigationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  activeNavigationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  hiddenButton: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
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
    textAlign: 'center',
  },
  floatingCameraButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8ac041',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 8,
    gap: 4,
  },
  filterText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  sortButton: {
    padding: 8,
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  filterDropdown: {
    maxHeight: 200,
  },
  sortDropdown: {
    maxHeight: 150,
  },
  selectedDropdownItem: {
    backgroundColor: 'rgba(138, 192, 65, 0.1)',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginVertical: 2,
    minWidth: 120,
  },
  dropdownItemText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDropdownItemText: {
    color: '#8ac041',
    fontWeight: '600',
  },
});

export default NavbarScreen;