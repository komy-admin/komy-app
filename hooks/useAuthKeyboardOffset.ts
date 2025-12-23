/**
 * useAuthKeyboardOffset Hook
 *
 * Calculates keyboard vertical offset based on device orientation
 * for authentication screens (login, PIN verification, etc.)
 *
 * @returns keyboardVerticalOffset - Offset value for KeyboardAvoidingView
 *
 * @example
 * ```tsx
 * const keyboardVerticalOffset = useAuthKeyboardOffset();
 * <KeyboardSafeFormView keyboardVerticalOffset={keyboardVerticalOffset} />
 * ```
 */

import { useWindowDimensions } from 'react-native';

export const useAuthKeyboardOffset = (): number => {
  const { width, height } = useWindowDimensions();

  // Detect landscape mode
  const isLandscape = width > height;

  // In landscape, keyboard takes more vertical space
  // Adjust offset accordingly
  return isLandscape ? 150 : 80;
};
