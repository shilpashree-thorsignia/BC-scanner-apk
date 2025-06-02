import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Image,
  Dimensions,
  Animated,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const MENU_WIDTH = Dimensions.get('window').width * 0.85;

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  hasArrow?: boolean;
  isLogout?: boolean;
  onPress?: () => void;
  hasSwitch?: boolean;
}

interface HamburgerScreenProps {
  logoPath?: string;
  isVisible: boolean;
  onClose: () => void;
}

const HamburgerScreen = ({ logoPath, isVisible, onClose }: HamburgerScreenProps) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const router = useRouter();
  const { isDark, colors } = useTheme();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isVisible ? 0 : -MENU_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, slideAnim]);

  const MenuItem = ({ icon, title, hasArrow, isLogout, onPress, hasSwitch }: MenuItemProps) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#F0F0F0' }]}
      onPress={() => {
        onPress?.();
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuItemIcon,
          isLogout ? styles.logoutIcon : styles.menuIcon
        ]}>
          <Ionicons
            name={icon}
            size={22}
            color={isLogout ? '#FF4444' : '#4CAF50'}
          />
        </View>
        <Text style={[
          styles.menuItemText,
          isLogout ? styles.logoutText : { color: isDark ? '#fff' : '#1F2937' }
        ]}>
          {title}
        </Text>
      </View>
      {hasSwitch && (
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor="#f4f3f4"
        />
      )}
      {hasArrow && <Ionicons name="chevron-forward" size={20} color={isDark ? '#fff' : '#666'} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menu,
            { 
              transform: [{ translateX: slideAnim }],
              backgroundColor: isDark ? colors.background : 'white' 
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Profile</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="search" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIcon}>
                <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Section */}
          <View style={[styles.profileSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F9F9F9' }]}>
            <View style={styles.avatarContainer}>
              {logoPath ? (
                <Image source={{ uri: logoPath }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameContainer}>
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
                <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]}>Thor Signia</Text>
              </View>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color="#4CAF50" />
                <Text style={styles.location}>Bengaluru</Text>
              </View>
            </View>
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={styles.profileActionButton}
                onPress={() => {
                  router.push('/screens/EditProfileScreen');
                  onClose();
                }}
              >
                <Ionicons name="person" size={18} color="#4CAF50" />
              </TouchableOpacity>
              <View style={styles.actionSpacer} />
              <TouchableOpacity style={styles.profileActionButton}>
                <Ionicons name="qr-code" size={18} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <MenuItem
              icon="person-outline"
              title="Edit Profile"
              hasArrow
              onPress={() => {
                router.push('/screens/EditProfileScreen');
              }}
            />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              hasSwitch
            />
            <MenuItem
              icon="help-circle-outline"
              title="Help & support"
              hasArrow
              onPress={() => {
                // Navigation logic here
              }}
            />
            <MenuItem
              icon="information-circle-outline"
              title="About us"
              hasArrow
              onPress={() => {
                // Navigation logic here
              }}
            />
            <MenuItem
              icon="person-add-outline"
              title="Invite a friend"
              hasArrow
              onPress={() => {
                // Navigation logic here
              }}
            />
            <MenuItem
              icon="log-out-outline"
              title="Log out"
              isLogout
              onPress={() => {
                // Logout logic here
              }}
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: MENU_WIDTH,
    padding: 16,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8F5E9',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmarkContainer: {
    marginRight: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    marginLeft: 4,
    color: '#4CAF50',
  },
  profileActions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  profileActionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSpacer: {
    height: 8,
  },
  menuItems: {
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    backgroundColor: '#E8F5E9',
  },
  logoutIcon: {
    backgroundColor: '#FFEBEE',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
  },
  logoutText: {
    color: '#FF4444',
  },
});

export default HamburgerScreen;