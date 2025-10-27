import React, { memo } from 'react';
import { Pressable, Platform, StyleSheet, ViewStyle, TextStyle, View, Text as RNText } from 'react-native';

export interface SelectButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  variant?: 'main' | 'sub' | 'compact' | 'tab' | 'pill';
  style?: ViewStyle;
  textStyle?: TextStyle;
  activeColor?: string;
  activeBgColor?: string;
  count?: number;
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
  activeBgColor,
  count,
  flex = false
}) => {
  const buttonStyles = [
    variant === 'main' ? styles.mainButton :
      variant === 'compact' ? styles.compactButton :
        variant === 'tab' ? styles.tabButton :
          variant === 'pill' ? styles.pillButton :
            styles.subButton,
    flex && styles.flexButton,
    isActive && variant !== 'tab' && variant !== 'pill' && {
      backgroundColor: activeColor,
      borderColor: activeColor
    },
    isActive && variant === 'tab' && styles.tabButtonActive,
    isActive && variant === 'pill' && activeBgColor && {
      backgroundColor: activeBgColor,
      borderColor: activeColor,
    },
    style
  ];

  const textStyles: TextStyle[] = [
    variant === 'main' ? styles.mainButtonText :
      variant === 'compact' ? styles.compactButtonText :
        variant === 'tab' ? styles.tabButtonText :
          variant === 'pill' ? styles.pillButtonText :
            styles.subButtonText,
    isActive && variant !== 'tab' && variant !== 'pill' ? {
      color: '#FFFFFF',
      fontWeight: variant === 'main' ? '700' as TextStyle['fontWeight'] : '600' as TextStyle['fontWeight']
    } : undefined,
    isActive && variant === 'tab' ? styles.tabButtonTextActive : undefined,
    isActive && variant === 'pill' ? { color: activeColor, fontWeight: '600' as TextStyle['fontWeight'] } : undefined,
    // Force les styles critiques sur Web
    Platform.OS === 'web' && {
      fontSize: variant === 'main' ? 14 : variant === 'compact' ? 12 : variant === 'tab' ? 14 : variant === 'pill' ? 14 : 13,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: isActive
        ? (variant === 'main' ? '700' : variant === 'tab' ? '600' : variant === 'pill' ? '600' : '600')
        : (variant === 'compact' ? '500' : variant === 'tab' ? '500' : variant === 'pill' ? '500' : '500')
    },
    textStyle
  ].filter(Boolean) as TextStyle[];

  return (
    <Pressable
      style={buttonStyles}
      onPress={onPress}
    >
      {variant === 'pill' && count !== undefined ? (
        <View style={styles.pillContent}>
          <RNText style={textStyles}>
            {label}
          </RNText>
          <View style={[
            styles.pillBadge,
            isActive && { backgroundColor: activeColor }
          ]}>
            <RNText style={[
              styles.pillBadgeText,
              isActive && { color: '#FFFFFF' }
            ]}>
              {count}
            </RNText>
          </View>
        </View>
      ) : (
        <RNText style={textStyles}>
          {label}
        </RNText>
      )}
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
  },

  // Tab button styles (modern underline style, no borders)
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } as any)
  },

  tabButtonActive: {
    borderBottomColor: '#2A2E33',
  },

  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },

  tabButtonTextActive: {
    color: '#2A2E33',
    fontWeight: '600' as TextStyle['fontWeight'],
  },

  // Pill button styles (modern pills with badges)
  pillButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    } as any)
  },

  pillButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  },

  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  pillBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  pillBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif'
    })
  }
});