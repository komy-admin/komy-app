import React, { useState } from 'react';
import { View, TouchableOpacity, Text as RNText, StyleSheet, Modal, Pressable } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';
import { colors } from '~/theme';
import { getColorWithOpacity } from '~/lib/color-utils';

interface ActionButtonsProps {
  mode: 'single' | 'dual' | 'none';
  itemGroup: ItemGroup;
  status?: Status;
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
  showModal?: boolean;
  onNotify?: () => void;
  tableShortId?: string;
}

/**
 * Composant qui gère le bouton d'action "Prêt à servir"
 * Transition : PENDING → READY
 */
export function ActionButtons({
  mode,
  itemGroup,
  status,
  onStatusChange,
  showModal = false,
  onNotify,
  tableShortId,
}: ActionButtonsProps) {
  const [modalVisible, setModalVisible] = useState(false);

  if (mode === 'none') {
    return null;
  }

  const hasPendingItems = itemGroup.items.some(item => item.status === Status.PENDING);

  const handleReady = () => {
    if (showModal) {
      setModalVisible(true);
    } else {
      const filteredItemGroup = {
        ...itemGroup,
        items: itemGroup.items.filter(item => item.status === Status.PENDING)
      };
      onStatusChange(filteredItemGroup, Status.READY);
    }
  };

  const handleNotifyConfirm = () => {
    setModalVisible(false);
    const filteredItemGroup = {
      ...itemGroup,
      items: itemGroup.items.filter(item => item.status === Status.PENDING)
    };
    onStatusChange(filteredItemGroup, Status.READY);
  };

  if (!hasPendingItems) {
    return null;
  }

  // Mode single (column) ou dual (ticket) — même bouton unique maintenant
  return (
    <>
      <TouchableOpacity style={styles.readyButton} onPress={handleReady} activeOpacity={0.7}>
        <Bell size={15} color={colors.white} strokeWidth={2.5} />
        <RNText style={styles.readyButtonText}>Prêt à servir</RNText>
      </TouchableOpacity>

      {showModal && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <RNText style={styles.modalTitle}>Notifier le Service</RNText>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                  <X size={20} color={colors.gray[500]} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <RNText style={styles.modalText}>
                Confirmer que la commande{' '}
                <RNText style={styles.modalBold}>{tableShortId}</RNText> est prête à être servie ?
              </RNText>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <RNText style={styles.modalButtonCancelText}>Annuler</RNText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalButtonConfirm}
                  onPress={handleNotifyConfirm}
                  activeOpacity={0.7}
                >
                  <Bell size={16} color={colors.white} strokeWidth={2} />
                  <RNText style={styles.modalButtonConfirmText}>Notifier</RNText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  readyButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.brand.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: getColorWithOpacity(colors.brand.dark, 0.5),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.dark,
  },
  modalClose: {
    padding: 4,
  },
  modalText: {
    fontSize: 15,
    color: colors.gray[500],
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBold: {
    fontWeight: '700',
    color: colors.brand.dark,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },
  modalButtonConfirm: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.info.base,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
