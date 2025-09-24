import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
  Text,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  secure?: boolean;
  keyboardType?: 'numeric' | 'number-pad';
}

export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  onBlur,
  error = false,
  disabled = false,
  autoFocus = true,
  secure = true,
  keyboardType = 'number-pad',
}: PinInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const lastCompletedValueRef = useRef<string>('');

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    // Only call onComplete if value is complete and different from last completed value
    if (value.length === length && value !== lastCompletedValueRef.current && onComplete) {
      lastCompletedValueRef.current = value;
      onComplete(value);
    }

    // Reset lastCompletedValue when PIN is cleared
    if (value.length === 0) {
      lastCompletedValueRef.current = '';
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string) => {
    // Only allow digits and limit to length
    const filtered = text.replace(/[^0-9]/g, '').slice(0, length);

    if (filtered !== value) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(filtered);
    }
  };

  const handlePress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: any) => {
    if (nativeEvent.key === 'Backspace' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View style={styles.boxContainer}>
        {Array.from({ length }, (_, index) => {
          const isActive = index === value.length && focused;
          const hasValue = index < value.length;
          const isError = error;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isActive && styles.boxActive,
                isError && styles.boxError,
                hasValue && styles.boxFilled,
              ]}
            >
              {hasValue && (
                <Text style={styles.digit}>
                  {secure ? '•' : value[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onKeyPress={handleKeyPress}
        keyboardType={keyboardType}
        maxLength={length}
        style={styles.hiddenInput}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        selectTextOnFocus={false}
        autoCorrect={false}
        autoCapitalize="none"
        contextMenuHidden
        secureTextEntry={false} // We handle masking ourselves
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  boxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  box: {
    width: 56,
    height: 64,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  boxActive: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F9FF',
  },
  boxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  boxFilled: {
    borderColor: '#1F2937',
  },
  digit: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});

export default PinInput;