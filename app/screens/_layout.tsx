import React from 'react';
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ScreenLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <>
      <View 
        style={{ 
          backgroundColor: 'black', 
          height: Platform.OS === 'ios' ? insets.top : 25,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100
        }} 
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            backgroundColor: 'white',
            paddingTop: Platform.OS === 'ios' ? insets.top : 25,
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen 
          name="Onboarding1" 
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
              paddingTop: 0,
            }
          }}
        />
        <Stack.Screen 
          name="Onboarding2" 
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
              paddingTop: 0,
            }
          }}
        />
        <Stack.Screen 
          name="Onboarding3" 
          options={{
            headerShown: false,
            contentStyle: {
              backgroundColor: 'transparent',
              paddingTop: 0,
            }
          }}
        />
        <Stack.Screen 
          name="LoginScreen" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ScannerScreen" 
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="EditProfileScreen" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="AddManually" 
          options={{ 
            headerShown: false,
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="NavbarScreen" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="HamburgerScreen" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </>
  );
} 