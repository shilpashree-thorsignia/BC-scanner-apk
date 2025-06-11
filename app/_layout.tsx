import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { View, StyleSheet, Platform, Dimensions, StatusBar, Text } from 'react-native';
import ThemeProvider, { useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// This component will use the theme and handle authentication
function AppLayout() {
  // Store dimensions in state to force re-render on resize
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const { width } = dimensions;
  const isDesktop = Platform.OS === 'web' && width > 768;
  const isWeb = Platform.OS === 'web';
  const { colors, isDark } = useTheme();
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const inAuthScreens = segments[0] === 'screens' && (
      segments[1] === 'Onboarding1' || 
      segments[1] === 'Onboarding2' || 
      segments[1] === 'Onboarding3' ||
      segments[1] === 'WelcomeScreen' ||
      segments[1] === 'LoginScreen' ||
      segments[1] === 'SignupScreen' ||
      segments[1] === 'ForgotPasswordScreen' ||
      segments[1] === 'ForgotPasswordOTPScreen' ||
      segments[1] === 'OTPVerificationScreen'
    );

    const inMainApp = segments[0] === 'screens' && (
      segments[1] === 'NavbarScreen' ||
      segments[1] === 'ScannerScreen' ||
      segments[1] === 'AddManually' ||
      segments[1] === 'ProfileScreen' ||
      segments[1] === 'EditBusinessCard' ||
      segments[1] === 'TrashScreen'
    );

    // If user is not authenticated and not in auth screens, redirect to welcome
    if (!user && !inAuthScreens) {
      console.log('User not authenticated, redirecting to welcome screen');
      router.replace('/screens/WelcomeScreen');
      return;
    }

    // If user is authenticated but in auth screens, redirect to main app
    if (user && inAuthScreens) {
      console.log('User authenticated, redirecting to main app');
      router.replace('/screens/NavbarScreen');
      return;
    }
  }, [user, segments, loading, router]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await Camera.requestCameraPermissionsAsync();
      }
    })();
  }, []);

  // Add proper viewport meta tag for mobile web responsiveness
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Find existing viewport meta tag or create a new one
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta') as HTMLMetaElement;
        viewportMeta.setAttribute('name', 'viewport');
        document.head.appendChild(viewportMeta);
      }
      
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  // Add listener for orientation/dimension changes on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Create a resize handler that updates dimensions state
      const handleResize = () => {
        setDimensions(Dimensions.get('window'));
      };

      window.addEventListener('resize', handleResize);
      
      // Trigger once on mount to ensure correct initial layout
      handleResize();
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Show loading screen while determining authentication state
  if (loading) {
    return (
      <>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <SafeAreaProvider>
          <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.loadingText, { color: colors.text || '#000' }]}>Loading...</Text>
          </View>
        </SafeAreaProvider>
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <SafeAreaProvider>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
              },
              animation: isWeb ? 'none' : 'default',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="screens" options={{ headerShown: false }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </>
  );
}

// Root layout that provides the theme and auth context
export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
