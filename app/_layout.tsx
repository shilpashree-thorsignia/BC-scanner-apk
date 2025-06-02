import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { View, StyleSheet, Platform, Dimensions, StatusBar } from 'react-native';
import ThemeProvider, { useTheme } from './context/ThemeContext';

// This component will use the theme
function AppLayout() {
  // Store dimensions in state to force re-render on resize
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const { width } = dimensions;
  const isDesktop = Platform.OS === 'web' && width > 768;
  const isWeb = Platform.OS === 'web';
  const { colors, isDark } = useTheme();

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
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="screens" options={{ headerShown: false }} />
          </Stack>
        </View>
      </SafeAreaProvider>
    </>
  );
}

// Root layout that provides the theme
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
