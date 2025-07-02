# 🔌 Guide d'Implémentation WebSocket - Frontend

## Vue d'ensemble

Le backend émet maintenant des événements WebSocket génériques pour tous les modèles importants. Ce guide explique comment implémenter la réception de ces événements côté frontend.

## 📋 Événements disponibles

### Pattern des événements
Tous les événements suivent le pattern : `{model_name}_{action}`

| Modèle | Créé | Mis à jour | Supprimé |
|--------|------|------------|----------|
| **Order** | `order_created` | `order_updated` | `order_deleted` |
| **OrderItem** | `orderitem_created` | `orderitem_updated` | `orderitem_deleted` |
| **Room** | `room_created` | `room_updated` | `room_deleted` |
| **Table** | `table_created` | `table_updated` | `table_deleted` |
| **Item** | `item_created` | `item_updated` | `item_deleted` |
| **User** | `user_created` | `user_updated` | `user_deleted` |

## 📦 Structure des événements

Chaque événement reçu contient cette structure :

```typescript
interface WebSocketEvent {
  model: string;                    // "order", "item", "table", etc.
  action: 'created' | 'updated' | 'deleted';
  data: any;                       // Objet complet pour created/updated, {id, accountId} pour deleted
  accountId: string;               // ID du compte
  timestamp: string;               // ISO timestamp
}
```

## 🛠️ Implémentation Frontend

### 1. Listener basique pour un modèle spécifique

```javascript
// Écouter les nouvelles commandes
socket.on('order_created', (event) => {
  console.log('Nouvelle commande reçue:', event.data);
  
  // Exemple: Ajouter à la liste des commandes
  addOrderToList(event.data);
  
  // Exemple: Afficher une notification
  showNotification(`Nouvelle commande #${event.data.id}`);
  
  // Exemple: Mettre à jour le compteur
  updateOrderCount();
});

// Écouter les mises à jour de commandes
socket.on('order_updated', (event) => {
  console.log('Commande mise à jour:', event.data);
  
  // Mettre à jour la commande dans la liste
  updateOrderInList(event.data.id, event.data);
  
  // Mettre à jour l'interface si cette commande est affichée
  if (currentOrderId === event.data.id) {
    refreshOrderDetails(event.data);
  }
});

// Écouter les suppressions de commandes
socket.on('order_deleted', (event) => {
  console.log('Commande supprimée:', event.data.id);
  
  // Retirer de la liste
  removeOrderFromList(event.data.id);
  
  // Fermer la vue détaillée si c'était cette commande
  if (currentOrderId === event.data.id) {
    closeOrderDetails();
  }
});
```

### 2. Système générique pour tous les modèles

```javascript
// Configuration des modèles à écouter
const MODELS_CONFIG = {
  order: {
    created: (data) => {
      addOrderToList(data);
      showNotification(`Nouvelle commande #${data.id}`);
      playNotificationSound();
    },
    updated: (data) => {
      updateOrderInList(data.id, data);
      if (data.status === 'ready') {
        showNotification(`Commande #${data.id} prête !`);
      }
    },
    deleted: (data) => {
      removeOrderFromList(data.id);
      showNotification(`Commande #${data.id} annulée`);
    }
  },
  
  orderitem: {
    created: (data) => {
      if (currentOrderId === data.orderId) {
        addItemToCurrentOrder(data);
      }
    },
    updated: (data) => {
      updateOrderItem(data.id, data);
      if (data.status === 'ready') {
        markItemAsReady(data.id);
      }
    },
    deleted: (data) => {
      removeOrderItem(data.id);
    }
  },
  
  table: {
    created: (data) => {
      addTableToFloorPlan(data);
    },
    updated: (data) => {
      updateTableOnFloorPlan(data.id, data);
    },
    deleted: (data) => {
      removeTableFromFloorPlan(data.id);
    }
  },
  
  item: {
    created: (data) => {
      addItemToMenu(data);
    },
    updated: (data) => {
      updateMenuItem(data.id, data);
    },
    deleted: (data) => {
      removeItemFromMenu(data.id);
    }
  },
  
  room: {
    created: (data) => {
      addRoomToList(data);
    },
    updated: (data) => {
      updateRoom(data.id, data);
    },
    deleted: (data) => {
      removeRoom(data.id);
    }
  },
  
  user: {
    created: (data) => {
      addUserToList(data);
    },
    updated: (data) => {
      updateUser(data.id, data);
    },
    deleted: (data) => {
      removeUser(data.id);
    }
  }
};

