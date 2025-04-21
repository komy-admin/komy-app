import React, { useState, useEffect } from 'react';
import { TextInput, Platform, StyleSheet, View, Text } from 'react-native';

interface NumberInputProps {
  value: number | null;
  onChangeText: (value: number | null) => void;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  placeholder: string;
  currency?: string;
  style?: object;
}

export function NumberInput({
  value,
  onChangeText,
  decimalPlaces = 2,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  placeholder,
  currency,
  style,
  ...props
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === null) {
        setLocalValue('');
      } else {
        setLocalValue(value === 0 ? '' : formatValue(value));
      }
    }
  }, [value, isFocused]);

  const formatValue = (num: number): string => {
    return `${num.toFixed(decimalPlaces)}${currency ? ` ${currency}` : ''}`;
  };

  const handleChangeText = (text: string) => {
    if (text === '') {
      setLocalValue('');
      onChangeText(null);
      return;
    }

    let cleanText = text
      .replace(currency || '', '')
      .replace(/[^\d.,]/g, '')
      .replace(/,/g, '.')
      .trim();

    const dots = cleanText.match(/\./g);
    if (dots && dots.length > 1) {
      cleanText = cleanText.substring(0, cleanText.lastIndexOf('.'));
    }

    setLocalValue(cleanText);

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
    if (localValue) {
      const number = parseFloat(localValue);
      if (!isNaN(number)) {
        setLocalValue(number.toString());
      }
    }
  };

  return (
    <View style={styles.container}>
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
        placeholderTextColor="#A0A0A0"
        style={[
          styles.input,
          Platform.OS !== 'web' && styles.mobileInput,
          isFocused && styles.inputFocused,
          style
        ]}
        {...props}
      />
      {Platform.OS !== 'web' && currency && localValue !== '' && !isFocused && (
        <Text style={styles.currencyText}>{currency}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Platform.OS === 'web' ? 38 : 46,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    fontSize: Platform.OS !== 'web' ? 16 : 14,
  },
  mobileInput: {
    fontSize: 16,
    paddingRight: 32,
  },
  inputFocused: {
    borderColor: '#2A2E33',
    borderWidth: 1.5,
  },
  currencyText: {
    position: 'absolute',
    right: 12,
    color: '#2A2E33',
    fontSize: 16,
  }
});