/**
 * useKeyboardDebug Hook
 *
 * Debug utilities and monitoring for keyboard
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useKeyboard } from './useKeyboard';
import { isWeb, logKeyboardEvent } from '~/utils/keyboard.utils';
import type { UseKeyboardDebugReturn, KeyboardDebugInfo, UserRole } from './types';

/**
 * Hook for keyboard debugging and monitoring
 *
 * Provides:
 * - Real-time debug information
 * - Performance metrics
 * - Debug overlay toggle
 * - State logging
 *
 * @param role - User role for context
 * @returns Debug utilities
 *
 * @example
 * ```tsx
 * const { debugInfo, toggleDebugOverlay, logCurrentState } = useKeyboardDebug('SERVER');
 *
 * // Toggle debug overlay
 * <Button onPress={toggleDebugOverlay}>Toggle Debug</Button>
 *
 * // Log current state
 * useEffect(() => {
 *   logCurrentState();
 * }, []);
 * ```
 */
export const useKeyboardDebug = (role: UserRole = 'DEFAULT'): UseKeyboardDebugReturn => {
  // Get keyboard state
  const keyboard = useKeyboard(role);

  // Debug overlay visibility
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);

  // Performance metrics
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const frameDropsRef = useRef<number>(0);

  /**
   * Track keyboard events for performance monitoring
   */
  useEffect(() => {
    if (!__DEV__ || isWeb()) return;

    const now = performance.now();

    if (lastFrameTimeRef.current > 0) {
      const frameTime = now - lastFrameTimeRef.current;
      frameTimesRef.current.push(frameTime);

      // Keep only last 60 frames
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Detect frame drops (>16.67ms = 60fps threshold)
      if (frameTime > 16.67) {
        frameDropsRef.current += 1;
      }
    }

    lastFrameTimeRef.current = now;
  }, [keyboard.state.timestamp]);

  /**
   * Calculate average frame time
   */
  const getAverageFrameTime = useCallback((): number => {
    if (frameTimesRef.current.length === 0) return 0;

    const sum = frameTimesRef.current.reduce((a, b) => a + b, 0);
    return sum / frameTimesRef.current.length;
  }, []);

  /**
   * Build debug info object
   */
  const debugInfo: KeyboardDebugInfo = {
    currentState: keyboard.state,
    focusedInput: null, // Could be enhanced later
    performance: {
      frameDrops: frameDropsRef.current,
      averageFrameTime: getAverageFrameTime(),
      lastEventTimestamp: keyboard.state.timestamp,
    },
    config: keyboard.config,
    platform: {
      os: Platform.OS,
      version: Platform.Version,
      isTablet: Platform.isPad || false,
      supportsInteractiveDismiss: keyboard.config.enableGestureDismiss,
    },
  };

  /**
   * Toggle debug overlay
   */
  const toggleDebugOverlay = useCallback(() => {
    setDebugOverlayVisible((prev) => {
      const newValue = !prev;
      logKeyboardEvent('info', `Debug overlay ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  }, []);

  /**
   * Clear performance metrics
   */
  const clearMetrics = useCallback(() => {
    frameTimesRef.current = [];
    frameDropsRef.current = 0;
    lastFrameTimeRef.current = 0;
    logKeyboardEvent('info', 'Performance metrics cleared');
  }, []);

  /**
   * Log current keyboard state
   */
  const logCurrentState = useCallback(() => {
    const info = {
      state: keyboard.state.state,
      isVisible: keyboard.isVisible,
      height: keyboard.height,
      progress: keyboard.progress,
      duration: keyboard.state.duration,
      config: keyboard.config,
      performance: debugInfo.performance,
    };

    logKeyboardEvent('info', 'Current keyboard state:', info);

    console.group('🎹 Keyboard State Details');
    console.log('State:', keyboard.state.state);
    console.log('Visible:', keyboard.isVisible);
    console.log('Height:', keyboard.height);
    console.log('Progress:', keyboard.progress);
    console.log('Duration:', keyboard.state.duration);
    console.log('Config:', keyboard.config);
    console.log('Performance:', debugInfo.performance);
    console.groupEnd();
  }, [keyboard, debugInfo]);

  /**
   * Log keyboard events
   */
  useEffect(() => {
    if (!__DEV__ || !keyboard.config.enableDebug) return;

    // Log state changes
    logKeyboardEvent('debug', 'Keyboard state changed', {
      state: keyboard.state.state,
      height: keyboard.height,
      progress: keyboard.progress,
    });
  }, [keyboard.state.state, keyboard.config.enableDebug]);

  return {
    debugInfo,
    toggleDebugOverlay,
    clearMetrics,
    logCurrentState,
  };
};

/**
 * Persistent debug mode toggle (survives hot reload in dev)
 */
let persistentDebugMode = false;

export const togglePersistentDebugMode = () => {
  persistentDebugMode = !persistentDebugMode;
  logKeyboardEvent('info', `Persistent debug mode ${persistentDebugMode ? 'enabled' : 'disabled'}`);
  return persistentDebugMode;
};

export const isPersistentDebugMode = () => persistentDebugMode;
