import React, { useState } from 'react';
import { Text, View, StyleSheet, Button, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { parseQRCode, ParsedBusinessCard } from '../utils/qrCodeParser';
import { createBusinessCard } from '../lib/api';
import { Ionicons } from '@expo/vector-icons';

const Scanner = () => {
  /**
   * Handle the scanned QR code data
   * Parse QR code in MECARD or vCard format and save as business card if valid
   */
  const handleScannedQRCode = async (data: string) => {
    try {
      setProcessing(true);
      console.log('Scanned QR code data:', data);
      
      // Check if data is empty or undefined
      if (!data || data.trim() === '') {
        console.log('Empty QR code data received');
        Alert.alert(
          'Empty QR Code',
          'No data was detected in the QR code. Please try scanning again.',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }
      
      // Parse the QR code data (supports MECARD and vCard formats)
      const parsedCard: ParsedBusinessCard | null = parseQRCode(data);
      console.log('Parser result:', parsedCard ? 'Success' : 'Failed');
      
      if (!parsedCard) {
        console.log('Failed to parse QR code data. Raw data:', data);
        Alert.alert(
          'Invalid QR Code',
          'The scanned QR code is not in a valid business card format (MECARD or vCard).',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }
      
      console.log('Successfully parsed card:', JSON.stringify(parsedCard));
      
      // Create a new business card from the parsed data
      try {
        const savedCard = await createBusinessCard(parsedCard);
        console.log('Card saved to database:', savedCard ? 'success' : 'failed');
        
        Alert.alert(
          'Business Card Added',
          `Successfully added ${parsedCard.name}'s business card.`,
          [
            { 
              text: 'View Cards', 
              onPress: () => {
                router.push('/');
              } 
            },
            { 
              text: 'Scan Another', 
              onPress: () => setScanned(false) 
            }
          ]
        );
      } catch (saveError) {
        console.error('Error saving business card:', saveError);
        Alert.alert(
          'Save Error',
          'The QR code was read successfully, but there was an error saving the business card.',
          [{ text: 'Try Again', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error',
        'Failed to process the QR code. Please try again.',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setProcessing(false);
    }
  };

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <Button title="Request Permission" onPress={requestPermission} />
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={[StyleSheet.absoluteFill, styles.scanner]}
        onBarcodeScanned={scanned || processing ? undefined : (result: BarcodeScanningResult) => {
          console.log('Barcode detected:', result.type, result.data ? result.data.length : 'no data');
          setScanned(true);
          handleScannedQRCode(result.data);
        }}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      
      {/* Scan frame overlay */}
      <View style={styles.scanFrame}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Scan Business Card QR Code</Text>
      </View>
      
      {/* Bottom overlay */}
      <View style={styles.overlay}>
        {processing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.text}>Processing QR code...</Text>
          </View>
        ) : scanned ? (
          <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
            <Ionicons name="scan-outline" size={24} color="white" style={styles.scanIcon} />
            <Text style={styles.scanButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.instructionContainer}>
            <Ionicons name="qr-code-outline" size={32} color="white" style={styles.qrIcon} />
            <Text style={styles.text}>Position QR code in the frame to scan</Text>
            <Text style={styles.subText}>Supports MECARD and vCard formats</Text>
          </View>
        )}
        
        {!processing && !scanned && (
          <TouchableOpacity 
            style={styles.closeButtonBottom} 
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close Scanner</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
  },
  // Scan frame with corners
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    width: '80%',
    height: '30%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4CAF50',
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4CAF50',
    borderBottomRightRadius: 12,
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  // Bottom overlay
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 12,
  },
  instructionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
    borderRadius: 12,
    width: '90%',
  },
  qrIcon: {
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scanIcon: {
    marginRight: 4,
  },
  closeButtonBottom: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Scanner;