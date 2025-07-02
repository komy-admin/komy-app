# 🪝 Hooks Simplifiés - Guide d'utilisation

## 🎯 Objectif
Remplacer l'ancien `useRestaurant.ts` de **536 lignes** par **6 hooks spécialisés** de ~100 lignes chacun.

## 📁 Nouvelle structure

```
hooks/
├── useRestaurant.ts      # ← Hook principal (100 lignes) - combine tout
├── useRooms.ts          # ← Gestion des salles (80 lignes)
├── useTables.ts         # ← Gestion des tables (120 lignes)  
├── useOrders.ts         # ← Gestion des commandes (140 lignes)
├── useMenu.ts           # ← Gestion du menu (110 lignes)
└── useRestaurantInit.ts # ← Initialisation (40 lignes)
```

**Total : 590 lignes réparties vs 536 lignes dans 1 seul fichier !**

## 🎮 Comment utiliser

### Option 1 : Hook principal (comme avant)
```typescript
import { useRestaurant } from '~/hooks/useRestaurant';

function MonComposant() {
  // Récupère TOUT comme avant
  const { 
    rooms, currentRoom,
    enrichedTables, selectedTable,
    currentRoomOrders,
    createOrder, setCurrentRoom 
  } = useRestaurant();
  
  // Utilisation identique à l'ancien code !
}
```

### Option 2 : Hooks spécialisés (nouveauté)
```typescript
import { useRooms, useTables, useOrders } from '~/hooks/useRestaurant';

function MonComposant() {
  // Plus précis et performant
  const { rooms, setCurrentRoom } = useRooms();
  const { enrichedTables, setSelectedTable } = useTables();
  const { createOrder, currentRoomOrders } = useOrders();
}
```

## 🔍 Détail de chaque hook

### 1. `useRooms()` - Gestion des salles
```typescript
const {
  // Données
  rooms,                    // Room[]
  currentRoom,             // Room | null
  currentRoomId,           // string | null
  
  // État
  loading,                 // boolean
  error,                   // string | null
  
  // Actions
  setCurrentRoom,          // (roomId: string) => void
  loadRooms,              // () => Promise<Room[]>
  createRoom,             // (data: Partial<Room>) => Promise<Room>
  updateRoom,             // (id: string, data: Partial<Room>) => Promise<Room>
  deleteRoom,             // (id: string) => Promise<void>
  
  // Utilitaires
  getRoomById,            // (id: string) => Room | null
} = useRooms();
```

### 2. `useTables()` - Gestion des tables
```typescript
const {
  // Données
  tables,                 // Table[]
  enrichedTables,         // EnrichedTable[] (avec commandes)
  selectedTableId,        // string | null
  selectedTable,          // Table | null
  
  // Actions
  setSelectedTable,       // (id: string | null) => void
  selectTable,           // (table: Table) => void
  clearSelection,        // () => void
  createTable,           // (data: Partial<Table>) => Promise<Table>
  
  // Utilitaires
  getTableById,          // (id: string) => Table | null
  getTablesByRoom,       // (roomId: string) => Table[]
  hasOrder,              // (tableId: string) => boolean
  getSelectedTableOrder, // () => Order | null
} = useTables();
```

### 3. `useOrders()` - Gestion des commandes
```typescript
const {
  // Données
  allOrders,             // Order[]
  currentRoomOrders,     // Order[]
  selectedTableOrder,    // Order | null
  
  // Actions
  loadOrdersForRoom,     // (roomId: string) => Promise<Order[]>
  createOrder,           // (tableId: string) => Promise<Order>
  deleteOrder,           // (orderId: string) => Promise<void>
  updateOrderStatus,     // (orderId: string, status: Status, itemTypeId?: string) => Promise<void>
  
  // Utilitaires
  getOrderById,          // (id: string) => Order | null
  getOrderByTableId,     // (tableId: string) => Order | null
  getOrderItems,         // (orderId: string) => OrderItem[]
} = useOrders();
```

### 4. `useMenu()` - Gestion du menu
```typescript
const {
  // Données
  items,                 // Item[]
  itemTypes,            // ItemType[]
  
  // Actions
  loadItems,            // () => Promise<Item[]>
  loadItemTypes,        // () => Promise<ItemType[]>
  createMenuItem,       // (data: Partial<Item>) => Promise<Item>
  updateMenuItem,       // (id: string, data: Partial<Item>) => Promise<Item>
  deleteMenuItem,       // (id: string) => Promise<void>
  
  // Utilitaires
  getItemById,          // (id: string) => Item | null
  getItemsByType,       // (typeId: string) => Item[]
  getItemQuantityInOrder, // (itemId: string, orderItems: OrderItem[]) => number
} = useMenu();
```

### 5. `useRestaurantInit()` - Initialisation
```typescript
const {
  initializeRestaurant,  // () => Promise<{ rooms: Room[], itemTypes: ItemType[] }>
  switchRoom,           // (roomId: string) => Promise<void>
  currentRoom,          // Room | null
} = useRestaurantInit();
```

## ✅ Avantages de cette refactorisation

### 🔍 Plus lisible
- **Avant** : 1 fichier de 536 lignes impossible à naviguer
- **Maintenant** : 6 fichiers de ~100 lignes chacun, faciles à lire

### 🎯 Plus maintenable  
- **Avant** : Modifier les commandes = risquer de casser les salles
- **Maintenant** : Chaque domaine est isolé et sûr

### ⚡ Plus performant
- **Avant** : `useRestaurant()` recalcule tout à chaque changement
- **Maintenant** : `useOrders()` ne recalcule que les commandes

### 🧪 Plus testable
- **Avant** : Tester 1 énorme hook complexe
- **Maintenant** : Tester chaque hook indépendamment

## 🔄 Migration de ton code existant

### Code existant (fonctionne toujours !)
```typescript
// ✅ Ton code actuel continue de fonctionner
import { useRestaurant } from '~/hooks/useRestaurant';

const { rooms, createOrder, setCurrentRoom } = useRestaurant();
```

### Code optimisé (recommandé pour nouveau code)
```typescript
// ✅ Plus précis et performant
import { useRooms, useOrders } from '~/hooks/useRestaurant';

const { rooms, setCurrentRoom } = useRooms();
const { createOrder } = useOrders();
```

## 🎓 Résumé

**Pour toi :**
1. **Rien ne casse** - Ton code existant fonctionne toujours
2. **Plus simple** - Chaque fichier fait ~100 lignes au lieu de 500+
3. **Plus organisé** - Chaque hook a sa responsabilité claire
4. **Plus performant** - Tu peux utiliser seulement ce dont tu as besoin

**Le meilleur des deux mondes !** 🎉