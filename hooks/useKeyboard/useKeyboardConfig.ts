/**
 * useKeyboardConfig Hook
 *
 * Manages keyboard configuration per role/screen
 */

import { useState, useCallback, useMemo } from 'react';
import { getKeyboardConfig, validateKeyboardConfig } from '~/config/keyboard.config';
import type { KeyboardConfig, UseKeyboardConfigReturn, UserRole } from './types';
import { logKeyboardEvent } from '~/utils/keyboard.utils';

/**
 * Hook to manage keyboard configuration
 *
 * @param role - User role or screen context
 * @param initialConfig - Optional initial configuration overrides
 * @returns Keyboard configuration and management functions
 *
 * @example
 * ```tsx
 * const { config, updateConfig } = useKeyboardConfig('SERVER');
 *
 * // Later, adjust config for specific screen
 * updateConfig({ enableToolbar: false });
 * ```
 */
export const useKeyboardConfig = (
  role: UserRole = 'DEFAULT',
  initialConfig?: Partial<KeyboardConfig>
): UseKeyboardConfigReturn => {
  // Get base configuration for role
  const baseConfig = useMemo(() => getKeyboardConfig(role), [role]);

  // State for current configuration
  const [config, setConfig] = useState<KeyboardConfig>(() => {
    const merged = {
      ...baseConfig,
      ...initialConfig,
    };

    if (!validateKeyboardConfig(merged)) {
      logKeyboardEvent('warn', 'Invalid initial config, using base config', {
        role,
        initialConfig,
      });
      return baseConfig;
    }

    return merged;
  });

  /**
   * Update configuration with partial values
   */
  const updateConfig = useCallback(
    (partial: Partial<KeyboardConfig>) => {
      setConfig((prev) => {
        const updated = {
          ...prev,
          ...partial,
        };

        if (!validateKeyboardConfig(updated)) {
          logKeyboardEvent('warn', 'Invalid config update rejected', partial);
          return prev;
        }

        logKeyboardEvent('debug', 'Config updated', {
          from: prev,
          to: updated,
        });

        return updated;
      });
    },
    []
  );

  /**
   * Reset configuration to role defaults
   */
  const resetConfig = useCallback(() => {
    logKeyboardEvent('debug', 'Resetting config to defaults', { role });
    setConfig(baseConfig);
  }, [baseConfig, role]);

  return {
    config,
    updateConfig,
    resetConfig,
  };
};
