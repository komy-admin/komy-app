import React from 'react';
import QRCodeSVG from 'react-native-qrcode-svg';
import { View, StyleSheet } from 'react-native';

interface QRCodeProps {
  value: string;
  size?: number;
}

export const QRCode: React.FC<QRCodeProps> = ({ value, size = 200 }) => {
  return (
    <View style={styles.container}>
      <QRCodeSVG value={value} size={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
