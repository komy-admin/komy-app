import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { CustomModal } from '../CustomModal';
import { Button } from './button';
import { Minus, Plus } from 'lucide-react-native';

interface QuantityPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  title: string;
  message: string;
  max: number;
  confirmText?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline';
}

export function QuantityPickerModal({
  isVisible,
  onClose,
  onConfirm,
  title,
  message,
  max,
  confirmText = 'Confirmer',
  confirmVariant = 'destructive',
}: QuantityPickerModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Reset à 1 à chaque ouverture
  useEffect(() => {
    if (isVisible) setQuantity(1);
  }, [isVisible]);

  const handleDecrement = useCallback(() => {
    setQuantity(prev => Math.max(1, prev - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity(prev => Math.min(max, prev + 1));
  }, [max]);

  const handleConfirm = useCallback(() => {
    onConfirm(quantity);
  }, [onConfirm, quantity]);

  return (
    <CustomModal
      isVisible={isVisible}
      onClose={onClose}
      width={360}
      height={300}
      title={title}
      titleColor="#DC2626"
    >
      <View style={styles.content}>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.pickerRow}>
          <Pressable
            onPress={handleDecrement}
            style={[styles.pickerButton, quantity <= 1 && styles.pickerButtonDisabled]}
            disabled={quantity <= 1}
          >
            <Minus size={20} color={quantity <= 1 ? '#D1D5DB' : '#374151'} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.quantityDisplay}>
            <Text style={styles.quantityText}>{quantity}</Text>
            <Text style={styles.quantityMax}>/ {max}</Text>
          </View>

          <Pressable
            onPress={handleIncrement}
            style={[styles.pickerButton, quantity >= max && styles.pickerButtonDisabled]}
            disabled={quantity >= max}
          >
            <Plus size={20} color={quantity >= max ? '#D1D5DB' : '#374151'} strokeWidth={2.5} />
          </Pressable>
        </View>

        <Button
          variant={confirmVariant}
          onPress={handleConfirm}
          style={{ width: '100%' }}
        >
          <Text style={{ color: 'white' }}>{confirmText}</Text>
        </Button>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    color: '#374151',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  pickerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  pickerButtonDisabled: {
    opacity: 0.4,
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  quantityDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 60,
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  quantityMax: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
