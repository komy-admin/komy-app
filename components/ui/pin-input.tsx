import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Text,
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

export interface PinInputRef {
  focus: () => void;
  blur: () => void;
}

const PinInput = forwardRef<PinInputRef, PinInputProps>(({
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
}, ref) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const lastCompletedValueRef = useRef<string>('');

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    }
  }), []);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Handle completion
  useEffect(() => {
    if (value.length === length && value !== lastCompletedValueRef.current && onComplete) {
      lastCompletedValueRef.current = value;
      onComplete(value);
    }
    if (value.length === 0) {
      lastCompletedValueRef.current = '';
    }
  }, [value, length, onComplete]);

  const handleChange = (text: string) => {
    const filtered = text.replace(/[^0-9]/g, '').slice(0, length);
    if (filtered !== value) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChange(filtered);
    }
  };

  const handleContainerPress = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  return (
    <Pressable style={styles.container} onPress={handleContainerPress}>
      {/* Visual boxes */}
      <View style={styles.boxContainer}>
        {Array.from({ length }, (_, index) => {
          const isActive = index === value.length && focused;
          const hasValue = index < value.length;

          return (
            <View
              key={index}
              style={[
                styles.box,
                isActive && styles.boxActive,
                error && styles.boxError,
                hasValue && styles.boxFilled,
                disabled && styles.boxDisabled,
              ]}
            >
              {hasValue && (
                <Text style={[styles.digit, disabled && styles.digitDisabled]}>
                  {secure ? '•' : value[index]}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Real input - visible but styled to be on top */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        keyboardType={keyboardType}
        maxLength={length}
        style={styles.realInput}
        editable={!disabled}
        autoFocus={autoFocus}
        selectTextOnFocus={false}
        autoCorrect={false}
        autoCapitalize="none"
        contextMenuHidden
        secureTextEntry={false}
        textContentType="oneTimeCode"
        returnKeyType="done"
        blurOnSubmit={false}
        caretHidden
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  boxFilled: {
    borderColor: '#1F2937',
  },
  boxDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  digit: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
  },
  digitDisabled: {
    color: '#9CA3AF',
  },
  // The real input - positioned over the boxes but transparent
  realInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'rgba(0, 0, 0, 0.01)', // Almost invisible but not fully transparent
    backgroundColor: 'transparent',
    fontSize: 1, // Tiny font size
    textAlign: 'center',
    letterSpacing: 50, // Space out the invisible characters
    opacity: 0.01, // Additional opacity layer
  },
});

export default PinInput;