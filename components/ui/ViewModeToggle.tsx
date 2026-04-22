import { ComponentType } from 'react';
import { View, Pressable, StyleSheet, Platform, ViewStyle } from 'react-native';
import { shadows, colors } from '~/theme';

type IconComponent = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface ViewModeOption<T extends string = string> {
  value: T;
  icon: IconComponent;
}

interface ViewModeToggleProps<T extends string = string> {
  options: ViewModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
  orientation?: 'horizontal' | 'vertical';
  showSeparator?: boolean;
  bordered?: boolean;
}

const ACTIVE_COLOR = colors.brand.dark;
const INACTIVE_COLOR = colors.gray[400];
const BUTTON_SIZE = 36;
const ICON_SIZE = 18;

/**
 * Generic view-mode toggle (2+ options with icons).
 *
 * Horizontal layout with optional leading separator fits header bars;
 * vertical layout fits side rails. Active option gets a white pill
 * with `shadows.bottom`; `bordered` adds a 1px grey border.
 */
export function ViewModeToggle<T extends string>({
  options,
  value,
  onChange,
  orientation = 'horizontal',
  showSeparator = false,
  bordered = false,
}: ViewModeToggleProps<T>) {
  const isVertical = orientation === 'vertical';

  return (
    <>
      {showSeparator && !isVertical && <View style={styles.separatorH} />}
      <View style={isVertical ? styles.containerV : styles.containerH}>
        {options.map((opt) => {
          const isActive = opt.value === value;
          const Icon = opt.icon;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.button,
                isActive && styles.buttonActive,
                isActive && bordered && styles.buttonActiveBordered,
              ]}
            >
              <Icon
                size={ICON_SIZE}
                color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                strokeWidth={2}
              />
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  separatorH: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginVertical: 8,
  },
  containerH: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  containerV: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as ViewStyle,
  buttonActive: {
    backgroundColor: colors.white,
    ...shadows.bottom,
  },
  buttonActiveBordered: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
});
