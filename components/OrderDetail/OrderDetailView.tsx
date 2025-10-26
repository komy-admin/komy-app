import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { OrderDetailTabs } from './OrderDetailTabs';
import { OrderDetailItemCard } from './OrderDetailItemCard';
import { OrderDetailMenuCard } from './OrderDetailMenuCard';
import { OrderDetailActions } from './OrderDetailActions';
import { OrderLine, OrderLineType, OrderLineItem } from '~/types/order-line.types';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';
import { ItemType } from '~/types/item-type.types';
import { useToast } from '~/components/ToastProvider';

export interface OrderDetailViewProps {
  order: Order;
  itemTypes: ItemType[];
  onUpdateItemStatus: (orderLine: OrderLine, newStatus: Status) => Promise<void>;
  onUpdateMenuItemStatus: (orderLineItem: OrderLineItem, newStatus: Status) => Promise<void>;
  onDeleteOrderLine: (orderLineId: string) => Promise<void>;
  onDeleteMenuLine: (orderLineId: string) => Promise<void>;
  onReassignTable: () => void;
  onPayment: () => void;
  onTerminate: () => void;
  onDelete: () => void;
}

export const OrderDetailView = React.memo<OrderDetailViewProps>(({
  order,
  itemTypes,
  onUpdateItemStatus,
  onUpdateMenuItemStatus,
  onDeleteOrderLine,
  onDeleteMenuLine,
  onReassignTable,
  onPayment,
  onTerminate,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const { showToast } = useToast();

  // Logique de regroupement des items par tab
  const { filteredItems, counts } = useMemo(() => {
    const menuLines = order.lines?.filter((line) => line.type === OrderLineType.MENU) || [];
    const itemLines = order.lines?.filter((line) => line.type === OrderLineType.ITEM) || [];

    // Compter tous les items (y compris ceux dans les menus)
    let totalMenuItems = 0;
    menuLines.forEach((menuLine) => {
      totalMenuItems += menuLine.items?.length || 0;
    });

    const allCount = itemLines.length + totalMenuItems;

    const counts: { all: number; menus: number; [key: string]: number } = {
      all: allCount,
      menus: menuLines.length,
    };

    // Compter par itemType
    itemTypes.forEach((itemType) => {
      counts[itemType.id] = 0;

      // Compter les items individuels de ce type
      itemLines.forEach((line: OrderLine) => {
        if (line.item?.itemType?.id === itemType.id) {
          counts[itemType.id]++;
        }
      });

      // Compter les items de menu de ce type
      menuLines.forEach((menuLine: OrderLine) => {
        menuLine.items?.forEach((menuItem: OrderLineItem) => {
          if (menuItem.item?.itemType?.id === itemType.id) {
            counts[itemType.id]++;
          }
        });
      });
    });

    // Filtrer selon le tab actif
    let filteredItems: {
      type: 'item' | 'menu';
      data: OrderLine | { orderLineItem: OrderLineItem; menuName: string };
    }[] = [];

    if (activeTab === 'ALL') {
      // Afficher tout
      menuLines.forEach((menuLine: OrderLine) => {
        filteredItems.push({ type: 'menu', data: menuLine });
      });
      itemLines.forEach((line: OrderLine) => {
        filteredItems.push({ type: 'item', data: line });
      });
    } else if (activeTab === 'MENUS') {
      // Afficher seulement les menus
      menuLines.forEach((menuLine: OrderLine) => {
        filteredItems.push({ type: 'menu', data: menuLine });
      });
    } else {
      // Afficher les items d'un itemType spécifique
      // Items individuels
      itemLines.forEach((line: OrderLine) => {
        if (line.item?.itemType?.id === activeTab) {
          filteredItems.push({ type: 'item', data: line });
        }
      });

      // Items de menu de ce type
      menuLines.forEach((menuLine: OrderLine) => {
        menuLine.items?.forEach((menuItem: OrderLineItem) => {
          if (menuItem.item?.itemType?.id === activeTab) {
            filteredItems.push({
              type: 'item',
              data: {
                orderLineItem: menuItem,
                menuName: menuLine.menu?.name || 'Menu',
              },
            });
          }
        });
      });
    }

    return { filteredItems, counts };
  }, [order.lines, activeTab, itemTypes]);

  const handleDeleteItem = useCallback(async (orderLineId: string, itemName: string) => {
    try {
      await onDeleteOrderLine(orderLineId);
      showToast('Article supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    }
  }, [onDeleteOrderLine, showToast]);

  const handleDeleteMenu = useCallback(async (orderLineId: string, menuName: string) => {
    try {
      await onDeleteMenuLine(orderLineId);
      showToast('Menu supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    }
  }, [onDeleteMenuLine, showToast]);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <OrderDetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemTypes={itemTypes}
        counts={counts}
      />

      {/* Contenu */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun article dans cette catégorie</Text>
          </View>
        ) : (
          filteredItems.map((item, index) => {
            if (item.type === 'menu') {
              const menuLine = item.data as OrderLine;
              return (
                <OrderDetailMenuCard
                  key={`menu-${menuLine.id}`}
                  menuLine={menuLine}
                  onUpdateItemStatus={onUpdateMenuItemStatus}
                  onDelete={() => handleDeleteMenu(menuLine.id, menuLine.menu?.name || 'Menu')}
                />
              );
            } else {
              // Vérifier si c'est un OrderLine ou un OrderLineItem
              if ('orderLineItem' in item.data) {
                const { orderLineItem, menuName } = item.data as {
                  orderLineItem: OrderLineItem;
                  menuName: string;
                };
                return (
                  <OrderDetailItemCard
                    key={`menu-item-${orderLineItem.id}`}
                    orderLineItem={orderLineItem}
                    isFromMenu={true}
                    menuName={menuName}
                    onStatusChange={(newStatus) =>
                      onUpdateMenuItemStatus(orderLineItem, newStatus)
                    }
                    onDelete={() => {
                      // On ne peut pas supprimer un item de menu individuellement
                      showToast('Impossible de supprimer un item de menu', 'warning');
                    }}
                  />
                );
              } else {
                const orderLine = item.data as OrderLine;
                return (
                  <OrderDetailItemCard
                    key={`item-${orderLine.id}`}
                    orderLine={orderLine}
                    onStatusChange={(newStatus) => onUpdateItemStatus(orderLine, newStatus)}
                    onDelete={() => handleDeleteItem(orderLine.id, orderLine.item?.name || 'Article')}
                  />
                );
              }
            }
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Actions */}
      <OrderDetailActions
        orderStatus={order.status}
        onReassignTable={onReassignTable}
        onPayment={onPayment}
        onTerminate={onTerminate}
        onDelete={onDelete}
      />
    </View>
  );
});

OrderDetailView.displayName = 'OrderDetailView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
