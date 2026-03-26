import { View, StyleSheet, Pressable, Platform, Text as RNText, ScrollView, LayoutChangeEvent } from 'react-native';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { navigationEvents } from '~/lib/navigation-events';
import { useToast } from '~/components/ToastProvider';
import { showApiError } from '~/lib/apiErrorHandler';
import { ActionConfirmModal } from '~/components/Service/ActionConfirmModal';
import { useMenu, useOrders } from '~/hooks/useRestaurant';
import { useAppSelector } from '~/store/hooks';
import { selectOrders } from '~/store/selectors';
import { Plus, ShoppingBag, LayoutDashboard, LayoutGrid } from 'lucide-react-native';
import { OrderLinesForm } from '~/components/order/OrderLinesForm';
import { useOrderLinesManager } from '~/hooks/order/useOrderLinesManager';
import { useOrderStatusActions } from '~/hooks/order/useOrderStatusActions';
import { useOrderDetailLineActions } from '~/hooks/order/useOrderDetailLineActions';
import { useOrderLines } from '~/hooks/useOrderLines';
import { OrderDetailActions } from '~/components/OrderDetail';
import { SidePanel } from '~/components/SidePanel';
import { DraftReviewPanelContent } from '~/components/order/OrderLinesForm/DraftReviewPanelContent';
import { Status } from '~/types/status.enum';
import { Order } from '~/types/order.types';
import { isOrderActive } from '~/utils/orderUtils';
import {
  getOrderGlobalStatus,
  getStatusColor,
  getStatusText,
  getStatusTextColor,
} from '~/lib/status.utils';
import { getColorWithOpacity } from '~/lib/color-utils';
import { formatPrice } from '~/lib/utils';
import { GroupDeletePickerModal } from '~/components/ui/GroupDeletePickerModal';
import { GroupStatusPickerModal } from '~/components/ui/GroupStatusPickerModal';
import PaymentView from '~/components/Service/PaymentView';

const STATUS_PRIORITY: Record<string, number> = {
  [Status.READY]: 0,
  [Status.PENDING]: 1,
  [Status.INPROGRESS]: 2,
  [Status.DRAFT]: 3,
  [Status.SERVED]: 4,
  [Status.ERROR]: 5,
  [Status.TERMINATED]: 6,
};

/**
 * Pre-compute daily order labels for all orders at once (O(n log n) instead of O(n²))
 */
function buildDailyOrderLabels(orders: Order[]): Map<string, string> {
  const labels = new Map<string, string>();
  const byDay = new Map<string, Order[]>();

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let dayOrders = byDay.get(dayKey);
    if (!dayOrders) {
      dayOrders = [];
      byDay.set(dayKey, dayOrders);
    }
    dayOrders.push(order);
  }

  for (const dayOrders of byDay.values()) {
    dayOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    dayOrders.forEach((order, i) => {
      labels.set(order.id, `C${String(i + 1).padStart(2, '0')}`);
    });
  }

  return labels;
}

const ConfirmDeleteOverlay = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => {
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={styles.confirmOverlay}>
      <View style={styles.overlayMessage}>
        <RNText style={styles.overlayMessageText}>Supprimer cette commande ?</RNText>
      </View>
      <Pressable
        onPress={countdown === 0 ? onConfirm : undefined}
        disabled={countdown > 0}
        style={[styles.deleteConfirmBtn, countdown > 0 && styles.confirmBtnDisabled]}
      >
        <RNText style={styles.confirmBtnText}>
          {countdown > 0 ? `${countdown}` : 'SUPPRIMER'}
        </RNText>
      </Pressable>
      <Pressable onPress={onCancel} style={styles.cancelBtn}>
        <RNText style={styles.cancelBtnText}>ANNULER</RNText>
      </Pressable>
    </View>
  );
};


type ServiceViewMode = 'rooms' | 'orders';

