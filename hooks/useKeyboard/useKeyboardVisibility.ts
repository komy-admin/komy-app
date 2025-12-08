/**
 * useKeyboardVisibility Hook
 *
 * Lightweight hook for tracking keyboard visibility state
 */

import { useMemo } from 'react';
import { isWeb, getKeyboardController } from '~/utils/keyboard.utils';
import { KEYBOARD_STATE, KEYBOARD_THRESHOLDS } from '~/constants/keyboard.constants';
import type { UseKeyboardVisibilityReturn } from './types';

/**
 * Hook to track keyboard visibility without re-renders
 *
 * Uses selector pattern to minimize re-renders
 *
 * @returns Keyboard visibility state
 *
 * @example
 * ```tsx
 * const { isVisible, height } = useKeyboardVisibility();
 *
 * useEffect(() => {
 *   if (isVisible) {
 *     console.log('Keyboard is visible with height:', height);
 *   }
 * }, [isVisible, height]);
 * ```
 */
export const useKeyboardVisibility = (): UseKeyboardVisibilityReturn => {
  // On web, keyboard is managed by browser
  if (isWeb()) {
    return {
      isVisible: false,
      isOpening: false,
      isClosing: false,
      height: 0,
      duration: 0,
    };
  }

  const keyboardModule = getKeyboardController();

  // Fallback if module not loaded
  if (!keyboardModule?.useKeyboardState) {
    return {
      isVisible: false,
      isOpening: false,
      isClosing: false,
      height: 0,
      duration: 0,
    };
  }

  const { useKeyboardState } = keyboardModule;

  // Use selectors to minimize re-renders
  const isVisible = useKeyboardState((state: any) => state.isVisible);
  const height = useKeyboardState((state: any) => state.height);
  const duration = useKeyboardState((state: any) => state.duration);

  // Compute opening/closing state
  const state = useMemo(() => {
    if (!isVisible && height < KEYBOARD_THRESHOLDS.MIN_HEIGHT) {
      return KEYBOARD_STATE.CLOSED;
    }

    if (isVisible && height >= KEYBOARD_THRESHOLDS.MIN_HEIGHT) {
      return KEYBOARD_STATE.OPEN;
    }

    if (!isVisible && height > 0) {
      return KEYBOARD_STATE.CLOSING;
    }

    if (isVisible && height < KEYBOARD_THRESHOLDS.MIN_HEIGHT) {
      return KEYBOARD_STATE.OPENING;
    }

    return KEYBOARD_STATE.CLOSED;
  }, [isVisible, height]);

  return {
    isVisible,
    isOpening: state === KEYBOARD_STATE.OPENING,
    isClosing: state === KEYBOARD_STATE.CLOSING,
    height,
    duration,
  };
};
