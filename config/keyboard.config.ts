/**
 * Keyboard Configuration
 *
 * Role-based keyboard configurations for Fork'it
 */

import {
  KEYBOARD_BEHAVIOR,
  KEYBOARD_OFFSETS,
  KEYBOARD_FEATURES,
} from '~/constants/keyboard.constants';
import type { KeyboardConfig, UserRole } from '~/hooks/useKeyboard/types';
import { isInteractiveDismissSupported } from '~/utils/keyboard.utils';

/**
 * Default keyboard configuration
 */
const DEFAULT_CONFIG: KeyboardConfig = {
  role: 'DEFAULT',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.DEFAULT.vertical,
  bottomOffset: KEYBOARD_OFFSETS.DEFAULT.bottom,
  enableGestureDismiss: false,
  enableDebug: KEYBOARD_FEATURES.ENABLE_DEBUG_OVERLAY,
};

/**
 * Authentication screens configuration
 * Simple inputs (email, password, PIN)
 */
const AUTH_CONFIG: KeyboardConfig = {
  role: 'AUTH',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.AUTH.vertical,
  bottomOffset: KEYBOARD_OFFSETS.AUTH.bottom,
  enableGestureDismiss: isInteractiveDismissSupported(),
  enableDebug: __DEV__,
};

/**
 * Server role configuration
 * Complex forms, order taking, table notes
 */
const SERVER_CONFIG: KeyboardConfig = {
  role: 'SERVER',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.SERVER.vertical,
  bottomOffset: KEYBOARD_OFFSETS.SERVER.bottom,
  enableGestureDismiss: isInteractiveDismissSupported(),
  enableDebug: __DEV__,
};

/**
 * Admin role configuration
 * Menu editing, user management, room configuration
 */
const ADMIN_CONFIG: KeyboardConfig = {
  role: 'ADMIN',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.ADMIN.vertical,
  bottomOffset: KEYBOARD_OFFSETS.ADMIN.bottom,
  enableGestureDismiss: isInteractiveDismissSupported(),
  enableDebug: __DEV__,
};

/**
 * Cook role configuration
 * No text inputs - read-only kitchen display
 */
const COOK_CONFIG: KeyboardConfig = {
  role: 'COOK',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.COOK.vertical,
  bottomOffset: KEYBOARD_OFFSETS.COOK.bottom,
  enableGestureDismiss: false, // No keyboard, no dismiss needed
  enableDebug: __DEV__,
};

/**
 * Barman role configuration
 * No text inputs - button-based interface
 */
const BARMAN_CONFIG: KeyboardConfig = {
  role: 'BARMAN',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.BARMAN.vertical,
  bottomOffset: KEYBOARD_OFFSETS.BARMAN.bottom,
  enableGestureDismiss: false, // No keyboard, no dismiss needed
  enableDebug: __DEV__,
};

/**
 * Configuration registry
 */
export const KEYBOARD_CONFIGS: Record<UserRole, KeyboardConfig> = {
  DEFAULT: DEFAULT_CONFIG,
  AUTH: AUTH_CONFIG,
  SERVER: SERVER_CONFIG,
  ADMIN: ADMIN_CONFIG,
  COOK: COOK_CONFIG,
  BARMAN: BARMAN_CONFIG,
};

/**
 * Get keyboard configuration for a specific role
 */
export const getKeyboardConfig = (role?: UserRole): KeyboardConfig => {
  if (!role) return DEFAULT_CONFIG;
  return KEYBOARD_CONFIGS[role] || DEFAULT_CONFIG;
};

/**
 * Merge custom config with role defaults
 */
export const mergeKeyboardConfig = (
  role: UserRole,
  customConfig: Partial<KeyboardConfig>
): KeyboardConfig => {
  const baseConfig = getKeyboardConfig(role);
  return {
    ...baseConfig,
    ...customConfig,
  };
};

/**
 * Validate keyboard configuration
 */
export const validateKeyboardConfig = (config: KeyboardConfig): boolean => {
  // Check required fields
  if (!config.role || !config.behavior) {
    console.warn('[KEYBOARD] Invalid config: missing required fields');
    return false;
  }

  // Check offsets are numbers
  if (
    typeof config.verticalOffset !== 'number' ||
    typeof config.bottomOffset !== 'number'
  ) {
    console.warn('[KEYBOARD] Invalid config: offsets must be numbers');
    return false;
  }

  // Check behavior is valid
  const validBehaviors = Object.values(KEYBOARD_BEHAVIOR);
  if (!validBehaviors.includes(config.behavior as any)) {
    console.warn('[KEYBOARD] Invalid config: unknown behavior', config.behavior);
    return false;
  }

  return true;
};

/**
 * Get recommended config based on screen characteristics
 */
export const getRecommendedConfig = (options: {
  hasMultipleInputs?: boolean;
  hasComplexForm?: boolean;
  isReadOnly?: boolean;
  role?: UserRole;
}): KeyboardConfig => {
  const {
    hasMultipleInputs = false,
    hasComplexForm = false,
    isReadOnly = false,
    role = 'DEFAULT',
  } = options;

  let config = getKeyboardConfig(role);

  // Override based on screen characteristics
  if (isReadOnly) {
    // No keyboard interaction needed
    config = {
      ...config,
      enableGestureDismiss: false,
    };
  }

  return config;
};

/**
 * Export configurations for easy access
 */
export {
  DEFAULT_CONFIG,
  AUTH_CONFIG,
  SERVER_CONFIG,
  ADMIN_CONFIG,
  COOK_CONFIG,
  BARMAN_CONFIG,
};
