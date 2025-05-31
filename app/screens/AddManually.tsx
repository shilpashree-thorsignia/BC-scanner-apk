import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createBusinessCard, CreateCardData } from '../lib/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddManually = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCardData>({
    name: '',
    jobTitle: '',
    company: '',
    notes: '',
    address: '',
    mobile: '',
    email: '',
    website: '',
  });
  const [displayData, setDisplayData] = useState({
    name: '',
    jobTitle: '',
  });
  const [isEdited, setIsEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CreateCardData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsEdited(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Required Field', 'Please enter the full name');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Attempting to save business card with data:', formData);
      const savedCard = await createBusinessCard(formData);
      console.log('Successfully saved card:', savedCard);
      setDisplayData({
        name: savedCard.name,
        jobTitle: savedCard.job_title || '',
      });
      setIsEdited(false);
      Alert.alert('Success', 'Business card saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving business card:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save business card. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.statusBarBackground} />
      <View style={styles.mainContainer}>
        {/* Teal Container Section */}
        <View style={[styles.tealContainer, { height: SCREEN_HEIGHT * 0.45 }]}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButtonRight}>
              <Ionicons name="person-add-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Centered Text */}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {displayData.name || 'Add Contact'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {displayData.jobTitle || 'Enter Job Title'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="mail-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text style={styles.actionButtonText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Favourite</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <ScrollView style={styles.formContainer}>
          {/* AI Research Section */}
          <TouchableOpacity style={styles.aiResearchButton}>
            <View style={styles.aiResearchIcon}>
              <Ionicons name="analytics" size={24} color="white" />
            </View>
            <Text style={styles.aiResearchText}>Research long with AI</Text>
            <Ionicons name="chevron-forward" size={24} color="gray" />
          </TouchableOpacity>

          {/* Group Section */}
          <View style={styles.groupSection}>
            <Text style={styles.groupLabel}>Group</Text>
            <TouchableOpacity style={styles.addGroupButton}>
              <Text style={styles.addGroupButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                placeholder="How do you know them?"
                style={styles.input}
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="Enter full name"
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                placeholder="Enter company name"
                style={styles.input}
                value={formData.company}
                onChangeText={(text) => handleInputChange('company', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title</Text>
              <TextInput
                placeholder="Enter job title"
                style={styles.input}
                value={formData.jobTitle}
                onChangeText={(text) => handleInputChange('jobTitle', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Enter address"
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                placeholder="Enter mobile number"
                style={styles.input}
                value={formData.mobile}
                onChangeText={(text) => handleInputChange('mobile', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter email"
                style={styles.input}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                placeholder="Enter website"
                style={styles.input}
                keyboardType="url"
                value={formData.website}
                onChangeText={(text) => handleInputChange('website', text)}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEdited(true)}
            >
              <Text style={styles.editButtonText}>Edit Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00A693',
  },
  statusBarBackground: {
    height: Platform.OS === 'android' ? 24 : 0,
    backgroundColor: '#00A693',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#00A693',
  },
  tealContainer: {
    position: 'relative',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  navButtonRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: 'white',
    fontSize: 36,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: 80,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 6,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  aiResearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  aiResearchIcon: {
    backgroundColor: '#00A693',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  aiResearchText: {
    flex: 1,
    color: '#6B7280',
  },
  groupSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  groupLabel: {
    color: '#6B7280',
  },
  addGroupButton: {
    borderWidth: 1,
    borderColor: '#00A693',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  addGroupButtonText: {
    color: '#00A693',
  },
  formFields: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  bottomButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 32,
    gap: 16,
    paddingBottom: 16,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#00A693',
    borderRadius: 12,
    paddingVertical: 14,
  },
  editButtonText: {
    color: '#00A693',
    textAlign: 'center',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8BC34A',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AddManually; 

