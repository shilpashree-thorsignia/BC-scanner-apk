import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar, DateData } from 'react-native-calendars';

interface DayObject {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

interface ProfileData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profileImage: string | null;
}

interface DayObject {
  timestamp: number;
}

const EditProfileScreen: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>(() => ({
    id: user?.id ? parseInt(user.id, 10) : 0,
    first_name: user?.firstName || '',
    last_name: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: null,
  }));

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to update your profile picture.'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  const pickImage = async (): Promise<void> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfileData({ ...profileData, profileImage: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDateSelect = (day: DayObject): void => {
    // Date selection removed as it's not part of our user model
    setShowCalendar(false);
  };

  const validateForm = (): boolean => {
    if (!profileData.first_name.trim() || !profileData.last_name.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!profileData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const response = await fetch(`${API_BASE_URL}/users/${profileData.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          email: profileData.email,
          phone: profileData.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user data in context
      setUser({
        id: data.id.toString(),
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
      });

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && { backgroundColor: '#1a1a1a' }]}>
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#8AC041'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : 25,
          backgroundColor: isDark ? colors.background : 'white',
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : 'black'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : 'black' }]}>Edit Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            <View style={styles.imageContainer}>
              <TouchableOpacity onPress={pickImage}>
                {profileData.profileImage ? (
                  <Image
                    source={{ uri: profileData.profileImage }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.profileImagePlaceholder} />
                )}
                <View style={styles.cameraButton}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#fff' : '#374151' }]}>First Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                      color: isDark ? '#fff' : '#374151',
                    },
                  ]}
                  value={profileData.first_name}
                  onChangeText={(text) => setProfileData({ ...profileData, first_name: text })}
                  placeholder="Enter your first name"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#fff' : '#374151' }]}>Last Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                      color: isDark ? '#fff' : '#374151',
                    },
                  ]}
                  value={profileData.last_name}
                  onChangeText={(text) => setProfileData({ ...profileData, last_name: text })}
                  placeholder="Enter your last name"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#fff' : '#374151' }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                      color: isDark ? '#fff' : '#374151',
                    },
                  ]}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#fff' : '#374151' }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, { 
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#E5E7EB',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'white',
                    color: isDark ? '#fff' : '#374151'
                  }]}
                  value={profileData.phone}
                  onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : '#9CA3AF'}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
      >
        <TouchableWithoutFeedback onPress={() => setShowCalendar(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.calendarContainer, { backgroundColor: isDark ? colors.cardBackground : 'white' }]}>
                <Calendar
                  onDayPress={handleDateSelect}
                  maxDate={new Date().toISOString().split('T')[0]}
                  markedDates={{}}
                  theme={{
                    selectedDayBackgroundColor: isDark ? '#fff' : '#8AC041',
                    todayTextColor: isDark ? '#fff' : '#8AC041',
                    arrowColor: isDark ? '#fff' : '#8AC041',
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#8AC041',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#8AC041',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: '#8AC041',
    padding: 8,
    borderRadius: 15,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#8AC041',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
});

export default EditProfileScreen;