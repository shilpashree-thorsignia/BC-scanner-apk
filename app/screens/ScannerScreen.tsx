import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import { useRouter } from 'expo-router';
import { getResponsiveData, scaleSize } from '../../constants/responsive';

export default function ScannerScreen() {
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
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
        const photo = await cameraRef.current.takePictureAsync() as CameraCapturedPicture;
        // Handle the captured photo as needed
      } catch (error) {
        console.error('Error taking picture:', error);
      }
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
                Log 2 of 3
              </Text>
              <TouchableOpacity>
                <MaterialIcons name="chevron-right" size={largeIconSize} color="white" />
              </TouchableOpacity>
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

            {/* Bottom Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
                onPress={() => router.back()}
              >
                <Text style={styles.actionButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { width: largeButtonSize, height: largeButtonSize }]}
                onPress={takePicture}
              >
                <View 
                  style={[styles.innerButton, { width: innerButtonSize, height: innerButtonSize }]}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
              >
                <MaterialIcons name="photo-library" size={iconSize} color="#00A99D" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
                onPress={() => router.back()}
              >
                <Text style={styles.actionButtonText}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.simulationText}>
            Camera simulation in desktop web view
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={flashOn}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="chevron-left" size={largeIconSize} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              Log 2 of 3
            </Text>
            <TouchableOpacity>
              <MaterialIcons name="chevron-right" size={largeIconSize} color="white" />
            </TouchableOpacity>
          </View>

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
            >
              <MaterialIcons name="description" size={iconSize} color="#00A99D" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            >
              <MaterialIcons name="help-outline" size={iconSize} color="#00A99D" />
            </TouchableOpacity>
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

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { width: largeButtonSize, height: largeButtonSize }]}
              onPress={takePicture}
            >
              <View 
                style={[styles.innerButton, { width: innerButtonSize, height: innerButtonSize }]}
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
            >
              <MaterialIcons name="photo-library" size={iconSize} color="#00A99D" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { width: buttonSize, height: buttonSize }]}
              onPress={() => router.back()}
            >
              <Text style={styles.actionButtonText}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

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
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
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
}); 