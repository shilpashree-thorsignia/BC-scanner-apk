import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, Platform, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getResponsiveData, scaleSize } from '../../constants/responsive';
import { scanBusinessCardDualSide, createBusinessCard } from '../lib/api';

// Define BusinessCard type locally if the import is not available
type BusinessCard = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  imageUri?: string;
};

type ScanStep = 'front' | 'back' | 'processing' | 'complete';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  stepIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
    zIndex: 10,
  },
  stepText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    color: '#ffffff90',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cardFrameContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  cardFrame: {
    aspectRatio: 1.6,
    borderRadius: 12,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderColor: '#00A99D',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionButton: {
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  innerButton: {
    borderRadius: 50,
    backgroundColor: '#00A99D',
  },
  actionButtonText: {
    color: '#00A99D',
    fontSize: 16,
    fontWeight: '600',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  successText: {
    color: '#00A99D',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '80%',
    aspectRatio: 1.6,
    borderRadius: 12,
    marginBottom: 20,
  },
  previewText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
  },
  retakeButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButton: {
    backgroundColor: '#00A99D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function DualSideScannerScreen() {
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<ScanStep>('front');
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { isDesktop, isMobileWeb, isWeb } = getResponsiveData();
  
  // Responsive sizes
  const iconSize = scaleSize(24);
  const largeIconSize = scaleSize(30);
  const buttonSize = scaleSize(44);
  const largeButtonSize = scaleSize(70);
  const innerButtonSize = scaleSize(60);
  const cornerSize = scaleSize(20);
  const cardFrameWidth = Math.min(dimensions.width * 0.9, 500);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: 'white', fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { width: buttonSize * 3, height: buttonSize, backgroundColor: '#00A99D' }]}
            onPress={requestPermission}
          >
            <Text style={[styles.actionButtonText, { color: 'white' }]}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        setProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 1.0,  // Maximum quality for better OCR
          skipProcessing: false,  // Allow processing for better quality
          exif: false  // Don't include EXIF data to reduce file size
        }) as CameraCapturedPicture;

        if (currentStep === 'front') {
          setFrontImageUri(photo.uri);
          setCurrentStep('back');
          setProcessing(false);
        } else if (currentStep === 'back') {
          setBackImageUri(photo.uri);
          setCurrentStep('processing');
          
          try {
            // Process both images
            const scanResult = await scanBusinessCardDualSide(frontImageUri!, photo.uri);
            console.log('Dual-side scan successful:', scanResult);
            setScanSuccess(true);
            setCurrentStep('complete');
            
            // Navigate back after a short delay to show success feedback
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } catch (scanError) {
            console.error('Error scanning dual-side business card:', scanError);
            setProcessing(false);
            setCurrentStep('front');
            setFrontImageUri(null);
            setBackImageUri(null);
            
            Alert.alert(
              'Dual-Side Scan Failed',
              'Could not scan both sides of the business card. Please try again.',
              [
                { text: 'Try Again', onPress: () => {
                  setCurrentStep('front');
                }},
                { text: 'Single Side Scan', onPress: () => router.back() }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        setProcessing(false);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const pickImageFromGallery = async (): Promise<void> => {
    try {
      // Request media library permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      setProcessing(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [16, 10], // Business card aspect ratio
        quality: 1.0,  // Maximum quality for better OCR
        exif: false,  // Don't include EXIF data
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        if (currentStep === 'front') {
          setFrontImageUri(selectedImage.uri);
          setCurrentStep('back');
          setProcessing(false);
        } else if (currentStep === 'back') {
          setBackImageUri(selectedImage.uri);
          setCurrentStep('processing');
          
          try {
            // Process both images
            const scanResult = await scanBusinessCardDualSide(frontImageUri!, selectedImage.uri);
            console.log('Dual-side scan successful:', scanResult);
            setScanSuccess(true);
            setCurrentStep('complete');
            
            // Navigate back after a short delay to show success feedback
            setTimeout(() => {
              router.push('/');
            }, 2000);
          } catch (scanError) {
            console.error('Error scanning dual-side business card:', scanError);
            setProcessing(false);
            setCurrentStep('front');
            setFrontImageUri(null);
            setBackImageUri(null);
            
            Alert.alert(
              'Dual-Side Scan Failed',
              'Could not scan both sides of the business card. Please try again.',
              [
                { text: 'Try Again', onPress: () => {
                  setCurrentStep('front');
                }},
                { text: 'Single Side Scan', onPress: () => router.back() }
              ]
            );
          }
        }
      } else {
        // User cancelled image selection
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      setProcessing(false);
      Alert.alert('Error', 'Failed to access gallery. Please try again.');
    }
  };

  const retakeCurrentSide = () => {
    if (currentStep === 'back') {
      setBackImageUri(null);
    } else {
      setFrontImageUri(null);
      setCurrentStep('front');
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'front':
        return {
          title: 'Step 1: Scan Front Side',
          description: 'Position the front side of the business card within the frame. Make sure all text is clearly visible.',
        };
      case 'back':
        return {
          title: 'Step 2: Scan Back Side',
          description: 'Now flip the card and position the back side within the frame. This side may contain additional information.',
        };
      case 'processing':
        return {
          title: 'Processing Both Sides',
          description: 'Analyzing both sides of the business card for comprehensive information extraction...',
        };
      case 'complete':
        return {
          title: 'Scan Complete!',
          description: 'Successfully scanned both sides of the business card.',
        };
    }
  };

  // Processing overlay
  if (currentStep === 'processing' || currentStep === 'complete') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.overlayContainer}>
          {currentStep === 'processing' ? (
            <>
              <ActivityIndicator color="#00A99D" size="large" />
              <Text style={styles.processingText}>
                Processing dual-side scan...{'\n'}
                Analyzing both front and back sides
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons name="check-circle" size={80} color="#00A99D" />
              <Text style={styles.successText}>
                Dual-side scan complete!{'\n'}
                Business card saved successfully
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Preview captured image
  if ((currentStep === 'front' && frontImageUri) || (currentStep === 'back' && backImageUri)) {
    const currentImageUri = currentStep === 'front' ? frontImageUri : backImageUri;
    const isBackSide = currentStep === 'back';
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>
            {isBackSide ? 'Back side captured!' : 'Front side captured!'}
          </Text>
          {currentImageUri && (
            <Image source={{ uri: currentImageUri }} style={styles.previewImage} />
          )}
          <Text style={styles.previewText}>
            {isBackSide 
              ? 'Ready to process both sides?' 
              : 'Continue to capture the back side?'
            }
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakeCurrentSide}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={() => {
                if (currentStep === 'front') {
                  setCurrentStep('back');
                } else {
                  // Process both images
                  setCurrentStep('processing');
                  scanBusinessCardDualSide(frontImageUri!, backImageUri!)
                    .then((result) => {
                      console.log('Dual-side scan successful:', result);
                      setScanSuccess(true);
                      setCurrentStep('complete');
                      setTimeout(() => router.push('/'), 2000);
                    })
                    .catch((error) => {
                      console.error('Error scanning dual-side business card:', error);
                      setCurrentStep('front');
                      setFrontImageUri(null);
                      setBackImageUri(null);
                      Alert.alert('Scan Failed', 'Could not process both sides. Please try again.');
                    });
                }
              }}
            >
              <Text style={styles.buttonText}>
                {isBackSide ? 'Process' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
        />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={largeIconSize} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Dual-Side Scan</Text>
          <TouchableOpacity onPress={() => setFlashOn(!flashOn)}>
            <MaterialIcons 
              name={flashOn ? "flash-on" : "flash-off"} 
              size={iconSize} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{getStepInfo().title}</Text>
          <Text style={styles.stepDescription}>{getStepInfo().description}</Text>
        </View>

        {/* Card Frame */}
        <View style={styles.cardFrameContainer}>
          <View style={[styles.cardFrame, { width: cardFrameWidth }]}>
            <View style={[styles.corner, styles.topLeft, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.topRight, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.bottomLeft, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.bottomRight, { width: cornerSize, height: cornerSize }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsRow}>
            {/* Gallery Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
              onPress={pickImageFromGallery}
            >
              <MaterialIcons name="photo-library" size={iconSize} color="#00A99D" />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { width: largeButtonSize, height: largeButtonSize }]}
              onPress={takePicture}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#00A99D" size="small" />
              ) : (
                <View style={[styles.innerButton, { width: innerButtonSize, height: innerButtonSize }]} />
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
              onPress={() => router.back()}
            >
              <MaterialIcons name="close" size={iconSize} color="#00A99D" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
} 