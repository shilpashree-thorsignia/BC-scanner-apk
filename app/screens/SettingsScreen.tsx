import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

interface ListItemProps {
  title: string;
  onPress: () => void;
}

interface SectionHeaderProps {
  title: string;
}

const ListItem: React.FC<ListItemProps> = ({ title, onPress }) => (
  <TouchableOpacity 
    style={styles.listItem} 
    onPress={onPress}
  >
    <Text style={styles.listItemText}>{title}</Text>
    <Ionicons name="chevron-forward-outline" size={24} color="#CCCCCC" />
  </TouchableOpacity>
);

const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function SettingsScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text style={styles.headerTitle}>Settings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <SectionHeader title="GENERAL" />
          <ListItem title="User ID" onPress={() => {}} />
          <ListItem title="Language" onPress={() => {}} />
          <ListItem title="Dark theme" onPress={() => {}} />
          <ListItem title="Fix name capitalization" onPress={() => {}} />
          <ListItem title="Prompt for card sharing" onPress={() => {}} />
          <ListItem title="Edit groups" onPress={() => {}} />
          <ListItem title="Export all cards" onPress={() => {}} />
          <ListItem title="AI Integration" onPress={() => {}} />
          <ListItem title="Configure webbook" onPress={() => {}} />

          <SectionHeader title="BUSINESS" />
          <ListItem title="Integrations" onPress={() => {}} />
          <ListItem title="Team Collaboration" onPress={() => {}} />
          <ListItem title="Scan for Business" onPress={() => {}} />

          <SectionHeader title="OTHER" />
          <ListItem title="FAQ" onPress={() => {}} />
          <ListItem title="Contact support" onPress={() => {}} />

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