// Initialisation automatique des listeners
function initializeWebSocketListeners(socket) {
  Object.keys(MODELS_CONFIG).forEach(model => {
    Object.keys(MODELS_CONFIG[model]).forEach(action => {
      const eventName = `${model}_${action}`;
      const handler = MODELS_CONFIG[model][action];
      
      socket.on(eventName, (event) => {
        console.log(`📡 ${eventName}:`, event);
        
        try {
          handler(event.data);
        } catch (error) {
          console.error(`Erreur lors du traitement de ${eventName}:`, error);
        }
      });
    });
  });
  
  console.log('✅ WebSocket listeners initialisés');
}

// Utilisation
initializeWebSocketListeners(socket);
```

### 3. Hook React personnalisé

```jsx
// hooks/useWebSocketEvents.js
import { useEffect, useContext } from 'react';
import { SocketContext } from '../contexts/SocketContext';

export const useWebSocketEvents = (model, handlers) => {
  const socket = useContext(SocketContext);
  
  useEffect(() => {
    if (!socket) return;
    
    const events = {
      [`${model}_created`]: handlers.onCreated,
      [`${model}_updated`]: handlers.onUpdated,
      [`${model}_deleted`]: handlers.onDeleted,
    };
    
    // Ajouter les listeners
    Object.entries(events).forEach(([eventName, handler]) => {
      if (handler) {
        socket.on(eventName, (event) => handler(event.data));
      }
    });
    
    // Nettoyage
    return () => {
      Object.keys(events).forEach(eventName => {
        socket.off(eventName);
      });
    };
  }, [socket, model, handlers]);
};

