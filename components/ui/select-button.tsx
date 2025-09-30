import React, { memo } from 'react';
import { Pressable, Platform, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Text } from './text';

export interface SelectButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  variant?: 'main' | 'sub' | 'compact';
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeColor?: string;
  flex?: boolean;
}

/**
 * Composant de bouton de sélection réutilisable
 * Utilisé dans MenuForm, TeamForm, OrderLinesForm
 */
export const SelectButton = memo<SelectButtonProps>(({
  label,
  isActive,
  onPress,
  variant = 'sub',
  style,
  textStyle,
  activeColor = '#2A2E33',
  flex = false
}) => {
  const buttonStyles = [
    variant === 'main' ? styles.mainButton :
      variant === 'compact' ? styles.compactButton :
        styles.subButton,
    flex && styles.flexButton,
    isActive && {
      backgroundColor: activeColor,
      borderColor: activeColor
    },
    style
  ];

  const textStyles: TextStyle[] = [
    variant === 'main' ? styles.mainButtonText :
      variant === 'compact' ? styles.compactButtonText :
        styles.subButtonText,
    isActive ? {
      color: '#FFFFFF',
      fontWeight: variant === 'main' ? '700' as TextStyle['fontWeight'] : '600' as TextStyle['fontWeight']
    } : undefined,
    // Force les styles critiques sur Web
    Platform.OS === 'web' && {
      fontSize: variant === 'main' ? 14 : variant === 'compact' ? 12 : 13,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: isActive
        ? (variant === 'main' ? '700' : '600')
        : (variant === 'compact' ? '500' : '500')
    },
    textStyle
  ].filter(Boolean) as TextStyle[];

  return (
    <Pressable
      style={buttonStyles}
      onPress={onPress}
    >
      <Text style={textStyles}>
        {label}
      </Text>
    </Pressable>
  );
});

SelectButton.displayName = 'SelectButton';

const styles = StyleSheet.create({
  // Main button styles (larger, for primary selections)
  mainButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } as any)
  },

  mainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },

  // Sub button styles (medium, for secondary selections)
  subButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 80,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } as any)
  },

  subButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },

  // Compact button styles (smaller, for space-constrained areas)
  compactButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } as any)
  },

  compactButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },

  flexButton: {
    flex: 1
  }
});