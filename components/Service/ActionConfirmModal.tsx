import { memo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import type { GroupedSection } from '~/hooks/order/useOrderStatusActions';
import { colors } from '~/theme';

interface ActionConfirmModalProps {
  isVisible: boolean;
  itemsData: {
    orderLineIds: string[];
    orderLineItemIds: string[];
    itemTypeNames?: string[];
    count: number;
    itemNames: string[];
    sections: GroupedSection[];
  } | null;
  onClose: () => void;
  onConfirm: () => void;
  variant: 'claim' | 'serve';
}

const VARIANT_CONFIG = {
  claim: {
    title: 'Réclamer',
    subtitle: 'Confirmation de réclamation',
    confirmText: 'Confirmer la réclamation',
    color: '#FB923C',
  },
  serve: {
    title: 'Servir',
    subtitle: 'Confirmation de service',
    confirmText: 'Confirmer le service',
    color: colors.success.base,
  },
} as const;

export const ActionConfirmModal = memo<ActionConfirmModalProps>(({
  isVisible,
  itemsData,
  onClose,
  onConfirm,
  variant,
}) => {
  const { renderPanel, clearPanel } = usePanelPortal();
  const config = VARIANT_CONFIG[variant];

  const handleClose = useCallback(() => {
    clearPanel();
    onClose();
  }, [clearPanel, onClose]);

  const handleConfirm = useCallback(() => {
    clearPanel();
    onConfirm();
  }, [clearPanel, onConfirm]);

  useEffect(() => {
    if (isVisible && itemsData) {
      renderPanel(
        <SlidePanel
          visible={true}
          onClose={handleClose}
          width={430}
        >
          <View style={styles.container}>
            {/* Banner coloré */}
            <View style={[styles.banner, { backgroundColor: config.color }]}>
              <Text style={styles.bannerText}>
                <Text style={styles.bannerBold}>{config.title}</Text>
                {' : ' + config.subtitle}
              </Text>
            </View>

            {/* Sections groupées par itemType */}
            <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
              {itemsData.sections.map((section, sIdx) => (
                <View key={sIdx} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {section.totalCount}x {section.itemTypeName}
                    </Text>
                  </View>
                  <View style={styles.sectionBlock}>
                    {section.items.map((item, iIdx) => (
                      <View key={iIdx} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{item.quantity}x</Text>
                        <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                          {item.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer avec boutons */}
            <View style={styles.footer}>
              <Pressable onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable onPress={handleConfirm} style={[styles.confirmButton, { backgroundColor: config.color }]}>
                <Text style={styles.confirmText}>Confirmer</Text>
              </Pressable>
            </View>
          </View>
        </SlidePanel>
      );
    } else {
      clearPanel();
    }
  }, [isVisible, itemsData, variant, config, handleClose, handleConfirm, renderPanel, clearPanel]);

  // Cleanup au démontage
  useEffect(() => {
    return () => clearPanel();
  }, [clearPanel]);

  return null;
});

ActionConfirmModal.displayName = 'ActionConfirmModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Banner
  banner: {
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
  // Scroll
  scrollArea: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  // Section (like DraftReviewPanelContent)
  section: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.gray[100],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBlock: {
    backgroundColor: colors.white,
  },
  // Item row (receipt style)
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gray[200],
  },
  itemQty: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray[500],
    marginRight: 6,
    flexShrink: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[800],
    flex: 1,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  confirmButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
