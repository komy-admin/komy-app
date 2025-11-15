import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { OrderDetailTabs } from './OrderDetailTabs';
import { OrderDetailItemCard } from './OrderDetailItemCard';
import { OrderDetailMenuCard } from './OrderDetailMenuCard';
import { OrderDetailActions } from './OrderDetailActions';
import { OrderDetailMultiSelectBar } from './OrderDetailMultiSelectBar';
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
  onBulkUpdateStatus?: (orderLineIds: string[], orderLineItemIds: string[], newStatus: Status) => Promise<void>;
  onDeleteOrderLine: (orderLineId: string) => Promise<void>;
  onDeleteMenuLine: (orderLineId: string) => Promise<void>;
  onReassignTable: () => void;
  onPayment: () => void;
  onTerminate: () => void;
  onDelete: () => void;
  isMultiSelectMode?: boolean;
  onToggleMultiSelectMode?: () => void;
}

export const OrderDetailView = React.memo<OrderDetailViewProps>(({
  order,
  itemTypes,
  onUpdateItemStatus,
  onUpdateMenuItemStatus,
  onBulkUpdateStatus,
  onDeleteOrderLine,
  onDeleteMenuLine,
  onReassignTable,
  onPayment,
  onTerminate,
  onDelete,
  isMultiSelectMode: externalMultiSelectMode,
  onToggleMultiSelectMode: externalToggleMultiSelectMode,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const [internalMultiSelectMode, setInternalMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  const isMultiSelectMode = externalMultiSelectMode !== undefined ? externalMultiSelectMode : internalMultiSelectMode;

  // Stocker l'order.id précédent pour détecter les changements
  const prevOrderIdRef = React.useRef(order.id);

  // Nettoyer la sélection quand on désactive le mode sélection
  React.useEffect(() => {
    if (!isMultiSelectMode) {
      setSelectedItems(new Set());
    }
  }, [isMultiSelectMode]);

  // Désactiver le mode sélection quand on change de commande
  React.useEffect(() => {
    // Ne se déclenche que si l'order.id a vraiment changé
    if (prevOrderIdRef.current !== order.id) {
      if (isMultiSelectMode) {
        if (externalToggleMultiSelectMode) {
          externalToggleMultiSelectMode();
        } else {
          setInternalMultiSelectMode(false);
        }
        setSelectedItems(new Set());
      }
      // Mettre à jour la ref
      prevOrderIdRef.current = order.id;
    }
  }, [order.id, isMultiSelectMode, externalToggleMultiSelectMode]);

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

  const handleUpdateMenuStatus = useCallback(async (orderLineItems: OrderLineItem[], newStatus: Status) => {
    if (!onBulkUpdateStatus) {
      showToast('Fonctionnalité non disponible', 'warning');
      return;
    }

    try {
      // Collecter tous les IDs des items du menu
      const orderLineItemIds = orderLineItems.map(item => item.id);

      // Un seul appel API pour tout mettre à jour
      await onBulkUpdateStatus([], orderLineItemIds, newStatus);
      showToast('Statut du menu mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur mise à jour menu:', error);
    }
  }, [onBulkUpdateStatus, showToast]);

  const handleDeleteMenu = useCallback(async (orderLineId: string, menuName: string) => {
    try {
      await onDeleteMenuLine(orderLineId);
      showToast('Menu supprimé avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    }
  }, [onDeleteMenuLine, showToast]);

  const toggleMultiSelectMode = useCallback(() => {
    if (externalToggleMultiSelectMode) {
      externalToggleMultiSelectMode();
    } else {
      setInternalMultiSelectMode((prev) => !prev);
    }
    setSelectedItems(new Set());
  }, [externalToggleMultiSelectMode]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleBulkStatusChange = useCallback(async (newStatus: Status) => {
    if (selectedItems.size === 0) return;

    try {
      if (onBulkUpdateStatus) {
        const orderLineIds: string[] = [];
        const orderLineItemIds: string[] = [];

        selectedItems.forEach((itemId) => {
          const orderLine = order.lines?.find((line) => line.id === itemId);
          if (orderLine) {
            if (orderLine.type === OrderLineType.ITEM) {
              orderLineIds.push(itemId);
            }
          } else {
            order.lines?.forEach((line) => {
              if (line.type === OrderLineType.MENU && line.items) {
                const menuItem = line.items.find((item) => item.id === itemId);
                if (menuItem) {
                  orderLineItemIds.push(itemId);
                }
              }
            });
          }
        });

        await onBulkUpdateStatus(orderLineIds, orderLineItemIds, newStatus);
      } else {
        const promises: Promise<void>[] = [];

        selectedItems.forEach((itemId) => {
          const orderLine = order.lines?.find((line) => line.id === itemId);
          if (orderLine) {
            if (orderLine.type === OrderLineType.ITEM) {
              promises.push(onUpdateItemStatus(orderLine, newStatus));
            }
          } else {
            order.lines?.forEach((line) => {
              if (line.type === OrderLineType.MENU && line.items) {
                const menuItem = line.items.find((item) => item.id === itemId);
                if (menuItem) {
                  promises.push(onUpdateMenuItemStatus(menuItem, newStatus));
                }
              }
            });
          }
        });

        await Promise.all(promises);
        showToast(`${selectedItems.size} article(s) mis à jour`, 'success');
      }

      setSelectedItems(new Set());
      toggleMultiSelectMode();
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
      console.error('Erreur bulk update:', error);
    }
  }, [selectedItems, order.lines, onUpdateItemStatus, onUpdateMenuItemStatus, onBulkUpdateStatus, showToast, toggleMultiSelectMode]);

  // Calculer le nombre total d'items visibles
  const totalVisibleCount = useMemo(() => {
    let count = 0;
    filteredItems.forEach((item) => {
      if (item.type === 'menu') {
        const menuLine = item.data as OrderLine;
        count += menuLine.items?.length || 0;
      } else {
        count += 1;
      }
    });
    return count;
  }, [filteredItems]);

  // Sélectionner/désélectionner tous les items visibles
  const handleSelectAll = useCallback(() => {
    const allVisibleIds: string[] = [];

    filteredItems.forEach((item) => {
      if (item.type === 'menu') {
        const menuLine = item.data as OrderLine;
        menuLine.items?.forEach((menuItem) => {
          allVisibleIds.push(menuItem.id);
        });
      } else if ('orderLineItem' in item.data) {
        const { orderLineItem } = item.data as { orderLineItem: OrderLineItem; menuName: string };
        allVisibleIds.push(orderLineItem.id);
      } else {
        const orderLine = item.data as OrderLine;
        allVisibleIds.push(orderLine.id);
      }
    });

    const allSelected = allVisibleIds.every(id => selectedItems.has(id));

    if (allSelected) {
      // Désélectionner tout
      setSelectedItems(new Set());
    } else {
      // Sélectionner tout
      setSelectedItems(new Set(allVisibleIds));
    }
  }, [filteredItems, selectedItems]);

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
        contentContainerStyle={[
          styles.scrollContent,
          isMultiSelectMode && styles.scrollContentWithBar
        ]}
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
                  onUpdateMenuStatus={handleUpdateMenuStatus}
                  onDelete={() => handleDeleteMenu(menuLine.id, menuLine.menu?.name || 'Menu')}
                  isMultiSelectMode={isMultiSelectMode}
                  selectedItems={selectedItems}
                  onToggleItemSelection={toggleItemSelection}
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
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedItems.has(orderLineItem.id)}
                    onToggleSelection={() => toggleItemSelection(orderLineItem.id)}
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
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedItems.has(orderLine.id)}
                    onToggleSelection={() => toggleItemSelection(orderLine.id)}
                  />
                );
              }
            }
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Multi-select bar */}
      {isMultiSelectMode && (
        <OrderDetailMultiSelectBar
          selectedCount={selectedItems.size}
          totalVisibleCount={totalVisibleCount}
          onCancel={() => {
            setSelectedItems(new Set());
            toggleMultiSelectMode();
          }}
          onStatusChange={handleBulkStatusChange}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Actions */}
      {!isMultiSelectMode && (
        <OrderDetailActions
          orderStatus={order.status}
          onReassignTable={onReassignTable}
          onPayment={onPayment}
          onTerminate={onTerminate}
          onDelete={onDelete}
        />
      )}
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
  scrollContentWithBar: {
    paddingBottom: 90,
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
