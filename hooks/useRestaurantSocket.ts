import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './useSocket';
import { entitiesActions, sessionActions } from '~/store';

// Types pour les événements WebSocket génériques
interface WebSocketEvent {
  model: string;
  action: 'created' | 'updated' | 'deleted';
  data?: any; // Pour les événements avec données complexes
  dataId?: string; // Pour les événements de suppression
  accountId?: string;
  timestamp: string;
}

/**
 * Hook pour synchroniser les événements WebSocket avec le store restaurant
 * Utilise les nouveaux événements génériques (model_action pattern)
 */
export const useRestaurantSocket = () => {
  const dispatch = useDispatch();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    // Mettre à jour l'état de connexion dans le store
    dispatch(sessionActions.setWebSocketConnected(isConnected));
  }, [isConnected, dispatch]);

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // Configuration des gestionnaires d'événements
    const eventHandlers = {
      // Événements Orders
      order_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle commande reçue:', event.data.id);
        console.log('📊 Données de la commande:', event.data);
        console.log('📦 Action à dispatcher:', { order: event.data });
        
        try {
          dispatch(entitiesActions.createOrder({ order: event.data }));
          console.log('✅ Action createOrder dispatchée avec succès');
        } catch (error) {
          console.error('❌ Erreur lors du dispatch de createOrder:', error);
        }
      },
      
      order_updated: (event: WebSocketEvent) => {
        console.log('📝 Commande mise à jour:', event.data.id);
        dispatch(entitiesActions.updateOrder({ order: event.data }));
      },
      
      order_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Commande supprimée:', event.data.id);
        
        // Si c'est une suppression automatique suite à un ordre vide
        if (event.data.reason === 'empty_after_menu_deletion') {
          console.log('⚠️ Ordre supprimé automatiquement (devenu vide après suppression de menu)');
        }
        
        dispatch(entitiesActions.deleteOrder({ orderId: event.data.id }));
      },

      // 🆕 Événements OrderLines (nouvelle architecture)
      orderline_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle ligne de commande:', event.data.id);
        dispatch(entitiesActions.createOrderLine({ orderLine: event.data }));
      },

      orderline_batch_created: (event: WebSocketEvent) => {
        console.log('🔥 Création batch de lignes de commande:', event.data.createdCount, 'lines');
        dispatch(entitiesActions.createOrderLinesBatch({
          orderLines: event.data.createdLines
        }));
      },

      orderline_updated: (event: WebSocketEvent) => {
        console.log('📝 Ligne de commande mise à jour:', event.data.id);
        dispatch(entitiesActions.updateOrderLine({ orderLine: event.data }));
      },

      orderline_batch_updated: (event: WebSocketEvent) => {
        console.log('📦 Mise à jour batch de lignes:', event.data.updatedCount, 'lines');
        dispatch(entitiesActions.orderLinesStatusUpdated({
          orderLineIds: event.data.orderLineIds,
          status: event.data.status
        }));
      },

      orderline_deleted: (event: WebSocketEvent) => {
        const orderLineId = event.dataId || event.data?.id;
        console.log('🗑️ Ligne de commande supprimée:', orderLineId);
        if (orderLineId) {
          dispatch(entitiesActions.deleteOrderLine({ orderLineId }));
        }
      },

      orderline_batch_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Suppression batch de lignes:', event.data.deletedCount, 'lines');
        dispatch(entitiesActions.deleteOrderLinesBatch({ orderLineIds: event.data.orderLineIds }));
      },

      // 🔄 Événements OrderLineItems (items de menu)
      orderlineitem_updated: (event: WebSocketEvent) => {
        console.log('📝 Item de menu mis à jour:', event.data.id);
        dispatch(entitiesActions.updateOrderLineItem({ orderLineItem: event.data }));
      },

      orderlineitem_batch_updated: (event: WebSocketEvent) => {
        console.log('📦 Mise à jour batch d\'items de menu:', event.data.updatedCount, 'items');
        dispatch(entitiesActions.orderLineItemsStatusUpdated({
          orderLineItemIds: event.data.orderLineItemIds,
          status: event.data.status
        }));
      },

      // 📜 Événements OrderItems (SUPPRIMÉS - remplacés par OrderLines)

      // Événements Tables
      table_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle table créée:', event.data.id);
        dispatch(entitiesActions.createTable({ table: event.data }));
      },
      
      table_updated: (event: WebSocketEvent) => {
        console.log('📝 Table mise à jour:', event.data.id);
        dispatch(entitiesActions.updateTable({ table: event.data }));
      },
      
      table_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Table supprimée:', event.data.id);
        dispatch(entitiesActions.deleteTable({ tableId: event.data.id }));
      },

      // Événements Rooms
      room_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle salle créée:', event.data.id);
        dispatch(entitiesActions.createRoom({ room: event.data }));
      },
      
      room_updated: (event: WebSocketEvent) => {
        console.log('📝 Salle mise à jour:', event.data.id);
        dispatch(entitiesActions.updateRoom({ room: event.data }));
      },
      
      room_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Salle supprimée:', event.data.id);
        dispatch(entitiesActions.deleteRoom({ roomId: event.data.id }));
      },

      // Événements Items (Menu)
      item_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel article de menu:', event.data.id);
        dispatch(entitiesActions.createMenuItem({ item: event.data }));
      },
      
      item_updated: (event: WebSocketEvent) => {
        console.log('📝 Article de menu mis à jour:', event.data.id);
        dispatch(entitiesActions.updateMenuItem({ item: event.data }));
      },
      
      item_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Article de menu supprimé:', event.data.id);
        dispatch(entitiesActions.deleteMenuItem({ itemId: event.data.id }));
      },

      // Événements Menu (Menus structurés)
      menu_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouveau menu créé:', event.data.id);
        dispatch(entitiesActions.createMenu({ menu: event.data }));
      },
      
      menu_updated: (event: WebSocketEvent) => {
        console.log('📝 Menu mis à jour:', event.data.id);
        dispatch(entitiesActions.updateMenu({ menu: event.data }));
      },
      
      menu_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Menu supprimé:', event.data.id);
        dispatch(entitiesActions.deleteMenu({ menuId: event.data.id }));
      },

      // Événements MenuCategory (Catégories de menu)
      menucategory_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle catégorie de menu créée:', event.data.id);
        dispatch(entitiesActions.createMenuCategory({ menuCategory: event.data }));
      },
      
      menucategory_updated: (event: WebSocketEvent) => {
        console.log('📝 Catégorie de menu mise à jour:', event.data.id);
        dispatch(entitiesActions.updateMenuCategory({ menuCategory: event.data }));
      },
      
      menucategory_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Catégorie de menu supprimée:', event.data.id);
        dispatch(entitiesActions.deleteMenuCategory({ menuCategoryId: event.data.id }));
      },

      // Événements MenuCategoryItem (Articles dans les catégories de menu)
      menucategoryitem_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel article de catégorie créé:', event.data.id);
        dispatch(entitiesActions.createMenuCategoryItem({ menuCategoryItem: event.data }));
      },
      
      menucategoryitem_updated: (event: WebSocketEvent) => {
        console.log('📝 Article de catégorie mis à jour:', event.data.id);
        dispatch(entitiesActions.updateMenuCategoryItem({ menuCategoryItem: event.data }));
      },
      
      menucategoryitem_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Article de catégorie supprimé:', event.data.id);
        dispatch(entitiesActions.deleteMenuCategoryItem({ menuCategoryItemId: event.data.id }));
      },

      // Événements Users
      user_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel utilisateur créé:', event.data.id);
        dispatch(entitiesActions.createUser({ user: event.data }));
      },
      
      user_updated: (event: WebSocketEvent) => {
        console.log('📝 Utilisateur mis à jour:', event.data.id);
        dispatch(entitiesActions.updateUser({ user: event.data }));
      },
      
      user_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Utilisateur supprimé:', event.data.id);
        dispatch(entitiesActions.deleteUser({ userId: event.data.id }));
      },
    };

    // Enregistrer tous les listeners avec type générique
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      (socket as any).on(eventName, (event: WebSocketEvent) => {
        try {
          console.log(`📡 Événement WebSocket reçu: ${eventName}`, event);
          
          handler(event);
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de ${eventName}:`, error);
        }
      });
    });

    console.log('🔌 Nouveaux listeners WebSocket enregistrés pour le restaurant');

    // Nettoyage des listeners
    return () => {
      Object.keys(eventHandlers).forEach(eventName => {
        (socket as any).off(eventName);
      });
      
      console.log('🔌 Listeners WebSocket supprimés pour le restaurant');
    };
  }, [socket, isConnected, dispatch]);

  return {
    isConnected,
    socket,
  };
};

/**
 * Hook optionnel pour la réconciliation des données après reconnexion
 * Peut être utilisé pour re-synchroniser les données avec le serveur
 */
export const useRestaurantDataReconciliation = () => {
  const { isConnected } = useSocket();

  const reconcileData = async (roomId: string) => {
    try {
      console.log('🔄 Réconciliation des données pour la room:', roomId);
      
      // Ici vous pourriez re-fetch les données depuis l'API
      // pour vous assurer qu'elles sont à jour après une reconnexion
      
      // Exemple :
      // const { data: orders } = await orderApiService.getAll({ roomId });
      // dispatch(entitiesActions.setOrders({ orders, roomId }));
      
      console.log('✅ Réconciliation terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la réconciliation:', error);
    }
  };

  // Déclencher la réconciliation automatiquement après reconnexion
  useEffect(() => {
    if (isConnected) {
      // Optionnel: déclencher la réconciliation après reconnexion
      // reconcileData(currentRoomId);
    }
  }, [isConnected]);

  return {
    reconcileData,
  };
};