import { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SidePanel } from '~/components/SidePanel';
import { DraftReviewPanelContent } from '~/components/order/OrderLinesForm/DraftReviewPanelContent';
import { OrderDetailActions } from './OrderDetailActions';
import { ReassignTablePanel } from './ReassignTablePanel';
import { GroupStatusPickerModal } from '~/components/ui/GroupStatusPickerModal';
import { GroupDeletePickerModal } from '~/components/ui/GroupDeletePickerModal';
import { ValidationOverlay } from '~/components/ui/ValidationOverlay';
import { ActionConfirmModal } from '~/components/Service/ActionConfirmModal';
import { Order } from '~/types/order.types';
import { ItemType } from '~/types/item-type.types';
import { Room } from '~/types/room.types';
import { Table } from '~/types/table.types';
import { Status } from '~/types/status.enum';
import { useOrderStatusActions } from '~/hooks/order/useOrderStatusActions';
import { useOrderDetailLineActions } from '~/hooks/order/useOrderDetailLineActions';
import { useReassignTable } from '~/hooks/order/useReassignTable';
import { colors } from '~/theme';

export type OrderStatusActionsApi = ReturnType<typeof useOrderStatusActions>;
export type OrderDetailLineActionsApi = ReturnType<typeof useOrderDetailLineActions>;

export interface ReassignTableApi extends ReturnType<typeof useReassignTable> {
  rooms: Room[];
  enrichedTables: Table[];
}

export interface OrderDetailProps {
  order: Order;
  itemTypes: ItemType[];
  sidePanelWidth: number;
  title: string;
  onEdit: () => void;
  onPayment: () => void;
  onClose: () => void;
  onNoteChange: (note: string) => void;
  orderActions: OrderStatusActionsApi;
  lineActions: OrderDetailLineActionsApi;
  reassignApi?: ReassignTableApi;
}

export const OrderDetail = memo<OrderDetailProps>(({
  order,
  itemTypes,
  sidePanelWidth,
  title,
  onEdit,
  onPayment,
  onClose,
  onNoteChange,
  orderActions,
  lineActions,
  reassignApi,
}) => {
  const {
    hasDraftItems,
    hasReadyItems,
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
    handleDelete,
    handleConfirmDelete,
    showDeleteDialog,
    setShowDeleteDialog,
    handleTerminate,
    handleConfirmTerminate,
    showTerminateDialog,
    setShowTerminateDialog,
  } = orderActions;

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
  } = lineActions;

  const overlayActive = showDeleteDialog || showTerminateDialog;

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

  const showReassign = reassignApi?.showReassignInline ?? false;
  const handleCancelSidePanel = showReassign && reassignApi
    ? () => reassignApi.setShowReassignInline(false)
    : onClose;

  return (
    <View style={styles.orderDetailLayout}>
      <SidePanel
        title=""
        hideCloseButton={true}
        hideHeader={true}
        width={sidePanelWidth}
      >
        <DraftReviewPanelContent
          title={title}
          draftLines={order.lines}
          itemTypes={itemTypes}
          hideFooter={true}
          allowEditAll={true}
          onEdit={handleOpenStatusSelector}
          onEditGroup={handleOpenStatusSelectorGroup}
          onEditMenu={handleOpenMenuStatusSelector}
          onDelete={handleDeleteLineByIndex}
          onDeleteGroup={handleDeleteGroupByIndices}
          onCancel={handleCancelSidePanel}
        />
      </SidePanel>

      {showReassign && reassignApi ? (
        <ReassignTablePanel
          rooms={reassignApi.rooms}
          reassignRoomId={reassignApi.reassignRoomId}
          enrichedTables={reassignApi.enrichedTables}
          reassignRoom={reassignApi.reassignRoom}
          reassignRoomTables={reassignApi.reassignRoomTables}
          currentTableId={order.tableId ?? undefined}
          isReassigning={reassignApi.isReassigning}
          onRoomChange={reassignApi.handleReassignRoomChange}
          onConfirm={reassignApi.handleTableReassign}
          onBack={() => reassignApi.setShowReassignInline(false)}
        />
      ) : (
        <OrderDetailActions
          onAddItem={onEdit}
          onClaim={handleClaim}
          onServe={handleServe}
          hasDraftItems={hasDraftItems}
          hasReadyItems={hasReadyItems}
          onReassignTable={reassignApi ? reassignApi.handleReassignTable : undefined}
          onPayment={onPayment}
          onTerminate={handleTerminate}
          onDelete={handleDelete}
          onNoteChange={onNoteChange}
          order={order}
          blockInputs={overlayActive}
        />
      )}

      <GroupStatusPickerModal
        isVisible={!!menuStatusData}
        onClose={handleCloseMenuStatus}
        onConfirm={handleConfirmMenuStatus}
        itemName={menuStatusData?.itemName || ''}
        max={menuStatusData?.orderLineItemIds.length || 1}
        currentStatus={menuStatusData?.currentStatus || Status.DRAFT}
      />

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

      {showTerminateDialog && (
        <ValidationOverlay
          title="Terminer cette commande ?"
          confirmLabel="TERMINER"
          confirmColor={colors.brand.dark}
          onConfirm={handleConfirmTerminate}
          onCancel={handleCloseTerminateDialog}
        />
      )}
      {showDeleteDialog && (
        <ValidationOverlay
          title="Supprimer cette commande ?"
          confirmLabel="SUPPRIMER"
          confirmColor={colors.error.text}
          confirmColorDisabled="#F4ADAB"
          countdownSeconds={3}
          onConfirm={handleConfirmDelete}
          onCancel={handleCloseDeleteDialog}
        />
      )}
    </View>
  );
});

OrderDetail.displayName = 'OrderDetail';

const styles = StyleSheet.create({
  orderDetailLayout: {
    flex: 1,
    flexDirection: 'row',
  },
});
