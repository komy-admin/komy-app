import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { OrderDetailTabs } from './OrderDetailTabs';
import { OrderDetailListItem } from './OrderDetailListItem';
import { OrderLine, OrderLineItem } from '~/types/order-line.types';
import { Order } from '~/types/order.types';
import { Status } from '~/types/status.enum';
import { ItemType } from '~/types/item-type.types';
import { useToast } from '~/components/ToastProvider';
import StatusSelector from '~/components/Service/StatusSelector';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';
import { useOrderDetailFiltering, FilteredItem } from '~/hooks/useOrderDetailFiltering';

export interface OrderDetailViewProps {
  order: Order;
  itemTypes: ItemType[];
  onUpdateItemStatus: (orderLine: OrderLine, newStatus: Status) => Promise<void>;
  onUpdateMenuItemStatus: (orderLineItem: OrderLineItem, newStatus: Status) => Promise<void>;
  onBulkUpdateStatus?: (orderLineIds: string[], orderLineItemIds: string[], newStatus: Status) => Promise<void>;
  onDeleteOrderLine: (orderLineId: string) => Promise<void>;
  onDeleteMenuLine: (orderLineId: string) => Promise<void>;
}

export const OrderDetailView = React.memo<OrderDetailViewProps>(({
  order,
  itemTypes,
  onUpdateItemStatus,
  onUpdateMenuItemStatus,
  onBulkUpdateStatus,
  onDeleteOrderLine,
  onDeleteMenuLine,
}) => {
  const [activeTab, setActiveTab] = useState('ALL');
  const { showToast } = useToast();

  // ✅ Hook custom pour la logique de filtrage (séparé pour la réutilisabilité)
  const { filteredItems, counts } = useOrderDetailFiltering(order.lines, activeTab, itemTypes);

  // State pour le StatusSelector global
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [selectedItemForStatus, setSelectedItemForStatus] = useState<{
    type: 'orderLine' | 'orderLineItem' | 'menuItems';
    data: OrderLine | OrderLineItem | OrderLineItem[];
    currentStatus: Status;
  } | null>(null);

  // State pour le DeleteConfirmationModal global
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<{
    type: 'orderLine' | 'menu';
    id: string;
    name: string;
  } | null>(null);

  // ✅ Handlers optimisés avec useCallback
  const handleOpenDeleteItemDialog = useCallback((orderLine: OrderLine) => {
    setSelectedItemForDelete({
      type: 'orderLine',
      id: orderLine.id,
      name: orderLine.item?.name || 'Article',
    });
    setShowDeleteDialog(true);
  }, []);

  const handleUpdateMenuStatus = useCallback(async (orderLineItems: OrderLineItem[], newStatus: Status) => {
    if (!onBulkUpdateStatus) {
      showToast('Fonctionnalité non disponible', 'warning');
      return;
    }

    try {
      const orderLineItemIds = orderLineItems.map(item => item.id);
      await onBulkUpdateStatus([], orderLineItemIds, newStatus);
      showToast('Statut du menu mis à jour avec succès', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour du statut', 'error');
      console.error('Erreur mise à jour menu:', error);
    }
  }, [onBulkUpdateStatus, showToast]);

  const handleOpenDeleteMenuDialog = useCallback((menuLine: OrderLine) => {
    setSelectedItemForDelete({
      type: 'menu',
      id: menuLine.id,
      name: menuLine.menu?.name || 'Menu',
    });
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedItemForDelete) return;

    setShowDeleteDialog(false);

    try {
      if (selectedItemForDelete.type === 'orderLine') {
        await onDeleteOrderLine(selectedItemForDelete.id);
        showToast('Article supprimé avec succès', 'success');
      } else if (selectedItemForDelete.type === 'menu') {
        await onDeleteMenuLine(selectedItemForDelete.id);
        showToast('Menu supprimé avec succès', 'success');
      }
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
      console.error('Erreur suppression:', error);
    } finally {
      setSelectedItemForDelete(null);
    }
  }, [selectedItemForDelete, onDeleteOrderLine, onDeleteMenuLine, showToast]);

  const handleOpenItemStatusSelector = useCallback((orderLine: OrderLine) => {
    setSelectedItemForStatus({
      type: 'orderLine',
      data: orderLine,
      currentStatus: orderLine.status || Status.PENDING,
    });
    setShowStatusSelector(true);
  }, []);

  const handleOpenMenuItemStatusSelector = useCallback((orderLineItem: OrderLineItem) => {
    setSelectedItemForStatus({
      type: 'orderLineItem',
      data: orderLineItem,
      currentStatus: orderLineItem.status || Status.PENDING,
    });
    setShowStatusSelector(true);
  }, []);

  const handleOpenMenuStatusSelector = useCallback((orderLineItems: OrderLineItem[], currentStatus: Status) => {
    setSelectedItemForStatus({
      type: 'menuItems',
      data: orderLineItems,
      currentStatus,
    });
    setShowStatusSelector(true);
  }, []);

  const handleStatusSelect = useCallback(async (newStatus: Status) => {
    if (!selectedItemForStatus) return;

    setShowStatusSelector(false);

    try {
      if (selectedItemForStatus.type === 'orderLine') {
        await onUpdateItemStatus(selectedItemForStatus.data as OrderLine, newStatus);
      } else if (selectedItemForStatus.type === 'orderLineItem') {
        await onUpdateMenuItemStatus(selectedItemForStatus.data as OrderLineItem, newStatus);
      } else if (selectedItemForStatus.type === 'menuItems') {
        await handleUpdateMenuStatus(selectedItemForStatus.data as OrderLineItem[], newStatus);
      }
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    } finally {
      setSelectedItemForStatus(null);
    }
  }, [selectedItemForStatus, onUpdateItemStatus, onUpdateMenuItemStatus, handleUpdateMenuStatus]);

  const handleCloseStatusSelector = useCallback(() => {
    setShowStatusSelector(false);
    setSelectedItemForStatus(null);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setSelectedItemForDelete(null);
  }, []);

  // ✅ keyExtractor optimisé
  const keyExtractor = useCallback((item: FilteredItem, index: number) => {
    if (item.type === 'menu') {
      return `menu-${(item.data as OrderLine).id}`;
    }
    if ('orderLineItem' in item.data) {
      return `menu-item-${item.data.orderLineItem.id}`;
    }
    return `item-${(item.data as OrderLine).id}`;
  }, []);

  // ✅ renderItem optimisé - extrait dans un composant séparé
  const renderItem = useCallback(({ item }: { item: FilteredItem }) => (
    <OrderDetailListItem
      item={item}
      activeTab={activeTab}
      itemTypes={itemTypes}
      onOpenItemStatusSelector={handleOpenItemStatusSelector}
      onOpenMenuItemStatusSelector={handleOpenMenuItemStatusSelector}
      onOpenMenuStatusSelector={handleOpenMenuStatusSelector}
      onOpenDeleteItemDialog={handleOpenDeleteItemDialog}
      onOpenDeleteMenuDialog={handleOpenDeleteMenuDialog}
      onShowToast={showToast}
    />
  ), [
    activeTab,
    itemTypes,
    handleOpenItemStatusSelector,
    handleOpenMenuItemStatusSelector,
    handleOpenMenuStatusSelector,
    handleOpenDeleteItemDialog,
    handleOpenDeleteMenuDialog,
    showToast,
  ]);

  // ✅ ListEmptyComponent optimisé
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun article dans cette catégorie</Text>
    </View>
  ), []);

  // ✅ ListFooterComponent optimisé
  const ListFooterComponent = useCallback(() => (
    <View style={styles.footer} />
  ), []);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <OrderDetailTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemTypes={itemTypes}
        counts={counts}
      />

      {/* ✅ FlatList avec virtualisation (bien plus performant que ScrollView + map) */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        // ✅ Optimisations critiques pour tablettes
        showsVerticalScrollIndicator={true}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        scrollEnabled={true}
        directionalLockEnabled={true}
        alwaysBounceVertical={true}
        // ✅ Performance optimizations
        removeClippedSubviews={true} // Enlève les vues hors écran (iOS/Android)
        maxToRenderPerBatch={10} // Rend 10 items max par batch
        updateCellsBatchingPeriod={50} // Attend 50ms entre les batches
        initialNumToRender={10} // Rend 10 items au départ
        windowSize={5} // Garde 5 écrans en mémoire (2.5 avant, 2.5 après)
        // ✅ Empty state
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
      />

      {/* StatusSelector global - un seul pour toutes les cards */}
      <StatusSelector
        visible={showStatusSelector}
        currentStatus={selectedItemForStatus?.currentStatus || Status.DRAFT}
        onClose={handleCloseStatusSelector}
        onStatusSelect={handleStatusSelect}
      />

      {/* DeleteConfirmationModal global - un seul pour toutes les cards */}
      {selectedItemForDelete && (
        <DeleteConfirmationModal
          isVisible={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          entityName={`"${selectedItemForDelete.name}"`}
          entityType={selectedItemForDelete.type === 'menu' ? 'le menu' : "l'article"}
          usePortal={true}
        />
      )}
    </View>
  );
});

OrderDetailView.displayName = 'OrderDetailView';

// ✅ StyleSheet.create pour performance native
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  footer: {
    height: 20,
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
