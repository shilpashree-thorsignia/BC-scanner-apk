import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getResponsiveData } from '../../constants/responsive';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;
  const { isDesktop, isMobileWeb } = getResponsiveData();
  
  // Responsive sizes
  const contentMaxWidth = Math.min(width * 0.9, 500);
  const buttonWidth = isDesktop ? '90%' : '100%';
  const fontSize = isDesktop ? { title: 28, normal: 16 } : { title: 32, normal: 16 };

  const handleResetPassword = () => {
    // Add password reset logic here
    router.push('/screens/LoginScreen');
  };

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8ac041" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContent, { width: '100%' }]}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={[styles.headerText, { fontSize: fontSize.title }]}>
              Forgot Password
            </Text>
          </View>

          {/* Form Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex1}
          >
            <View style={[styles.formContainer, { maxWidth: contentMaxWidth }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity 
                style={[styles.button, { width: buttonWidth }]}
                onPress={handleResetPassword}
              >
                <Text style={styles.buttonText}>
                  Reset Password
                </Text>
              </TouchableOpacity>

              {/* Back to Login */}
              <View style={styles.loginLinkContainer}>
                <Text style={styles.greyText}>
                  Remember your password?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/screens/LoginScreen')}>
                  <Text style={styles.loginLink}>
                    Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8ac041',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    alignSelf: 'center',
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  headerSection: {
    height: '35%',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 40,
    paddingHorizontal: 24,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#8ac041',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  greyText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#8ac041',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen; 