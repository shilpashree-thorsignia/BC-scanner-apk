import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BusinessCard as BusinessCardType } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { captureRef } from 'react-native-view-shot';

interface MultiCardShareViewProps {
  cards: BusinessCardType[];
  onCapture?: (uri: string) => void;
  onReady?: () => void;
  onLayout?: () => void;
}

const MultiCardShareView = React.forwardRef<View, MultiCardShareViewProps>(({ cards, onCapture, onReady, onLayout }, ref) => {
  const { colors, isDark } = useTheme();
  const viewRef = useRef<View>(null);
  
  console.log('🎨 MultiCardShareView rendering with', cards?.length || 0, 'cards:', cards?.map(c => ({ id: c.id, name: c.name })) || []);
  
  // Fixed dimensions for consistent capture
  const containerWidth = 800;
  const cardsPerRow = cards.length === 1 ? 1 : 2;
  const cardWidth = (containerWidth - 80) / cardsPerRow; // 80 for padding and margins
  const cardHeight = cardWidth * 0.6; // Maintain aspect ratio
  
  console.log('📐 MultiCardShareView dimensions:', { containerWidth, cardsPerRow, cardWidth, cardHeight });

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
  
  // Notify parent when component is ready
  React.useEffect(() => {
    if (cards && cards.length > 0 && onReady) {
      const timer = setTimeout(() => {
        onReady();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cards, onReady]);

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

  const renderCard = (card: BusinessCardType, index: number) => {
    console.log(`🃏 Rendering card ${index + 1}:`, { id: card.id, name: card.name });
    return (
      <View key={card.id} style={[styles.card, { 
        backgroundColor: '#ffffff', 
        borderColor: '#3B82F6',
        width: cardWidth,
        height: cardHeight,
        marginBottom: 16,
        marginRight: index % cardsPerRow === cardsPerRow - 1 ? 0 : 16
      }]}>
        <View style={styles.cardContent}>
        {/* Business Card Header */}
        <View style={styles.businessCardHeader}>
          <View style={styles.nameSection}>
            <Text style={[styles.businessCardName, { color: '#1F2937' }]} numberOfLines={1} ellipsizeMode="tail">
              {card.name || 'Not Provided'}
            </Text>
            <Text style={[styles.businessCardTitle, { color: '#6B7280' }]} numberOfLines={1} ellipsizeMode="tail">
              {card.job_title || 'Position not specified'}
            </Text>
            <Text style={[styles.businessCardCompany, { color: '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
              {card.company || 'Company not specified'}
            </Text>
          </View>
          <View style={styles.dateSection}>
            <Text style={[styles.dateText, { color: '#9CA3AF' }]}>
              {formatDate(card.created_at)}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactGrid}>
            <View style={styles.contactItem}>
              <Text style={[styles.contactText, { color: '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
                📧 {card.email || 'Email not provided'}
              </Text>
            </View>
            
            <View style={styles.contactItem}>
              <Text style={[styles.contactText, { color: '#374151' }]} numberOfLines={1} ellipsizeMode="tail">
                📞 {card.mobile || 'Phone not provided'}
              </Text>
            </View>
            
            {card.website && (
              <View style={styles.contactItem}>
                <Text style={[styles.contactText, styles.websiteLink, { color: '#2563EB' }]} numberOfLines={1} ellipsizeMode="tail">
                  🌐 {card.website}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
  };

  if (!cards || cards.length === 0) {
    console.log('❌ MultiCardShareView: No cards to render');
    return (
      <View ref={viewRef} style={[styles.container, { 
        backgroundColor: colors.background,
        width: containerWidth,
        height: 200
      }]}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: isDark ? '#fff' : colors.text }]}>
            No Cards Selected
          </Text>
        </View>
      </View>
    );
  }

  const containerHeight = Math.ceil(cards.length / cardsPerRow) * (cardHeight + 40) + 100;
  console.log('📏 Final container dimensions:', { width: containerWidth, height: containerHeight });

  return (
    <View 
      ref={viewRef} 
      style={[styles.container, { 
        backgroundColor: '#ffffff',
        width: containerWidth,
        height: containerHeight,
        minHeight: containerHeight
      }]}
      onLayout={onLayout}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, { color: '#1f2937' }]}>
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
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'nowrap',
  },
  label: {
    fontSize: 7,
    color: '#666',
    fontWeight: '600',
    minWidth: 35,
    flexShrink: 0,
  },
  value: {
    fontSize: 8,
    color: '#4B5563',
    flex: 1,
    flexShrink: 1,
  },
  // Business Card Styles
  businessCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  nameSection: {
    flex: 1,
    paddingRight: 6,
  },
  businessCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 1,
    lineHeight: 13,
  },
  businessCardTitle: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 0.5,
    fontWeight: '500',
  },
  businessCardCompany: {
    fontSize: 8,
    color: '#374151',
    fontWeight: '600',
  },
  dateSection: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 7,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  contactSection: {
    marginBottom: 6,
  },
  contactGrid: {
    gap: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  contactText: {
    fontSize: 8,
    color: '#374151',
    flex: 1,
  },
  websiteLink: {
    textDecorationLine: 'underline',
  },
});

export default MultiCardShareView; 