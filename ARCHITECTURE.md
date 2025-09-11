# Architecture et Flux de Données - Fork'it

## Vue d'ensemble

Fork'it est une application de gestion de restaurant en temps réel construite avec React Native/Expo. Elle utilise Redux pour la gestion d'état et Socket.io pour la synchronisation temps réel entre tous les clients connectés.

## 🏗️ Architecture Globale

```
┌──────────────────────────────────────────────────────────────┐
│                         Backend API                          │
│                    (AdonisJS + Socket.io)                    │
└──────────────────┬──────────────────┬────────────────────────┘
                   │                  │
              HTTP REST          WebSocket (Socket.io)
                   │                  │
┌──────────────────▼──────────────────▼────────────────────────┐
│                     Frontend Mobile App                      │
│                    (React Native + Expo)                     │
├──────────────────────────────────────────────────────────────┤
│                      Redux Store                             │
│  ┌────────────┬──────────────┬─────────────────┐             │
│  │   Auth     │  Restaurant  │  AccountConfig  │             │
│  └────────────┴──────────────┴─────────────────┘             │
├──────────────────────────────────────────────────────────────┤
│                    WebSocket Manager                         │
│              (useRestaurantSocket Hook)                      │
├──────────────────────────────────────────────────────────────┤
│                      UI Components                           │
│  ┌─────────┬──────────┬──────────┬────────────┐              │
│  │ Server  │  Admin   │   Cook   │   Barman   │              │
│  └─────────┴──────────┴──────────┴────────────┘              │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Flux de Données Détaillé

### 1. Initialisation de l'Application

```
app/_layout.tsx
    ↓
Vérification Auth (useAuthCheck hook)
    ↓
Si authentifié → Chargement du restaurant
    ↓
hooks/useRestaurant.ts (initialisation globale)
    ├── Fetch données initiales (HTTP)
    └── Établissement connexion WebSocket
