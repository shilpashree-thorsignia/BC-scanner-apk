import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileData {
  name: string;
  email: string;
  dateOfBirth: string;
  region: string;
  image: string | null;
}

interface DayObject {
  timestamp: number;
}

const EditProfileScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: 'Name',
    email: 'Email',
    dateOfBirth: 'DoB',
    region: 'Location',
    image: null,
  });

  const [showCalendar, setShowCalendar] = useState<boolean>(false);

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
        setProfileData({ ...profileData, image: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleDateSelect = (day: DayObject): void => {
    const date = new Date(day.timestamp);
    const formattedDate = date.toLocaleDateString('en-GB');
    setProfileData({ ...profileData, dateOfBirth: formattedDate });
    setShowCalendar(false);
  };

  const validateForm = (): boolean => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Profile updated successfully');
      console.log('Updated profile:', profileData);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? insets.top : 25 }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
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
                {profileData.image ? (
                  <Image
                    source={{ uri: profileData.image }}
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
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={profileData.name}
                  onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowCalendar(true);
                  }}
                >
                  <Text style={styles.dateText}>{profileData.dateOfBirth}</Text>
                  <Ionicons name="calendar" size={20} color="#8AC041" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Country/Region</Text>
                <TextInput
                  style={styles.input}
                  value={profileData.region}
                  onChangeText={(text) => setProfileData({ ...profileData, region: text })}
                  placeholder="Enter your location"
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
              <View style={styles.calendarContainer}>
                <Calendar
                  onDayPress={handleDateSelect}
                  maxDate={new Date().toISOString().split('T')[0]}
                  markedDates={{
                    [profileData.dateOfBirth.split('/').reverse().join('-')]: {
                      selected: true,
                      selectedColor: '#8AC041',
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: '#8AC041',
                    todayTextColor: '#8AC041',
                    arrowColor: '#8AC041',
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
    backgroundColor: 'white',
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