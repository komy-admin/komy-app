import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ConfirmDialog, ForkModal, Text, TextInput } from "~/components/ui";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState, useCallback, useRef } from "react";
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
    createOrderItem,
    deleteOrderItem,
    deleteManyOrderItems,
    updateOrderItemStatus
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();


  // État global
  const { isLoading } = useRestaurant();

  // État local de l'interface seulement
  const [showReassignModal, setShowReassignModal] = useState<boolean>(false);
  const [isReassigning, setIsReassigning] = useState<boolean>(false);
  const [showDeleteOrderDialog, setShowDeleteOrderDialog] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState<boolean>(false);
  const [cameFromOrderDetailModal, setCameFromOrderDetailModal] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>("");


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
  } = useOrderFilters(currentRoomOrders.filter(order => order.orderItems && order.orderItems.length > 0));


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

    // Calculer les orderItems restants SANS attendre Redux
    const remainingOrderItems = selectedTableOrder.orderItems.filter(
      item => !deletedItemIds.includes(item.id)
    );


    if (remainingOrderItems.length === 0) {
      try {
        // FERMER LA MODAL EN PREMIER pour éviter l'effet de "vidage"
        setShowOrderDetailModal(false);
        setSelectedTable(null);

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
    if (selectedTableId && selectedTableOrder && (!selectedTableOrder.orderItems || selectedTableOrder.orderItems.length === 0)) {
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

  const handleCreateOrder = async () => {
    try {
      if (!selectedTableId) {
        showToast('Veuillez sélectionner une table avant de créer une commande.', 'warning');
        return;
      }
      const existingOrder = currentRoomOrders.find(order => order.tableId === selectedTableId);
      if (existingOrder) {
        showToast('Une commande existe déjà pour cette table.', 'warning');
        return;
      }

      await createOrder(selectedTableId);
      setOrderCreatedFromStart(true); // Marquer que la commande a été créée depuis "Start"
      setCameFromOrderDetailModal(false); // Ne vient PAS de la modal détails
      setModalTitle(`Créer la commande - ${selectedTable?.name}`); // Titre stable pour nouvelle commande
      // selectedTableOrder sera mis à jour par Redux, on l'utilisera dans un useEffect
      orderFormView.openCreate(); // Ouvrir la AdminFormView
      showToast('Commande créée avec succès.', 'success');
    } catch (error) {
      showToast('Erreur lors de la création de la commande. Veuillez réessayer.', 'error');
      console.error(error);
    }
  };


  const handleOpenOrderModal = () => {
    setOrderCreatedFromStart(false); // Modal ouverte depuis le bouton "Modifier"
    setCameFromOrderDetailModal(true); // Marquer qu'on vient de la modal détails
    setModalTitle(selectedTableOrder ? `Modifier la commande - ${selectedTableOrder.table.name}` : "Modifier la commande"); // Titre stable pour modification
    // La commande courante est déjà disponible via selectedTableOrder
    orderFormView.openEdit(); // Ouvrir en mode édition
  };

  const handleOpenOrderDetailModal = (order?: Order) => {
    if (order && order.tableId) {
      setSelectedTable(order.tableId);
    }
    setShowOrderDetailModal(true);
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setSelectedTable(null); // Désélectionner la table à la fermeture
  };


  // Ref pour tracker les sauvegardes en cours (persiste entre les renders)
  const isSavingOrderRef = useRef(false);

  // Handler intelligent qui s'adapte selon le contexte
  const handleSmartCloseOrderModal = () => {    
    if (isSavingOrderRef.current) {
      // Si on est en train de sauvegarder, c'est AdminFormView qui ferme après succès
      orderFormView.close();
      isSavingOrderRef.current = false;
    } else {
      // Sinon, c'est une fermeture manuelle/annulation
      
      // Fermer immédiatement la modal
      orderFormView.close();

      // Reset tous les flags AVANT la logique de nettoyage pour éviter les conflits
      const wasOrderCreatedFromStart = orderCreatedFromStart;
      setOrderCreatedFromStart(false);

      // Exécuter la logique de nettoyage SEULEMENT lors d'une fermeture manuelle
      if (selectedTableOrder && wasOrderCreatedFromStart && selectedTableOrder.orderItems.length === 0) {
        deleteOrder(selectedTableOrder.id)
          .then(() => {
            showToast('Commande annulée car aucun article n\'a été ajouté.', 'info');
          })
          .catch((error) => {
            console.error('Erreur lors de la suppression:', error);
          });
      }

      // Si on vient de la modal de détails ET qu'il y a une commande avec des items, la rouvrir
      if (cameFromOrderDetailModal && selectedTableOrder && selectedTableOrder.orderItems.length > 0) {
        setShowOrderDetailModal(true);
      }

      setCameFromOrderDetailModal(false);
    }
  };

  const handleConfigurationModeChange = useCallback((configuring: boolean) => {
    setIsConfiguringMenu(configuring);
    // Si on sort du mode configuration, nettoyer immédiatement les actions pour éviter la latence
    if (!configuring) {
      setMenuConfigActions(null);
    }
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: { onCancel: () => void; onConfirm: () => void } | null) => {
    setMenuConfigActions(actions);
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
        
        // Désactiver les flags avant que AdminFormView appelle onClose automatiquement
        setOrderCreatedFromStart(false);
        setCameFromOrderDetailModal(false);

        // Planifier la réouverture de la modal détails après la fermeture automatique
        requestAnimationFrame(() => {
          if (updatedOrder && updatedOrder.orderItems && updatedOrder.orderItems.length > 0) {
            setShowOrderDetailModal(true);
          }
        });

        showToast('Commande mise à jour avec succès.', 'success');
        return true;
      } else {
        // Pas de modifications, AdminFormView va fermer automatiquement
        setOrderCreatedFromStart(false);
        setCameFromOrderDetailModal(false);
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

      setShowPaymentModal(false);
      setShowOrderDetailModal(true); // Rouvrir la modal de détails
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
        isVisible={showOrderDetailModal}
        onClose={handleCloseOrderDetailModal}
        width={900}
        height={700}
        title={selectedTableOrder ? `Détails de la commande - ${selectedTableOrder.table.name}` : "Détails de la commande"}
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
                  onPress={() => {
                    setShowReassignModal(true);
                  }}
                >
                  <Text>Assigner une autre table</Text>
                </Button>
                <Button
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setShowPaymentModal(true);
                  }}
                >
                  <Text>Régler la note</Text>
                </Button>
                <Button
                  variant="destructive"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setShowDeleteOrderDialog(true);
                  }}
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
        title={modalTitle}
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
        {selectedTableOrder && (
          <OrderItemsForm
            order={selectedTableOrder}
            items={allItems.filter(item => item.isActive)}
            itemTypes={allItemTypes}
            onConfigurationModeChange={handleConfigurationModeChange}
            onConfigurationActionsChange={handleConfigurationActionsChange}
          />
        )}
      </AdminFormView>

      {selectedTableOrder && showDeleteOrderDialog && (
        <ConfirmDialog
          open={showDeleteOrderDialog}
          onOpenChange={(value) => {
            setShowDeleteOrderDialog(value)
          }}
          title="Supprimer la commande"
          content="Êtes-vous sûr de vouloir supprimer cette commande ?"
          onCancel={() => {
            setShowDeleteOrderDialog(false);
            setShowOrderDetailModal(true); // Rouvrir la modal de détails si annulation
          }}
          onConfirm={() => {
            setShowDeleteOrderDialog(false);
            setShowOrderDetailModal(false);
            deleteOrder(selectedTableOrder.id);
            setSelectedTable(null);
          }}
          confirmText="Supprimer"
          variant="destructive"
        />
      )}
      <CustomModal
        isVisible={showReassignModal}
        onClose={() => {
          setShowReassignModal(false);
          setShowOrderDetailModal(true); // Rouvrir la modal de détails si fermeture
        }}
        width={800}
        height={600}
        title={isReassigning ? "Assignation en cours..." : "Sélectionner une table"}
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
              isLoading={isLoading || isReassigning}
              containerDimensions={{ width: 760, height: 560 }} // 800-40 et 600-40 pour les paddings
              onTablePress={async (pressedTable: Table | null) => {
                if (pressedTable && selectedTableOrder && !isReassigning) {
                  setIsReassigning(true); // Bloquer les autres clics

                  try {
                    await updateOrder({ ...selectedTableOrder, tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    setShowReassignModal(false);
                    setShowOrderDetailModal(true);
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
                    console.error('Erreur lors de la réassignation:', error);
                    showToast('Erreur lors de la réassignation.', 'error');
                  } finally {
                    setIsReassigning(false); // Débloquer
                  }
                }
              }}
              onTableLongPress={async (pressedTable: Table | null) => {
                if (pressedTable && selectedTableOrder && !isReassigning) {
                  setIsReassigning(true); // Bloquer les autres clics

                  try {
                    await updateOrder({ ...selectedTableOrder, tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    setShowReassignModal(false);
                    setShowOrderDetailModal(true);
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
                    console.error('Erreur lors de la réassignation:', error);
                    showToast('Erreur lors de la réassignation.', 'error');
                  } finally {
                    setIsReassigning(false); // Débloquer
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
        visible={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setShowOrderDetailModal(true); // Rouvrir la modal de détails si fermeture
        }}
        maxWidth={1200}
        title="Régler l'addition"
      >
        {selectedTableOrder && (
          <PaymentView
            order={selectedTableOrder}
            onClose={() => {
              setShowPaymentModal(false);
              setShowOrderDetailModal(true); // Rouvrir la modal de détails
            }}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </ForkModal>
    </View>
  );
}