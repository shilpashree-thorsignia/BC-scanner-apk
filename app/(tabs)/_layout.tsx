import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.secondaryText,
          tabBarActiveBackgroundColor: colors.background,
          tabBarInactiveBackgroundColor: colors.background
        }}
        initialRouteName="index"
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            tabBarStyle: { display: 'none' }
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            tabBarStyle: { display: 'none' }
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