interface RoomlessServiceViewProps {
  viewModeToggle?: {
    viewMode: ServiceViewMode;
    onViewModeChange: (mode: ServiceViewMode) => void;
  };
  onEditModePress?: () => void;
}

export default function RoomlessServiceView({ viewModeToggle, onEditModePress }: RoomlessServiceViewProps = {}) {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState(false);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showPaymentView, setShowPaymentView] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(prev => Math.abs(prev - w) < 1 ? prev : w);
  }, []);

  const allStoreOrders = useAppSelector(selectOrders);
  const {
    orders: _orders,
    deleteOrder,
    updateOrder,
    updateOrderStatus,
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();
  const activeItems = useMemo(() => allItems.filter(item => item.isActive), [allItems]);
  const { deleteOrderLine, deleteOrderLines } = useOrderLines();
  const { showToast } = useToast();

  // Active orders sorted by status priority then by date
  const activeOrders = useMemo(() => {
    return allStoreOrders
      .filter(order => isOrderActive(order))
      .sort((a, b) => {
        const statusA = STATUS_PRIORITY[getOrderGlobalStatus(a)] ?? 9;
        const statusB = STATUS_PRIORITY[getOrderGlobalStatus(b)] ?? 9;
        if (statusA !== statusB) return statusA - statusB;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [allStoreOrders]);

  // Pre-compute daily labels for all orders (O(n log n) instead of O(n²))
  const dailyLabels = useMemo(() => buildDailyOrderLabels(allStoreOrders), [allStoreOrders]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return allStoreOrders.find(o => o.id === selectedOrderId) || null;
  }, [allStoreOrders, selectedOrderId]);

  // Responsive columns with min width
  const GRID_PADDING = 16;
  const GRID_GAP = 12;
  const MIN_CARD_WIDTH = 220;

  const numColumns = useMemo(() => {
    if (!containerWidth) return 2;
    const availableWidth = containerWidth - (GRID_PADDING * 2);
    const cols = Math.floor((availableWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
    return Math.max(1, Math.min(cols, 5));
  }, [containerWidth]);

  const cardWidth = useMemo(() => {
    if (!containerWidth) return MIN_CARD_WIDTH;
    const availableWidth = containerWidth - (GRID_PADDING * 2);
    const totalGap = (numColumns - 1) * GRID_GAP;
    return (availableWidth - totalGap) / numColumns;
  }, [containerWidth, numColumns]);

  const handleOrderCleanup = useCallback(() => {
    setSelectedOrderId(null);
    setShowOrderDetail(false);
  }, []);

  const {
    hasDraftItems,
    hasReadyItems,
    handleBulkUpdateStatus,
    handleClaim,
    confirmClaim,
    showClaimConfirmModal,
    setShowClaimConfirmModal,
    itemsToClaimData,
    setItemsToClaimData,
    handleServe,
    confirmServe,
    showServeConfirmModal,
    setShowServeConfirmModal,
    itemsToServeData,
    setItemsToServeData,
    handleDeleteLine,
    handleDelete,
    handleConfirmDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    handleTerminate,
    handleConfirmTerminate,
    showTerminateDialog,
    setShowTerminateDialog,
  } = useOrderStatusActions({
    selectedTableOrder: selectedOrder,
    allItemTypes,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    deleteOrderLine,
    showToast,
    onCleanup: handleOrderCleanup,
  });

  useEffect(() => {
    if (!showOrderDetail) {
      if (showTerminateDialog) setShowTerminateDialog(false);
      if (showDeleteDialog) setShowDeleteDialog(false);
    }
  }, [showOrderDetail, showTerminateDialog, setShowTerminateDialog, showDeleteDialog, setShowDeleteDialog]);

  const {
    statusGroupData,
    handleOpenStatusSelector,
    handleOpenStatusSelectorGroup,
    handleConfirmGroupStatus,
    handleCloseStatusGroup,
    menuStatusData,
    handleOpenMenuStatusSelector,
    handleConfirmMenuStatus,
    handleCloseMenuStatus,
    deleteGroupData,
    handleDeleteLineByIndex,
    handleDeleteGroupByIndices,
    handleConfirmDeleteGroup,
    handleCloseDeleteGroup,
  } = useOrderDetailLineActions({
    selectedTableOrder: selectedOrder,
    handleBulkUpdateStatus,
    handleDeleteLine,
    deleteOrderLines,
  });

  const initialLines = useMemo(() => selectedOrder?.lines || [], [selectedOrder?.id, selectedOrder?.lines]);

  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);
  const cameFromDetailViewRef = useRef<boolean>(false);

  const orderLinesManager = useOrderLinesManager({
    initialLines,
    mode: orderCreatedFromStart ? 'create' : 'edit',
    orderId: selectedOrder?.id,
    tableId: undefined,
    onSuccess: (updatedOrder) => {
      isSavingOrderRef.current = { savedOrder: updatedOrder };
      showToast('Commande mise à jour avec succès', 'success');
      setShowOrderForm(false);

      if (updatedOrder?.id) {
        setSelectedOrderId(updatedOrder.id);
      }
      setShowOrderDetail(true);
      cameFromDetailViewRef.current = false;

      setTimeout(() => {
        isSavingOrderRef.current = false;
      }, 500);
      setOrderCreatedFromStart(false);
    },
    onError: () => {
      showToast('Erreur lors de la mise à jour de la commande', 'error');
      isSavingOrderRef.current = false;
    },
  });

  // Reset on nav event
  const resetOrderLines = orderLinesManager.reset;
  useEffect(() => {
    return navigationEvents.on('/service', () => {
      resetOrderLines();
      setShowOrderForm(false);
      setShowOrderDetail(false);
      setShowPaymentView(false);
      setOrderCreatedFromStart(false);
      setSelectedOrderId(null);
    });
  }, [resetOrderLines]);

  // Reset when order disappears
  useEffect(() => {
    if (showOrderDetail && !selectedOrder && !isSavingOrderRef.current) {
      setShowOrderDetail(false);
      setSelectedOrderId(null);
    }
  }, [showOrderDetail, selectedOrder]);

  const handleCreateOrder = useCallback(() => {
    cameFromDetailViewRef.current = false;
    setOrderCreatedFromStart(true);
    setShowOrderForm(true);
  }, []);

  const handleCardPress = useCallback((order: Order) => {
    setSelectedOrderId(order.id);
    setShowOrderDetail(true);
  }, []);

  const handleSmartCloseOrderModal = useCallback(() => {
    orderLinesManager.reset();
    const cameFromDetail = cameFromDetailViewRef.current;

    setShowOrderForm(false);
    setOrderCreatedFromStart(false);

    if (cameFromDetail) {
      setShowOrderDetail(true);
      cameFromDetailViewRef.current = false;
    }

    setTimeout(() => {
      isSavingOrderRef.current = false;
    }, 300);
  }, [orderLinesManager]);

  const handleEditOrder = useCallback(() => {
    cameFromDetailViewRef.current = true;
    setShowOrderDetail(false);
    setOrderCreatedFromStart(false);
    setShowOrderForm(true);
  }, []);

  const orderNoteId = selectedOrder?.id;
  const handleNoteChange = useCallback(async (note: string) => {
    if (!orderNoteId) return;
    try {
      await updateOrder(orderNoteId, { note });
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la sauvegarde de la note');
    }
  }, [orderNoteId, updateOrder, showToast]);

  const handlePayment = useCallback(() => {
    setShowPaymentView(true);
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    showToast('Paiement traité avec succès', 'success');
  }, [showToast]);

  const handleBackFromPayment = useCallback(() => {
    setShowPaymentView(false);
  }, []);

  const handleTerminateFromPayment = useCallback(() => {
    setShowPaymentView(false);
    handleTerminate();
  }, [handleTerminate]);

  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedOrderId(null);
    setShowTerminateDialog(false);
  }, [setShowTerminateDialog]);

  const handleCloseDeleteDialog = useCallback(() => setShowDeleteDialog(false), [setShowDeleteDialog]);
  const handleCloseTerminateDialog = useCallback(() => setShowTerminateDialog(false), [setShowTerminateDialog]);
  const handleCloseClaimModal = useCallback(() => {
    setShowClaimConfirmModal(false);
    setItemsToClaimData(null);
  }, [setShowClaimConfirmModal, setItemsToClaimData]);
  const handleCloseServeModal = useCallback(() => {
    setShowServeConfirmModal(false);
    setItemsToServeData(null);
  }, [setShowServeConfirmModal, setItemsToServeData]);

  // ====================================================================
  // RENDER
  // ====================================================================

  // PaymentView
  if (showPaymentView && selectedOrder) {
    return (
      <PaymentView
        order={selectedOrder}
        tableName="Commande"
        onBack={handleBackFromPayment}
        onPaymentComplete={handlePaymentComplete}
        onTerminate={handleTerminateFromPayment}
      />
    );
  }

  // OrderLinesForm
  if (showOrderForm && (selectedOrder || orderCreatedFromStart)) {
    return (
      <View style={styles.columnLayout}>
        <View style={styles.flex1}>
          <OrderLinesForm
            title={orderCreatedFromStart ? 'Nouvelle commande' : `Commande`}
            lines={orderLinesManager.orderLines}
            items={activeItems}
            itemTypes={allItemTypes}
            onAddItem={orderLinesManager.addItem}
            onUpdateItem={orderLinesManager.updateItem}
            onAddMenu={orderLinesManager.addMenu}
            onUpdateMenu={orderLinesManager.updateMenu}
            onDeleteLine={orderLinesManager.deleteLine}
            onSave={orderLinesManager.save}
            onCancel={handleSmartCloseOrderModal}
            hasChanges={orderLinesManager.hasChanges}
            isProcessing={orderLinesManager.isProcessing}
          />
        </View>
      </View>
    );
  }

  // Order detail view
  if (showOrderDetail && selectedOrder) {
    const orderLabel = dailyLabels.get(selectedOrder.id) || 'C??';
    return (
      <View style={styles.flex1}>
        <View style={styles.orderDetailLayout}>
          <SidePanel
            title=""
            hideCloseButton={true}
            hideHeader={true}
            width={containerWidth ? containerWidth / 3 : 400}
          >
            <DraftReviewPanelContent
              title={`${orderLabel} - Commande`}
              draftLines={selectedOrder.lines}
              itemTypes={allItemTypes}
              hideFooter={true}
              allowEditAll={true}
              onEdit={handleOpenStatusSelector}
              onEditGroup={handleOpenStatusSelectorGroup}
              onEditMenu={handleOpenMenuStatusSelector}
              onDelete={handleDeleteLineByIndex}
              onDeleteGroup={handleDeleteGroupByIndices}
              onCancel={handleCloseOrderDetail}
            />
          </SidePanel>
          <OrderDetailActions
            onAddItem={handleEditOrder}
            onClaim={handleClaim}
            onServe={handleServe}
            hasDraftItems={hasDraftItems}
            hasReadyItems={hasReadyItems}
            onPayment={handlePayment}
            onTerminate={handleTerminate}
            onDelete={handleDelete}
            onNoteChange={handleNoteChange}
            order={selectedOrder}
          />

          <GroupStatusPickerModal
            isVisible={!!menuStatusData}
            onClose={handleCloseMenuStatus}
            onConfirm={handleConfirmMenuStatus}
            itemName={menuStatusData?.itemName || ''}
            max={menuStatusData?.orderLineItemIds.length || 1}
            currentStatus={menuStatusData?.currentStatus || Status.DRAFT}
          />

          {showTerminateDialog && (
            <View style={styles.confirmOverlay}>
              <View style={styles.overlayMessage}>
                <RNText style={styles.overlayMessageText}>Terminer cette commande ?</RNText>
              </View>
              <Pressable onPress={handleConfirmTerminate} style={styles.terminateConfirmBtn}>
                <RNText style={styles.confirmBtnText}>TERMINER</RNText>
              </Pressable>
              <Pressable onPress={handleCloseTerminateDialog} style={styles.cancelBtn}>
                <RNText style={styles.cancelBtnText}>ANNULER</RNText>
              </Pressable>
            </View>
          )}
          {showDeleteDialog && (
            <ConfirmDeleteOverlay
              onConfirm={handleConfirmDelete}
              onCancel={handleCloseDeleteDialog}
            />
          )}
        </View>

        {deleteGroupData && (
          <GroupDeletePickerModal
            isVisible={!!deleteGroupData}
            onClose={handleCloseDeleteGroup}
            onConfirm={handleConfirmDeleteGroup}
            itemName={deleteGroupData.itemName}
            max={deleteGroupData.indices.length}
            status={deleteGroupData.status}
          />
        )}
        {statusGroupData && (
          <GroupStatusPickerModal
            isVisible={!!statusGroupData}
            onClose={handleCloseStatusGroup}
            onConfirm={handleConfirmGroupStatus}
            itemName={statusGroupData.itemName}
            max={statusGroupData.indices.length}
            currentStatus={statusGroupData.currentStatus}
          />
        )}
        <ActionConfirmModal
          isVisible={showClaimConfirmModal}
          itemsData={itemsToClaimData}
          onClose={handleCloseClaimModal}
          onConfirm={confirmClaim}
          variant="claim"
        />
        <ActionConfirmModal
          isVisible={showServeConfirmModal}
          itemsData={itemsToServeData}
          onClose={handleCloseServeModal}
          onConfirm={confirmServe}
          variant="serve"
        />
      </View>
    );
  }

  // Main grid view
  return (
    <View style={styles.flex1} onLayout={handleContainerLayout}>
      {/* Header — same style as menu/team/service tabs bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        {viewModeToggle && (
          <>
            <View style={styles.headerSeparator} />
            <View style={styles.toggleContainer}>
              <Pressable
                onPress={() => viewModeToggle.onViewModeChange('rooms')}
                style={[styles.toggleButton, viewModeToggle.viewMode === 'rooms' && styles.toggleButtonActive]}
              >
                <LayoutDashboard
                  size={18}
                  color={viewModeToggle.viewMode === 'rooms' ? '#2A2E33' : '#9CA3AF'}
                  strokeWidth={2}
                />
              </Pressable>
              <Pressable
                onPress={() => viewModeToggle.onViewModeChange('orders')}
                style={[styles.toggleButton, viewModeToggle.viewMode === 'orders' && styles.toggleButtonActive]}
              >
                <LayoutGrid
                  size={18}
                  color={viewModeToggle.viewMode === 'orders' ? '#2A2E33' : '#9CA3AF'}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </>
        )}
        {viewModeToggle && onEditModePress ? (
          <Pressable onPress={onEditModePress} style={styles.editModeBtn}>
            <RNText style={styles.editModeBtnText}>MODE ÉDITION</RNText>
          </Pressable>
        ) : !viewModeToggle ? (
          <Pressable onPress={handleCreateOrder} style={styles.newOrderBtn}>
            <RNText style={styles.newOrderBtnText}>NOUVELLE COMMANDE</RNText>
          </Pressable>
        ) : null}
      </View>

      {activeOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color="#CBD5E1" strokeWidth={1.5} />
          <RNText style={styles.emptyTitle}>Aucune commande</RNText>
          <RNText style={styles.emptySubtitle}>
            {viewModeToggle ? 'Créez une commande depuis la vue salles' : 'Créez une nouvelle commande pour commencer'}
          </RNText>
          {!viewModeToggle && (
            <Pressable onPress={handleCreateOrder} style={styles.emptyBtn}>
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <RNText style={styles.emptyBtnText}>Nouvelle commande</RNText>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.gridContainer, { padding: GRID_PADDING }]}>
          <View style={[styles.grid, { gap: GRID_GAP }]}>
            {activeOrders.map((order) => {
              const globalStatus = getOrderGlobalStatus(order);
              const label = order.table?.name || dailyLabels.get(order.id) || 'C??';
              const lineCount = order.lines?.length || 0;
              const time = new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const updatedAt = new Date(order.updatedAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const statusColor = getStatusColor(globalStatus);
              const borderColor = getColorWithOpacity(getStatusTextColor(globalStatus), 0.5);

              return (
                <View
                  key={order.id}
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      borderColor: borderColor,
                      backgroundColor: statusColor,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => handleCardPress(order)}
                    style={({ pressed }) => [
                      styles.cardPressable,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View style={styles.cardInner}>
                      <View style={styles.cardHeader}>
                        <RNText style={styles.cardLabel}>{label}</RNText>
                        <RNText style={styles.cardTime}>{time}</RNText>
                      </View>
                      <RNText style={styles.cardArticles}>
                        {lineCount} {lineCount > 1 ? 'articles' : 'article'}
                      </RNText>
                      <View style={styles.cardBadges}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                          <RNText style={[styles.statusBadgeText, { color: getStatusTextColor(globalStatus) }]}>
                            {getStatusText(globalStatus)}
                          </RNText>
                        </View>
                        {(order.paymentStatus === 'paid' || order.paymentStatus === 'partial') && (
                          <View style={[
                            styles.statusBadge,
                            order.paymentStatus === 'paid' ? styles.paidBadge : styles.partialBadge,
                          ]}>
                            <RNText style={[
                              styles.statusBadgeText,
                              order.paymentStatus === 'paid' ? styles.paidBadgeText : styles.partialBadgeText,
                            ]}>
                              {order.paymentStatus === 'paid' ? 'Payé' : 'Partiel'}
                            </RNText>
                          </View>
                        )}
                      </View>
                      <View style={styles.cardFooter}>
                        <RNText style={styles.cardUpdatedAt}>Dernière maj : {updatedAt}</RNText>
                        <RNText style={styles.cardPrice}>{formatPrice(order.totalAmount)}</RNText>
                      </View>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: '#FFFFFF' },
  columnLayout: { flex: 1, flexDirection: 'column' },
  orderDetailLayout: { flex: 1, flexDirection: 'row' },

  // Header — matches RoomTabsHeader height (auto, dictated by content)
  header: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FBFBFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  headerSeparator: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as any,
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newOrderBtn: {
    backgroundColor: '#2A2E33',
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as any,
  newOrderBtnText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '500',
    textTransform: 'uppercase',
  } as any,
  editModeBtn: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  } as any,
  editModeBtnText: {
    fontSize: 14,
    color: '#FBFBFB',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as any,

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  } as any,
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  } as any,
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2E33',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  } as any,
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  } as any,

  // Grid
  gridContainer: {},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Card — identical to OrderItemsCardView
  card: {
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as any : {}),
  },
  cardPressable: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 9,
    gap: 8,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
  } as any,
  cardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  } as any,
  cardArticles: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  } as any,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardUpdatedAt: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  } as any,
  cardPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  } as any,
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  } as any,
  paidBadge: {
    backgroundColor: '#10B98120',
  },
  paidBadgeText: {
    color: '#059669',
  },
  partialBadge: {
    backgroundColor: '#F59E0B20',
  },
  partialBadgeText: {
    color: '#D97706',
  },

  // Overlays
  confirmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    zIndex: 200,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)',
      },
    }),
  } as any,
  overlayMessage: { marginBottom: 8 },
  overlayMessageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2A2E33',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as any,
  terminateConfirmBtn: {
    minWidth: 200,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)' },
      android: { elevation: 8 },
    }),
  } as any,
  deleteConfirmBtn: {
    minWidth: 200,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)' },
      android: { elevation: 8 },
    }),
  } as any,
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  } as any,
  cancelBtn: {
    minWidth: 200,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  } as any,
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as any,
});
