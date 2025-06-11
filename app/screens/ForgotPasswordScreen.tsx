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
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getResponsiveData } from '../../constants/responsive';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
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

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Request password reset OTP
      await requestPasswordReset(email);
      
      // Navigate to OTP verification screen
      router.push({
        pathname: '/screens/ForgotPasswordOTPScreen',
        params: { email: email }
      });
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        'Error',
        error.message || 'There was an error sending the reset code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8ac041" translucent />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.mainContent, { width: '100%' }]}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
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
              {/* Info Section */}
              <View style={styles.infoSection}>
                <MaterialCommunityIcons name="lock-reset" size={48} color="#8ac041" />
                <Text style={styles.infoTitle}>Reset Your Password</Text>
                <Text style={styles.instructionText}>
                  Enter your email address and we'll send you a verification code to reset your password.
                </Text>
              </View>
              
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

              {/* Send Code Button */}
              <TouchableOpacity 
                style={[styles.button, { 
                  width: buttonWidth,
                  opacity: loading ? 0.7 : 1 
                }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    Send Verification Code
                  </Text>
                )}
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

              {/* Security Note */}
              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#8ac041" />
                <Text style={styles.securityText}>
                  We'll send a 6-digit verification code to your email for secure password reset
                </Text>
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
    minHeight: '100%',
  },
  mainContent: {
    alignSelf: 'center',
    flex: 1,
    minHeight: '100%',
  },
  flex1: {
    flex: 1,
  },
  headerSection: {
    height: 120,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    position: 'relative',
    paddingTop: 20,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
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
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 30,
    alignSelf: 'center',
    width: '100%',
    minHeight: 500,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
    marginBottom: 20,
    alignSelf: 'center',
    marginTop: 10,
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
  infoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8ac041',
    marginTop: 12,
    marginBottom: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default ForgotPasswordScreen; 