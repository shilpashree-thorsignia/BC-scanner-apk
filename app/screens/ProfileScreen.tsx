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
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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

const ProfileScreen: React.FC = () => {
  const { isDark, colors } = useTheme();
  const { user, setUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isEditing, setIsEditing] = useState(false);
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

  const [originalData, setOriginalData] = useState<ProfileData>(profileData);

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
    if (!isEditing) return;
    
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

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalData({ ...profileData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({ ...originalData });
    setError(null);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

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

      // Update local state
      setOriginalData({ ...profileData });
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'ios' ? insets.top : 25,
          backgroundColor: colors.background,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]} 
                onPress={handleCancel}
                disabled={isSaving}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.accent }]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]} 
              onPress={handleEdit}
            >
              <Ionicons name="pencil" size={20} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.listItemBackground }]}>
          <Text style={[styles.errorText, { color: '#EF4444' }]}>{error}</Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={pickImage} disabled={!isEditing}>
              {profileData.profileImage ? (
                <Image
                  source={{ uri: profileData.profileImage }}
                  style={[styles.profileImage, { borderColor: colors.accent }]}
                />
              ) : (
                <View style={[styles.profileImagePlaceholder, { 
                  backgroundColor: colors.listItemBackground,
                  borderColor: colors.accent 
                }]}>
                  <Ionicons name="person" size={40} color={colors.secondaryText} />
                </View>
              )}
              {isEditing && (
                <View style={[styles.cameraButton, { backgroundColor: colors.accent }]}>
                  <Ionicons name="camera" size={20} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.divider,
                      backgroundColor: colors.background,
                      color: colors.text,
                    },
                  ]}
                  value={profileData.first_name}
                  onChangeText={(text) => setProfileData({ ...profileData, first_name: text })}
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.secondaryText}
                />
              ) : (
                <View style={[styles.displayField, { backgroundColor: colors.listItemBackground }]}>
                  <Text style={[styles.displayText, { color: colors.text }]}>
                    {profileData.first_name || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.divider,
                      backgroundColor: colors.background,
                      color: colors.text,
                    },
                  ]}
                  value={profileData.last_name}
                  onChangeText={(text) => setProfileData({ ...profileData, last_name: text })}
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.secondaryText}
                />
              ) : (
                <View style={[styles.displayField, { backgroundColor: colors.listItemBackground }]}>
                  <Text style={[styles.displayText, { color: colors.text }]}>
                    {profileData.last_name || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.divider,
                      backgroundColor: colors.background,
                      color: colors.text,
                    },
                  ]}
                  value={profileData.email}
                  onChangeText={(text) => setProfileData({ ...profileData, email: text })}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <View style={[styles.displayField, { backgroundColor: colors.listItemBackground }]}>
                  <Text style={[styles.displayText, { color: colors.text }]}>
                    {profileData.email || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.divider,
                      backgroundColor: colors.background,
                      color: colors.text,
                    },
                  ]}
                  value={profileData.phone}
                  onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={[styles.displayField, { backgroundColor: colors.listItemBackground }]}>
                  <Text style={[styles.displayText, { color: colors.text }]}>
                    {profileData.phone || 'Not set'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: 'transparent',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
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
    borderWidth: 3,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    padding: 8,
    borderRadius: 15,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  displayField: {
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 16,
  },
});

export default ProfileScreen; 