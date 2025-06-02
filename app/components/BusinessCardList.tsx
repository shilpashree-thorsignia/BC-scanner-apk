import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Share,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BusinessCard as BusinessCardType } from '../lib/api';
import QRCode from 'react-native-qrcode-svg';

interface BusinessCardProps {
  item: BusinessCardType;
}

const BusinessCardComponent: React.FC<BusinessCardProps> = ({ item }) => {
  const handleWhatsApp = () => {
    if (item.mobile) {
      Linking.openURL(`https://wa.me/${item.mobile}`);
    }
  };

  const handleCall = () => {
    if (item.mobile) {
      Linking.openURL(`tel:${item.mobile}`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.name} - ${item.job_title}\n${item.email}\n${item.mobile}`,
        title: `Contact details for ${item.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Top Section - Name and Title */}
          <View style={styles.topSection}>
            <View style={styles.nameAndTitleSection}>
              <Text style={styles.name}>Kiran Kumar</Text>
              <Text style={styles.surname}>Sundarshan</Text>
              <Text style={styles.jobTitle}>Director</Text>
            </View>
          </View>

          {/* Middle Section - Contact, Quote and QR */}
          <View style={styles.middleSection}>
            {/* Left side - Contact and Quote */}
            <View style={styles.leftSection}>
              <View style={styles.contactSection}>
                <Text style={styles.email}>kirankumar@thorsignia.online</Text>
                <Text style={styles.phone}>+91 7587 196 571</Text>
              </View>
              <View style={styles.quoteSection}>
                <Text style={styles.quoteText}>
                  "I help businesses like <Text style={styles.highlightGreen}>yours</Text> scale and <Text style={styles.highlightTeal}>succeed</Text>{"\nwith GTM strategy, innovative development, and\nAI-driven automation."}
                </Text>
              </View>
            </View>
            
            {/* Vertical dotted line */}
            <View style={styles.verticalDottedLine} />

            {/* Right side - QR Code */}
            <View style={styles.qrSection}>
              <View style={styles.qrHeader}>
                <Text style={styles.qrHeaderText}>Connect</Text>
                <MaterialIcons name="keyboard-arrow-down" size={12} color="#4B5563" />
              </View>
              <Text style={styles.qrSubText}>Access to tools & resources</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={`MECARD:N:Kiran Kumar Sundarshan;TEL:+91 7587 196 571;EMAIL:kirankumar@thorsignia.online;`}
                  size={64}
                  color="black"
                  backgroundColor="white"
                />
              </View>
            </View>
          </View>

          {/* Horizontal green line */}
          <View style={styles.horizontalGreenLine} />

          {/* Bottom Section - Logos and WhatsApp */}
          <View style={styles.bottomSection}>
            <View style={styles.bottomLeftSection}>
              {/* Thor Signia Logo with tagline */}
              <View style={styles.thorContainer}>
                <View style={styles.thorTitleContainer}>
                  <Text style={styles.thorPrefix}>Thor</Text>
                  <Text style={styles.thorSuffix}>Signia</Text>
                </View>
                <Text style={styles.thorTagline}>Committed Towards Progress</Text>
              </View>
              
              {/* ATSAIC text */}
              <Text style={styles.atsaicText}>ATSAIC</Text>
            </View>
            <Text style={styles.connectWhatsApp}>Connect on WhatsApp</Text>
          </View>
        </View>
      </View>
      
      {/* Action buttons below the card */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          onPress={handleWhatsApp}
          style={styles.actionButton}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleCall}
          style={styles.actionButton}
        >
          <Ionicons name="call-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={handleShare}
          style={styles.actionButton}
        >
          <Ionicons name="share-social-outline" size={24} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface BusinessCardListProps {
  cards: BusinessCardType[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

const BusinessCardList: React.FC<BusinessCardListProps> = ({
  cards,
  onRefresh,
  refreshing = false,
}) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={cards}
        renderItem={({ item }) => <BusinessCardComponent item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    padding: 10,
  },
  topSection: {
    marginBottom: 8,
  },
  nameAndTitleSection: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 18,
  },
  surname: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    lineHeight: 18,
  },
  jobTitle: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leftSection: {
    flex: 1,
    paddingRight: 10,
  },
  contactSection: {
    marginBottom: 6,
  },
  email: {
    fontSize: 10,
    color: '#4B5563',
    marginBottom: 2,
  },
  phone: {
    fontSize: 10,
    color: '#4B5563',
  },
  quoteSection: {
  },
  quoteText: {
    fontSize: 9,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 11,
  },
  highlightGreen: {
    color: '#22C55E',
    fontWeight: '600',
  },
  highlightTeal: {
    color: '#14B8A6',
    fontWeight: '600',
  },
  verticalDottedLine: {
    width: 1,
    backgroundColor: '#14B8A6',
    height: 36,
    marginHorizontal: 10,
    opacity: 0.8,
  },
  qrSection: {
    width: 88,
    alignItems: 'center',
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 1,
  },
  qrHeaderText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 2,
  },
  qrSubText: {
    fontSize: 7,
    color: '#4B5563',
    textAlign: 'right',
    marginBottom: 3,
    width: '100%',
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  horizontalGreenLine: {
    height: 1,
    backgroundColor: '#22C55E',
    marginBottom: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  thorContainer: {
    alignItems: 'flex-start',
  },
  thorTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thorPrefix: {
    fontSize: 11,
    fontWeight: '400',
    color: '#22C55E',
    lineHeight: 13,
  },
  thorSuffix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14B8A6',
    lineHeight: 13,
  },
  thorTagline: {
    fontSize: 7,
    color: '#666',
    marginTop: 1,
  },
  atsaicText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 1.1,
  },
  connectWhatsApp: {
    fontSize: 7,
    color: '#4B5563',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default BusinessCardList;