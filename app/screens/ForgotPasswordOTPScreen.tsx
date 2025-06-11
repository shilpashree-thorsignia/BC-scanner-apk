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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { getResponsiveData } from '../../constants/responsive';
import { useAuth } from '../context/AuthContext';

const ForgotPasswordOTPScreen: React.FC = () => {
  const { email } = useLocalSearchParams();
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { verifyPasswordResetOTP, resendPasswordResetOTP } = useAuth();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const { width, height } = dimensions;
  const { isDesktop, isMobileWeb } = getResponsiveData();
  
  // Responsive sizes
  const contentMaxWidth = Math.min(width * 0.9, 500);
  const buttonWidth = isDesktop ? '90%' : '100%';
  const fontSize = isDesktop ? { title: 28, normal: 16 } : { title: 32, normal: 16 };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await verifyPasswordResetOTP(email as string, otpCode, newPassword);
      
      Alert.alert(
        'Success!',
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          {
            text: 'Login',
            onPress: () => {
              router.push('/screens/LoginScreen');
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Password reset verification error:', error);
      Alert.alert(
        'Verification Failed',
        error.message || 'Invalid or expired OTP code. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await resendPasswordResetOTP(email as string);
      setTimeLeft(600); // Reset timer to 10 minutes
      Alert.alert('Success', 'A new OTP code has been sent to your email');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOTPChange = (text: string) => {
    // Only allow numeric input and limit to 6 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtpCode(numericText);
  };

  const isExpired = timeLeft <= 0;

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
              Reset Password
            </Text>
          </View>

          {/* Form Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex1}
          >
            <View style={[styles.formContainer, { maxWidth: contentMaxWidth }]}>
              {/* Email Icon and Info */}
              <View style={styles.infoSection}>
                <MaterialCommunityIcons name="email-outline" size={48} color="#8ac041" />
                <Text style={styles.infoTitle}>Enter Verification Code</Text>
                <Text style={styles.infoText}>
                  We've sent a 6-digit verification code to {email}
                </Text>
              </View>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Text style={[styles.timerText, { color: isExpired ? '#ff4444' : '#666' }]}>
                  {isExpired ? 'Code expired' : `Code expires in ${formatTime(timeLeft)}`}
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.otpInput, { borderColor: isExpired ? '#ff4444' : '#E8E8E8' }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor="#999"
                  value={otpCode}
                  onChangeText={handleOTPChange}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New Password (min 6 characters)"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity 
                style={[styles.button, { 
                  width: buttonWidth,
                  opacity: loading ? 0.7 : 1,
                  backgroundColor: isExpired ? '#ccc' : '#8ac041'
                }]}
                onPress={handleVerifyOTP}
                disabled={loading || isExpired}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <View style={styles.resendContainer}>
                <Text style={styles.greyText}>
                  Didn't receive the code?{' '}
                </Text>
                <TouchableOpacity 
                  onPress={handleResendOTP}
                  disabled={resendLoading}
                >
                  <Text style={[styles.resendLink, { opacity: resendLoading ? 0.7 : 1 }]}>
                    {resendLoading ? 'Sending...' : 'Resend'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Security Note */}
              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#8ac041" />
                <Text style={styles.securityText}>
                  Your new password will be encrypted and stored securely
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
    minHeight: 600,
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  otpInput: {
    height: 55,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    backgroundColor: 'white',
    textAlign: 'center',
    letterSpacing: 6,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: 'white',
    height: 50,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  greyText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#8ac041',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    textAlign: 'center',
    flex: 1,
    lineHeight: 16,
  },
});

export default ForgotPasswordOTPScreen; 