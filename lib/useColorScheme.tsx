import { useColorScheme as useNativewindColorScheme } from 'nativewind';

export function useColorScheme() {
  // Force light theme only - no dark mode support
  return {
    colorScheme: 'light' as const,
    isDarkColorScheme: false,
    setColorScheme: () => {}, // Disable theme switching
    toggleColorScheme: () => {}, // Disable theme toggling
  };
}
