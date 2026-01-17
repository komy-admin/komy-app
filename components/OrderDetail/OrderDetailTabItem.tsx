import { memo, useCallback } from 'react';
import { SelectButton } from '~/components/ui';

interface OrderDetailTabItemProps {
  itemTypeId: string;
  label: string;
  count: number;
  isActive: boolean;
  activeColor: string;
  activeBgColor: string;
  onTabChange: (tab: string) => void;
}

/**
 * Composant mémoïsé pour chaque tab ItemType
 * Chaque tab gère son propre handler mémoïsé
 */
export const OrderDetailTabItem = memo<OrderDetailTabItemProps>(({
  itemTypeId,
  label,
  count,
  isActive,
  activeColor,
  activeBgColor,
  onTabChange,
}) => {
  // ✅ Handler mémoïsé spécifique à ce tab
  const handlePress = useCallback(() => {
    onTabChange(itemTypeId);
  }, [onTabChange, itemTypeId]);

  return (
    <SelectButton
      label={label}
      count={count}
      isActive={isActive}
      onPress={handlePress}
      variant="pill"
      activeColor={activeColor}
      activeBgColor={activeBgColor}
    />
  );
});

OrderDetailTabItem.displayName = 'OrderDetailTabItem';
