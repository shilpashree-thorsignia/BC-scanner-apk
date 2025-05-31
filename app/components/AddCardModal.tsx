import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CreateCardData } from '../lib/api';

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (cardData: CreateCardData) => void;
}

export default function AddCardModal({ visible, onClose, onSubmit }: AddCardModalProps) {
  const [formData, setFormData] = useState<CreateCardData>({
    name: '',
    email: '',
    mobile: '',
    company: '',
    jobTitle: '',
    website: '',
    address: '',
    notes: '',
  });

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        email: '',
        mobile: '',
        company: '',
        jobTitle: '',
        website: '',
        address: '',
        notes: '',
      });
      onClose();
    }
  };

  const handleChange = (field: keyof CreateCardData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add Business Card</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={formData.mobile}
              onChangeText={(text) => handleChange('mobile', text)}
              keyboardType="phone-pad"
              placeholderTextColor="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Company"
              value={formData.company}
              onChangeText={(text) => handleChange('company', text)}
              placeholderTextColor="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Job Title"
              value={formData.jobTitle}
              onChangeText={(text) => handleChange('jobTitle', text)}
              placeholderTextColor="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Website"
              value={formData.website}
              onChangeText={(text) => handleChange('website', text)}
              keyboardType="url"
              autoCapitalize="none"
              placeholderTextColor="#666"
            />

            <TextInput
              style={styles.input}
              placeholder="Address"
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholderTextColor="#666"
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes"
              value={formData.notes}
              onChangeText={(text) => handleChange('notes', text)}
              multiline
              numberOfLines={3}
              placeholderTextColor="#666"
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={!formData.name.trim()}
              >
                <Text style={styles.buttonText}>Add Card</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 