import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, Platform, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { getResponsiveData, scaleSize } from '../../constants/responsive';
import { scanBusinessCard, createBusinessCard, scanQRCode } from '../lib/api';

// Define BusinessCard type locally if the import is not available
type BusinessCard = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  imageUri?: string;
};

// Define styles at the top of the file to avoid using before declaration errors
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00A99D',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#00A99D',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#00A99D',
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mockCamera: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  headerText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  topActionBar: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 24,
    zIndex: 10,
  },
  cardFrameContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -100 }],
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  cardFrame: {
    aspectRatio: 1.6,
    borderWidth: 2,
    borderColor: '#8ac041',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    borderColor: '#8ac041',
    borderWidth: 2,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  actionBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 24,
    zIndex: 10,
  },
  actionButton: {
    borderRadius: 999,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    color: '#00A99D',
    fontSize: 12,
    fontWeight: '600',
  },
  innerButton: {
    borderRadius: 999,
    backgroundColor: '#00A99D',
  },
  simulationText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  headerTextAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'white',
    fontSize: 17,
    paddingTop: 10,
    fontWeight: '600',
    zIndex: -1, // optional, pushes it behind the buttons if needed
  }
  
});

export default function ScannerScreen() {
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [scanSuccess, setScanSuccess] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [manualNameInput, setManualNameInput] = useState<string>('');
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
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
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
        setCapturedImage(photo.uri);
        
        try {
          // Try to call the API to scan the business card
          const scanResult = await scanBusinessCard(photo.uri);
          console.log('Scan successful:', scanResult);
          setScanSuccess(true);
          
          // Navigate back after a short delay to show success feedback
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } catch (scanError) {
          console.error('Error scanning business card:', scanError);
          
          // If backend OCR fails, ask user to manually enter a name for the card
          if (scanError instanceof Error && scanError.message && scanError.message.includes('tesseract is not installed')) {
            promptForManualEntry(photo.uri);
          } else {
            setProcessing(false);
            Alert.alert(
              'Scan Failed',
              'Could not scan the business card. Please try again or add manually.',
              [
                { text: 'Try Again', onPress: () => {
                  setCapturedImage(null);
                  setProcessing(false);
                }},
                { text: 'Add Manually', onPress: () => router.push('/screens/AddManually' as any) }
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

  const smartScan = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        setProcessing(true);
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 1.0,  // Maximum quality for better OCR
          skipProcessing: false,  // Allow processing for better quality
          exif: false  // Don't include EXIF data to reduce file size
        }) as CameraCapturedPicture;
        setCapturedImage(photo.uri);
        
        try {
          // Try to call the smart scanner API (QR code first, then business card OCR)
          const scanResult = await scanQRCode(photo.uri);
          console.log('Smart scan successful:', scanResult);
          setScanSuccess(true);
          
          // Navigate back after a short delay to show success feedback
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } catch (scanError) {
          console.error('Error in QR scan:', scanError);
          setProcessing(false);
          
          const errorMessage = scanError instanceof Error ? scanError.message : 'Could not scan the QR code.';
          
          Alert.alert(
            'QR Scan Failed',
            errorMessage,
            [
              { text: 'Try Again', onPress: () => {
                setCapturedImage(null);
                setProcessing(false);
              }},
              { text: 'Cancel', onPress: () => {
                setCapturedImage(null);
                setProcessing(false);
              }}
            ]
          );
        }
      } catch (error) {
        console.error('Error taking picture for smart scan:', error);
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
        setCapturedImage(selectedImage.uri);

        try {
          // First try business card OCR (primary purpose of gallery upload)
          const cardScanResult = await scanBusinessCard(selectedImage.uri);
          console.log('Business card scan successful:', cardScanResult);
          setScanSuccess(true);
          
          // Navigate back after a short delay to show success feedback
          setTimeout(() => {
            router.push('/');
          }, 1500);
        } catch (cardError) {
          console.log('Business card OCR failed, trying QR code scan:', cardError);
          
          try {
            // If business card OCR fails, try QR code scanning as fallback
            const qrScanResult = await scanQRCode(selectedImage.uri);
            console.log('QR code scan successful:', qrScanResult);
            setScanSuccess(true);
            
            // Navigate back after a short delay to show success feedback
            setTimeout(() => {
              router.push('/');
            }, 1500);
          } catch (qrError) {
            console.error('Error scanning image from gallery:', qrError);
            
            // If both business card OCR and QR scan fail, ask user to manually enter card details
            if (cardError instanceof Error && cardError.message && cardError.message.includes('tesseract is not installed')) {
              promptForManualEntry(selectedImage.uri);
            } else {
              setProcessing(false);
              Alert.alert(
                'Scan Failed',
                'Could not extract text or scan QR code from the image. Please try another image or add the card manually.',
                [
                  { text: 'Try Another Image', onPress: () => {
                    setCapturedImage(null);
                    setProcessing(false);
                  }},
                  { text: 'Add Manually', onPress: () => {
                    promptForManualEntry(selectedImage.uri);
                  }},
                  { text: 'Cancel', onPress: () => {
                    setCapturedImage(null);
                    setProcessing(false);
                  }}
                ]
              );
            }
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
  
  const promptForManualEntry = (imageUri: string) => {
    // On Android, Alert.prompt is not available, so we need to handle this differently
    if (Platform.OS === 'android') {
      // For Android, we'll use a simpler approach since we can't use Alert.prompt
      Alert.alert(
        'Manual Entry Required',
        'OCR service is unavailable. Please enter a name for this business card.',
        [
          {
            text: 'Cancel',
            onPress: () => {
              setCapturedImage(null);
              setProcessing(false);
            },
            style: 'cancel',
          },
          {
            text: 'Add Card with Image Only',
            onPress: async () => {
              try {
                // Create a business card with the name and image
                await createBusinessCard({
                  name: manualNameInput || 'Unnamed Card',
                  imageUri: imageUri,
                } as BusinessCard);
                setScanSuccess(true);
                setTimeout(() => {
                  router.push('/');
                }, 1500);
              } catch (error) {
                console.error('Error creating card:', error);
                Alert.alert('Error', 'Failed to save the card. Please try again.');
                setProcessing(false);
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'OCR Not Available',
        'Automatic text recognition is not available. Would you like to save this card with a name?',
        [
          { text: 'Cancel', onPress: () => {
            setCapturedImage(null);
            setProcessing(false);
          }},
          { text: 'Save Card', onPress: () => {
            // Ask for a name
            // Note: Alert.prompt is iOS only, this will need a custom modal for Android
            // For this demo, we're using it directly
            Alert.prompt(
              'Enter Card Name',
              'Please enter a name for this business card',
              [
                { text: 'Cancel', onPress: () => {
                  setCapturedImage(null);
                  setProcessing(false);
                }},
                { text: 'Save', onPress: async (name?: string) => {
                  const cardName = name || '';
                  if (cardName && cardName.trim()) {
                    try {
                      // Create a business card with the name and image
                      await createBusinessCard({
                        name: cardName.trim(),
                        imageUri: imageUri
                      } as BusinessCard);
                      setScanSuccess(true);
                      
                      // Navigate back after success
                      setTimeout(() => {
                        router.push('/');
                      }, 1500);
                    } catch (saveError) {
                      console.error('Error saving card:', saveError);
                      setProcessing(false);
                      Alert.alert('Error', 'Failed to save the card. Please try again.');
                    }
                  } else {
                    Alert.alert('Error', 'Name cannot be empty');
                    setProcessing(false);
                  }
                }}
              ],
              'plain-text'
            );
          }}
        ]
      );
    }
  };

  // For web desktop, show a mock camera view
  if (isWeb && isDesktop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={[styles.mockCamera, { maxWidth: 480, aspectRatio: 3/4 }]}>
            {/* Mock camera frame */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <MaterialIcons name="chevron-left" size={largeIconSize} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerText}>
                Scan Business Card
              </Text>
              <TouchableOpacity>
                <MaterialIcons name="chevron-right" size={largeIconSize} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { width: largeButtonSize, height: largeButtonSize, marginTop: 32 }]}
                onPress={() => {
                  setProcessing(true);
                  // Simulate taking a picture
                  setTimeout(() => {
                    // Simulate manual entry since we can't actually take a picture
                    Alert.alert(
                      'Mock Camera Capture',
                      'Enter a name for this business card',
                      [
                        { text: 'Cancel', onPress: () => setProcessing(false) },
                        { 
                          text: 'Save', 
                          onPress: async () => {
                            try {
                              // Create a mock business card
                              await createBusinessCard({
                                name: 'Mock Business Card',
                                imageUri: 'https://example.com/mock-image.jpg'
                              } as BusinessCard);
                              setScanSuccess(true);
                              setTimeout(() => {
                                router.push('/');
                              }, 1500);
                            } catch (error) {
                              Alert.alert('Error', 'Failed to save the mock card.');
                              setProcessing(false);
                            }
                          } 
                        }
                      ]
                    );
                  }, 1000);
                }}
              >
                {processing ? (
                  <ActivityIndicator color="#00A99D" size="small" />
                ) : (
                  <View style={[styles.innerButton, { width: innerButtonSize, height: innerButtonSize }]} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, { width: buttonSize, height: buttonSize, marginTop: 16 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        {/* Camera View without children */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
        />
        
        {/* Header - positioned absolutely over camera */}
        <View style={styles.header}>
          <TouchableOpacity
          style={{ paddingTop: 10 }}
          onPress={() => router.back()}>
            <MaterialIcons name="chevron-left" size={largeIconSize} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTextAbsolute}>Scan Business Card</Text>
        </View>

        {/* Card Frame - positioned absolutely over camera */}
        <View style={styles.cardFrameContainer}>
          <View style={[styles.cardFrame, { width: cardFrameWidth }]}>
            <View style={[styles.corner, styles.topLeft, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.topRight, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.bottomLeft, { width: cornerSize, height: cornerSize }]} />
            <View style={[styles.corner, styles.bottomRight, { width: cornerSize, height: cornerSize }]} />
          </View>
        </View>

        {/* Processing/Success Overlay */}
        {processing && (
          <View style={styles.overlay}>
            {scanSuccess ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={largeIconSize * 2} color="#8ac041" />
                <Text style={styles.successText}>Card Scanned Successfully!</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#8ac041" />
            )}
          </View>
        )}
        
        {/* Top Action Bar */}
        <View style={styles.topActionBar}>
          <TouchableOpacity 
            style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            onPress={() => setFlashOn(!flashOn)}
          >
            <MaterialIcons 
              name={flashOn ? "flash-on" : "flash-off"} 
              size={iconSize} 
              color="#00A99D" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            onPress={() => router.back()}
            disabled={processing}
          >
            <Text style={styles.actionButtonText}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            onPress={pickImageFromGallery}
            disabled={processing}
          >
            <MaterialIcons name="photo-library" size={iconSize} color="#00A99D" />
          </TouchableOpacity>
          
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
          
          <TouchableOpacity 
            style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            onPress={smartScan}
            disabled={processing}
          >
            <MaterialIcons name="qr-code-scanner" size={iconSize} color="#00A99D" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}