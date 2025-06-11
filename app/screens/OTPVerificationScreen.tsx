import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '../config';

const OTPVerificationScreen = () => {
  const params = useLocalSearchParams();
  const { email, firstName } = params;
  
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      setLoading(true);
      console.log('Verifying OTP...');

      const response = await fetch(`${API_BASE_URL}/register/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      console.log('OTP verification successful:', data);

      Alert.alert(
        'Success! 🎉',
        'Your email has been verified successfully! You can now log in to your account.',
        [
          {
            text: 'Login Now',
            onPress: () => {
              // Navigate to login screen
              router.replace('/screens/LoginScreen');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'OTP verification failed. Please try again.';
      if (error.message) {
        if (error.message.includes('expired')) {
          errorMessage = 'OTP code has expired. Please request a new one.';
        } else if (error.message.includes('Invalid OTP')) {
          errorMessage = 'Invalid OTP code. Please check and try again.';
        } else if (error.message.includes('already been used')) {
          errorMessage = 'This OTP code has already been used. Please request a new one.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      console.log('Resending OTP...');

      const response = await fetch(`${API_BASE_URL}/register/resend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      console.log('OTP resent successfully');
      setTimeLeft(600); // Reset timer to 10 minutes
      setOtp(''); // Clear the input

      Alert.alert(
        'OTP Sent! 📧',
        'A new verification code has been sent to your email.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert('Resend Failed', error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const isExpired = timeLeft <= 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Verification</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-outline" size={64} color="#8ac041" />
        </View>

        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.otpContainer}>
          <TextInput
            style={[styles.otpInput, isExpired && styles.expiredInput]}
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#9CA3AF"
            editable={!isExpired}
          />
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.timerText, isExpired && styles.expiredText]}>
            {isExpired ? 'Code expired' : `Code expires in ${formatTime(timeLeft)}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.verifyButton,
            (loading || isExpired || otp.length !== 6) && styles.verifyButtonDisabled
          ]}
          onPress={handleVerifyOTP}
          disabled={loading || isExpired || otp.length !== 6}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify Email</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={resendLoading}
          >
            <Text style={[styles.resendLink, resendLoading && styles.resendLinkDisabled]}>
              {resendLoading ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            💡 Check your spam folder if you don't see the email
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8ac041',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginLeft: 16,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    marginTop: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: '600',
    color: '#8ac041',
  },
  otpContainer: {
    width: '100%',
    marginBottom: 16,
  },
  otpInput: {
    height: 56,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
    color: '#111827',
  },
  expiredInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  timerContainer: {
    marginBottom: 24,
  },
  timerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  expiredText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#8ac041',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendLink: {
    color: '#8ac041',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  helpContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default OTPVerificationScreen; 