import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar, Image, Platform, PixelRatio } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const WelcomeScreen: React.FC = () => {
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
  const pixelRatio = PixelRatio.get();
  
  // Calculate responsive dimensions
  const isDesktop = Platform.OS === 'web' && width > 768;
  const isMobileWeb = Platform.OS === 'web' && width <= 768;
  
  // Scale factors for different device types
  const scaleFactor = isDesktop ? 0.4 : (isMobileWeb ? 0.6 : 1);
  
  // Adjust logo size based on device type and screen size
  const logoSize = Math.min(
    width * 0.4 * scaleFactor, 
    height * 0.3 * scaleFactor,
    300
  );
  
  // Container dimensions
  const containerWidth = isDesktop ? Math.min(width * 0.8, 800) : width;
  const containerHeight = height;
  
  // Calculate the exact center of the screen
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  const circle1Radius = useRef(new Animated.Value(0)).current;
  const circle1Opacity = useRef(new Animated.Value(1)).current;
  
  const circle2Radius = useRef(new Animated.Value(0)).current;
  const circle2Opacity = useRef(new Animated.Value(1)).current;
  
  const circle3Radius = useRef(new Animated.Value(0)).current;
  const circle3Opacity = useRef(new Animated.Value(1)).current;
  
  const circle4Radius = useRef(new Animated.Value(0)).current;
  const circle4Opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Add navigation timeout
    const navigationTimer = setTimeout(() => {
      router.push('/screens/Onboarding1');
    }, 5000);

    const startAnimations = () => {
      const maxRadius = Math.max(containerWidth, containerHeight);

      const createCircleAnimation = (radius: Animated.Value, opacity: Animated.Value) => {
        return Animated.loop(
          Animated.parallel([
            Animated.timing(radius, {
              toValue: maxRadius,
              duration: 15000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 15000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const totalDelay = 6000;
      const delayBetweenCircles = totalDelay / 3;

      const animations = [
        createCircleAnimation(circle1Radius, circle1Opacity),
        createCircleAnimation(circle2Radius, circle2Opacity),
        createCircleAnimation(circle3Radius, circle3Opacity),
        createCircleAnimation(circle4Radius, circle4Opacity),
      ];

      animations[0].start();
      setTimeout(() => animations[1].start(), delayBetweenCircles);
      setTimeout(() => animations[2].start(), delayBetweenCircles * 2);
      setTimeout(() => animations[3].start(), delayBetweenCircles * 3);

      return () => animations.forEach(anim => anim.stop());
    };

    const cleanup = startAnimations();

    return () => {
      cleanup();
      clearTimeout(navigationTimer);
    };
  }, [containerWidth, containerHeight, router]);

  // Create circle props that handle the collapsable attribute correctly
  const circleProps = Platform.select({
    web: {
      collapsable: 'false',
    },
    default: {
      collapsable: false,
    },
  });

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container, { width: containerWidth, height: containerHeight }]}>
        <StatusBar translucent backgroundColor="transparent" />
        
        <Svg style={StyleSheet.absoluteFill} width={containerWidth} height={containerHeight}>
          <Defs>
            <LinearGradient id="backgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#8ac041" />
              <Stop offset="100%" stopColor="#1fa189" />
            </LinearGradient>
          </Defs>

          <Rect width="100%" height="100%" fill="url(#backgroundGradient)" />

          <AnimatedCircle
            {...circleProps}
            cx={centerX}
            cy={centerY}
            r={circle1Radius}
            fill="rgba(255, 255, 255, 0.15)"
            opacity={circle1Opacity}
          />
          <AnimatedCircle
            {...circleProps}
            cx={centerX}
            cy={centerY}
            r={circle2Radius}
            fill="rgba(255, 255, 255, 0.15)"
            opacity={circle2Opacity}
          />
          <AnimatedCircle
            {...circleProps}
            cx={centerX}
            cy={centerY}
            r={circle3Radius}
            fill="rgba(255, 255, 255, 0.15)"
            opacity={circle3Opacity}
          />
          <AnimatedCircle
            {...circleProps}
            cx={centerX}
            cy={centerY}
            r={circle4Radius}
            fill="rgba(255, 255, 255, 0.15)"
            opacity={circle4Opacity}
          />
        </Svg>

        <View style={[styles.logoContainer, { width: containerWidth, height: containerHeight }]}>
          <View style={[styles.logoWrapper, { width: logoSize, height: logoSize, borderRadius: logoSize / 2, borderWidth: 2, borderColor: 'transparent', backgroundColor: 'transparent' }]} >
            <Image
              source={require('../../assets/images/Logo2.png')}
              style={{ 
                width: logoSize * 1.6, 
                height: logoSize * 1.6,
                borderWidth: 0,
                borderColor: 'transparent',
                backgroundColor: 'transparent'
              }}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#1fa189',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      maxHeight: '100%',
    } : {}),
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});

export default WelcomeScreen; 