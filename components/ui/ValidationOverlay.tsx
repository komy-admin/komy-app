import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, Text as RNText } from 'react-native';
import { shadows, colors } from '~/theme';

export interface ValidationOverlayProps {
  title: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** If set, the confirm button is disabled and shows a countdown before enabling. */
  countdownSeconds?: number;
  /** Button background color while the countdown is active. Required if `countdownSeconds` is set. */
  confirmColorDisabled?: string;
}

/**
 * Fullscreen overlay used to validate a destructive action (terminate, delete, …).
 *
 * Layout: translucent white backdrop, centered title + confirm button + cancel button.
 * Optional countdown delays confirmation (used for irreversible deletions).
 */
export function ValidationOverlay({
  title,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
  countdownSeconds,
  confirmColorDisabled,
}: ValidationOverlayProps) {
  const [countdown, setCountdown] = useState(countdownSeconds ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!countdownSeconds) return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdownSeconds]);

  const isCountingDown = countdown > 0;
  const confirmBg = isCountingDown ? (confirmColorDisabled ?? confirmColor) : confirmColor;

  return (
    <View
      style={styles.overlay}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    >
      <View style={styles.message}>
        <RNText style={styles.messageText}>{title}</RNText>
      </View>
      <Pressable
        onPress={isCountingDown ? undefined : () => setTimeout(onConfirm, 0)}
        disabled={isCountingDown}
        style={[styles.confirmBtn, { backgroundColor: confirmBg }]}
      >
        <RNText style={styles.confirmBtnText}>
          {isCountingDown ? `${countdown}` : confirmLabel}
        </RNText>
      </Pressable>
      <Pressable onPress={() => setTimeout(onCancel, 0)} style={styles.cancelBtn}>
        <RNText style={styles.cancelBtnText}>ANNULER</RNText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 200,
    ...Platform.select({
      web: {
        backgroundColor: colors.glass.heavy,
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      } as any,
      android: {
        backgroundColor: colors.glass.opaque,
      },
      default: {
        backgroundColor: colors.glass.heavy,
      },
    }),
  },
  message: {
    marginBottom: 8,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  confirmBtn: {
    minWidth: 200,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.all,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1.5,
  },
  cancelBtn: {
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.all,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
