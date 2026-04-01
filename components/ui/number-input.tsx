import React, { useState, useEffect } from 'react';
import { TextInput, Platform, StyleSheet, View, Text } from 'react-native';
import { cn } from '~/lib/utils';

interface NumberInputProps {
  value: number | null;
  onChangeText: (value: number | null) => void;
  decimalPlaces?: number;
  min?: number;
  max?: number;
  placeholder: string;
  placeholderTextColor?: string;
  currency?: string;
  style?: object;
  containerStyle?: object;
  className?: string;
}

export function NumberInput({
  value,
  onChangeText,
  decimalPlaces = 2,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  placeholder,
  placeholderTextColor = "#D7D7D7",
  currency,
  style,
  containerStyle,
  className,
  ...props
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      if (value === null || value === undefined) {
        setLocalValue('');
      } else if (typeof value === 'number' && !isNaN(value)) {
        setLocalValue(value === 0 ? '' : formatValue(value));
      } else {
        setLocalValue('');
      }
    }
  }, [value, isFocused]);

  const formatValue = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) {
      return '';
    }
    return `${num.toFixed(decimalPlaces)}`;
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
    <View style={[styles.container, containerStyle]}>
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
        placeholderTextColor={placeholderTextColor}
        className={cn(
          'web:flex native:h-12 web:w-full px-3 web:py-2 native:text-lg native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
          isFocused && 'web:ring-2 web:ring-ring web:ring-offset-2',
          className
        )}
        style={[
          Platform.OS !== 'web' && styles.mobileInput,
          { height: 44 },
          style,
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
    minHeight: Platform.OS === 'web' ? 44 : 48,
  },
  mobileInput: {
    paddingRight: Platform.OS === 'ios' ? 8 : 32,
    width: '100%'
  },
  currencyText: {
    position: Platform.OS === 'ios' ? 'relative' : 'absolute',
    right: Platform.OS === 'ios' ? 0 : 12,
    color: '#2A2E33',
    fontSize: 16,
    marginLeft: Platform.OS === 'ios' ? 4 : 0,
  }
});