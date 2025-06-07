import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { getAllBusinessCards } from '../lib/api';
import { exportBusinessCards } from '../utils/exportCards';
import { useTheme } from '../context/ThemeContext';

interface ListItemProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  rightElement?: React.ReactNode;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
}

interface SectionHeaderProps {
  title: string;
}

const ListItem: React.FC<ListItemProps> = ({ 
  title, 
  onPress, 
  disabled, 
  rightElement, 
  showToggle, 
  toggleValue, 
  onToggleChange 
}) => {
  const { colors } = useTheme();
  
  return (
    <TouchableOpacity 
      style={[styles.listItem, { backgroundColor: colors.listItemBackground }]} 
      onPress={onPress}
      disabled={disabled || showToggle}
    >
      <Text style={[styles.listItemText, { color: colors.text }]}>{title}</Text>
      {rightElement}
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={toggleValue ? colors.accent : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward-outline" size={24} color={colors.chevron} />
      )}
    </TouchableOpacity>
  );
};

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionHeader, { color: colors.secondaryText }]}>{title}</Text>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const { colors, toggleTheme, isDark } = useTheme();

  const handleBack = () => {
    router.back();
  };

  const handleExportAllCards = async () => {
    try {
      setIsExporting(true);
      console.log('Starting export process...');
      
      // Fetch all business cards
      console.log('Fetching business cards...');
      const cards = await getAllBusinessCards();
      console.log(`Retrieved ${cards.length} business cards`);
      
      if (cards.length === 0) {
        Alert.alert('No Cards', 'There are no business cards to export.');
        return;
      }
      
      // Export the business cards
      console.log('Generating PDF and sharing...');
      await exportBusinessCards(cards);
      console.log('Export completed successfully');
      
    } catch (error) {
      // Log detailed error information
      console.error('Error exporting cards:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show user-friendly error message
      Alert.alert(
        'Export Failed',
        'There was an error exporting your business cards. Please check the console for details.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.icon} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="GENERAL" />
          {/* <ListItem title="User ID" onPress={() => {}} />
          <ListItem title="Language" onPress={() => {}} /> */}
          <ListItem 
            title="Dark theme" 
            onPress={() => {}}
            showToggle={true}
            toggleValue={isDark}
            onToggleChange={toggleTheme}
          />
          {/* <ListItem title="Fix name capitalization" onPress={() => {}} /> */}
          {/* <ListItem title="Prompt for card sharing" onPress={() => {}} /> */}
          <ListItem title="Edit groups" onPress={() => {}} />
          <ListItem 
            title="Configure automated mails" 
            onPress={() => router.push('/screens/autoMailConfig')}
          />
          <ListItem 
            title={isExporting ? "Exporting..." : "Export all cards"} 
            onPress={handleExportAllCards}
            disabled={isExporting}
            rightElement={isExporting ? <ActivityIndicator size="small" color={colors.accent} /> : undefined}
          />
          {/* <ListItem title="AI Integration" onPress={() => {}} /> */}
          {/* <ListItem title="Configure webbook" onPress={() => {}} /> */}

          {/* <SectionHeader title="BUSINESS" />
          <ListItem title="Integrations" onPress={() => {}} />
          <ListItem title="Team Collaboration" onPress={() => {}} />
          <ListItem title="Scan for Business" onPress={() => {}} />

          <SectionHeader title="OTHER" />
          <ListItem title="FAQ" onPress={() => {}} />
          <ListItem title="Contact support" onPress={() => {}} /> */}

          {/* Bottom padding to ensure last items are visible */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: 'black',
    fontWeight: '500',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    height: 56,
  },
  listItemText: {
    fontSize: 17,
    color: '#1F2937',
  },
  sectionHeader: {
    fontSize: 16,
    color: '#9CA3AF',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  bottomPadding: {
    height: 24,
  },
}); 