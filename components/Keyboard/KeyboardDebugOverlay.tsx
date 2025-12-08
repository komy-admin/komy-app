/**
 * KeyboardDebugOverlay Component
 *
 * Visual debug overlay showing real-time keyboard state
 * Only renders in __DEV__ mode
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useKeyboard, useKeyboardDebug } from '~/hooks/useKeyboard';
import { KEYBOARD_DEBUG, KEYBOARD_Z_INDEX } from '~/constants/keyboard.constants';
import {
  getKeyboardTypeDisplayName,
  getKeyboardAppearanceDisplayName,
  formatKeyboardEvent,
} from '~/utils/keyboard.utils';
import type { KeyboardDebugOverlayProps, UserRole } from '~/hooks/useKeyboard/types';

/**
 * KeyboardDebugOverlay
 *
 * Displays real-time keyboard debugging information
 * Toggle visibility by tapping the overlay
 *
 * @example
 * ```tsx
 * <KeyboardDebugOverlay visible={__DEV__} position="top-right" />
 * ```
 */
export const KeyboardDebugOverlay: React.FC<KeyboardDebugOverlayProps> = ({
  visible = __DEV__,
  position = 'top-right',
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [role] = useState<UserRole>('DEFAULT');

  const keyboard = useKeyboard(role);
  const { debugInfo, clearMetrics } = useKeyboardDebug(role);

  // Don't render in production
  if (!__DEV__ || !visible) {
    return null;
  }

  const positionStyle = getPositionStyle(position);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <View style={[styles.overlay, positionStyle]} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.container}
        onPress={toggleExpanded}
        onLongPress={clearMetrics}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            🎹 Keyboard Debug {isExpanded ? '▼' : '▶'}
          </Text>
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <View style={styles.content}>
            {/* Status */}
            <DebugRow
              label="Status"
              value={keyboard.state.state.toUpperCase()}
              highlight={keyboard.isVisible}
            />

            {/* Visibility */}
            <DebugRow
              label="Visible"
              value={keyboard.isVisible ? 'YES' : 'NO'}
              highlight={keyboard.isVisible}
            />

            {/* Height */}
            <DebugRow
              label="Height"
              value={`${Math.round(keyboard.height)}px (${keyboard.state.heightPercentage.toFixed(1)}%)`}
            />

            {/* Progress */}
            <DebugRow
              label="Progress"
              value={`${(keyboard.progress * 100).toFixed(1)}%`}
            />

            {/* Duration */}
            <DebugRow label="Duration" value={`${keyboard.state.duration}ms`} />

            {/* Keyboard Type */}
            <DebugRow
              label="Type"
              value={getKeyboardTypeDisplayName(keyboard.state.type)}
            />

            {/* Keyboard Appearance */}
            <DebugRow
              label="Appearance"
              value={getKeyboardAppearanceDisplayName(keyboard.state.appearance)}
            />

            {/* Platform */}
            <DebugRow label="Platform" value={`${Platform.OS} ${Platform.Version}`} />

            {/* Performance */}
            <View style={styles.separator} />
            <DebugRow
              label="Frame Drops"
              value={debugInfo.performance.frameDrops.toString()}
              highlight={debugInfo.performance.frameDrops > 0}
            />
            <DebugRow
              label="Avg Frame Time"
              value={`${debugInfo.performance.averageFrameTime.toFixed(2)}ms`}
              highlight={debugInfo.performance.averageFrameTime > 16.67}
            />

            {/* Config */}
            <View style={styles.separator} />
            <DebugRow label="Role" value={keyboard.config.role} />
            <DebugRow label="Behavior" value={keyboard.config.behavior} />
            <DebugRow
              label="Toolbar"
              value={keyboard.config.enableToolbar ? 'YES' : 'NO'}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Tap to collapse • Long press to clear metrics</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

/**
 * Debug row component
 */
const DebugRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
  </View>
);

/**
 * Get position style based on position prop
 */
const getPositionStyle = (
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
) => {
  switch (position) {
    case 'top-left':
      return { top: 50, left: 10 };
    case 'top-right':
      return { top: 50, right: 10 };
    case 'bottom-left':
      return { bottom: 50, left: 10 };
    case 'bottom-right':
      return { bottom: 50, right: 10 };
    default:
      return { top: 50, right: 10 };
  }
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    zIndex: KEYBOARD_Z_INDEX.DEBUG_OVERLAY,
    elevation: KEYBOARD_Z_INDEX.DEBUG_OVERLAY,
  },
  container: {
    backgroundColor: KEYBOARD_DEBUG.BACKGROUND_COLOR,
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    marginBottom: 8,
  },
  headerText: {
    color: KEYBOARD_DEBUG.TEXT_COLOR,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  content: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    color: '#888',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  value: {
    color: KEYBOARD_DEBUG.TEXT_COLOR,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  valueHighlight: {
    color: '#FFD700', // Gold
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 6,
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    color: '#666',
    fontSize: 9,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
