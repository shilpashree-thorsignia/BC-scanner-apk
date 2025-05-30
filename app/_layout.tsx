import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

export default function RootLayout() {
  // Store dimensions in state to force re-render on resize
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const { width } = dimensions;
  const isDesktop = Platform.OS === 'web' && width > 768;
  const isWeb = Platform.OS === 'web';

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
      
      // Set proper viewport settings for mobile responsiveness
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
    <SafeAreaProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'white',
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
