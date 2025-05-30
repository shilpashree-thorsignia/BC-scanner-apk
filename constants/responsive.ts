import { Dimensions, Platform, PixelRatio, ScaledSize } from 'react-native';

interface ResponsiveData {
  windowWidth: number;
  windowHeight: number;
  screenWidth: number;
  screenHeight: number;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileWeb: boolean;
  isWeb: boolean;
  scale: number;
  fontScale: number;
  pixelRatio: number;
}

/**
 * Get responsive data based on current device dimensions
 */
export function getResponsiveData(): ResponsiveData {
  const window = Dimensions.get('window');
  const screen = Dimensions.get('screen');
  
  const windowWidth = window.width;
  const windowHeight = window.height;
  const screenWidth = screen.width;
  const screenHeight = screen.height;
  
  const isWeb = Platform.OS === 'web';
  
  // Better detection for mobile Chrome emulation mode
  let isDesktop = isWeb && windowWidth > 768;
  let isMobileWeb = isWeb && windowWidth <= 768;
  
  // Check for Chrome's mobile emulation mode
  if (isWeb && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /mobile|android|iphone|ipad|ipod/.test(userAgent);
    
    // If user agent contains mobile keywords or window width is narrow, treat as mobile web
    if (isMobileDevice || windowWidth < 480 || (window.height > window.width && window.width < 500)) {
      isMobileWeb = true;
      isDesktop = false;
    }
  }
  
  // Detect device type based on screen size
  const isSmallDevice = windowWidth < 375;
  const isMediumDevice = windowWidth >= 375 && windowWidth < 768;
  const isLargeDevice = windowWidth >= 768;
  
  // Tablet detection based on ratio and size
  const aspectRatio = windowHeight / windowWidth;
  const isTablet = aspectRatio <= 1.6 && windowWidth >= 600;
  
  // Get various scaling factors
  const scale = windowWidth / 375; // Based on iPhone 8 as baseline
  const fontScale = PixelRatio.getFontScale();
  const pixelRatio = PixelRatio.get();
  
  return {
    windowWidth,
    windowHeight,
    screenWidth,
    screenHeight,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isDesktop,
    isMobileWeb,
    isWeb,
    scale,
    fontScale,
    pixelRatio
  };
}

/**
 * Scale a size based on device width
 */
export function scaleSize(size: number): number {
  const { scale, isDesktop, isMobileWeb, windowWidth } = getResponsiveData();
  
  // Adjust scaling for mobile web views
  let scaleFactor = scale;
  
  // In Chrome mobile emulation, we need different scaling behavior
  if (isMobileWeb && Platform.OS === 'web') {
    // Calculate based on current width compared to iPhone 8 (375pt)
    scaleFactor = windowWidth / 375;
    
    // Limit the scaling to prevent UI elements from getting too large
    if (scaleFactor > 1.3) scaleFactor = 1.3;
  }
  
  const newSize = size * scaleFactor;
  
  // Keep sizes in a reasonable range
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(newSize);
}

/**
 * Scale a font size based on device width and font scale
 */
export function scaleFontSize(size: number): number {
  const { scale, fontScale, isDesktop, isMobileWeb, windowWidth } = getResponsiveData();
  
  // Desktop web needs smaller fonts
  const deviceAdjustment = isDesktop ? 0.7 : 1;
  
  // Adjust for Chrome mobile emulation
  let mobileWebAdjustment = 1;
  if (isMobileWeb && Platform.OS === 'web') {
    // Smaller adjustment for mobile web to prevent fonts from getting too large
    mobileWebAdjustment = windowWidth < 400 ? 0.85 : 0.9;
  }
  
  // Scale based on device width and system font settings
  const newSize = size * scale * deviceAdjustment * mobileWebAdjustment;
  
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(newSize);
}

/**
 * Set responsive vertical margin/padding amounts
 */
export function verticalScale(size: number): number {
  const { windowHeight, isWeb, isMobileWeb } = getResponsiveData();
  const standardScreenHeight = 812; // iPhone X/11/12 height
  
  // Adjust for Chrome mobile emulation
  let scaleFactor = windowHeight / standardScreenHeight;
  if (isWeb && isMobileWeb) {
    // Limit scaling for better consistency in mobile web view
    scaleFactor = Math.min(scaleFactor, 1.2);
  }
  
  return Math.round(scaleFactor * size);
}

/**
 * Set responsive horizontal margin/padding amounts
 */
export function horizontalScale(size: number): number {
  const { windowWidth, isWeb, isMobileWeb } = getResponsiveData();
  const standardScreenWidth = 375; // iPhone X/11/12 width
  
  // Adjust for Chrome mobile emulation
  let scaleFactor = windowWidth / standardScreenWidth;
  if (isWeb && isMobileWeb) {
    // Limit scaling for better consistency in mobile web view
    scaleFactor = Math.min(scaleFactor, 1.2);
  }
  
  return Math.round(scaleFactor * size);
}

// Interface for responsive styles
interface ResponsiveStylesOptions {
  maxWidth?: number | string;
  maxHeight?: number | string;
  width?: number | string;
  height?: number | string;
  padding?: number;
  margin?: number;
}

interface ResponsiveStyles {
  maxWidth?: number | string;
  maxHeight?: number | string;
  width?: number | string;
  height?: number | string;
  padding?: number;
  margin?: number;
}

// Helper function to handle responsive design in different environments
export function getResponsiveStyles(options: ResponsiveStylesOptions): ResponsiveStyles {
  const { windowWidth, windowHeight, isWeb, isDesktop, isMobileWeb } = getResponsiveData();
  const styles: ResponsiveStyles = {};
  
  // Handle max width
  if (options.maxWidth) {
    if (typeof options.maxWidth === 'number') {
      // For mobile web, we may want to scale differently
      if (isWeb && isMobileWeb) {
        styles.maxWidth = Math.min(windowWidth * 0.95, options.maxWidth);
      } else {
        styles.maxWidth = Math.min(windowWidth, options.maxWidth);
      }
    } else {
      styles.maxWidth = options.maxWidth;
    }
  }
  
  // Handle max height
  if (options.maxHeight) {
    if (typeof options.maxHeight === 'number') {
      styles.maxHeight = Math.min(windowHeight, options.maxHeight);
    } else {
      styles.maxHeight = options.maxHeight;
    }
  }
  
  // Handle width
  if (options.width) {
    styles.width = options.width;
  }
  
  // Handle height
  if (options.height) {
    styles.height = options.height;
  }
  
  // Handle padding
  if (options.padding) {
    styles.padding = horizontalScale(options.padding);
  }
  
  // Handle margin
  if (options.margin) {
    styles.margin = horizontalScale(options.margin);
  }
  
  return styles;
}

// Export default dimensions object for convenience
export default {
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen'),
  isWeb: Platform.OS === 'web',
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android'
}; 