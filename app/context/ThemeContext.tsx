import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme types
export type ThemeType = 'light' | 'dark';

// Define colors for each theme
export const themes = {
  light: {
    background: 'white',
    text: '#1F2937',
    secondaryText: '#9CA3AF',
    listItemBackground: '#F9F9F9',
    headerBackground: 'white',
    divider: '#E5E7EB',
    accent: '#4CAF50',
    cardBorder: '#3B82F6',
    icon: '#000000',
    chevron: '#CCCCCC',
    cardBackground: 'white',
    qrBackground: 'white',
    filterBackground: '#f3f4f6',
    buttonText: 'white',
  },
  dark: {
    background: '#121212',
    text: '#E5E7EB',
    secondaryText: '#9CA3AF',
    listItemBackground: '#1F2937',
    headerBackground: '#121212',
    divider: '#374151',
    accent: '#4CAF50',
    cardBorder: '#3B82F6',
    icon: '#FFFFFF',
    chevron: '#6B7280',
    cardBackground: '#1F2937',
    qrBackground: '#2D3748',
    filterBackground: '#374151',
    buttonText: 'white',
  },
};

// Define the context type
interface ThemeContextType {
  theme: ThemeType;
  colors: typeof themes.light | typeof themes.dark;
  toggleTheme: () => void;
  isDark: boolean;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  
  // Load saved theme preference on component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadTheme();
  }, []);
  
  // Toggle between light and dark themes
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Save theme preference
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };
  
  // Get current theme colors
  const colors = themes[theme];
  const isDark = theme === 'dark';
  
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
