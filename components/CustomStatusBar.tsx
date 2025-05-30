import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import Constants from 'expo-constants';

interface CustomStatusBarProps {
  backgroundColor?: string;
}

const CustomStatusBar: React.FC<CustomStatusBarProps> = ({ backgroundColor = 'black' }) => {
  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={backgroundColor}
        translucent 
      />
      <View style={[styles.statusBar, { backgroundColor }]} />
    </>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    height: Constants.statusBarHeight,
  },
});

export default CustomStatusBar; 