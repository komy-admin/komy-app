# WebSocket Integration - Système d'invalidation

## Vue d'ensemble

Le système d'invalidation WebSocket permet au backend d'informer le frontend que des données doivent être refetch suite à des opérations CASCADE (suppressions en cascade).

## Architecture

### Fichiers principaux

1. **`websocket.config.ts`** - Configuration et types
   - Définit les types `InvalidateEvent` et `ResourceName`
   - Mappe les événements WebSocket aux actions Redux

2. **`useInvalidationRefetch.ts`** - Hook de refetch
   - Mappe les noms de ressources backend aux fonctions de refetch
   - Optimise les refetchs en regroupant les appels API identiques
   - Logs détaillés pour le debugging

3. **`useWebSocketSync.ts`** - Synchronisation WebSocket
   - Écoute l'événement `invalidate`
   - Déclenche les refetchs appropriés
   - Continue à gérer les événements CRUD standards

## Flux de données

```
Backend supprime ItemType
    ↓
DELETE CASCADE: items, menuCategories
    ↓
Backend émet: { action: 'invalidate', resources: ['items', 'itemTypes', 'menuCategories'] }
    ↓
useWebSocketSync reçoit l'événement
    ↓
useInvalidationRefetch groupe les ressources
    ↓
Optimisation: 2 appels API au lieu de 3
  - loadItems() + loadItemTypes() → refetch items & itemTypes
  - loadAllMenus() → refetch menus (inclut menuCategories)
    ↓
Redux state mis à jour
    ↓
UI se met à jour automatiquement
```

## Mapping des ressources

| Ressource Backend | Fonction de refetch | Note |
|------------------|---------------------|------|
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

## Optimisations

### Déduplication
Si le backend envoie `['items', 'menuCategories', 'menus']`, le système détecte que `menuCategories` est déjà inclus dans `loadAllMenus()` et ne fait qu'un seul appel API.

### Logs de debug
En développement, tous les événements d'invalidation sont loggés avec:
- 📦 Liste des ressources à refetch
- 🏢 Account ID
- 🕐 Timestamp
- 🔄 Nombre d'appels API optimisés

## Exemple d'événement

```typescript
{
  action: 'invalidate',
  resources: ['items', 'itemTypes', 'menuCategories'],
  accountId: 'clxxx123abc',
  timestamp: '2025-02-15T10:30:00.000Z'
}
```

## Cas d'usage CASCADE

Voir `.claude/WEBSOCKET_INVALIDATION.md` pour la documentation complète du backend.

### Exemples

**Suppression ItemType**
```
resources: ['items', 'itemTypes', 'menuCategories']
```

**Suppression Menu**
```
resources: ['menus', 'menuCategories', 'menuCategoryItems']
```

**Suppression Room**
```
resources: ['rooms', 'tables']
```

## Testing

Pour tester le système d'invalidation:

1. Ouvrir la console du navigateur/app
2. Effectuer une suppression CASCADE (ex: supprimer un ItemType)
3. Vérifier les logs:
   ```
   ♻️ WebSocket Invalidation
   📦 Resources à refetch: ['items', 'itemTypes', 'menuCategories']
   🔄 Regroupement: 2 appel(s) API nécessaire(s) au lieu de 3
   ✅ Toutes les ressources ont été refetch
   ```

## Extension

Pour ajouter le support d'une nouvelle ressource:

1. Ajouter le type dans `ResourceName` (`websocket.config.ts`)
2. Ajouter le mapping dans `useInvalidationRefetch.ts`:
   ```typescript
   const refetchMap: Record<ResourceName, ...> = {
     // ...
     newResource: useNewResource.loadNewResource,
   }
   ```
3. C'est tout! Le système s'occupe du reste.
