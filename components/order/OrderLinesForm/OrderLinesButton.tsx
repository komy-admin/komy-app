import { memo } from 'react';
import { Platform } from 'react-native';
import { Button, Text } from '~/components/ui';

// Constantes de style consolidées
const BUTTON_STYLES = {
  colors: {
    primary: '#2A2E33',
    primaryHover: '#1A1E23',
    secondary: '#6B7280',
    success: '#059669',
    background: '#FFFFFF',
    backgroundHover: '#F9FAFB',
    border: '#E5E7EB',
    borderHover: '#D1D5DB',
    textPrimary: '#FFFFFF',
    textSecondary: '#6B7280',
  },
  spacing: {
    height: 44,
    borderRadius: 12,
    gap: 12,
  },
  typography: {
    primary: {
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
    secondary: {
      fontSize: 16,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
    config: {
      fontSize: 14,
      fontWeight: '700' as const,
      letterSpacing: 0.5,
    },
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
};

export interface OrderLinesButtonProps {
  children: string;
  variant?: 'primary' | 'secondary' | 'config' | 'configCancel';
  disabled?: boolean;
  onPress: () => void;
  style?: any;
  backgroundColor?: string;
  flex?: number;
}

/**
 * Composant bouton optimisé pour OrderLinesForm
 * Reprend le design élégant de l'AdminFormView
 */
export const OrderLinesButton = memo<OrderLinesButtonProps>(({
  children,
  variant = 'primary',
  disabled = false,
  onPress,
  style,
  backgroundColor,
  flex = 1,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      flex,
      borderRadius: BUTTON_STYLES.spacing.borderRadius,
      height: BUTTON_STYLES.spacing.height,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? BUTTON_STYLES.colors.secondary : BUTTON_STYLES.colors.primary,
          ...BUTTON_STYLES.shadow,
          shadowColor: BUTTON_STYLES.colors.primary,
          ...(Platform.OS === 'web' && {
            ':hover': !disabled ? {
              backgroundColor: BUTTON_STYLES.colors.primaryHover,
              transform: 'translateY(-2px)',
              shadowOpacity: 0.3,
            } : {},
          }),
        };

      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: BUTTON_STYLES.colors.background,
          borderWidth: 2,
          borderColor: BUTTON_STYLES.colors.border,
          ...(Platform.OS === 'web' && {
            ':hover': !disabled ? {
              borderColor: BUTTON_STYLES.colors.borderHover,
              backgroundColor: BUTTON_STYLES.colors.backgroundHover,
              transform: 'translateY(-1px)',
            } : {},
          }),
        };

      case 'config':
        return {
          ...baseStyle,
          backgroundColor: backgroundColor || BUTTON_STYLES.colors.success,
          ...BUTTON_STYLES.shadow,
          shadowColor: backgroundColor || BUTTON_STYLES.colors.success,
          ...(Platform.OS === 'web' && {
            ':hover': !disabled ? {
              transform: 'translateY(-2px)',
              shadowOpacity: 0.3,
            } : {},
          }),
        };

      case 'configCancel':
        return {
          ...baseStyle,
          backgroundColor: BUTTON_STYLES.colors.background,
          borderWidth: 2,
          borderColor: BUTTON_STYLES.colors.border,
          ...(Platform.OS === 'web' && {
            ':hover': !disabled ? {
              borderColor: BUTTON_STYLES.colors.borderHover,
              backgroundColor: BUTTON_STYLES.colors.backgroundHover,
              transform: 'translateY(-1px)',
            } : {},
          }),
        };

      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          ...BUTTON_STYLES.typography.primary,
          color: BUTTON_STYLES.colors.textPrimary,
        };

      case 'secondary':
      case 'configCancel':
        return {
          ...BUTTON_STYLES.typography.secondary,
          color: BUTTON_STYLES.colors.textSecondary,
        };

      case 'config':
        return {
          ...BUTTON_STYLES.typography.config,
          color: BUTTON_STYLES.colors.textPrimary,
        };

      default:
        return BUTTON_STYLES.typography.primary;
    }
  };

  return (
    <Button
      disabled={disabled}
      onPress={onPress}
      style={[getButtonStyle(), style]}
    >
      <Text style={getTextStyle()}>
        {children}
      </Text>
    </Button>
  );
});

OrderLinesButton.displayName = 'OrderLinesButton';