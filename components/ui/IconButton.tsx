import React, { memo, useMemo } from 'react';
import { TouchableOpacity, View, TouchableOpacityProps, StyleSheet } from 'react-native';
import {
  Eye,
  EyeOff,
  PencilLine,
  Trash2,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  Search,
  Filter
} from 'lucide-react-native';

export type IconName =
  | 'eye'
  | 'eye-off'
  | 'pencil'
  | 'trash'
  | 'plus'
  | 'x'
  | 'check'
  | 'chevron-down'
  | 'chevron-up'
  | 'settings'
  | 'search'
  | 'filter';

export type IconButtonVariant = 'success' | 'primary' | 'danger' | 'warning' | 'neutral';

interface IconButtonProps extends Omit<TouchableOpacityProps, 'style' | 'children'> {
  iconName: IconName;
  size?: number;
  variant?: IconButtonVariant;
  isTransparent?: boolean;
  iconColor?: string;
  onPress?: () => void;
}

// ✅ Constante hors du component (créée une seule fois)
const ICON_MAP: Record<IconName, React.ComponentType<any>> = {
  'eye': Eye,
  'eye-off': EyeOff,
  'pencil': PencilLine,
  'trash': Trash2,
  'plus': Plus,
  'x': X,
  'check': Check,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'settings': Settings,
  'search': Search,
  'filter': Filter,
};

// ✅ Constante pour le ratio icon/button (documentée)
const ICON_SIZE_RATIO = 0.44; // L'icône fait 44% de la taille du bouton

// ✅ Fonction pure pour obtenir le component Icon (pas de JSX)
const getIconComponent = (iconName: IconName) => ICON_MAP[iconName];

// ✅ Configuration des variants (constante hors du component)
const VARIANT_STYLES = {
  success: {
    transparent: {
      backgroundColor: '#F0FDF4',
      borderColor: '#10B981',
      iconColor: '#10B981',
    },
    solid: {
      backgroundColor: '#10B981',
      borderColor: '#059669',
      iconColor: '#FFFFFF',
    },
  },
  primary: {
    transparent: {
      backgroundColor: '#EFF6FF',
      borderColor: '#93C5FD',
      iconColor: '#3B82F6',
    },
    solid: {
      backgroundColor: '#3B82F6',
      borderColor: '#2563EB',
      iconColor: '#FFFFFF',
    },
  },
  danger: {
    transparent: {
      backgroundColor: '#FEE2E2',
      borderColor: '#FCA5A5',
      iconColor: '#EF4444',
    },
    solid: {
      backgroundColor: '#EF4444',
      borderColor: '#DC2626',
      iconColor: '#FFFFFF',
    },
  },
  warning: {
    transparent: {
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
      iconColor: '#F59E0B',
    },
    solid: {
      backgroundColor: '#F59E0B',
      borderColor: '#D97706',
      iconColor: '#FFFFFF',
    },
  },
  neutral: {
    transparent: {
      backgroundColor: '#F9FAFB',
      borderColor: '#D1D5DB',
      iconColor: '#6B7280',
    },
    solid: {
      backgroundColor: '#6B7280',
      borderColor: '#4B5563',
      iconColor: '#FFFFFF',
    },
  },
} as const;

export const IconButton = memo<IconButtonProps>(({
  iconName,
  size = 36,
  variant = 'neutral',
  isTransparent = true,
  iconColor,
  onPress,
  disabled,
  ...touchableProps
}) => {
  // ✅ useMemo : Calcule le style seulement si variant/isTransparent changent
  const variantStyles = useMemo(() => {
    const variantKey = isTransparent ? 'transparent' : 'solid';
    return VARIANT_STYLES[variant][variantKey];
  }, [variant, isTransparent]);

  // ✅ useMemo : Calcule les styles dynamiques seulement si les dépendances changent
  const containerStyle = useMemo(() => ({
    width: size,
    height: size,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
  }), [size, variantStyles.backgroundColor, variantStyles.borderColor]);

  const touchableStyle = useMemo(() => ({
    opacity: disabled ? 0.5 : 1,
  }), [disabled]);

  // ✅ Calculs simples (pas besoin de useMemo pour ça)
  const finalIconColor = iconColor || variantStyles.iconColor;
  const iconSize = Math.round(size * ICON_SIZE_RATIO);
  const Icon = getIconComponent(iconName);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={touchableStyle}
      {...touchableProps}
    >
      <View style={[styles.container, containerStyle]}>
        <Icon size={iconSize} color={finalIconColor} />
      </View>
    </TouchableOpacity>
  );
});

IconButton.displayName = 'IconButton';

// ✅ StyleSheet.create : Optimisé par React Native (styles natifs)
const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
