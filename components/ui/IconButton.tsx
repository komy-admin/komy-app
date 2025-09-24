import React, { memo } from 'react';
import { Pressable, View, PressableProps } from 'react-native';
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

interface IconButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  iconName: IconName;
  size?: number;
  variant?: IconButtonVariant;
  isTransparent?: boolean;
  iconColor?: string;
  onPress?: () => void;
}

const getIcon = (iconName: IconName, size: number, color: string) => {
  const icons = {
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

  const Icon = icons[iconName];
  return <Icon size={size} color={color} />;
};

const getVariantStyles = (variant: IconButtonVariant, isTransparent: boolean) => {
  const variants = {
    success: {
      backgroundColor: isTransparent ? '#F0FDF4' : '#10B981',
      borderColor: isTransparent ? '#10B981' : '#059669',
      iconColor: isTransparent ? '#10B981' : '#FFFFFF',
    },
    primary: {
      backgroundColor: isTransparent ? '#EFF6FF' : '#3B82F6',
      borderColor: isTransparent ? '#93C5FD' : '#2563EB',
      iconColor: isTransparent ? '#3B82F6' : '#FFFFFF',
    },
    danger: {
      backgroundColor: isTransparent ? '#FEE2E2' : '#EF4444',
      borderColor: isTransparent ? '#FCA5A5' : '#DC2626',
      iconColor: isTransparent ? '#EF4444' : '#FFFFFF',
    },
    warning: {
      backgroundColor: isTransparent ? '#FEF3C7' : '#F59E0B',
      borderColor: isTransparent ? '#FDE68A' : '#D97706',
      iconColor: isTransparent ? '#F59E0B' : '#FFFFFF',
    },
    neutral: {
      backgroundColor: isTransparent ? '#F9FAFB' : '#6B7280',
      borderColor: isTransparent ? '#D1D5DB' : '#4B5563',
      iconColor: isTransparent ? '#6B7280' : '#FFFFFF',
    },
  };

  return variants[variant];
};

export const IconButton = memo<IconButtonProps>(({
  iconName,
  size = 36,
  variant = 'neutral',
  isTransparent = true,
  iconColor,
  onPress,
  disabled,
  ...pressableProps
}) => {
  const variantStyles = getVariantStyles(variant, isTransparent);
  const finalIconColor = iconColor || variantStyles.iconColor;
  const iconSize = Math.round(size * 0.44);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        transform: pressed ? [{ scale: 0.95 }] : [{ scale: 1 }],
      })}
      {...pressableProps}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: 1,
        }}
      >
        {getIcon(iconName, iconSize, finalIconColor)}
      </View>
    </Pressable>
  );
});

IconButton.displayName = 'IconButton';