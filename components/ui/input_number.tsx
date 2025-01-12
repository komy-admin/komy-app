import React, { useState, useEffect } from 'react';
import { TextInput, Platform, StyleSheet } from 'react-native';

interface NumberInputProps {
  value: number;
  onChangeText: (value: number | null) => void;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  currency?: string;
  style?: object;
}

export function NumberInput({
  value,
  onChangeText,
  decimalPlaces = 2,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  placeholder = "0.00",
  currency,
  style,
  ...props
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused && value !== null) {
      setLocalValue(value === 0 ? '' : formatValue(value));
    }
  }, [value, isFocused]);

  const formatValue = (num: number): string => {
    return `${num.toFixed(decimalPlaces)}${currency ? ` ${currency}` : ''}`;
  };

  const handleChangeText = (text: string) => {
    // Permettre la suppression complète
    if (text === '') {
      setLocalValue('');
      onChangeText(0);
      return;
    }

    // Nettoyer le texte des caractères non désirés
    let cleanText = text
      .replace(currency || '', '')
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '.')
      .trim();

    // Gérer les points multiples
    const dots = cleanText.match(/\./g);
    if (dots && dots.length > 1) {
      cleanText = cleanText.substring(0, cleanText.lastIndexOf('.'));
    }

    setLocalValue(cleanText);

    // Convertir en nombre si possible
    const number = parseFloat(cleanText);
    if (!isNaN(number)) {
      const constrainedNumber = Math.max(min, Math.min(max, number));
      onChangeText(constrainedNumber);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue) {
      const number = parseFloat(localValue);
      if (!isNaN(number)) {
        setLocalValue(formatValue(number));
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Enlever le formatage lors du focus
    if (localValue) {
      const number = parseFloat(localValue);
      if (!isNaN(number)) {
        setLocalValue(number.toString());
      }
    }
  };

  return (
    <TextInput
      keyboardType={Platform.select({
        ios: 'decimal-pad',
        android: 'decimal-pad',
        default: 'numeric'
      })}
      value={localValue}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      style={[styles.input, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    // marginTop: 8,
    // marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    fontWeight: '300',
    color: '#2A2E33',
  }
});