```

### 2. Chargement Initial des Données

**Fichiers impliqués:**
- `hooks/useRestaurant.ts` - Point d'entrée principal
- `api/*.api.ts` - Services API pour chaque entité
- `store/restaurant/*.slice.ts` - Slices Redux pour stocker les données

**Flux:**
```
useRestaurant.ts::loadRestaurantData()
    ↓
Appels API parallèles:
    ├── roomApiService.fetchAll() → store/rooms.slice.ts
    ├── tableApiService.fetchAll() → store/tables.slice.ts
    ├── orderApiService.fetchAll() → store/orders.slice.ts
    ├── menuApiService.fetchActiveMenus() → store/menus.slice.ts
    ├── itemApiService.fetchAll() → store/items.slice.ts
    ├── itemTypeApiService.fetchAll() → store/item-types.slice.ts
    └── userApiService.fetchAll() → store/users.slice.ts
```

### 3. Synchronisation WebSocket en Temps Réel

**Fichiers impliqués:**
- `hooks/useRestaurantSocket.ts` - Gestionnaire WebSocket principal
- `hooks/useSocket/index.tsx` - Context Provider Socket.io
- `store/restaurant/*.slice.ts` - Actions Redux pour les mises à jour

**Flux des événements WebSocket:**

```
Backend émet un événement (ex: "order:created")
    ↓
Socket.io Client (hooks/useSocket/index.tsx)
    ↓
useRestaurantSocket.ts (listener enregistré)
    ↓
Dispatch action Redux appropriée
    ↓
store/orders.slice.ts::addOrder()
    ↓
Tous les composants abonnés se mettent à jour
```

**Événements WebSocket gérés:**
- `order:created` → `addOrder()`
- `order:updated` → `updateOrder()`
- `order:deleted` → `removeOrder()`
- `table:created` → `addTable()`
- `table:updated` → `updateTable()`
- `room:updated` → `updateRoom()`
- `item:created/updated/deleted` → Actions items
- `menu:created/updated/deleted` → Actions menus
- `user:created/updated/deleted` → Actions users

### 4. Flux d'une Commande (Exemple Complet)

#### Création d'une commande:

```
1. UI: app/(server)/index.tsx
   └── Utilisateur sélectionne une table
   
2. Action: hooks/useOrders.ts::createOrder()
   └── Appel API: orderApiService.create()
   
3. Backend traite et émet: "order:created"

4. WebSocket: useRestaurantSocket.ts
   └── Reçoit l'événement "order:created"
   
5. Redux: store/orders.slice.ts::addOrder()
   └── Ajoute la commande au store
   
6. UI Update: Tous les composants utilisant useOrders()
   └── Se mettent à jour automatiquement
```

#### Ajout d'items à la commande:

```
1. UI: app/(server)/order/menu.tsx
   └── Sélection d'items dans le menu
   
2. Action: hooks/useOrderLines.ts::createOrderLines()
   └── API: orderLineApiService.create()
   
3. Backend: Crée les lignes et émet "order:updated"

4. WebSocket → Redux → UI (même flux que ci-dessus)
```

## 🗂️ Structure du Store Redux

### Auth Slice (`store/auth.slice.ts`)
```typescript
{
  user: User | null,
  token: string | null,
  isAuthenticated: boolean,
  loading: boolean,
  error: string | null
}
```

### Restaurant Slice (`store/restaurant/`)
Divisé en plusieurs sous-slices:

- **rooms.slice.ts**: Salles du restaurant
- **tables.slice.ts**: Tables avec leur statut
- **orders.slice.ts**: Commandes en cours
- **menus.slice.ts**: Menus disponibles
- **items.slice.ts**: Items du menu
- **item-types.slice.ts**: Types d'items (Entrées, Plats, etc.)
- **users.slice.ts**: Utilisateurs du restaurant

### AccountConfig Slice (`store/account-config.slice.ts`)
```typescript
{
  overdueOrderIds: string[],
  overdueOrderItemIds: string[],
  lastAlertCheck: string | null
}
```

## 🔄 Hooks Principaux et leur Rôle

### `useRestaurant()`
**Fichier:** `hooks/useRestaurant.ts`
- Initialise toutes les données du restaurant
- Lance la connexion WebSocket
- Point d'entrée principal pour l'app

### `useRestaurantSocket()`
**Fichier:** `hooks/useRestaurantSocket.ts`
- Gère tous les événements WebSocket
- Synchronise les données en temps réel
- 305 lignes de mappings événements → actions Redux

### Hooks spécialisés:
- `useOrders()` - Gestion des commandes
- `useOrderLines()` - Gestion des lignes de commande
- `useRooms()` - Gestion des salles
- `useTables()` - Gestion des tables
- `useMenu()` - Accès aux items et types
- `useMenus()` - Gestion des menus composés
- `useUsers()` - Gestion des utilisateurs

## 🎯 Points d'Entrée par Rôle

### Server (Serveur)
**Point d'entrée:** `app/(server)/index.tsx`
- Vue des tables et salles
- Création/modification de commandes
- Navigation vers le menu

### Admin
**Point d'entrée:** `app/(admin)/index.tsx`
- Configuration du restaurant
- Gestion des menus
- Vue cuisine superviseur

### Cook (Cuisinier)
**Point d'entrée:** `app/(cook)/index.tsx`
- Vue des commandes en cuisine
- Changement de statut des plats

### Barman
**Point d'entrée:** `app/(barman)/index.tsx`
- Vue des boissons à préparer
- Gestion des statuts des boissons

## 🔍 Traçabilité d'une Donnée

Pour tracer le parcours d'une donnée (ex: une commande):

1. **Création:** 
   - UI Component → Hook → API Service → Backend

2. **Stockage:**
   - Backend → Response → Redux Slice → Store

3. **Synchronisation:**
   - Backend Event → WebSocket → Hook Listener → Redux Action

4. **Affichage:**
   - Redux Store → Selector → Hook → Component

## 📝 Exemple: Parcours d'une Mise à Jour de Statut

```
1. components/Kitchen/OrderCard.tsx
   └── onStatusChange(Status.READY)

2. hooks/useOrders.ts::updateOrderLinesStatus()
   └── orderLineApiService.updateStatus()

3. api/order-line.api.ts
   └── PATCH /api/orders/:orderId/lines/status

4. Backend traite et émet: "order:updated"

5. hooks/useRestaurantSocket.ts
   └── socket.on('order:updated', (data) => {
       dispatch(updateOrder(data.order))
     })

6. store/orders.slice.ts::updateOrder()
   └── Met à jour l'ordre dans le state

7. Tous les composants utilisant:
   - useOrders()
   - useSelector(selectOrderById)
   └── Se rafraîchissent automatiquement
```

## 🚀 Optimisations Actuelles

1. **Memoization:** Utilisation de `createSelector` pour les sélecteurs Redux
2. **Batch Updates:** Redux groupe automatiquement les mises à jour
3. **WebSocket Unique:** Une seule connexion partagée pour toute l'app
4. **Lazy Loading:** Chargement des données à la demande

## 🔧 Points d'Extension

Pour ajouter une nouvelle entité:
1. Créer le type dans `types/`
2. Créer l'API service dans `api/`
3. Créer le slice Redux dans `store/restaurant/`
4. Ajouter les actions au `store/restaurant/index.ts`
5. Créer le hook dans `hooks/`
6. Ajouter les listeners WebSocket dans `useRestaurantSocket`
7. Utiliser le hook dans les composants

## 📊 Métriques de Performance

- **Temps initial de chargement:** ~2-3s (fetch parallèle)
- **Latence WebSocket:** < 100ms (réseau local)
- **Taille du store:** ~500 objets maximum
- **Re-renders:** Optimisés via React.memo et selectors