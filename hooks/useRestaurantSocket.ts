import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from './useSocket';
import { restaurantActions } from '~/store/restaurant';

// Types pour les événements WebSocket génériques
interface WebSocketEvent {
  model: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
  accountId: string;
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
    dispatch(restaurantActions.setConnected(isConnected));
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
          dispatch(restaurantActions.createOrder({ order: event.data }));
          console.log('✅ Action createOrder dispatchée avec succès');
        } catch (error) {
          console.error('❌ Erreur lors du dispatch de createOrder:', error);
        }
      },
      
      order_updated: (event: WebSocketEvent) => {
        console.log('📝 Commande mise à jour:', event.data.id);
        dispatch(restaurantActions.updateOrder({ order: event.data }));
      },
      
      order_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Commande supprimée:', event.data.id);
        
        // Si c'est une suppression automatique suite à un ordre vide
        if (event.data.reason === 'empty_after_menu_deletion') {
          console.log('⚠️ Ordre supprimé automatiquement (devenu vide après suppression de menu)');
        }
        
        dispatch(restaurantActions.deleteOrder({ orderId: event.data.id }));
      },

      // 🆕 Événements OrderLines (nouvelle architecture)
      orderline_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle ligne de commande:', event.data.id);
        dispatch(restaurantActions.createOrderLine({ orderLine: event.data }));
      },

      orderline_batch_created: (event: WebSocketEvent) => {
        console.log('🔥 Création batch de lignes de commande:', event.data.createdCount, 'lines');
        dispatch(restaurantActions.createOrderLinesBatch({
          orderLines: event.data.createdLines
        }));
      },

      orderline_updated: (event: WebSocketEvent) => {
        console.log('📝 Ligne de commande mise à jour:', event.data.id);
        dispatch(restaurantActions.updateOrderLine({ orderLine: event.data }));
      },

      orderline_batch_updated: (event: WebSocketEvent) => {
        console.log('📦 Mise à jour batch de lignes:', event.data.updatedCount, 'lines');
        dispatch(restaurantActions.orderLinesStatusUpdated({
          orderLineIds: event.data.orderLineIds,
          status: event.data.status
        }));
      },

      orderline_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Ligne de commande supprimée:', event.data.id);
        dispatch(restaurantActions.deleteOrderLine({ orderLineId: event.data.id }));
      },

      orderline_batch_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Suppression batch de lignes:', event.data.deletedCount, 'lines');
        dispatch(restaurantActions.deleteOrderLinesBatch({ orderLineIds: event.data.orderLineIds }));
      },

      // 🔄 Événements OrderLineItems (items de menu)
      orderlineitem_updated: (event: WebSocketEvent) => {
        console.log('📝 Item de menu mis à jour:', event.data.id);
        dispatch(restaurantActions.updateOrderLineItem({ orderLineItem: event.data }));
      },

      orderlineitem_batch_updated: (event: WebSocketEvent) => {
        console.log('📦 Mise à jour batch d\'items de menu:', event.data.updatedCount, 'items');
        dispatch(restaurantActions.orderLineItemsStatusUpdated({
          orderLineItemIds: event.data.orderLineItemIds,
          status: event.data.status
        }));
      },

      // 📜 Événements OrderItems (SUPPRIMÉS - remplacés par OrderLines)

      // Événements Tables
      table_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle table créée:', event.data.id);
        dispatch(restaurantActions.createTable({ table: event.data }));
      },
      
      table_updated: (event: WebSocketEvent) => {
        console.log('📝 Table mise à jour:', event.data.id);
        dispatch(restaurantActions.updateTable({ table: event.data }));
      },
      
      table_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Table supprimée:', event.data.id);
        dispatch(restaurantActions.deleteTable({ tableId: event.data.id }));
      },

      // Événements Rooms
      room_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle salle créée:', event.data.id);
        dispatch(restaurantActions.createRoom({ room: event.data }));
      },
      
      room_updated: (event: WebSocketEvent) => {
        console.log('📝 Salle mise à jour:', event.data.id);
        dispatch(restaurantActions.updateRoom({ room: event.data }));
      },
      
      room_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Salle supprimée:', event.data.id);
        dispatch(restaurantActions.deleteRoom({ roomId: event.data.id }));
      },

      // Événements Items (Menu)
      item_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel article de menu:', event.data.id);
        dispatch(restaurantActions.createMenuItem({ item: event.data }));
      },
      
      item_updated: (event: WebSocketEvent) => {
        console.log('📝 Article de menu mis à jour:', event.data.id);
        dispatch(restaurantActions.updateMenuItem({ item: event.data }));
      },
      
      item_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Article de menu supprimé:', event.data.id);
        dispatch(restaurantActions.deleteMenuItem({ itemId: event.data.id }));
      },

      // Événements Menu (Menus structurés)
      menu_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouveau menu créé:', event.data.id);
        dispatch(restaurantActions.createMenu({ menu: event.data }));
      },
      
      menu_updated: (event: WebSocketEvent) => {
        console.log('📝 Menu mis à jour:', event.data.id);
        dispatch(restaurantActions.updateMenu({ menu: event.data }));
      },
      
      menu_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Menu supprimé:', event.data.id);
        dispatch(restaurantActions.deleteMenu({ menuId: event.data.id }));
      },

      // Événements MenuCategory (Catégories de menu)
      menucategory_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvelle catégorie de menu créée:', event.data.id);
        dispatch(restaurantActions.createMenuCategory({ menuCategory: event.data }));
      },
      
      menucategory_updated: (event: WebSocketEvent) => {
        console.log('📝 Catégorie de menu mise à jour:', event.data.id);
        dispatch(restaurantActions.updateMenuCategory({ menuCategory: event.data }));
      },
      
      menucategory_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Catégorie de menu supprimée:', event.data.id);
        dispatch(restaurantActions.deleteMenuCategory({ menuCategoryId: event.data.id }));
      },

      // Événements MenuCategoryItem (Articles dans les catégories de menu)
      menucategoryitem_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel article de catégorie créé:', event.data.id);
        dispatch(restaurantActions.createMenuCategoryItem({ menuCategoryItem: event.data }));
      },
      
      menucategoryitem_updated: (event: WebSocketEvent) => {
        console.log('📝 Article de catégorie mis à jour:', event.data.id);
        dispatch(restaurantActions.updateMenuCategoryItem({ menuCategoryItem: event.data }));
      },
      
      menucategoryitem_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Article de catégorie supprimé:', event.data.id);
        dispatch(restaurantActions.deleteMenuCategoryItem({ menuCategoryItemId: event.data.id }));
      },

      // 📜 Événements MenuOrderGroups (SUPPRIMÉS - remplacés par OrderLines de type MENU)

      // Événements Users
      user_created: (event: WebSocketEvent) => {
        console.log('🆕 Nouvel utilisateur créé:', event.data.id);
        dispatch(restaurantActions.createUser({ user: event.data }));
      },
      
      user_updated: (event: WebSocketEvent) => {
        console.log('📝 Utilisateur mis à jour:', event.data.id);
        dispatch(restaurantActions.updateUser({ user: event.data }));
      },
      
      user_deleted: (event: WebSocketEvent) => {
        console.log('🗑️ Utilisateur supprimé:', event.data.id);
        dispatch(restaurantActions.deleteUser({ userId: event.data.id }));
      },
    };

    // Enregistrer tous les listeners avec type générique
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      (socket as any).on(eventName, (event: WebSocketEvent) => {
        try {
          console.log(`📡 Événement WebSocket reçu: ${eventName}`, {
            model: event.model,
            action: event.action,
            dataId: event.data?.id,
            timestamp: event.timestamp
          });
          
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
      // dispatch(restaurantActions.setOrders({ orders, roomId }));
      
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