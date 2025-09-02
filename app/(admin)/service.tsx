import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ForkModal, Text } from "~/components/ui";
import { DeleteConfirmationModal } from "~/components/ui/DeleteConfirmationModal";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Table } from "~/types/table.types";
import { Minus, Plus, Grid3X3Icon, ListFilter } from "lucide-react-native";
import OrderList from "~/components/Service/OrderList";
import { SearchBar } from "~/components/Service/SearchBar";
import { useOrderFilters } from "~/hooks/useOrderFilters";
import StartOrderCard from "~/components/Service/StartOrderCard";
import { Status } from "~/types/status.enum";
import AdminOrderDetailView from "~/components/Service/AdminOrderDetailView";
import PaymentView from "~/components/Service/PaymentView";
import { OrderItem } from '~/types/order-item.types';
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import {
  useRestaurant,
  useRooms,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { CustomModal } from '@/components/CustomModal';
import OrderItemsForm from '@/components/form/OrderItemsForm';
import { Order } from '@/types/order.types';
import { AdminFormView, useAdminFormView } from '~/components/admin/AdminFormView';

export default function ServicePage() {
  // AdminFormView pour la modal de commande
  const orderFormView = useAdminFormView();
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);
  const [isConfiguringMenu, setIsConfiguringMenu] = useState<boolean>(false);
  const [menuConfigActions, setMenuConfigActions] = useState<{
    onCancel: () => void;
    onConfirm: () => void;
  } | null>(null);
  // Hooks spécialisés pour chaque domaine
  const { rooms, currentRoom, setCurrentRoom } = useRooms();
  const { currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    deleteOrderItem,
    deleteManyOrderItems,
    updateOrderItemStatus
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();


  // État global
  const { isLoading } = useRestaurant();

  // ✅ Hook personnalisé pour centraliser la gestion des modals
  const useOrderModals = () => {
    const [modals, setModals] = useState({
      showReassignModal: false,
      isReassigning: false,
      showDeleteOrderDialog: false,
      showPaymentModal: false,
      showOrderDetailModal: false,
      cameFromOrderDetailModal: false,
      modalTitle: ""
    });

    const updateModal = useCallback((updates: Partial<typeof modals>) => {
      setModals(prev => ({ ...prev, ...updates }));
    }, []);

    const modalActions = useMemo(() => ({
      openReassign: () => updateModal({ showReassignModal: true }),
      closeReassign: () => updateModal({ showReassignModal: false }),
      setReassigning: (isReassigning: boolean) => updateModal({ isReassigning }),
      
      openDeleteDialog: () => updateModal({ showDeleteOrderDialog: true }),
      closeDeleteDialog: () => updateModal({ showDeleteOrderDialog: false }),
      
      openPayment: () => updateModal({ showPaymentModal: true }),
      closePayment: () => updateModal({ showPaymentModal: false }),
      
      openOrderDetail: (order?: Order) => {
        if (order?.tableId) setSelectedTable(order.tableId);
        updateModal({ showOrderDetailModal: true });
      },
      closeOrderDetail: () => {
        updateModal({ showOrderDetailModal: false });
        setSelectedTable(null);
      },
      
      setCameFromOrderDetail: (came: boolean) => updateModal({ cameFromOrderDetailModal: came }),
      setModalTitle: (title: string) => updateModal({ modalTitle: title })
    }), [updateModal]);

    return { modals, modalActions };
  };

  const { modals, modalActions } = useOrderModals();


  const { showToast } = useToast();

  // Hook pour la gestion des filtres et recherche
  const {
    searchQuery,
    filters,
    filteredOrders,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    isLoaded: filtersLoaded,
  } = useOrderFilters(currentRoomOrders.filter(order => order.lines && order.lines.length > 0));


  // Désélectionner la table lors de la navigation
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup : désélectionner lors du blur (navigation sortante)
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );


  // Fonction pour vérifier et supprimer une commande vide après suppression
  const checkAndHandleEmptyOrder = async (deletedItemIds: string[]) => {
    if (!selectedTableOrder) {
      return false;
    }

    // Calculer les orderLines restantes SANS attendre Redux
    const remainingOrderLines = selectedTableOrder.lines.filter(
      line => !deletedItemIds.includes(line.id)
    );


    if (remainingOrderLines.length === 0) {
      try {
        // FERMER LA MODAL EN PREMIER pour éviter l'effet de "vidage"
        modalActions.closeOrderDetail();

        // PUIS supprimer la commande vide
        await deleteOrder(selectedTableOrder.id);
        showToast('Commande supprimée car vide.', 'info');
        return true; // Commande était vide et supprimée
      } catch (error) {
        console.error('Erreur lors de la suppression de la commande vide:', error);
        showToast('Erreur lors de la suppression de la commande vide.', 'error');
      }
    }
    return false; // Commande pas vide
  };

  const handleChangeRoom = (room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  };

  const handleTablePress = (table: Table | null) => {
    if (!table) return;

    // Supprimer les commandes vides si on change de table
    if (selectedTableId && selectedTableOrder && (!selectedTableOrder.lines || selectedTableOrder.lines.length === 0)) {
      try {
        deleteOrder(selectedTableOrder.id);
      } catch (error) {
        console.error('Failed to delete empty order:', error);
      }
    }

    setSelectedTable(table.id);

    // Si la table a une commande, ouvrir directement la modal de détails
    const tableOrder = currentRoomOrders.find(order => order.tableId === table.id);
    if (tableOrder) {
      handleOpenOrderDetailModal(tableOrder);
    }
  };

  const handleCreateOrder = () => {
    if (!selectedTableId) {
      showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
      return;
    }
    const existingOrder = currentRoomOrders.find(order => order.tableId === selectedTableId);
    if (existingOrder) {
      showToast('Une commande existe déjà pour cette table.', 'warning');
      return;
    }

    // NOUVEAU FLUX : Ouvrir directement le formulaire SANS créer de commande
    // La commande sera créée à la fin quand le serveur validera avec les OrderLines
    setOrderCreatedFromStart(true); // Marquer qu'on vient du bouton "Start"
    modalActions.setCameFromOrderDetail(false); // Ne vient PAS de la modal détails
    modalActions.setModalTitle(`Prendre la commande - ${selectedTable?.name}`); // Titre pour nouvelle commande
    orderFormView.openCreate(); // Ouvrir la AdminFormView
    showToast('Commande en cours de préparation.', 'info');
  };


  const handleOpenOrderModal = () => {
    setOrderCreatedFromStart(false); // Modal ouverte depuis le bouton "Modifier"
    modalActions.setCameFromOrderDetail(true); // Marquer qu'on vient de la modal détails
    modalActions.setModalTitle(selectedTableOrder ? `Modifier la commande - ${selectedTableOrder.table?.name || selectedTable?.name || 'Table'}` : "Modifier la commande"); // Titre stable pour modification
    // La commande courante est déjà disponible via selectedTableOrder
    orderFormView.openEdit(); // Ouvrir en mode édition
  };

  const handleOpenOrderDetailModal = modalActions.openOrderDetail;
  const handleCloseOrderDetailModal = modalActions.closeOrderDetail;


  // Ref pour tracker les sauvegardes en cours (persiste entre les renders)
  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);

  // ✅ Hook personnalisé pour la logique de fermeture intelligente
  const useSmartOrderClose = () => {
    return useCallback(() => {
      const wasSaving = !!isSavingOrderRef.current;
      const wasOrderCreatedFromStart = orderCreatedFromStart;
      
      // Fermer le formulaire
      orderFormView.close();
      setOrderCreatedFromStart(false);


      // Nettoyage conditionnel de commande vide (seulement si pas de sauvegarde)
      if (!wasSaving && selectedTableOrder && wasOrderCreatedFromStart && selectedTableOrder.lines.length === 0) {
        console.log('🔄 Suppression commande vide car créée depuis Start');
        deleteOrder(selectedTableOrder.id)
          .then(() => showToast('Commande annulée car aucun article n\'a été ajouté.', 'info'))
          .catch((error) => console.error('Erreur lors de la suppression:', error));
      }

      // Réouverture conditionnelle de la modal détails
      // Cas 1: On vient de la modal détails (modification) OU
      // Cas 2: On a créé la commande depuis Start ET elle a des items après sauvegarde
      if (wasSaving && wasOrderCreatedFromStart) {
        // Pour le cas du start, ouvrir immédiatement puisqu'on sait qu'il y a eu sauvegarde
        modalActions.openOrderDetail();
      } else if (selectedTableOrder && selectedTableOrder.lines.length > 0) {
        if (modals.cameFromOrderDetailModal || wasOrderCreatedFromStart) {
          modalActions.openOrderDetail();
        }
      }

      // Réinitialiser le ref à la fin
      isSavingOrderRef.current = false;
      modalActions.setCameFromOrderDetail(false);
    }, [
      orderFormView, 
      orderCreatedFromStart, 
      selectedTableOrder, 
      modals.cameFromOrderDetailModal, 
      modalActions, 
      deleteOrder, 
      showToast
    ]);
  };

  const handleSmartCloseOrderModal = useSmartOrderClose();

  // Fermeture automatique de la modale si l'ordre est supprimé (WebSocket)
  useEffect(() => {
    // Si la modale de détails est ouverte mais que selectedTableOrder devient null
    // (ex: ordre supprimé via WebSocket après suppression d'un menu), fermer la modale
    if (modals.showOrderDetailModal && !selectedTableOrder) {
      modalActions.closeOrderDetail();
    }
  }, [selectedTableOrder, modals.showOrderDetailModal, modalActions]);

  // Optimisation des callbacks pour performances mobiles - batching des re-renders
  const handleConfigurationModeChange = useCallback((configuring: boolean) => {
    React.startTransition(() => {
      setIsConfiguringMenu(configuring);
      if (!configuring) {
        setMenuConfigActions(null);
      }
    });
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: { onCancel: () => void; onConfirm: () => void } | null) => {
    React.startTransition(() => {
      setMenuConfigActions(actions);
    });
  }, []);

  const handleSaveOrder = async (getFormData: () => any) => {
    try {
      const formResult = getFormData();
      
      if (!formResult.isValid) {
        return false;
      }

      // Indiquer qu'on est en train de sauvegarder pour que handleSmartCloseOrderModal le sache
      isSavingOrderRef.current = true;

      // Utiliser la fonction de sauvegarde complexe fournie par OrderItemsForm
      if (formResult.data.processComplexSave && formResult.hasChanges) {
        const updatedOrder = await formResult.data.processComplexSave();
        
        // Stocker le résultat pour useSmartOrderClose
        isSavingOrderRef.current = { savedOrder: updatedOrder };
        
        // Désactiver le flag orderCreatedFromStart seulement
        // Ne pas toucher à cameFromOrderDetailModal - laisser useSmartOrderClose gérer la réouverture
        setOrderCreatedFromStart(false);

        showToast('Commande mise à jour avec succès.', 'success');
        return true;
      } else {
        // Pas de modifications, AdminFormView va fermer automatiquement
        setOrderCreatedFromStart(false);
        return true;
      }
    } catch (error) {
      console.error('Erreur dans handleSaveOrder:', error);
      showToast('Erreur lors de la mise à jour de la commande.', 'error');
      isSavingOrderRef.current = false;
      return false;
    }
  };

  const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
    if (!selectedTableOrder) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }

    try {
      const orderItemsIds = orderItems.map(orderItem => orderItem.id);
      // Utiliser l'action Redux au lieu de l'appel API direct
      await updateOrderItemStatus(orderItemsIds, status);
      showToast('Statut mis à jour avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    }
  };

  const handleDeleteOrder = async () => {
    if (!selectedTableOrder) return;

    try {
      await deleteOrder(selectedTableOrder.id);
      setSelectedTable(null);
      showToast('Commande supprimée avec succès.', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      showToast('Erreur lors de la suppression de la commande.', 'error');
    }
  };

  const handlePaymentComplete = async (_paymentData: any) => {
    try {
      // Ici, vous pouvez ajouter la logique pour traiter le paiement
      // Par exemple, appeler une API pour enregistrer le paiement

      modalActions.closePayment();
      modalActions.openOrderDetail(); // Rouvrir la modal de détails
      showToast('Paiement traité avec succès.', 'success');

      // Optionnel : fermer la commande ou changer son statut
      // await updateOrder({ ...selectedTableOrder, status: Status.PAID });
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
      showToast('Erreur lors du traitement du paiement.', 'error');
    }
  };

  const navigateToRoomEdit = () => {
    if (!currentRoom) return;
    router.push({
      pathname: "/(admin)/room_edition",
      params: { roomId: currentRoom.id }
    });
  };

  // Fonction pour gérer la déselection de table
  const handleDeselectTable = () => {
    setSelectedTable(null);
  };

  const { width } = useWindowDimensions();

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        style={{ flex: 1 }}
        hideCloseButton={true}
        width={width / 4}
        title="Service"
        onBack={handleDeselectTable}
      >
        <View style={{ padding: 16, flex: 1 }}>
          {isLoading || !filtersLoaded ? (
            <Text>Chargement...</Text>
          ) : (
            <>
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
              />
              <OrderList
                orders={filteredOrders}
                onOrderPress={(order) => {
                  handleOpenOrderDetailModal(order);
                }}
                onOrderDelete={handleDeleteOrder}
              />
            </>
          )}
        </View>
      </SidePanel>

      <View style={{ flex: 1, height: '100%', position: 'relative' }}>
        <View className='flex-row w-full justify-between' style={{ backgroundColor: '#FBFBFB', height: 50 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              height: '100%'
            }}
            className='flex-row p-2 flex-1'
          >
            {rooms.map((room, index) => (
              <Pressable
                key={`${room.name}-badge-${index}`}
                onPress={() => handleChangeRoom(room)}>
                <Badge
                  variant="outline"
                  className='mx-1'
                  active={room.id === currentRoom?.id}
                  size='lg'
                >
                  <Text>{room.name}</Text>
                </Badge>
              </Pressable>
            ))}
          </ScrollView>
          <Button
            onPress={() => navigateToRoomEdit()}
            className="w-[200px] h-[50px] flex items-center justify-center"
            style={{ backgroundColor: '#2A2E33', borderRadius: 0, height: 50 }}
          >
            <Text
              style={{
                fontSize: 14,
                color: '#FBFBFB',
                fontWeight: '500',
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              Mode édition
            </Text>
          </Button>
        </View>

        {selectedTable && !selectedTableOrder && (
          <StartOrderCard
            table={selectedTable}
            onStartPress={handleCreateOrder}
          />
        )}

        <RoomComponent
          tables={currentRoomTables.map(t => ({
            ...t,
            orders: t.currentOrder ? [t.currentOrder] : []
          }))}
          orders={currentRoomOrders}
          editingTableId={selectedTableId ?? undefined}
          editionMode={false}
          isLoading={isLoading}
          width={currentRoom?.width}
          height={currentRoom?.height}
          onTablePress={handleTablePress}
          onTableLongPress={handleTablePress}
          onTableUpdate={() => { }}
        />
      </View>

      {/* Modal pour les détails et actions de la commande */}
      <CustomModal
        isVisible={modals.showOrderDetailModal}
        onClose={handleCloseOrderDetailModal}
        width={900}
        height={700}
        title={selectedTableOrder ? `Détails de la commande - ${selectedTableOrder.table?.name || selectedTable?.name || 'Table'}` : "Détails de la commande"}
      >
        {selectedTableOrder && (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
            <AdminOrderDetailView
              order={selectedTableOrder}
              itemTypes={allItemTypes}
              onDeleteOrderItem={async (orderItemId) => {
                try {
                  await deleteOrderItem(orderItemId);
                  showToast('Élément supprimé avec succès.', 'success');

                  // Vérifier si la commande est maintenant vide IMMÉDIATEMENT
                  await checkAndHandleEmptyOrder([orderItemId]);
                } catch (error) {
                  console.error('Erreur lors de la suppression:', error);
                  showToast('Erreur lors de la suppression de l\'élément.', 'error');
                }
              }}
              onDeleteManyOrderItems={async (orderItemIds) => {
                try {
                  const result = await deleteManyOrderItems(orderItemIds);
                  showToast(`${result.deletedCount} éléments supprimés avec succès.`, 'success');

                  // Vérifier si la commande est maintenant vide IMMÉDIATEMENT
                  await checkAndHandleEmptyOrder(orderItemIds);

                  return result;
                } catch (error) {
                  console.error('Erreur lors de la suppression multiple:', error);
                  showToast('Erreur lors de la suppression des éléments.', 'error');
                  throw error;
                }
              }}
              onUpdateOrderItemStatus={handleStatusUpdate}
            />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <Button
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={modalActions.openReassign}
                >
                  <Text>Assigner une autre table</Text>
                </Button>
                <Button
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={modalActions.openPayment}
                >
                  <Text>Régler la note</Text>
                </Button>
                <Button
                  variant="destructive"
                  style={{ flex: 1 }}
                  onPress={modalActions.openDeleteDialog}
                >
                  <Text>Supprimer</Text>
                </Button>
              </View>
              <Button
                onPress={() => {
                  // Ne pas fermer la modal de détails, juste ouvrir la modal d'édition par-dessus
                  handleOpenOrderModal();
                }}
                className="w-full h-[50px] flex items-center justify-center"
                style={{ backgroundColor: '#2A2E33' }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: '#FBFBFB',
                    fontWeight: '500',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  Modifier la commande
                </Text>
              </Button>
            </View>
          </View>
        )}
      </CustomModal>

      {/* AdminFormView pour l'ajout/modification de commande */}
      <AdminFormView
        visible={orderFormView.isVisible}
        mode={orderFormView.mode}
        title={modals.modalTitle}
        onClose={handleSmartCloseOrderModal}
        onCancel={handleSmartCloseOrderModal}
        onSave={handleSaveOrder}
        hideHeaderAndActions={isConfiguringMenu}
        disableGlobalScroll={true} // Désactiver le scroll global pour permettre le layout custom d'OrderItemsForm
        configurationActions={menuConfigActions ? {
          onCancel: menuConfigActions.onCancel,
          onConfirm: menuConfigActions.onConfirm,
          cancelLabel: 'Annuler',
          confirmLabel: 'Confirmer la sélection',
          confirmButtonColor: '#059669' // Vert pour différencier de l'enregistrement normal
        } : undefined}
      >
        {(selectedTableOrder || orderCreatedFromStart) && (
          <OrderItemsForm
            order={selectedTableOrder || {
              id: 'new-order-' + selectedTableId,
              tableId: selectedTableId!,
              table: selectedTable!,
              lines: [],
              orderItems: [], // Compatibilité legacy
              individualItems: [], // Compatibilité legacy
              menus: [], // Compatibilité legacy
              status: Status.DRAFT,
              account: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }}
            items={allItems.filter(item => item.isActive)}
            itemTypes={allItemTypes}
            onConfigurationModeChange={handleConfigurationModeChange}
            onConfigurationActionsChange={handleConfigurationActionsChange}
          />
        )}
      </AdminFormView>

      {selectedTableOrder && modals.showDeleteOrderDialog && (
        <DeleteConfirmationModal
          isVisible={modals.showDeleteOrderDialog}
          onClose={() => {
            modalActions.closeDeleteDialog();
            modalActions.openOrderDetail(); // Rouvrir la modal de détails si annulation
          }}
          onConfirm={() => {
            modalActions.closeDeleteDialog();
            modalActions.closeOrderDetail();
            deleteOrder(selectedTableOrder.id);
            setSelectedTable(null);
          }}
          entityName={`de la table ${selectedTableOrder.table?.name || selectedTableOrder.table?.id || 'N/A'}`}
          entityType="la commande"
        />
      )}
      <CustomModal
        isVisible={modals.showReassignModal}
        onClose={() => {
          modalActions.closeReassign();
          modalActions.openOrderDetail(); // Rouvrir la modal de détails si fermeture
        }}
        width={800}
        height={600}
        title={modals.isReassigning ? "Assignation en cours..." : "Sélectionner une table"}
      >
        <View style={{ flex: 1, padding: 20 }}>
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%'
          }}>
            <RoomComponent
              tables={currentRoomTables.filter(table => !table.currentOrder)}
              width={currentRoom?.width}
              height={currentRoom?.height}
              editionMode={false}
              isLoading={isLoading || modals.isReassigning}
              containerDimensions={{ width: 760, height: 560 }} // 800-40 et 600-40 pour les paddings
              onTablePress={async (pressedTable: Table | null) => {
                if (pressedTable && selectedTableOrder && !modals.isReassigning) {
                  modalActions.setReassigning(true); // Bloquer les autres clics

                  try {
                    await updateOrder({ ...selectedTableOrder, tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    modalActions.closeReassign();
                    modalActions.openOrderDetail();
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
                    console.error('Erreur lors de la réassignation:', error);
                    showToast('Erreur lors de la réassignation.', 'error');
                  } finally {
                    modalActions.setReassigning(false); // Débloquer
                  }
                }
              }}
              onTableLongPress={async (pressedTable: Table | null) => {
                if (pressedTable && selectedTableOrder && !modals.isReassigning) {
                  modalActions.setReassigning(true); // Bloquer les autres clics

                  try {
                    await updateOrder({ ...selectedTableOrder, tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    modalActions.closeReassign();
                    modalActions.openOrderDetail();
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
                    console.error('Erreur lors de la réassignation:', error);
                    showToast('Erreur lors de la réassignation.', 'error');
                  } finally {
                    modalActions.setReassigning(false); // Débloquer
                  }
                }
              }}
              onTableUpdate={() => { }}
            />
          </View>
        </View>
      </CustomModal>

      {/* Modal de paiement */}
      <ForkModal
        visible={modals.showPaymentModal}
        onClose={() => {
          modalActions.closePayment();
          modalActions.openOrderDetail(); // Rouvrir la modal de détails si fermeture
        }}
        maxWidth={1200}
        title="Régler l'addition"
      >
        {selectedTableOrder && (
          <PaymentView
            order={selectedTableOrder}
            onClose={() => {
              modalActions.closePayment();
              modalActions.openOrderDetail(); // Rouvrir la modal de détails
            }}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </ForkModal>
    </View>
  );
}