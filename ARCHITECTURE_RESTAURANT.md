# 📚 Architecture Restaurant - Guide Simple

## 🎯 Vue d'ensemble

L'architecture restaurant a été refactorisée pour être **plus simple et organisée**. Au lieu d'un gros fichier de 500+ lignes, on a maintenant **5 petits modules spécialisés**.

## 🏗️ Structure des dossiers

```
store/restaurant/
├── index.ts          # ← Point d'entrée principal (combine tout)
├── rooms.slice.ts    # ← Gestion des salles
├── tables.slice.ts   # ← Gestion des tables
├── orders.slice.ts   # ← Gestion des commandes
├── menu.slice.ts     # ← Gestion du menu (items + itemTypes)
└── ui.slice.ts       # ← Interface (users, loading, erreurs)
```

## 🎮 Comment utiliser (pour toi, développeur)

### 1. Dans tes composants React

```typescript
// Au lieu d'importer depuis restaurant.slice.ts
import { useRestaurant, useRooms, useOrders } from '~/hooks/useRestaurant';

function MonComposant() {
  // Hook principal - contient TOUT
  const { 
    rooms, currentRoom, 
    enrichedTables, selectedTable,
    currentRoomOrders, isLoading 
  } = useRestaurant();

  // OU hooks spécialisés pour des besoins précis
  const { setCurrentRoom } = useRooms();
  const { createOrder, deleteOrder } = useOrders();
}
```

### 2. Actions disponibles

```typescript
const {
  // 🏠 Salles
  setCurrentRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  
  // 🪑 Tables  
  setSelectedTable,
  createTable,
  updateTable,
  deleteTable,
  
  // 📝 Commandes
  createOrder,
  deleteOrder,
  updateOrderStatus,
  
  // 🍽️ Menu
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = useRestaurant();
```

## 🔄 Flux de données simplifié

```
1. User action (bouton cliqué)
     ↓
2. Hook function (ex: createOrder)
     ↓  
3. API call (ex: orderApiService.create)
     ↓
4. Redux action (ex: restaurantActions.createOrder)
     ↓
5. Store update (état mis à jour)
     ↓
6. Component re-render (interface mise à jour)
     ↓
7. WebSocket sync (autres clients notifiés)
```

## 📦 Les 5 modules expliqués

### 1. `rooms.slice.ts` - Salles
```typescript
// Ce qu'il contient
{
  rooms: { "1": Room, "2": Room },     // Toutes les salles
  currentRoomId: "1",                  // Salle sélectionnée
  loading: false,
  error: null
}

// Actions principales
- setRooms()         // Charger les salles
- setCurrentRoom()   // Changer de salle
- createRoom()       // Créer une salle
```

### 2. `tables.slice.ts` - Tables
```typescript
// Ce qu'il contient
{
  tables: { "1": Table, "2": Table }, // Toutes les tables
  selectedTableId: "1",               // Table sélectionnée
  loading: false,
  error: null
}

// Actions principales
- setTables()          // Charger les tables
- setSelectedTable()   // Sélectionner une table
- createTable()        // Créer une table
```

### 3. `orders.slice.ts` - Commandes
```typescript
// Ce qu'il contient
{
  orders: { "1": Order, "2": Order },           // Toutes les commandes
  orderItems: { "1": OrderItem, "2": OrderItem }, // Tous les articles
  loading: false,
  error: null
}

// Actions principales
- setOrders()            // Charger les commandes
- createOrder()          // Créer une commande
- updateOrderStatus()    // Changer le statut
```

### 4. `menu.slice.ts` - Menu
```typescript
// Ce qu'il contient
{
  items: { "1": Item, "2": Item },           // Articles du menu
  itemTypes: { "1": ItemType, "2": ItemType }, // Catégories
  loading: false,
  error: null
}

// Actions principales
- setItems()         // Charger le menu
- setItemTypes()     // Charger les catégories
- createMenuItem()   // Ajouter un article
```

### 5. `ui.slice.ts` - Interface
```typescript
// Ce qu'il contient
{
  users: { "1": User, "2": User },     // Utilisateurs
  isConnected: true,                    // État WebSocket
  lastSyncTime: 1640995200000,         // Dernière sync
  loadingState: {                      // États de chargement
    rooms: false,
    tables: false,
    orders: false,
    menu: false,
    users: false
  },
  errors: {                            // Erreurs par domaine
    rooms: null,
    tables: "Erreur de connexion",
    orders: null,
    menu: null,
    users: null
  }
}
```

## 🎯 Avantages de cette architecture

### ✅ Avant (problèmes)
- 1 fichier de 500+ lignes = difficile à lire
- Tout mélangé = difficile à déboguer  
- Ajout de features = modification massive

### ✅ Maintenant (solutions)
- 5 fichiers de ~100 lignes = facile à lire
- Séparation claire = débug ciblé
- Ajout de features = modification localisée

## 🚀 Exemples pratiques

### Créer une commande
```typescript
function CreateOrderButton() {
  const { createOrder, selectedTable } = useRestaurant();
  
  const handleCreate = async () => {
    if (!selectedTable) return;
    
    try {
      // 1. Appel API + Store update automatique
      const newOrder = await createOrder(selectedTable);
      
      // 2. Interface mise à jour automatiquement
      // 3. WebSocket notifie les autres clients
      
      console.log('Commande créée:', newOrder.id);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  return <Button onPress={handleCreate}>Créer commande</Button>;
}
```

### Changer de salle
```typescript
function RoomSelector() {
  const { rooms, currentRoom, setCurrentRoom } = useRooms();
  
  return (
    <ScrollView horizontal>
      {rooms.map(room => (
        <Button 
          key={room.id}
          active={room.id === currentRoom?.id}
          onPress={() => setCurrentRoom(room.id)}
        >
          {room.name}
        </Button>
      ))}
    </ScrollView>
  );
}
```

## 🔧 Migration de tes composants

### Ancien code (à supprimer)
```typescript
// ❌ Ancien pattern
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  loadOrders();
}, []);

const loadOrders = async () => {
  setLoading(true);
  const data = await orderApiService.getAll();
  setOrders(data);
  setLoading(false);
};
```

### Nouveau code (à utiliser)
```typescript
// ✅ Nouveau pattern
const { currentRoomOrders, isLoading } = useRestaurant();

// Plus de useState, useEffect, ou appels API manuels !
// Tout est géré automatiquement par le hook
```

## 🆘 En cas de problème

### "Je ne trouve plus mes données"
- Utilise `useRestaurant()` - il contient TOUT
- Ou utilise les hooks spécialisés : `useRooms()`, `useOrders()`, etc.

### "Mon action ne fonctionne pas"
- Vérifie que tu utilises les bonnes actions depuis `useRestaurant()`
- Regarde la console pour les logs WebSocket

### "J'ai une erreur TypeScript"
- Assure-toi d'importer depuis `'~/hooks/useRestaurant'`
- Pas besoin d'importer les slices directement

## 🎓 Résumé pour toi

**En gros :** 
1. Tu utilises `useRestaurant()` dans tes composants
2. Tu appelles ses fonctions (createOrder, setCurrentRoom, etc.)
3. Tout le reste (API, WebSocket, store) est automatique
4. Ton interface se met à jour toute seule

**C'est tout !** 🎉