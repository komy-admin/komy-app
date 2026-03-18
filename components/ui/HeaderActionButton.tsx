import { Pressable, Text as RNText, StyleSheet, Platform, ViewStyle } from 'react-native';

interface HeaderActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'dark' | 'light';
  style?: ViewStyle;
}

export function HeaderActionButton({
  label,
  onPress,
  disabled = false,
  variant = 'dark',
  style,
}: HeaderActionButtonProps) {
  const isDark = variant === 'dark';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isDark ? styles.dark : styles.light,
        style,
      ]}
    >
      {({ pressed }) => (
        <RNText style={[
          styles.label,
          isDark ? styles.labelDark : styles.labelLight,
          pressed && styles.pressed,
        ]}>
          {label}
        </RNText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 175,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  dark: {
    backgroundColor: '#2A2E33',
  },
  light: {
    backgroundColor: '#F9F9FA',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelDark: {
    color: '#FBFBFB',
  },
  labelLight: {
    color: '#2A2E33',
  },
  pressed: {
    opacity: 0.6,
  },
});
