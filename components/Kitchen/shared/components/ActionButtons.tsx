import React, { useState } from 'react';
import { View, TouchableOpacity, Text as RNText, StyleSheet, Modal, Pressable } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';

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
 * Composant qui gère les boutons d'action pour changer le statut des items
 *
 * Modes:
 * - 'single': Un seul bouton selon le statut (column mode)
 * - 'dual': Peut afficher deux boutons simultanément (ticket mode)
 * - 'none': Aucun bouton
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
  const hasInProgressItems = itemGroup.items.some(item => item.status === Status.INPROGRESS);

  const handleStart = () => {
    const filteredItemGroup = {
      ...itemGroup,
      items: itemGroup.items.filter(item => item.status === Status.PENDING)
    };
    onStatusChange(filteredItemGroup, Status.INPROGRESS);
  };

  const handleReady = () => {
    if (showModal) {
      setModalVisible(true);
    } else {
      const filteredItemGroup = {
        ...itemGroup,
        items: itemGroup.items.filter(item => item.status === Status.INPROGRESS)
      };
      onStatusChange(filteredItemGroup, Status.READY);
    }
  };

  const handleNotifyConfirm = () => {
    setModalVisible(false);
    const filteredItemGroup = {
      ...itemGroup,
      items: itemGroup.items.filter(item => item.status === Status.INPROGRESS)
    };
    onStatusChange(filteredItemGroup, Status.READY);
  };

  // Mode single: Affiche un seul bouton selon le statut
  if (mode === 'single') {
    if (status === Status.PENDING && hasPendingItems) {
      return (
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.7}>
          <RNText style={styles.startButtonText}>▶ Commencer</RNText>
        </TouchableOpacity>
      );
    }

    if (status === Status.INPROGRESS && hasInProgressItems) {
      return (
        <TouchableOpacity style={styles.readyButton} onPress={handleReady} activeOpacity={0.7}>
          <RNText style={styles.readyButtonText}>✓ Prêt</RNText>
        </TouchableOpacity>
      );
    }

    return null;
  }

  // Mode dual: Peut afficher 1 ou 2 boutons simultanément
  if (mode === 'dual') {
    if (!hasPendingItems && !hasInProgressItems) {
      return null;
    }

    return (
      <>
        <View style={styles.buttonsContainer}>
          {hasPendingItems && (
            <TouchableOpacity
              style={[
                styles.actionButtonBase,
                styles.startButton,
                hasInProgressItems && styles.dualButtonLeft,
              ]}
              onPress={handleStart}
              activeOpacity={0.7}
            >
              <RNText style={styles.startButtonText}>▶ Commencer</RNText>
            </TouchableOpacity>
          )}

          {hasInProgressItems && (
            <TouchableOpacity
              style={[
                styles.actionButtonBase,
                styles.readyButton,
                hasPendingItems && styles.dualButtonRight,
              ]}
              onPress={handleReady}
              activeOpacity={0.7}
            >
              <RNText style={styles.readyButtonText}>✓ Prêt à servir</RNText>
            </TouchableOpacity>
          )}
        </View>

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
                    <X size={20} color="#6B7280" strokeWidth={2} />
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
                    <Bell size={16} color="#FFFFFF" strokeWidth={2} />
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

  return null;
}

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    margin: 12,
    marginTop: 8,
  },
  actionButtonBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    flex: 1,
  },
  startButton: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 12,
    marginTop: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  readyButton: {
    backgroundColor: '#3B82F6',  // Bleu - cohérent avec utils.ts READY
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dualButtonLeft: {},
  dualButtonRight: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    color: '#2A2E33',
  },
  modalClose: {
    padding: 4,
  },
  modalText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalBold: {
    fontWeight: '700',
    color: '#2A2E33',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonConfirm: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',  // Bleu - cohérent avec utils.ts READY
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
