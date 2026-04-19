import { colors as colorsTokens } from './colors.tokens';

/**
 * Global color tokens — JS API.
 *
 * Consumed by StyleSheet / inline styles / JSX color props.
 * The same object is consumed by tailwind.config.js via colors.tokens.js
 * so the NativeWind utility classes stay in sync.
 *
 * Usage:
 *   import { colors } from '~/theme';
 *   <View style={{ backgroundColor: colors.brand.dark }} />
 *   <Text style={{ color: colors.neutral[500] }}>…</Text>
 *
 * Or through Tailwind utilities:
 *   <View className="bg-brand-dark text-neutral-500" />
 */
export const colors = colorsTokens as {
  brand: {
    dark: string;
    accent: string;
    accentDark: string;
  };
  neutral: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  gray: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  success: { base: string; bg: string; border: string; text: string; dark: string };
  error: { base: string; bg: string; border: string; text: string; dark: string };
  warning: { base: string; bg: string; border: string; text: string; dark: string };
  info: { base: string; bg: string; border: string; text: string };
  purple: { base: string; alt: string };
  pink: string;
  surface: { white: string; screen: string; card: string; muted: string };
  black: string;
  white: string;
};
