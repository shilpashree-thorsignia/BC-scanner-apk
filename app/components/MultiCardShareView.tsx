import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BusinessCard as BusinessCardType } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { captureRef } from 'react-native-view-shot';

interface MultiCardShareViewProps {
  cards: BusinessCardType[];
  onCapture?: (uri: string) => void;
}

const MultiCardShareView = React.forwardRef<View, MultiCardShareViewProps>(({ cards, onCapture }, ref) => {
  const { colors, isDark } = useTheme();
  const viewRef = useRef<View>(null);
  const screenWidth = Dimensions.get('window').width;
  
  // Calculate grid layout
  const cardsPerRow = cards.length === 1 ? 1 : cards.length === 2 ? 2 : 2;
  const cardWidth = (screenWidth - 60) / cardsPerRow; // 60 for padding and margins
  const cardHeight = cardWidth * 0.6; // Maintain aspect ratio

  const captureView = async () => {
    if (!viewRef.current) {
      throw new Error('View ref not available');
    }
    return await captureRef(viewRef.current, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });
  };

  React.useImperativeHandle(ref, () => viewRef.current!, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  const renderCard = (card: BusinessCardType, index: number) => (
    <View key={card.id} style={[styles.card, { 
      backgroundColor: colors.cardBackground, 
      borderColor: colors.accent,
      width: cardWidth,
      height: cardHeight,
      marginBottom: 16,
      marginRight: index % cardsPerRow === cardsPerRow - 1 ? 0 : 16
    }]}>
      <View style={styles.cardContent}>
        <View style={styles.topSection}>
          <View style={styles.nameAndTitleSection}>
            <Text style={[styles.name, { color: isDark ? '#fff' : colors.text }]} numberOfLines={1}>
              {card.name || 'Not Provided'}
            </Text>
            <Text style={[styles.jobTitle, { color: isDark ? '#fff' : colors.secondaryText }]}>
              {card.job_title || 'Not provided'}
            </Text>
          </View>
          <Text style={[styles.date, { color: isDark ? '#fff' : colors.secondaryText }]}>
            {formatDate(card.created_at)}
          </Text>
        </View>

        <View style={styles.middleSection}>
          <View style={styles.leftSection}>
            <Text style={[styles.label, { color: isDark ? '#fff' : colors.secondaryText }]}>Email:</Text>
            <Text style={[styles.value, { color: isDark ? '#fff' : colors.secondaryText }]} numberOfLines={1}>
              {card.email || 'Not provided'}
            </Text>
            <Text style={[styles.label, { color: isDark ? '#fff' : colors.secondaryText }]}>Phone:</Text>
            <Text style={[styles.value, { color: isDark ? '#fff' : colors.secondaryText }]}>
              {card.mobile || 'Not provided'}
            </Text>
          </View>
          <View style={styles.rightSection}>
            <Text style={[styles.label, { color: isDark ? '#fff' : colors.secondaryText }]}>Company:</Text>
            <Text style={[styles.value, { color: isDark ? '#fff' : colors.secondaryText }]} numberOfLines={1}>
              {card.company || 'Not provided'}
            </Text>
            <Text style={[styles.label, { color: isDark ? '#fff' : colors.secondaryText }]}>Website:</Text>
            <Text style={[styles.value, { color: '#2563EB' }]} numberOfLines={1}>
              {card.website || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View ref={viewRef} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: isDark ? '#fff' : colors.text }]}>
          Business Cards ({cards.length})
        </Text>
      </View>
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => renderCard(card, index))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    padding: 8,
    flex: 1,
  },
  topSection: {
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameAndTitleSection: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    lineHeight: 18,
  },
  jobTitle: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  date: {
    fontSize: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  middleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  leftSection: {
    flex: 1,
    paddingRight: 4,
  },
  rightSection: {
    flex: 1,
    paddingLeft: 4,
  },
  label: {
    fontSize: 7,
    color: '#666',
    fontWeight: '600',
    marginTop: 2,
  },
  value: {
    fontSize: 8,
    color: '#4B5563',
    marginBottom: 2,
  },
});

export default MultiCardShareView; 