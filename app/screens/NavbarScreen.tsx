import React, { useState, useCallback, memo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HamburgerScreen from './HamburgerScreen';
import { getResponsiveData, scaleSize } from '../../constants/responsive';

// Helper function to get responsive styles
const getStyles = () => {
  const { isDesktop } = getResponsiveData();
  
  return {
    fontSize: {
      title: isDesktop ? 18 : 20,
      normal: isDesktop ? 14 : 16,
      small: isDesktop ? 12 : 14,
    },
    iconSize: scaleSize(24),
    padding: scaleSize(12),
    tabHeight: scaleSize(50),
  };
};

const GroupNameInput = memo(({ 
  value, 
  onChangeText 
}: { 
  value: string; 
  onChangeText: (text: string) => void 
}) => {
  const { fontSize } = getStyles();
  
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.labelText, { fontSize: fontSize.small }]}>
        List name
      </Text>
      <View style={styles.inputBorder}>
        <TextInput
          style={[styles.input, { fontSize: fontSize.normal }]}
          placeholder="Example: Work, Friends"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          autoFocus={true}
          keyboardType="default"
          returnKeyType="next"
        />
      </View>
      <Text style={[styles.helperText, { fontSize: fontSize.small }]}>
        Any list you create becomes a filter at the top of your Chats tab.
      </Text>
    </View>
  );
});

