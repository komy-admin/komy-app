import React from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, Platform } from "react-native";
import { SidePanel } from "~/components/SidePanel";
import { Badge, Button, ForkModal, Text } from "~/components/ui";
import { DeleteConfirmationModal } from "~/components/ui/DeleteConfirmationModal";
import { ConfirmationModal } from "~/components/ui/ConfirmationModal";
import RoomComponent from '~/components/Room/Room';
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Table } from "~/types/table.types";
import OrderList from "~/components/Service/OrderList";
import { SearchBar } from "~/components/Service/SearchBar";
import { useOrderFilters } from "~/hooks/useOrderFilters";
import StartOrderCard from "~/components/Service/StartOrderCard";
import { Status } from "~/types/status.enum";
import AdminOrderDetailView from "~/components/Service/AdminOrderDetailView";
import PaymentView from "~/components/Service/PaymentView";
import { router } from 'expo-router';
import { useToast } from '~/components/ToastProvider';
import {
  useRestaurant,
  useMenu,
  useTables,
  useOrders
} from '~/hooks/useRestaurant';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { selectAppInitialized, selectIsAppInitializing } from '~/store/slices/session.slice';
import { CustomModal } from '@/components/CustomModal';
import { OrderLinesForm, OrderLinesHeader, OrderLinesButton } from '~/components/order/OrderLinesForm';
import { Order } from '@/types/order.types';
import { OrderLine, CreateOrderLineRequest, OrderLineType } from '~/types/order-line.types';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useMenus } from '~/hooks/useMenus';
import { Plus, LayoutDashboard } from 'lucide-react-native';

