import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  Image,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getResponsiveData, scaleSize } from '../../constants/responsive';

const SignupScreen: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
  const iconSize = scaleSize(22);
  const socialButtonSize = scaleSize(40);
  const socialIconSize = scaleSize(20);
  const fontSize = isDesktop ? { title: 28, normal: 16, small: 14 } : { title: 24, normal: 16, small: 14 };

  const handleSignup = () => {
    try {
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error navigating:', error);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8ac041" translucent />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContent, { maxWidth: contentMaxWidth }]}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={[styles.headerText, { fontSize: fontSize.title }]}>
              Create Account
            </Text>
          </View>

          {/* Form Section */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formWrapper}
          >
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { height: scaleSize(50), fontSize: fontSize.normal }]}
                  placeholder="First Name"
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { height: scaleSize(50), fontSize: fontSize.normal }]}
                  placeholder="Last Name"
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { height: scaleSize(50), fontSize: fontSize.normal }]}
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
                  style={[styles.input, { height: scaleSize(50), fontSize: fontSize.normal }]}
                  placeholder="Phone no"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputContainer, styles.passwordContainer]}>
                <TextInput
                  style={[styles.input, { height: scaleSize(50), fontSize: fontSize.normal }]}
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

              {/* Sign Up Button */}
              <TouchableOpacity 
                style={[styles.signupButton, { width: buttonWidth, height: scaleSize(50) }]}
                onPress={handleSignup}
              >
                <Text style={[styles.signupButtonText, { fontSize: fontSize.normal }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>

              {/* Social Login Section */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={[styles.dividerText, { fontSize: fontSize.small }]}>
                  Or Sign Up With
                </Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.socialButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                >
                  <Image 
                    source={require('../../assets/images/apple.png')}
                    style={[styles.socialIcon, { width: socialIconSize, height: socialIconSize }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                >
                  <Image 
                    source={require('../../assets/images/google.png')}
                    style={[styles.socialIcon, { width: socialIconSize, height: socialIconSize }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.socialButton, { width: socialButtonSize, height: socialButtonSize }]}
                >
                  <Image 
                    source={require('../../assets/images/facebook.png')}
                    style={[styles.socialIcon, { width: socialIconSize, height: socialIconSize }]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { fontSize: fontSize.small }]}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/screens/LoginScreen')}>
                  <Text style={[styles.loginLink, { fontSize: fontSize.small }]}>
                    Log in
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
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  headerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formWrapper: {
    width: '100%',
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
  },
  passwordContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  input: {
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
  signupButton: {
    backgroundColor: '#8ac041',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  signupButtonText: {
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
    marginBottom: 24,
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
  socialIcon: {
    resizeMode: 'contain',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
  },
  loginLink: {
    color: '#8ac041',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignupScreen; 