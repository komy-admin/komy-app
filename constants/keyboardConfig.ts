import { Platform } from 'react-native';

export const KEYBOARD_AWARE_CONFIG = {
  keyboardShouldPersistTaps: 'handled' as const,
  showsVerticalScrollIndicator: false,
  enableOnAndroid: true,
  enableAutomaticScroll: Platform.OS === 'android',
  extraScrollHeight: Platform.OS === 'android' ? 100 : 50,
  extraHeight: Platform.OS === 'android' ? 60 : 30,
  viewIsInsideTabBar: false,
  enableResetScrollToCoords: true,
  resetScrollToCoords: { x: 0, y: 0 },
  scrollEventThrottle: 32,
} as const;

// Configuration pour éviter les doubles repositionnements sur les longs contenus
export const KEYBOARD_AWARE_CONFIG_SMOOTH = {
  ...KEYBOARD_AWARE_CONFIG,
  enableResetScrollToCoords: true,
  resetScrollToCoords: { x: 0, y: 0 },
  scrollEventThrottle: 60, // Plus lent pour éviter les conflits
  keyboardDismissMode: 'none' as const, // Évite les conflits de timing
} as const;

// Configuration spéciale pour RoomFilters (contenu très long)
export const KEYBOARD_AWARE_CONFIG_LONG = {
  ...KEYBOARD_AWARE_CONFIG_SMOOTH,
  extraScrollHeight: Platform.OS === 'android' ? 120 : 60, // Plus d'espace
  extraHeight: Platform.OS === 'android' ? 80 : 40, // Plus de marge
  scrollEventThrottle: 80, // Encore plus lent pour contenu long
  enableResetScrollToCoords: true,
  resetScrollToCoords: { x: 0, y: 0 },
} as const;