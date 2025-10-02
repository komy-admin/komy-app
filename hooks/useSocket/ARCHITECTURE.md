# Architecture WebSocket - Fork'it

## Vue d'ensemble

Architecture simplifiée et centralisée pour gérer tous les événements WebSocket de l'application.

## Fichiers

### 1. `socket.ts` - Service WebSocket
Service singleton simplifié qui gère la connexion Socket.IO.

**Responsabilités:**
- Connexion/déconnexion au serveur WebSocket
- Exposition du socket brut pour les listeners
- Méthodes génériques `emit()`, `on()`, `off()`

### 2. `SockerProvider.tsx` - Provider principal ✨
**Point d'entrée unique** pour toute la logique WebSocket.

**Responsabilités:**
- Initialisation de la connexion (avec sessionToken)
- Enregistrement du listener `invalidate` (suppressions CASCADE)
- Gestion de l'état de connexion
- Cleanup automatique à la déconnexion

**Code clé:**
```tsx
// Connexion + listeners en un seul endroit
useEffect(() => {
  await socketService.connect(API_URL, sessionToken);
  const socket = socketService.getSocket();

  // Listener invalidation
  socket.on('invalidate', handleInvalidate);

  // Listener disconnect
  socketService.on('disconnect', () => setIsConnected(false));
}, [isAuthenticated, sessionToken]);
```

### 3. `useInvalidationRefetch.ts` - Mapping resources → refetch
Hook qui mappe les noms de ressources backend aux fonctions de refetch.

**Optimisations:**
- Déduplication automatique
- Regroupement des appels API identiques
- Ex: `['items', 'menuCategories', 'menus']` → 2 appels au lieu de 3

### 4. `websocket.config.ts` - Configuration
Types et configuration pour les événements WebSocket.

**Contient:**
- `WebSocketEvent` - Type pour les événements CRUD
- `InvalidateEvent` - Type pour les invalidations CASCADE
- `ResourceName` - Union type des ressources supportées
- `WEBSOCKET_EVENT_MAP` - Mapping événements → actions Redux

### 5. `useWebSocketSync.ts` - Événements CRUD
Hook pour synchroniser les événements CRUD standards avec Redux.

**Événements gérés:**
- `order_created`, `order_updated`, `order_deleted`
- `table_created`, `table_updated`, `table_deleted`
- `item_created`, `item_updated`, `item_deleted`
- etc.

**Note:** L'événement `invalidate` est géré directement dans `SockerProvider`

## Flux de données

### Événement d'invalidation (CASCADE delete)

```
Backend supprime ItemType (CASCADE)
    ↓
Backend émet: { action: 'invalidate', resources: ['items', 'itemTypes', 'menuCategories'] }
    ↓
SocketProvider reçoit l'événement
    ↓
useInvalidationRefetch groupe et optimise
    ↓
2 appels API (au lieu de 3)
  - loadItems() + loadItemTypes()
  - loadAllMenus() (inclut menuCategories)
    ↓
Redux state mis à jour
    ↓
UI se rafraîchit automatiquement
```

### Événement CRUD standard

```
Backend met à jour une table
    ↓
Backend émet: { action: 'updated', model: 'table', data: {...} }
    ↓
useWebSocketSync reçoit 'table_updated'
    ↓
Dispatch updateTable(payload) dans Redux
    ↓
UI se rafraîchit automatiquement
```

## Architecture avant/après

### ❌ Avant (complexe)
```
app/_layout.tsx
  └─ SocketProvider (hooks/useSocket/SockerProvider.tsx)
       └─ useInvalidation() (hook séparé)
            └─ useInvalidationRefetch()

providers/WebSocketProvider.tsx (INUTILISÉ!)
  └─ useWebSocketSync() (avec invalidation en doublon)
       └─ useInvalidationRefetch()
```

**Problèmes:**
- 2 providers (1 utilisé, 1 inutilisé)
- Code dupliqué pour l'invalidation
- Hook `useInvalidation` séparé du provider
- Confusion sur où les choses se passent

### ✅ Après (simplifié)
```
app/_layout.tsx
  └─ SocketProvider (hooks/useSocket/SockerProvider.tsx)
       ├─ Connexion WebSocket
       ├─ Listener 'invalidate' intégré
       └─ useInvalidationRefetch()
```

**Avantages:**
- 1 seul provider
- Tout au même endroit
- Code linéaire et facile à suivre
- Pas de hooks séparés inutiles

## Fichiers supprimés

- ✅ `providers/WebSocketProvider.tsx` (provider inutilisé)
- ✅ `hooks/useSocket/useInvalidation.ts` (hook séparé inutile)
- ✅ `hooks/useSocket/types.ts` (types jamais utilisés)

## Ressources supportées

| Ressource | Fonction refetch | Notes |
|-----------|-----------------|-------|
| `items` | `useMenu.loadItems()` | Items individuels |
| `itemTypes` | `useMenu.loadItemTypes()` | Types d'items |
| `menus` | `useMenus.loadAllMenus()` | Menus complets |
| `menuCategories` | `useMenus.loadAllMenus()` | Inclus dans menus |
| `menuCategoryItems` | `useMenus.loadAllMenus()` | Inclus dans menus |
| `rooms` | `useRooms.loadRooms()` | Salles |
| `tables` | `useRooms.loadRooms()` | Incluses dans rooms |
| `orders` | `useOrders.loadAllOrders()` | Commandes |
| `orderLines` | `useOrders.loadAllOrders()` | Incluses dans orders |
| `orderLineItems` | `useOrders.loadAllOrders()` | Incluses dans orders |
| `users` | `useUsers.loadUsers()` | Utilisateurs |

## Ajouter une nouvelle ressource

1. Ajouter dans `ResourceName` (`websocket.config.ts`):
```typescript
export type ResourceName =
  | 'items'
  | 'itemTypes'
  | 'newResource';  // ← Ajouter ici
```

2. Ajouter dans le mapping (`useInvalidationRefetch.ts`):
```typescript
const refetchMap: Record<ResourceName, ...> = {
  // ...
  newResource: useNewResource.loadNewResource,
}
```

C'est tout! Le système gère le reste automatiquement.

## Debugging

### Logs clés à surveiller

```
✅ [SocketProvider] Listeners enregistrés (disconnect, invalidate)
♻️ [Invalidation] Resources: ['items', 'itemTypes']
♻️ Invalidation de 2 ressource(s): ['items', 'itemTypes']
🔄 Regroupement: 1 appel(s) API nécessaire(s) au lieu de 2
```

### Problèmes courants

**Aucun refetch après invalidation?**
- Vérifier que le `SocketProvider` est bien utilisé dans `_layout.tsx`
- Vérifier les logs `[SocketProvider]` au démarrage
- Vérifier que `refetchResources` a bien les fonctions de load

**Erreurs TypeScript?**
- S'assurer que `ResourceName` est à jour
- Vérifier que la ressource a bien une fonction de refetch

## Performance

- **Déduplication**: Les ressources dupliquées ne sont refetch qu'une fois
- **Regroupement**: Les ressources utilisant la même fonction ne font qu'un seul appel API
- **Logs optimisés**: Seulement en développement

## Conclusion

Architecture **simple, centralisée et efficace** pour gérer tous les événements WebSocket de l'application Fork'it.

Tout se passe dans `SocketProvider` → facile à débugger et maintenir! 🎉
