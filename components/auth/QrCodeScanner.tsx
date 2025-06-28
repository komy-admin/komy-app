import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface QrCodeScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permission === undefined) {
      // Permission is still loading
      return;
    }

    if (!permission?.granted) {
      // Permission not granted, request it
      requestPermission().then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    console.log('QR code scanned:', data);
    setScanned(true);
    onScan(data);
  };

  if (loading || permission === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.text}>Demande d'autorisation caméra...</Text>
      </View>
    );
  }

  if (!permission || !permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>L'accès à la caméra est requis pour scanner un QR code.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Autoriser la caméra</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.button} onPress={onCancel}>
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanText}>Scannez le QR code pour vous connecter</Text>
        {scanned && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.buttonText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        )}
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.buttonText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export default QrCodeScanner;