import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  Dimensions, 
  ScrollView, 
  KeyboardAvoidingView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getResponsiveData, scaleSize } from '../../constants/responsive';
import { API_BASE_URL } from '../config';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [loading, setLoading] = useState(false);

  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;
  const { isDesktop, isMobileWeb } = getResponsiveData();
  
  // Responsive sizing
  const contentMaxWidth = Math.min(width * 0.9, 500);
  const iconSize = scaleSize(22);
  const logoSize = scaleSize(60);
  const socialButtonSize = scaleSize(40);
  const socialIconSize = scaleSize(20);
  const buttonWidth = isDesktop ? '90%' : '100%';
  const fontSize = isDesktop ? { title: 28, normal: 16, small: 14 } : { title: 24, normal: 16, small: 14 };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Login successful, navigate to home
      router.replace('/screens/NavbarScreen');
      
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        error.message || 'There was an error logging in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    try {
      router.push('/screens/ForgotPasswordScreen');
    } catch (error) {
      console.error('Error navigating to ForgotPassword:', error);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8ac041" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContent, { maxWidth: contentMaxWidth }]}>
          {/* Top Section with Icon */}
          <View style={[styles.topSection, { height: height * 0.25 }]}>
            <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
              <Ionicons 
                name="chatbubble-outline" 
                size={iconSize} 
                color="#8ac041" 
              />
            </View>
          </View>

          {/* Content Section */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex1}
          >
            <View style={styles.contentSection}>
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { fontSize: fontSize.normal }]}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, { fontSize: fontSize.normal }]}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={[styles.eyeIcon, { top: scaleSize(13) }]}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={iconSize} 
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity 
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={[styles.forgotPasswordText, { fontSize: fontSize.small }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity 
                  style={[styles.loginButton, { 
                    width: buttonWidth, 
                    height: scaleSize(50),
                    opacity: loading ? 0.7 : 1
                  }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={[styles.loginButtonText, { fontSize: fontSize.normal }]}>
                      Log in
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Social Login Section */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={[styles.dividerText, { fontSize: fontSize.small }]}>
                    Or Log In With
                  </Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                  >
                    <Ionicons name="logo-apple" size={socialIconSize} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                  >
                    <Ionicons name="logo-google" size={socialIconSize} color="#DB4437" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                  >
                    <Ionicons name="logo-facebook" size={socialIconSize} color="#4267B2" />
                  </TouchableOpacity>
                </View>

                {/* Sign Up Section */}
                <View style={styles.signupContainer}>
                  <Text style={[styles.signupText, { fontSize: fontSize.small }]}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/screens/SignupScreen')}>
                    <Text style={[styles.signupLink, { fontSize: fontSize.small }]}>
                      Sign up
                    </Text>
                  </TouchableOpacity>
                </View>
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
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  topSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#8ac041',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#8ac041',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    alignSelf: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  signupText: {
    color: '#666',
  },
  signupLink: {
    color: '#8ac041',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen; 