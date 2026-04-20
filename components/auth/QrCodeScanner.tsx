import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, AppState } from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '~/theme';

interface QrCodeScannerProps {
  onScan: (data: string) => void;
  onCancel?: () => void;
}

const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScan, onCancel }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const waitingForSettings = useRef(false);

  // Re-check permission when returning from Settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && waitingForSettings.current) {
        waitingForSettings.current = false;
        await Camera.getCameraPermissionsAsync();
        // requestPermission refreshes the hook state
        await requestPermission();
      }
    });
    return () => subscription.remove();
  }, [requestPermission]);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      waitingForSettings.current = true;
      Linking.openSettings();
    }
  }, [requestPermission]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onScan(data);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.white} />
        <Text style={styles.text}>Demande d'autorisation caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>
          {permission.canAskAgain
            ? "L'accès à la caméra est requis pour scanner un QR code."
            : "L'accès à la caméra a été refusé. Activez-le dans les réglages."}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleRequestPermission}>
          <Text style={styles.primaryButtonText}>
            {permission.canAskAgain ? 'Autoriser la caméra' : 'Ouvrir les réglages'}
          </Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Retour</Text>
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
            style={styles.secondaryButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.secondaryButtonText}>Scanner à nouveau</Text>
          </TouchableOpacity>
        )}
        {onCancel && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
            <Text style={styles.secondaryButtonText}>Annuler</Text>
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
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: colors.overlay.modalStrong,
    padding: 8,
    borderRadius: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    paddingHorizontal: 32,
  },
  text: {
    color: colors.white,
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    height: 48,
    paddingHorizontal: 24,
    minWidth: 220,
    backgroundColor: colors.brand.dark,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    marginTop: 12,
    height: 48,
    paddingHorizontal: 24,
    minWidth: 220,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.brand.dark,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default QrCodeScanner;
