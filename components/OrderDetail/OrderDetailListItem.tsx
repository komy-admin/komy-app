import { memo, useCallback } from 'react';
import { Pressable } from 'react-native';
import { OrderDetailItemCard } from './OrderDetailItemCard';
import { OrderDetailMenuCard } from './OrderDetailMenuCard';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { ItemType } from '~/types/item-type.types';
import { FilteredItem } from '~/hooks/useOrderDetailFiltering';
import { usePayments } from '@/hooks/usePayments';

interface OrderDetailListItemProps {
  item: FilteredItem;
  activeTab: string;
  itemTypes: ItemType[];
  onOpenItemStatusSelector: (orderLine: OrderLine) => void;
  onOpenMenuItemStatusSelector: (orderLineItem: OrderLineItem) => void;
  onOpenMenuStatusSelector: (orderLineItems: OrderLineItem[], currentStatus: any) => void;
  onOpenDeleteItemDialog: (orderLine: OrderLine) => void;
  onOpenDeleteMenuDialog: (menuLine: OrderLine) => void;
  onShowToast: (message: string, type: 'warning' | 'success' | 'error') => void;
}

/**
 * Composant mémoïsé pour rendre un item ou un menu
 * Extrait du map() pour optimiser les performances
 */
export const OrderDetailListItem = memo<OrderDetailListItemProps>((props) => {
  const {
    item,
    activeTab,
    itemTypes,
    onOpenItemStatusSelector,
    onOpenMenuItemStatusSelector,
    onOpenMenuStatusSelector,
    onOpenDeleteItemDialog,
    onOpenDeleteMenuDialog,
    onShowToast,
  } = props;

  const { getOrderLinePaymentFraction } = usePayments();

  // ✅ Handlers mémoïsés pour éviter les re-renders des enfants
  const handleDeleteMenuDialog = useCallback(() => {
    if (item.type === 'menu') {
      const menuLine = item.data as OrderLine;
      onOpenDeleteMenuDialog(menuLine);
    }
  }, [item, onOpenDeleteMenuDialog]);

  const handleMenuItemStatusSelector = useCallback((orderLineItem: OrderLineItem) => {
    onOpenMenuItemStatusSelector(orderLineItem);
  }, [onOpenMenuItemStatusSelector]);

  const handleItemStatusSelector = useCallback(() => {
    if (item.type === 'item' && 'id' in item.data) {
      onOpenItemStatusSelector(item.data as OrderLine);
    }
  }, [item, onOpenItemStatusSelector]);

  const handleDeleteItemDialog = useCallback(() => {
    if (item.type === 'item' && 'id' in item.data) {
      onOpenDeleteItemDialog(item.data as OrderLine);
    }
  }, [item, onOpenDeleteItemDialog]);

  const handleDeleteMenuItemWarning = useCallback(() => {
    onShowToast('Impossible de supprimer un item de menu', 'warning');
  }, [onShowToast]);

  // Render MENU
  if (item.type === 'menu') {
    const menuLine = item.data as OrderLine;
    return (
      <Pressable>
        <OrderDetailMenuCard
          menuLine={menuLine}
          itemTypes={itemTypes}
          onOpenItemStatusSelector={onOpenMenuItemStatusSelector}
          onOpenMenuStatusSelector={onOpenMenuStatusSelector}
          onOpenDeleteDialog={handleDeleteMenuDialog}
        />
      </Pressable>
    );
  }

  // Render ITEM from MENU
  if ('orderLineItem' in item.data) {
    const { orderLineItem, menuName } = item.data as {
      orderLineItem: OrderLineItem;
      menuName: string;
    };
    return (
      <Pressable>
        <OrderDetailItemCard
          orderLineItem={orderLineItem}
          isFromMenu={true}
          menuName={menuName}
          showItemTypeTag={activeTab === 'ALL'}
          itemTypeName={orderLineItem.item?.itemType?.name}
          onOpenStatusSelector={() => handleMenuItemStatusSelector(orderLineItem)}
          onOpenDeleteDialog={handleDeleteMenuItemWarning}
        />
      </Pressable>
    );
  }

  // Render ITEM standalone
  const orderLine = item.data as OrderLine;
  return (
    <Pressable>
      <OrderDetailItemCard
        orderLine={orderLine}
        showItemTypeTag={activeTab === 'ALL'}
        itemTypeName={orderLine.item?.itemType?.name}
        onOpenStatusSelector={handleItemStatusSelector}
        onOpenDeleteDialog={handleDeleteItemDialog}
        paymentFraction={getOrderLinePaymentFraction(orderLine.id, orderLine.totalPrice)}
      />
    </Pressable>
  );
});

OrderDetailListItem.displayName = 'OrderDetailListItem';