// Utilisation dans un composant
function OrdersList() {
  const [orders, setOrders] = useState([]);
  
  useWebSocketEvents('order', {
    onCreated: (order) => {
      setOrders(prev => [...prev, order]);
      toast.success(`Nouvelle commande #${order.id}`);
    },
    onUpdated: (order) => {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    },
    onDeleted: (deletedOrder) => {
      setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
    }
  });
  
  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### 4. Store Redux/Zustand

```javascript
// store/websocketSlice.js (Redux Toolkit)
import { createSlice } from '@reduxjs/toolkit';

const websocketSlice = createSlice({
  name: 'websocket',
  initialState: {
    orders: [],
    tables: [],
    items: [],
    // ...
  },
  reducers: {
    // Orders
    orderCreated: (state, action) => {
      state.orders.push(action.payload);
    },
    orderUpdated: (state, action) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
    },
    orderDeleted: (state, action) => {
      state.orders = state.orders.filter(o => o.id !== action.payload.id);
    },
    
    // Tables
    tableCreated: (state, action) => {
      state.tables.push(action.payload);
    },
    tableUpdated: (state, action) => {
      const index = state.tables.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tables[index] = action.payload;
      }
    },
    tableDeleted: (state, action) => {
      state.tables = state.tables.filter(t => t.id !== action.payload.id);
    },
    
    // ... autres modèles
  }
});

// Middleware pour connecter WebSocket au store
export const websocketMiddleware = (store) => (next) => (action) => {
  if (action.type === 'websocket/connect') {
    const socket = action.payload.socket;
    
    // Connecter tous les événements au store
    const eventMappings = {
      'order_created': websocketSlice.actions.orderCreated,
      'order_updated': websocketSlice.actions.orderUpdated,
      'order_deleted': websocketSlice.actions.orderDeleted,
      'table_created': websocketSlice.actions.tableCreated,
      'table_updated': websocketSlice.actions.tableUpdated,
      'table_deleted': websocketSlice.actions.tableDeleted,
      // ... autres mappings
    };
    
    Object.entries(eventMappings).forEach(([eventName, actionCreator]) => {
      socket.on(eventName, (event) => {
        store.dispatch(actionCreator(event.data));
      });
    });
  }
  
  return next(action);
};
```

## 🎯 Cas d'usage spécifiques

### Service de cuisine (Kitchen Display)
```javascript
// Écouter les nouveaux items à préparer
socket.on('orderitem_created', (event) => {
  if (event.data.status === 'pending') {
    addItemToKitchenQueue(event.data);
    playKitchenAlert();
  }
});

socket.on('orderitem_updated', (event) => {
  updateKitchenItem(event.data.id, event.data);
  
  if (event.data.status === 'ready') {
    moveItemToReadySection(event.data.id);
  }
});
```

### Service en salle (Table Management)
```javascript
socket.on('order_created', (event) => {
  // Mettre à jour le statut de la table
  updateTableStatus(event.data.tableId, 'occupied');
  
  // Ajouter à la liste des commandes à servir
  addOrderToServeList(event.data);
});

socket.on('table_updated', (event) => {
  // Rafraîchir le plan de salle
  updateFloorPlan(event.data);
});
```

### Administration
```javascript
socket.on('user_created', (event) => {
  addUserToEmployeeList(event.data);
  logActivity(`Nouvel employé: ${event.data.firstName} ${event.data.lastName}`);
});

socket.on('item_updated', (event) => {
  updateMenuItem(event.data);
  if (event.data.price !== previousPrice) {
    notifyPriceChange(event.data);
  }
});
```

## 🐛 Gestion d'erreurs

```javascript
function setupWebSocketErrorHandling(socket) {
  socket.on('connect_error', (error) => {
    console.error('Erreur de connexion WebSocket:', error);
    showConnectionError();
  });
  
  socket.on('disconnect', () => {
    console.warn('WebSocket déconnecté');
    showDisconnectionWarning();
  });
  
  socket.on('reconnect', () => {
    console.log('WebSocket reconnecté');
    hideConnectionWarnings();
    refreshAllData(); // Recharger les données qui ont pu changer
  });
}
```

## 📱 Notes d'implémentation

### À faire :
1. ✅ Implémenter les listeners pour les modèles dont vous avez besoin
2. ✅ Ajouter la gestion d'erreurs et reconnexion
3. ✅ Tester les événements en créant/modifiant/supprimant des données
4. ✅ Ajouter des notifications visuelles pour les événements importants
5. ✅ Optimiser les performances (debouncing si nécessaire)

### Compatibilité :
- Les anciens événements (`new_order`, `update_order`, etc.) fonctionnent toujours
- Migration progressive possible
- Pas de breaking changes

## 🔍 Debugging

```javascript
// Mode debug pour voir tous les événements
function enableWebSocketDebug(socket) {
  const events = [
    'order_created', 'order_updated', 'order_deleted',
    'orderitem_created', 'orderitem_updated', 'orderitem_deleted',
    'table_created', 'table_updated', 'table_deleted',
    'item_created', 'item_updated', 'item_deleted',
    'room_created', 'room_updated', 'room_deleted',
    'user_created', 'user_updated', 'user_deleted'
  ];
  
  events.forEach(eventName => {
    socket.on(eventName, (event) => {
      console.log(`🔍 [DEBUG] ${eventName}:`, {
        model: event.model,
        action: event.action,
        data: event.data,
        timestamp: event.timestamp
      });
    });
  });
}

// Activer en développement
if (process.env.NODE_ENV === 'development') {
  enableWebSocketDebug(socket);
}
```

---

**Prêt à implémenter ! 🚀** 

Les événements sont déjà émis par le backend. Il suffit d'ajouter les listeners côté frontend selon vos besoins.