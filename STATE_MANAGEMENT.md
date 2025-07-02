# State Management - Fork It App

## Architecture globale

L'application utilise **Redux Toolkit** avec une architecture modulaire en 3 couches :

```
Store Global (Redux)
    ↓
Hooks spécialisés (useTables, useOrders, etc.)
    ↓
Composants React
```

## Structure du Store

### 1. Store principal (`/store/index.ts`)
```typescript
{
  auth: AuthState,
  restaurant: {
    rooms: RoomsState,
    tables: TablesState,
    orders: OrdersState,
    menu: MenuState,
    ui: UiState
  }
}
```

### 2. État des tables (`/store/restaurant/tables.slice.ts`)
```typescript
TablesState = {
  tables: Record<string, Table>,      // { "table-1": Table, "table-2": Table }
  selectedTableId: string | null,     // ID de la table sélectionnée
  loading: boolean,
  error: string | null
}
```

## Flux de données

### 1. Clic sur une table
```
handleTablePress(table) 
  → setSelectedTable(table.id)
  → dispatch(setSelectedTable(table.id))
  → state.restaurant.tables.selectedTableId = table.id
```

### 2. Récupération de la table sélectionnée
```
selectSelectedTable({ tables: state.restaurant.tables })
  → trouve state.restaurant.tables.selectedTableId
  → retourne state.restaurant.tables.tables[selectedTableId]
  → objet Table complet
```

## Hooks spécialisés

### `useTables()` - Gestion des tables
```typescript
const {
  selectedTable,        // Objet Table complet
  selectedTableId,      // string | null
  setSelectedTable,     // (id: string | null) => void
  currentRoomTables     // Table[] pour la room actuelle
} = useTables();
```

### `useRestaurant()` - Hook global
```typescript
const {
  selectedTable,        // Objet Table (vient de useTables)
  currentRoom,          // Room actuelle
  currentRoomOrders     // Commandes de la room actuelle
} = useRestaurant();
```

## Problème résolu

### Avant (❌)
Les sélecteurs dans `useTables` utilisaient :
```typescript
useSelector(selectSelectedTable)
// Cherchait dans { tables: TablesState }
```

### Après (✅)
Maintenant ils utilisent :
```typescript
useSelector((state) => selectSelectedTable({ tables: state.restaurant.tables }))
// Cherche dans { restaurant: { tables: TablesState } }
```

## Sélecteurs principaux

### Sélecteurs de base (tables.slice.ts)
- `selectSelectedTableId` → string | null
- `selectSelectedTable` → Table | null
- `selectAllTables` → Table[]

### Sélecteurs enrichis (restaurant/index.ts)
- `selectEnrichedTables` → Table[] avec commandes
- `selectCurrentRoomTables` → Table[] de la room actuelle
- `selectCurrentRoomOrders` → Order[] de la room actuelle

## Conventions

1. **Actions** : Préfixées par le domaine (`setSelectedTable`, `createTable`)
2. **Sélecteurs** : Préfixées par `select` (`selectSelectedTable`)
3. **Hooks** : Préfixées par `use` (`useTables`, `useOrders`)
4. **State** : Organisé par domaine fonctionnel (tables, orders, rooms)

## Exemple concret

```typescript
// Dans un composant
const { selectedTable, setSelectedTable } = useTables();

// Sélectionner une table
const handleTablePress = (table: Table) => {
  setSelectedTable(table.id);  // Stocke l'ID
};

// Utiliser la table sélectionnée
console.log(selectedTable);  // Objet Table complet ou null
```

Le système garantit que quand `selectedTableId` change, `selectedTable` se met à jour automatiquement grâce aux sélecteurs Redux.