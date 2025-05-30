import React, { useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

const Scanner = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
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
        onBarcodeScanned={scanned ? undefined : (result: BarcodeScanningResult) => {
          setScanned(true);
          alert(`Bar code with type ${result.type} and data ${result.data} has been scanned!`);
        }}
      />
      <View style={styles.overlay}>
        {scanned && (
          <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
        )}
        <Button title="Close Scanner" onPress={() => router.back()} />
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
  overlay: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default Scanner; 