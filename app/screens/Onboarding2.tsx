import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import CustomStatusBar from '../../components/CustomStatusBar';

const Onboarding2: React.FC = () => {
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;
  const isDesktop = Platform.OS === 'web' && width > 768;
  const isMobileWeb = Platform.OS === 'web' && width <= 768;
  
  // Responsive sizes
  const imageSize = Math.min(width * 0.7, 400);
  const contentMaxWidth = Math.min(width * 0.9, 500);
  const fontSize = isDesktop ? { title: 28, desc: 16 } : isMobileWeb ? { title: 24, desc: 15 } : { title: 28, desc: 16 };
  const buttonWidth = Math.min(width * 0.8, 280);

  const handleNext = () => {
    try {
      router.push('/screens/Onboarding3');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomStatusBar />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <AntDesign name="left" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
            <Image
              source={require('../../assets/images/organization-illustration.png')}
              style={[styles.logo, { width: imageSize, height: imageSize }]}
              resizeMode="contain"
            />

            <View style={styles.textContainer}>
              <Text style={[styles.welcomeText, { fontSize: fontSize.title }]}>
                Seamless Business Card Organization
              </Text>

              <Text style={[styles.description, { fontSize: fontSize.desc }]}>
                Keep all your business cards in one place and access them whenever needed.
              </Text>
            </View>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { width: buttonWidth }]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    height: 56,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 25,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  logo: {
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  welcomeText: {
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#8ac041',
  },
  nextButton: {
    backgroundColor: '#8ac041',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 30,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default Onboarding2; 