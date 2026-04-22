import React from 'react';
import { TouchableOpacity, Text as RNText, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Status } from '~/types/status.enum';
import { ItemGroup } from '~/types/kitchen.types';
import { colors } from '~/theme';

interface ActionButtonsProps {
  mode: 'single' | 'dual' | 'none';
  itemGroup: ItemGroup;
  status?: Status;
  onStatusChange: (itemGroup: ItemGroup, newStatus: Status) => void;
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
}: ActionButtonsProps) {
  if (mode === 'none') {
    return null;
  }

  const hasPendingItems = itemGroup.items.some(item => item.status === Status.PENDING);

  if (!hasPendingItems) {
    return null;
  }

  const handleReady = () => {
    const filteredItemGroup = {
      ...itemGroup,
      items: itemGroup.items.filter(item => item.status === Status.PENDING)
    };
    onStatusChange(filteredItemGroup, Status.READY);
  };

  return (
    <TouchableOpacity style={styles.readyButton} onPress={handleReady} activeOpacity={0.7}>
      <Bell size={15} color={colors.white} strokeWidth={2.5} />
      <RNText style={styles.readyButtonText}>Prêt à servir</RNText>
    </TouchableOpacity>
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
});
