import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { Text as RNText } from 'react-native';
import { Portal } from '@rn-primitives/portal';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { getColorWithOpacity } from '~/lib/color-utils';
import { colors } from '~/theme';

function stripArticle(text: string): string {
  return text.replace(/^(l'|la |le |les |un |une |du |de la |des )/i, '');
}

interface DeleteConfirmPanelProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName: string;
  entityType: string;
  description?: string;
  isLoading?: boolean;
  delay?: number;
}

export function DeleteConfirmPanel({
  visible,
  onClose,
  onConfirm,
  entityName,
  entityType,
  description,
  isLoading = false,
  delay,
}: DeleteConfirmPanelProps) {
  const { topOffset } = usePanelPortal();
  const [remaining, setRemaining] = useState(delay ?? 0);
  const isLocked = remaining > 0;

  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (visible && delay && delay > 0) {
      setRemaining(delay);
    } else if (!visible) {
      setRemaining(0);
    }
  }, [visible, delay]);

  useEffect(() => {
    if (!visible || !delay || delay <= 0 || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, delay, remaining > 0]);

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!isLocked && !isLoading) {
      onConfirmRef.current();
    }
  }, [isLocked, isLoading]);

  if (!visible) return null;

  const canConfirm = !isLocked && !isLoading;

  return (
    <Portal name="delete-confirm-panel">
      <View style={[styles.container, { top: topOffset }]}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.panel}>
          {/* Banner */}
          <View style={styles.banner}>
            <RNText style={styles.bannerText}>
              <RNText style={styles.bannerBold}>Supprimer</RNText>
              {' : '}{stripArticle(entityType)}
            </RNText>
          </View>

          {/* Item header */}
          <View style={styles.itemHeader}>
            <RNText style={styles.itemName} numberOfLines={1}>{entityName}</RNText>
          </View>

          {/* Content */}
          <View style={styles.contentSection}>
            <RNText style={styles.message}>
              Êtes-vous sûr de vouloir supprimer {entityType}{' '}
              <RNText style={styles.messageBold}>{entityName}</RNText> ?
            </RNText>

            {description ? (
              <RNText style={styles.description}>{description}</RNText>
            ) : null}

            <RNText style={styles.warning}>Cette action est irréversible.</RNText>
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
            >
              <RNText style={styles.confirmButtonText}>
                {isLoading
                  ? 'Suppression...'
                  : isLocked
                    ? `Confirmer la suppression (${remaining}s)`
                    : 'Confirmer la suppression'}
              </RNText>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <RNText style={styles.separatorText}>ou</RNText>
              <View style={styles.separatorLine} />
            </View>

            <Pressable onPress={handleClose} disabled={isLoading} style={styles.cancelButton}>
              <RNText style={styles.cancelText}>Annuler</RNText>
            </Pressable>
          </View>
        </View>
      </View>
    </Portal>
  );
}

const PANEL_WIDTH = 430;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // top est défini dynamiquement via inline style (topOffset)
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.5),
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    backgroundColor: colors.white,
    ...Platform.select({
      web: {
        transition: 'transform 0.3s ease-out',
      },
    }),
  },
  // Banner
  banner: {
    backgroundColor: colors.error.text,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  bannerBold: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Item header
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  itemName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.neutral[800],
    letterSpacing: 0.3,
  },
  // Content
  contentSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  message: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  messageBold: {
    fontWeight: '700',
    color: colors.neutral[800],
  },
  description: {
    fontSize: 13,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  warning: {
    fontSize: 13,
    color: colors.error.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
  // Spacer
  spacer: {
    flex: 1,
  },
  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.error.text,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : {}),
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  separatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[400],
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[600],
  },
});
