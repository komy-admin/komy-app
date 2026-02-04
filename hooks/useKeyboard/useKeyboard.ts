/**
 * useKeyboard Hook
 *
 * Main hook for keyboard management in Fork'it
 * Provides unified API for keyboard state, animations, and control
 */

import { useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { isWeb, getKeyboardController, logKeyboardEvent } from '~/utils/keyboard.utils';
import { KEYBOARD_STATE } from '~/constants/keyboard.constants';
import { useKeyboardVisibility } from './useKeyboardVisibility';
import type {
  UseKeyboardReturn,
  KeyboardState,
  KeyboardDismissOptions,
  KeyboardReanimatedValues,
} from './types';

/**
 * Main keyboard hook
 *
 * Provides complete keyboard management:
 * - State tracking
 * - Animation values (Reanimated)
 * - Controller methods
 *
 * @returns Complete keyboard API
 *
 * @example
 * ```tsx
 * const { state, animated, dismiss } = useKeyboard();
 *
 * // Use animation values with Reanimated
 * const animatedStyle = useAnimatedStyle(() => ({
 *   transform: [{ translateY: animated.height.value }],
 * }));
 *
 * // Dismiss keyboard
 * const handleSubmit = async () => {
 *   await dismiss();
 * };
 * ```
 */
export const useKeyboard = (): UseKeyboardReturn => {
  // Get visibility state
  const visibility = useKeyboardVisibility();

  // Get keyboard module
  const keyboardModule = useMemo(() => {
    if (isWeb()) return null;
    return getKeyboardController();
  }, []);

  // Get animation values (Reanimated)
  const animated = useMemo<KeyboardReanimatedValues>(() => {
    if (!keyboardModule?.useReanimatedKeyboardAnimation) {
      // Fallback for web or if module not loaded
      return {
        height: { value: 0 },
        progress: { value: 0 },
      };
    }

    try {
      return keyboardModule.useReanimatedKeyboardAnimation();
    } catch (error) {
      logKeyboardEvent('error', 'Failed to get Reanimated keyboard animation', error);
      return {
        height: { value: 0 },
        progress: { value: 0 },
      };
    }
  }, [keyboardModule]);

  // Get full keyboard state
  const state = useMemo<KeyboardState>(() => {
    const baseState: KeyboardState = {
      isVisible: visibility.isVisible,
      height: visibility.height,
      progress: visibility.isVisible ? 1 : 0,
      duration: visibility.duration,
      timestamp: Date.now(),
      target: -1,
      type: 'default',
      appearance: 'default',
      state: visibility.isOpening
        ? KEYBOARD_STATE.OPENING
        : visibility.isClosing
        ? KEYBOARD_STATE.CLOSING
        : visibility.isVisible
        ? KEYBOARD_STATE.OPEN
        : KEYBOARD_STATE.CLOSED,
      heightPercentage: 0,
    };

    // Try to get more detailed state if available
    if (keyboardModule?.KeyboardController?.state) {
      try {
        const detailedState = keyboardModule.KeyboardController.state();
        return {
          ...baseState,
          ...detailedState,
          state: baseState.state,
          heightPercentage: (baseState.height / Platform.select({ ios: 812, android: 800, default: 800 })) * 100,
        };
      } catch (error) {
        logKeyboardEvent('warn', 'Failed to get detailed keyboard state', error);
      }
    }

    return baseState;
  }, [visibility, keyboardModule]);

  /**
   * Dismiss keyboard
   */
  const dismiss = useCallback(
    async (options?: KeyboardDismissOptions): Promise<void> => {
      if (isWeb()) {
        // On web, blur active element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      if (!keyboardModule?.KeyboardController?.dismiss) {
        logKeyboardEvent('warn', 'KeyboardController.dismiss not available');
        return;
      }

      try {
        await keyboardModule.KeyboardController.dismiss(options);
        logKeyboardEvent('debug', 'Keyboard dismissed', options);
      } catch (error) {
        logKeyboardEvent('error', 'Failed to dismiss keyboard', error);
      }
    },
    [keyboardModule]
  );

  /**
   * Set focus to prev/next/current input
   */
  const setFocusTo = useCallback(
    (direction: 'prev' | 'current' | 'next') => {
      if (isWeb()) {
        logKeyboardEvent('debug', 'setFocusTo not supported on web');
        return;
      }

      if (!keyboardModule?.KeyboardController?.setFocusTo) {
        logKeyboardEvent('warn', 'KeyboardController.setFocusTo not available');
        return;
      }

      try {
        keyboardModule.KeyboardController.setFocusTo(direction);
        logKeyboardEvent('debug', `Focus set to: ${direction}`);
      } catch (error) {
        logKeyboardEvent('error', `Failed to set focus to ${direction}`, error);
      }
    },
    [keyboardModule]
  );

  return {
    // State
    state,
    isVisible: state.isVisible,
    height: state.height,
    progress: state.progress,

    // Animation values
    animated,

    // Controller methods
    dismiss,
    setFocusTo,
  };
};