const PeopleList = memo(({ 
  contacts, 
  selectedPeople, 
  onSelectPerson 
}: { 
  contacts: any[]; 
  selectedPeople: any[]; 
  onSelectPerson: (person: any) => void 
}) => {
  const { fontSize, iconSize } = getStyles();
  
  return (
    <ScrollView style={styles.peopleList}>
      {contacts.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={[
            styles.personItem,
            selectedPeople.some(p => p.id === person.id) && styles.selectedPerson
          ]}
          onPress={() => onSelectPerson(person)}
        >
          <Ionicons
            name={selectedPeople.some(p => p.id === person.id)
              ? 'checkbox'
              : 'square-outline'}
            size={iconSize}
            color="#00A693"
          />
          <View style={styles.personInfo}>
            <Text style={[styles.personName, { fontSize: fontSize.normal }]}>
              {person.name}
            </Text>
            <Text style={[styles.personEmail, { fontSize: fontSize.small }]}>
              {person.email}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const GroupModal = memo(({ 
  visible, 
  onClose, 
  groupName,
  onGroupNameChange,
  groupCreationStep,
  onBack,
  contacts,
  selectedPeople,
  onSelectPerson,
  onCreateGroup
}: {
  visible: boolean;
  onClose: () => void;
  groupName: string;
  onGroupNameChange: (text: string) => void;
  groupCreationStep: 'name' | 'people';
  onBack: () => void;
  contacts: any[];
  selectedPeople: any[];
  onSelectPerson: (person: any) => void;
  onCreateGroup: () => void;
}) => {
  const { fontSize, iconSize } = getStyles();
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onBack}>
              <Ionicons name="arrow-back" size={iconSize} color="#666" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontSize: fontSize.title }]}>
              {groupCreationStep === 'name' ? 'New List' : 'Add People'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={iconSize} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {groupCreationStep === 'name' ? (
            <GroupNameInput value={groupName} onChangeText={onGroupNameChange} />
          ) : (
            <PeopleList 
              contacts={contacts} 
              selectedPeople={selectedPeople} 
              onSelectPerson={onSelectPerson} 
            />
          )}

          {/* Footer Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.footerButton,
                (groupCreationStep === 'name' && groupName.trim()) ||
                groupCreationStep === 'people'
                  ? styles.activeButton
                  : styles.inactiveButton
              ]}
              onPress={onCreateGroup}
              disabled={groupCreationStep === 'name' && !groupName.trim()}
            >
              <Text 
                style={[
                  styles.footerButtonText,
                  { fontSize: fontSize.normal },
                  (groupCreationStep === 'name' && groupName.trim()) ||
                  groupCreationStep === 'people'
                    ? styles.activeButtonText
                    : styles.inactiveButtonText
                ]}
              >
                {groupCreationStep === 'name' ? 'Continue' : 'Create List'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const NavbarScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showPopup, setShowPopup] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupCreationStep, setGroupCreationStep] = useState<'name' | 'people'>('name');
  const [groupName, setGroupName] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('');
  const [activeSort, setActiveSort] = useState('');
  const [isHamburgerVisible, setIsHamburgerVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const router = useRouter();
  const { fontSize, iconSize, padding, tabHeight } = getStyles();

  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width } = dimensions;
  const { isDesktop, isMobileWeb } = getResponsiveData();
  const tabWidth = width / 3;

  const [contacts, setContacts] = useState([
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    // Add more dummy data as needed
  ]);

  const handlePeopleSelect = (person: any) => {
    setSelectedPeople(prev => 
      prev.some(p => p.id === person.id)
        ? prev.filter(p => p.id !== person.id)
        : [...prev, person]
    );
  };

  const resetGroupCreation = () => {
    setGroupCreationStep('name');
    setGroupName('');
    setSelectedPeople([]);
    setEditingGroupName('');
  };

  const handleCreateGroup = () => {
    if (groupCreationStep === 'name' && groupName.trim()) {
      setGroupCreationStep('people');
    } else if (groupCreationStep === 'people') {
      const newGroup = {
        id: Date.now().toString(),
        name: groupName,
        people: selectedPeople
      };
      setGroups(prevGroups => [...prevGroups, newGroup]);
      setShowGroupModal(false);
      resetGroupCreation();
    }
  };

  const handleGroupLongPress = useCallback((groupId: string) => {
    setSelectedGroupId(prevId => prevId === groupId ? null : groupId);
  }, []);

  const handleDeleteGroup = (groupId: string) => {
    setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
    setSelectedGroupId(null);
  };

  const handleEditGroup = (group: any) => {
    setEditingGroupName(group.name);
    setGroupName(group.name);
    setShowGroupModal(true);
    setSelectedGroupId(null);
  };

  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <TouchableOpacity
        style={styles.filterModalBackground}
        activeOpacity={1}
        onPress={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContent}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filter By</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {[
            { id: 'newest', label: 'Newest to Oldest' },
            { id: 'oldest', label: 'Oldest to Newest' },
            { id: 'startDate', label: 'Start Date to End Date' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterModalOption,
                activeFilter === option.id && styles.selectedFilterOption
              ]}
              onPress={() => {
                setActiveFilter(option.id);
                setShowFilterModal(false);
              }}
            >
              <Text style={[
                styles.filterModalOptionText,
                { color: activeFilter === option.id ? '#8ac041' : '#6b7280' },
                activeFilter === option.id && styles.selectedFilterOptionText
              ]}>
                {option.label}
              </Text>
              {activeFilter === option.id && (
                <Ionicons name="checkmark" size={24} color="#8ac041" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const SortModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSortModal}
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.sortModalBackground}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalContent}>
          <View style={styles.sortModalHeader}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          {[
            { id: 'firstName', label: 'First Name' },
            { id: 'lastName', label: 'Last Name' },
            { id: 'company', label: 'Company' },
            { id: 'dateAdded', label: 'Date Added' },
          ].map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortModalOption,
                activeSort === option.id && styles.selectedSortOption
              ]}
              onPress={() => {
                setActiveSort(option.id);
                setShowSortModal(false);
              }}
            >
              <Text style={[
                styles.sortModalOptionText,
                { color: activeSort === option.id ? '#8ac041' : '#6b7280' },
                activeSort === option.id && styles.selectedSortOptionText
              ]}>
                {option.label}
              </Text>
              {activeSort === option.id && (
                <Ionicons name="checkmark" size={24} color="#8ac041" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Cards"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
      >
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter-outline" size={20} color="#666" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical-outline" size={20} color="#666" />
          <Text style={styles.filterButtonText}>Sort</Text>
        </TouchableOpacity>

        {groups.map((group) => (
          <View key={group.id} style={styles.groupItem}>
            <TouchableOpacity 
              style={styles.groupButton}
              onLongPress={() => handleGroupLongPress(group.id)}
              delayLongPress={500}
              activeOpacity={0.7}
            >
              <Text style={styles.groupText}>{group.name}</Text>
            </TouchableOpacity>
            
            {selectedGroupId === group.id && (
              <Modal
                transparent={true}
                visible={true}
                animationType="none"
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setSelectedGroupId(null)}
                  style={styles.groupModalBackground}
                >
                  <View 
                    style={[
                      styles.groupModalContent,
                      { top: 90, left: 10 },
                    ]}
                  >
                    <TouchableOpacity 
                      style={styles.groupModalOption}
                      onPress={() => {
                        handleEditGroup(group);
                        setSelectedGroupId(null);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#666" style={styles.groupModalIcon} />
                      <Text style={styles.groupModalText}>Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.groupModalOption}
                      onPress={() => {
                        handleDeleteGroup(group.id);
                        setSelectedGroupId(null);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF0000" style={styles.groupModalIcon} />
                      <Text style={styles.groupModalText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
          </View>
        ))}

        <TouchableOpacity 
          style={styles.groupButton}
          onPress={() => {
            setShowGroupModal(true);
            setGroupName('');
            setEditingGroupName('');
          }}
        >
          <Ionicons name="people-outline" size={20} color="#666" />
          <Text style={styles.groupText}>New Group</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const FloatingActionButton = () => (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => setShowPopup(!showPopup)}
    >
      <Ionicons name={showPopup ? 'close' : 'chevron-up'} size={24} color="#fff" />
    </TouchableOpacity>
  );

  const PopupMenu = () =>
    showPopup && (
      <View style={styles.popupMenu}>
        <TouchableOpacity 
          style={styles.popupMenuItem}
          onPress={() => {
            router.push('/screens/ScannerScreen' as any);
            setShowPopup(false);
          }}
        >
          <View style={styles.popupMenuIcon}>
            <Ionicons name="qr-code-outline" size={24} color="#666" />
          </View>
          <Text style={styles.popupMenuItemText}>Scan a Card</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.popupMenuItem}
          onPress={() => {
            router.push('/screens/AddManually' as any);
            setShowPopup(false);
          }}
        >
          <View style={styles.popupMenuIcon}>
            <Ionicons name="person-add-outline" size={24} color="#666" />
          </View>
          <Text style={styles.popupMenuItemText}>Add Manually</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.popupMenuItem}>
          <View style={styles.popupMenuIcon}>
            <Ionicons name="share-social-outline" size={24} color="#666" />
          </View>
          <Text style={styles.popupMenuItemText}>Share Contact</Text>
        </TouchableOpacity>
      </View>
    );

  const handleModalClose = useCallback(() => {
    setShowGroupModal(false);
    resetGroupCreation();
  }, []);

  const handleBack = useCallback(() => {
    if (groupCreationStep === 'name') {
      handleModalClose();
    } else {
      setGroupCreationStep('name');
    }
  }, [groupCreationStep]);

  const handleGroupNameChange = useCallback((text: string) => {
    setGroupName(text);
  }, []);

  const handleSelectPerson = useCallback((person: any) => {
    setSelectedPeople(prev => 
      prev.some(p => p.id === person.id)
        ? prev.filter(p => p.id !== person.id)
        : [...prev, person]
    );
  }, []);

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
            size={28}
            color={activeTab === 'home' ? '#0097e6' : '#fff'}
            style={activeTab === 'home' ? { transform: [{ translateY: -22 }], marginBottom: 8 } : { marginBottom: 8 }}
          />
          <Text style={[
            styles.navigationButtonText,
            { color: activeTab === 'home' ? '#0097e6' : '#fff' },
            activeTab === 'home' && styles.activeNavigationButtonText
          ]}>
            Home
          </Text>
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
          <Ionicons 
            name="add-outline" 
            size={28} 
            color={activeTab === 'add' ? '#0097e6' : '#fff'}
            style={activeTab === 'add' ? { transform: [{ translateY: -22 }], marginBottom: 8 } : { marginBottom: 8 }}
          />
          <Text style={[
            styles.navigationButtonText,
            { color: activeTab === 'add' ? '#0097e6' : '#fff' },
            activeTab === 'add' && styles.activeNavigationButtonText
          ]}>
            Add
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navigationButton,
            activeTab === 'settings' && styles.activeNavigationButton
          ]}
          onPress={() => {
            setActiveTab('settings');
            router.push('/settings');
          }}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={28}
            color={activeTab === 'settings' ? '#0097e6' : '#fff'}
            style={activeTab === 'settings' ? { transform: [{ translateY: -22 }], marginBottom: 8 } : { marginBottom: 8 }}
          />
          <Text style={[
            styles.navigationButtonText,
            { color: activeTab === 'settings' ? '#0097e6' : '#fff' },
            activeTab === 'settings' && styles.activeNavigationButtonText
          ]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" translucent />
      <View style={styles.content}>
        <TopBar />
        <FilterModal />
        <SortModal />
        <GroupModal
          visible={showGroupModal}
          onClose={handleModalClose}
          groupName={groupName}
          onGroupNameChange={handleGroupNameChange}
          groupCreationStep={groupCreationStep}
          onBack={handleBack}
          contacts={contacts}
          selectedPeople={selectedPeople}
          onSelectPerson={handleSelectPerson}
          onCreateGroup={handleCreateGroup}
        />
        <View style={styles.emptyContent}>
          <Image
            source={require('../../assets/images/Mask_group.png')}
            style={styles.emptyImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyText}>No Card Found</Text>
        </View>
        <FloatingActionButton />
        <PopupMenu />
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
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1F2937',
  },
  filterBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  filterButtonText: {
    marginLeft: 8,
    color: '#6B7280',
  },
  groupItem: {
    position: 'relative',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  groupText: {
    color: '#1F2937',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  emptyText: {
    color: '#1F2937',
    fontSize: 18,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 150,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00bfa5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupMenu: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    zIndex: 50,
  },
  popupMenuItem: {
    padding: 16,
    borderRadius: 25,
    backgroundColor: '#f0f9f0',
  },
  popupMenuIcon: {
    marginRight: 8,
  },
  popupMenuItemText: {
    color: '#6B7280',
  },
  navigationBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80,
    backgroundColor: '#8AC041',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  navigationBarContent: {
    flex: 1,
  },
  navigationButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeNavigationButton: {
    backgroundColor: '#0097e6',
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activeNavigationButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  inputContainer: {
    padding: 16,
    flex: 1,
  },
  labelText: {
    color: '#6B7280',
    marginBottom: 8,
  },
  inputBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  input: {
    color: '#1F2937',
    paddingBottom: 8,
  },
  helperText: {
    color: '#6B7280',
    marginTop: 16,
  },
  peopleList: {
    flex: 1,
    padding: 16,
  },
  selectedPerson: {
    backgroundColor: '#E6F7F5',
  },
  personInfo: {
    marginLeft: 12,
  },
  personName: {
    color: '#1F2937',
  },
  personEmail: {
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#00A693',
  },
  inactiveButton: {
    backgroundColor: '#F3F4F6',
  },
  footerButtonText: {
    fontWeight: '500',
  },
  activeButtonText: {
    color: 'white',
  },
  inactiveButtonText: {
    color: '#9CA3AF',
  },
  filterModalBackground: {
    flex: 1,
    backgroundColor: 'black',
    opacity: 0.5,
  },
  filterModalContent: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterModalTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  filterModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedFilterOption: {
    backgroundColor: '#E5E7EB',
  },
  filterModalOptionText: {
    color: '#6B7280',
  },
  selectedFilterOptionText: {
    fontWeight: '600',
  },
  sortModalBackground: {
    flex: 1,
    backgroundColor: 'black',
    opacity: 0.5,
  },
  sortModalContent: {
    marginTop: 'auto',
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sortModalTitle: {
    fontWeight: '600',
    color: '#1F2937',
  },
  sortModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedSortOption: {
    backgroundColor: '#E5E7EB',
  },
  sortModalOptionText: {
    color: '#6B7280',
  },
  selectedSortOptionText: {
    fontWeight: '600',
  },
  groupModalBackground: {
    flex: 1,
    backgroundColor: 'black',
    opacity: 0.5,
  },
  groupModalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  groupModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  groupModalIcon: {
    marginRight: 8,
  },
  groupModalText: {
    color: '#6B7280',
  },
});

export default NavbarScreen; 