export default function ServicePage() {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCreatedFromStart, setOrderCreatedFromStart] = useState<boolean>(false);
  const [isConfiguringMenu, setIsConfiguringMenu] = useState<boolean>(false);
  const [menuConfigActions, setMenuConfigActions] = useState<{
    onCancel: () => void;
    onConfirm: () => void;
    isValid?: boolean;
  } | null>(null);

  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);
  const { createOrderWithLines, createOrderLines, deleteOrderLine, deleteOrderLines } = useOrderLines();
  const { rooms, currentRoom, setCurrentRoom } = useRestaurant();
  const appInitialized = useSelector(selectAppInitialized);
  const appLoading = useSelector(selectIsAppInitializing);
  const { currentRoomTables, selectedTableId, selectedTable, setSelectedTable } = useTables();
  const {
    currentRoomOrders,
    selectedTableOrder,
    loading,
    // createOrder, // Non utilisé
    updateOrder,
    updateOrderStatus,
    deleteOrder
  } = useOrders();
  const { items: allItems, itemTypes: allItemTypes } = useMenu();
  const { activeMenus: allMenus } = useMenus();



  // ✅ Hook personnalisé pour centraliser la gestion des modals
  const useOrderModals = () => {
    const [modals, setModals] = useState({
      showReassignModal: false,
      isReassigning: false,
      showDeleteOrderDialog: false,
      showTerminateOrderDialog: false,
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

      openTerminateDialog: () => updateModal({ showTerminateOrderDialog: true }),
      closeTerminateDialog: () => updateModal({ showTerminateOrderDialog: false }),

      openPayment: () => updateModal({ showPaymentModal: true }),
      closePayment: () => updateModal({ showPaymentModal: false }),

      openOrderDetail: (order?: Order) => {
        if (!order) {
          return;
        }

        // 🔧 CORRECTION: Vérifier si une autre modal n'est pas déjà ouverte
        if (modals.showOrderDetailModal) {
          return;
        }

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

  const {
    searchQuery,
    filters,
    filteredOrders,
    handleSearchChange,
    handleFiltersChange,
    handleClearFilters,
    isLoaded: filtersLoaded,
  } = useOrderFilters(currentRoomOrders.filter(order => order.lines && order.lines.length > 0));


  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup : désélectionner lors du blur (navigation sortante)
        setSelectedTable(null);
      };
    }, [setSelectedTable])
  );



  const handleChangeRoom = (room: any) => {
    setSelectedTable(null);
    setCurrentRoom(room.id);
  };

  const handleTablePress = useCallback((table: Table | null) => {
    if (!table) return;

    // 🔧 CORRECTION: Trouver la commande AVANT de changer la table sélectionnée
    const tableOrder = currentRoomOrders.find(order => order.tableId === table.id);

    // Sélectionner la table
    setSelectedTable(table.id);

    // Si la table a une commande, ouvrir directement la modal de détails
    if (tableOrder) {
      modalActions.openOrderDetail(tableOrder);
    } else {
    }
  }, [currentRoomOrders, selectedTableId, selectedTableOrder, deleteOrder, setSelectedTable, modalActions.openOrderDetail]);

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
    setOrderLines([]); // Réinitialiser les lignes pour une nouvelle commande
    setShowOrderModal(true); // Ouvrir la modal
  };


  const handleOpenOrderModal = () => {
    setOrderCreatedFromStart(false); // Modal ouverte depuis le bouton "Modifier"
    modalActions.setCameFromOrderDetail(true); // Marquer qu'on vient de la modal détails
    modalActions.setModalTitle(selectedTableOrder ? `Modifier la commande - ${selectedTableOrder.table?.name || selectedTable?.name || 'Table'}` : "Modifier la commande"); // Titre stable pour modification
    setOrderLines([]); // Réinitialiser les lignes draft (les lignes existantes viendront de selectedTableOrder)
    // La commande courante est déjà disponible via selectedTableOrder
    setShowOrderModal(true); // Ouvrir la modal
  };

  const handleCloseOrderDetailModal = modalActions.closeOrderDetail;


  const isSavingOrderRef = useRef<boolean | { savedOrder: any }>(false);

  // ✅ Hook personnalisé pour la logique de fermeture intelligente
  const useSmartOrderClose = () => {
    return useCallback(() => {
      const wasSaving = !!isSavingOrderRef.current;
      const wasOrderCreatedFromStart = orderCreatedFromStart;

      // Fermer le formulaire et réinitialiser les lignes
      setShowOrderModal(false);
      setOrderCreatedFromStart(false);
      setOrderLines([]);



      // 🔧 CORRECTION: Réouverture conditionnelle de la modal détails avec délai
      // Utiliser l'ordre sauvegardé stocké dans isSavingOrderRef au lieu de selectedTableOrder
      if (wasSaving) {

        // Récupérer l'ordre sauvegardé depuis la ref
        const savedOrderData = typeof isSavingOrderRef.current === 'object' ? isSavingOrderRef.current.savedOrder : null;

        // Délai pour permettre aux WebSocket de se stabiliser
        setTimeout(() => {
          const shouldReopen = (
            (wasOrderCreatedFromStart) ||
            (savedOrderData && savedOrderData.lines && savedOrderData.lines.length > 0 && modals.cameFromOrderDetailModal)
          );

          if (shouldReopen) {
            modalActions.openOrderDetail(savedOrderData);
          }
        }, 300); // Délai augmenté pour plus de stabilité
      }

      // Réinitialiser le ref à la fin avec délai (après la réouverture)
      setTimeout(() => {
        isSavingOrderRef.current = false;
        modalActions.setCameFromOrderDetail(false);
      }, 400); // Délai plus long que la réouverture (300ms)
    }, [
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
    // 🔧 CORRECTION: Ajouter un délai pour éviter les fermetures prématurées pendant les transitions d'état
    if (modals.showOrderDetailModal && !selectedTableOrder) {

      // 🔴 NOUVEAU: Vérifier si on est en train de sauvegarder pour éviter les fermetures intempestives
      // Vérifier si c'est un boolean true (en cours de sauvegarde) et non un objet savedOrder
      if (isSavingOrderRef.current === true) {
        return;
      }

      // Délai de 300ms pour permettre aux états de se stabiliser (augmenté)
      const timeoutId = setTimeout(() => {
        // Double vérification après le délai
        if (modals.showOrderDetailModal && !selectedTableOrder && isSavingOrderRef.current !== true) {
          modalActions.closeOrderDetail();
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTableOrder, modals.showOrderDetailModal, modalActions]);

  const handleConfigurationModeChange = useCallback((configuring: boolean) => {
    setIsConfiguringMenu(configuring);
    if (!configuring) {
      setMenuConfigActions(null);
    }
  }, []);

  const handleConfigurationActionsChange = useCallback((actions: { onCancel: () => void; onConfirm: () => void; isValid?: boolean } | null) => {
    setMenuConfigActions(actions);
  }, []);

  const handleLinesChange = useCallback((newLines: OrderLine[]) => {
    // Si on est en mode modification, filtrer les lignes déjà existantes
    let linesToSave = newLines;

    if (selectedTableOrder && selectedTableOrder.lines) {
      const existingLineIds = new Set(selectedTableOrder.lines.map(l => l.id));
      // Ne garder que les lignes qui n'ont pas d'ID ou dont l'ID commence par "draft-"
      linesToSave = newLines.filter(line =>
        !line.id ||
        line.id.startsWith('draft-') ||
        !existingLineIds.has(line.id)
      );
    }

    setOrderLines(linesToSave);
  }, [selectedTableOrder]);

  const getCurrentLines = useCallback((): OrderLine[] => {
    if (orderCreatedFromStart) {
      return orderLines; // Mode création : utiliser les lignes draft
    } else if (selectedTableOrder) {
      return selectedTableOrder.lines || []; // Mode modification : utiliser les lignes existantes
    }
    return [];
  }, [orderCreatedFromStart, orderLines, selectedTableOrder]);


  const convertOrderLinesToApiFormat = useCallback((lines: OrderLine[]): CreateOrderLineRequest[] => {
    return lines.map(line => {
      if (line.type === OrderLineType.ITEM) {
        return {
          type: line.type,
          quantity: line.quantity,
          itemId: line.item!.id,
          note: line.note || ''
        };
      } else if (line.type === OrderLineType.MENU) {
        // Pour les menus, reconstruire selectedItems à partir des orderLine.items
        const selectedItems: Record<string, string> = {};

        line.items?.forEach(orderLineItem => {
          // Trouver la catégorie correspondante dans le menu original
          const menu = allMenus.find((m: any) => m.id === line.menu?.id);
          if (menu?.categories) {
            const category = menu.categories.find((cat: any) => {
              const categoryName = allItemTypes.find(type => type.id === cat.itemTypeId)?.name;
              return categoryName === orderLineItem.categoryName;
            });

            if (category) {
              selectedItems[category.id] = orderLineItem.item.id;
            }
          }
        });

        return {
          type: line.type,
          quantity: line.quantity,
          menuId: line.menu!.id,
          selectedItems,
          note: line.note || ''
        };
      }

      // Fallback - ne devrait pas arriver
      throw new Error(`Type de ligne non supporté: ${line.type}`);
    });
  }, [allMenus, allItemTypes]);

  const handleSaveOrder = async () => {
    try {
      if (!orderLines || orderLines.length === 0) {
        showToast('Aucune ligne à sauvegarder', 'info');
        setOrderCreatedFromStart(false);
        return true;
      }

      // Indiquer qu'on est en train de sauvegarder
      isSavingOrderRef.current = true;

      // Convertir les OrderLine vers le format API
      const apiData = convertOrderLinesToApiFormat(orderLines);

      let updatedOrder;
      if (orderCreatedFromStart) {
        // Mode création : créer order + lignes ensemble
        updatedOrder = await createOrderWithLines(selectedTableId!, apiData);
      } else if (selectedTableOrder?.id) {
        // Mode modification : ajouter lignes à l'order existant
        updatedOrder = await createOrderLines(selectedTableOrder.id, apiData);
      }

      if (updatedOrder) {
        // Stocker le résultat pour useSmartOrderClose
        isSavingOrderRef.current = { savedOrder: updatedOrder };
        showToast('Commande mise à jour avec succès.', 'success');
        // Réinitialiser l'état
        setOrderLines([]);

        // Fermer la modal de création/modification
        setShowOrderModal(false);

        // Ouvrir la modal de détails avec la commande mise à jour
        modalActions.openOrderDetail(updatedOrder);

        // Réinitialiser le flag de sauvegarde après un court délai
        setTimeout(() => {
          isSavingOrderRef.current = false;
        }, 500);
      }

      // Désactiver le flag orderCreatedFromStart
      setOrderCreatedFromStart(false);
      return true;
    } catch (error) {
      showToast('Erreur lors de la mise à jour de la commande.', 'error');
      isSavingOrderRef.current = false;
      return false;
    }
  };


  const handleStatusUpdate = async (orderLines: OrderLine[], status: Status) => {
    if (!selectedTableOrder) {
      showToast('Aucune commande sélectionnée.', 'warning');
      return;
    }

    try {
      const orderLinesIds = orderLines.map(orderLine => orderLine.id);

      // Utiliser updateOrderStatus pour mettre à jour le statut des OrderLines
      await updateOrderStatus(selectedTableOrder.id, {
        status: status,
        orderLineIds: orderLinesIds
      });
      showToast('Statut mis à jour avec succès.', 'success');
    } catch (error) {
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
      showToast('Erreur lors du traitement du paiement.', 'error');
    }
  };

  const navigateToRoomEdit = () => {
    if (!currentRoom) return;
    router.push('/(admin)/room/edition-mode');
  };

  const handleDeselectTable = () => {
    setSelectedTable(null);
  };

  const { width, height } = useWindowDimensions();
  // Fonction pour rediriger vers room_list avec création automatique
  const handleCreateFirstRoom = () => {
    router.push('/(admin)/room/create');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* OrderLinesForm en pleine page - remplace tout le layout */}
      {showOrderModal && (selectedTableOrder || orderCreatedFromStart) ? (
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {/* Header avec titre et bouton retour - masqué pendant la configuration de menu */}
          <OrderLinesHeader
            title={modals.modalTitle}
            onClose={handleSmartCloseOrderModal}
            isVisible={!isConfiguringMenu}
          />

          {/* OrderLinesForm */}
          <View style={{ flex: 1 }}>
            <OrderLinesForm
              lines={getCurrentLines()}
              items={allItems.filter(item => item.isActive)}
              itemTypes={allItemTypes}
              onLinesChange={handleLinesChange}
              onConfigurationModeChange={handleConfigurationModeChange}
              onConfigurationActionsChange={handleConfigurationActionsChange}
            />
          </View>

          {/* Boutons d'action */}
          {!isConfiguringMenu && (
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 16,
              gap: 12
            }}>
              <OrderLinesButton
                variant="secondary"
                onPress={handleSmartCloseOrderModal}
              >
                Annuler
              </OrderLinesButton>
              <OrderLinesButton
                variant="primary"
                onPress={handleSaveOrder}
                disabled={!orderLines || orderLines.length === 0}
                flex={2}
              >
                Sauvegarder
              </OrderLinesButton>
            </View>
          )}

          {/* Boutons de configuration de menu */}
          {isConfiguringMenu && menuConfigActions && (
            <View style={{
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              padding: 16,
              gap: 12
            }}>
              <OrderLinesButton
                variant="configCancel"
                onPress={menuConfigActions.onCancel}
              >
                Annuler
              </OrderLinesButton>
              <OrderLinesButton
                variant="config"
                onPress={menuConfigActions.onConfirm}
                disabled={!menuConfigActions.isValid}
                flex={2}
              >
                Confirmer la sélection
              </OrderLinesButton>
            </View>
          )}
        </View>
      ) : (
        // Layout normal service avec SidePanel + Room
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <SidePanel
            hideCloseButton={true}
            width={width / 4}
            title="Service"
            onBack={handleDeselectTable}
          >
            <View style={{ padding: 16, flex: 1, backgroundColor: '#F9FAFB' }}>
              {loading || !filtersLoaded ? (
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
                      modalActions.openOrderDetail(order);
                    }}
                    onOrderDelete={handleDeleteOrder}
                  />
                </>
              )}
            </View>
          </SidePanel>

          <View style={{ flex: 1, height: '100%', position: 'relative' }}>
            {/* Header avec tabs des rooms - seulement si il y a des rooms */}
            {rooms.length > 0 && (
              <View className='flex-row w-full justify-between' style={{
                backgroundColor: '#FBFBFB',
                height: 50,
                zIndex: 10,
                elevation: 5,
                ...Platform.select({
                  android: {
                    shadowColor: 'transparent', // Pas d'ombre visible sur Android
                  },
                }),
              }}>
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
            )}

            {appInitialized && !appLoading && rooms.length === 0 ? (
              // État vide - Aucune room disponible (seulement quand l'initialisation est vraiment terminée)
              <View style={{
                backgroundColor: '#F4F5F7',
                padding: 48,
                alignItems: 'center',
                flex: 1,
                justifyContent: 'center',
              }}>
                <View style={{ marginBottom: 20 }}>
                  <LayoutDashboard size={48} color="#D1D5DB" />
                </View>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: '#2A2E33',
                  marginBottom: 12,
                  textAlign: 'center',
                  letterSpacing: 0.3,
                }}>
                  Aucune salle configurée
                </Text>
                <Text style={{
                  fontSize: 15,
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 22,
                  marginBottom: 32,
                  maxWidth: 320,
                }}>
                  Pour commencer à utiliser le service, vous devez d'abord créer une salle avec des tables.
                </Text>
                <Pressable
                  onPress={handleCreateFirstRoom}
                  style={{
                    backgroundColor: '#2A2E33',
                    paddingHorizontal: 28,
                    paddingVertical: 14,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: '#2A2E33',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 6,
                    ...(Platform.OS === 'web' && {
                      cursor: 'pointer',
                    })
                  }}
                >
                  <Plus size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '700',
                    letterSpacing: 0.4,
                  }}>
                    Créer ma première salle
                  </Text>
                </Pressable>
              </View>
            ) : appLoading || !appInitialized ? (
              // État de chargement
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text>Chargement des salles...</Text>
              </View>
            ) : (
              // Layout normal avec room existante
              <View style={{
                flex: 1,
                zIndex: 1,
                elevation: 0,
                // overflow: 'visible' pour permettre gestures partout
                // Le flash est déjà géré par isGridReady dans Room.tsx
              }}>
                {selectedTable && !selectedTableOrder && (
                  <StartOrderCard
                    table={selectedTable}
                    onStartPress={handleCreateOrder}
                  />
                )}

                <RoomComponent
                  tables={currentRoomTables}
                  orders={currentRoomOrders}
                  editingTableId={selectedTableId ?? undefined}
                  editionMode={false}
                  isLoading={loading}
                  width={currentRoom?.width}
                  height={currentRoom?.height}
                  onTablePress={handleTablePress}
                  onTableLongPress={handleTablePress}
                  onTableUpdate={() => { }}
                />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modal pour les détails et actions de la commande - masquée si OrderLinesForm est active */}
      {!showOrderModal && (
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
                onDeleteOrderLines={async (orderLineIds) => {
                  try {
                    if (orderLineIds.length === 1) {
                      await deleteOrderLine(orderLineIds[0]);
                      showToast('Article supprimé avec succès', 'success');
                    } else {
                      await deleteOrderLines(orderLineIds);
                      showToast(`${orderLineIds.length} articles supprimés avec succès`, 'success');
                    }
                  } catch (error) {
                    showToast('Erreur lors de la suppression', 'error');
                    console.error('Erreur suppression:', error);
                  }
                }}
                onUpdateOrderLinesStatus={handleStatusUpdate}
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
                  {selectedTableOrder && selectedTableOrder.status !== Status.TERMINATED && (
                    <Button
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() => {
                        modalActions.openTerminateDialog(); // Ouvrir directement la modal de confirmation sans fermer la modal de détail
                      }}
                    >
                      <Text>Terminer</Text>
                    </Button>
                  )}
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
      )}


      {selectedTableOrder && modals.showDeleteOrderDialog && (
        <DeleteConfirmationModal
          isVisible={modals.showDeleteOrderDialog}
          onClose={() => {
            modalActions.closeDeleteDialog(); // Fermer seulement la modal de confirmation
            // La modal de détail reste ouverte
          }}
          onConfirm={() => {
            modalActions.closeDeleteDialog();
            modalActions.closeOrderDetail(); // Fermer les deux modals après confirmation
            deleteOrder(selectedTableOrder.id);
            setSelectedTable(null);
          }}
          entityName={`de la table ${selectedTableOrder.table?.name || selectedTableOrder.table?.id || 'N/A'}`}
          entityType="la commande"
        />
      )}

      {selectedTableOrder && modals.showTerminateOrderDialog && (
        <ConfirmationModal
          isVisible={modals.showTerminateOrderDialog}
          onClose={() => {
            modalActions.closeTerminateDialog(); // Fermer seulement la modal de confirmation
            // La modal de détail reste ouverte
          }}
          onConfirm={async () => {
            try {
              // Collecter tous les IDs des OrderLines et OrderLineItems
              const orderLineIds: string[] = [];
              const orderLineItemIds: string[] = [];

              selectedTableOrder.lines?.forEach(line => {
                if (line.type === OrderLineType.ITEM) {
                  orderLineIds.push(line.id);
                } else if (line.type === OrderLineType.MENU && line.items) {
                  line.items.forEach(item => {
                    orderLineItemIds.push(item.id);
                  });
                }
              });

              // Mettre à jour toutes les lignes en TERMINATED
              await updateOrderStatus(selectedTableOrder.id, {
                status: Status.TERMINATED,
                orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
                orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
              });

              showToast('Commande terminée avec succès', 'success');
              modalActions.closeTerminateDialog();
              modalActions.closeOrderDetail(); // Fermer les deux modals après confirmation
              setSelectedTable(null);
            } catch (error) {
              showToast('Erreur lors de la terminaison de la commande', 'error');
              modalActions.closeTerminateDialog(); // Fermer seulement la modal de confirmation en cas d'erreur
            }
          }}
          title="Terminer la commande"
          message={`Voulez-vous vraiment terminer la commande de la table ${selectedTableOrder.table?.name || 'N/A'} ?`}
          description="Cette action marquera tous les articles de la commande comme terminés. La commande disparaîtra de la vue service."
          confirmText="Confirmer"
          confirmVariant="default"
        />
      )}
      <CustomModal
        isVisible={modals.showReassignModal}
        onClose={() => {
          modalActions.closeReassign(); // Fermer seulement la modal de réassignation
          // La modal de détail reste ouverte
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
            height: '100%',
            // overflow: 'visible' pour permettre gestures partout
            // Le flash est déjà géré par isGridReady dans Room.tsx
          }}>
            <RoomComponent
              tables={currentRoomTables.filter(table => {
                const tableOrder = table.orders?.[0];
                return tableOrder?.id !== selectedTableOrder?.id;
              })}
              width={currentRoom?.width}
              height={currentRoom?.height}
              editionMode={false}
              isLoading={loading || modals.isReassigning}
              containerDimensions={{ width: 760, height: 560 }} // 800-40 et 600-40 pour les paddings
              onTablePress={async (pressedTable: Table | null) => {
                if (pressedTable && selectedTableOrder && !modals.isReassigning) {
                  modalActions.setReassigning(true); // Bloquer les autres clics

                  try {
                    await updateOrder(selectedTableOrder.id, { tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    modalActions.closeReassign();
                    // La modal de détail reste ouverte avec les nouvelles infos
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
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
                    await updateOrder(selectedTableOrder.id, { tableId: pressedTable.id });
                    setSelectedTable(pressedTable.id);
                    modalActions.closeReassign();
                    // La modal de détail reste ouverte avec les nouvelles infos
                    showToast('Table réassignée avec succès.', 'success');
                  } catch (error) {
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
        maxWidth={Math.min(1200, width * 0.95)}
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