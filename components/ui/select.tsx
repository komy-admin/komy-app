import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface Choice {
  label: string;
  value: string;
  id?: string;
}

interface SelectProps {
  choices: Choice[];
  selectedValue?: Choice;
  defaultValue?: Choice;
  placeholder?: string;
  onValueChange: (choice: Choice) => void;
  maxHeight?: number;
  style?: object;
  error?: string;
  disabled?: boolean;
  label?: string;
}

export function Select({
  choices,
  selectedValue,
  defaultValue,
  placeholder = 'Sélectionner une option',
  onValueChange,
  maxHeight = 200,
  style,
  error,
  disabled = false,
  label,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(selectedValue || defaultValue);
  const animation = useRef(new Animated.Value(0)).current;
  const dropdownRef = useRef<View>(null);
  const [dropdownLayout, setDropdownLayout] = useState({
    pageX: 0,
    pageY: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (selectedValue) {
      setCurrentValue(selectedValue);
    } else if (defaultValue) {
      setCurrentValue(defaultValue);
    }
  }, [selectedValue, defaultValue]);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const rotateAnimation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const scaleAnimation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  const handlePress = () => {
    if (disabled) return;

    if (dropdownRef.current) {
      dropdownRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({ pageX, pageY, width, height });
      });
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (choice: Choice) => {
    onValueChange(choice);
    setCurrentValue(choice);
    setIsOpen(false);
  };

  const optionHeight = 48;
  const visibleOptions = 3;
  const dropdownHeight = Math.min(
    maxHeight,
    choices.length > visibleOptions
      ? optionHeight * visibleOptions + optionHeight * 0.3
      : optionHeight * choices.length
  );

  const renderDropdownContent = () => (
    <Animated.View
      style={[
        styles.dropdown,
        {
          height: dropdownHeight,
          transform: [{ scale: scaleAnimation }],
          opacity: animation,
          ...(Platform.OS === 'web'
            ? {
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
              }
            : {
                position: 'absolute',
                top: dropdownLayout.pageY + dropdownLayout.height,
                left: dropdownLayout.pageX,
                width: dropdownLayout.width,
              }),
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {choices.map((choice, index) => (
          <TouchableOpacity
            key={choice.id || `${choice.value}-${index}`}
            style={[
              styles.option,
              currentValue?.value === choice.value && styles.selectedOption,
            ]}
            onPress={() => handleSelect(choice)}
          >
            <Text
              style={[
                styles.optionText,
                currentValue?.value === choice.value && styles.selectedOptionText,
              ]}
            >
              {choice.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={[
            styles.label,
            error && styles.labelError,
            disabled && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      )}

      <View style={styles.selectWrapper}>
        <TouchableOpacity
          ref={dropdownRef}
          style={[
            styles.selectButton,
            isOpen && styles.selectButtonOpen,
            error && styles.selectButtonError,
            disabled && styles.selectButtonDisabled,
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={disabled}
        >
          <Text
            style={[
              styles.selectedText,
              !currentValue && styles.placeholderText,
              disabled && styles.textDisabled,
            ]}
          >
            {currentValue ? currentValue.label : placeholder}
          </Text>
          <Animated.View style={{ transform: [{ rotate: rotateAnimation }] }}>
            <ChevronDown size={20} color={disabled ? '#A0A0A0' : '#2A2E33'} />
          </Animated.View>
        </TouchableOpacity>

        {Platform.OS === 'web' ? (
          isOpen && renderDropdownContent()
        ) : (
          <Modal visible={isOpen} transparent animationType="none">
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setIsOpen(false)}
            >
              {renderDropdownContent()}
            </Pressable>
          </Modal>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 2,
  },
  selectWrapper: {
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2E33',
    marginBottom: 6,
  },
  labelError: {
    color: '#DC2626',
  },
  labelDisabled: {
    color: '#A0A0A0',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingVertical: 12,
        minHeight: 44,
      },
      android: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
      },
      web: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
        cursor: 'pointer',
      },
    }),
  },
  selectButtonOpen: {
    borderColor: '#2563EB',
  },
  selectButtonError: {
    borderColor: '#DC2626',
  },
  selectButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5E5',
    ...(Platform.OS === 'web' && {
      cursor: 'not-allowed',
    }),
  },
  selectedText: {
    fontSize: 14,
    color: '#2A2E33',
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  textDisabled: {
    color: '#A0A0A0',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollView: {
    width: '100%',
  },
  option: {
    height: 48,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  selectedOption: {
    backgroundColor: '#F5F5F5',
  },
  optionText: {
    fontSize: 14,
    color: '#2A2E33',
  },
  selectedOptionText: {
    fontWeight: '500',
  },
});