# 📱 Migration Server View - Guide Complet

## 🎯 Objectif de la migration

Migrer les pages serveur (`app/(server)/`) de l'ancienne architecture vers la nouvelle architecture **Redux Toolkit + Hooks spécialisés** pour garantir un **Single Source of Truth** et une synchronisation temps réel cohérente.

## 📁 Fichiers migrés

### ✅ Complètement migrés
- `app/(server)/index.tsx` - Page principale serveur
- `app/(server)/order/[id].tsx` - Page détail commande

### 📊 Statistiques de migration
- **Avant** : 224 lignes dans `order/[id].tsx`
- **Après** : 144 lignes (-35% de code)
- **Code obsolète supprimé** : ~100 lignes de logique dupliquée

## 🏗️ Architecture avant/après

### ❌ Ancienne architecture (Problématique)

```typescript
// État local dupliqué dans chaque composant
const [order, setOrder] = useState<Order | null>(null);
const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Appels API directs
const loadOrderData = async () => {
  const orderResponse = await orderApiService.get(id);
  const itemTypesResponse = await itemTypeApiService.getAll();
  setOrder(orderResponse);
  setItemTypes(itemTypesResponse.data);
};

// Logique WebSocket manuelle (40+ lignes)
useEffect(() => {
  if (!isConnected || !socket || !order) return;
  
  const handleUpdateOrdersStatus = (orderItemIds: string[], status: Status) => {
    setOrder(prevOrder => {
      // Logique complexe de mise à jour...
    });
  };
  
  socket.on(EventType.ORDER_ITEMS_READY, handleUpdateOrdersStatus);
  // ...
}, [isConnected, socket, order]);
```

### ✅ Nouvelle architecture (Redux Toolkit)

```typescript
// Single Source of Truth via Redux
const { isLoading: globalLoading } = useRestaurant(); // Initialise WebSocket
const { getOrderById, deleteOrder, updateOrderStatus, loading, error } = useOrders();
const { itemTypes } = useMenu();

// Récupération depuis le store (pas d'API)
const order = getOrderById(id as string);

// WebSocket géré automatiquement par useRestaurantSocket
// Synchronisation temps réel transparente
```

## 🔧 Problèmes rencontrés et solutions

### 🐛 Problème 1: Mise à jour de tous les items au lieu du type sélectionné

**Symptôme** :
```typescript
// ❌ Code problématique
await updateOrderStatus(order.id, status); // Met à jour TOUS les items
```

**Cause** : 
Appel à `updateOrderStatus` sans `itemTypeId`, ce qui mettait à jour tous les items de la commande au lieu de seulement ceux sélectionnés.

**Solution** :
```typescript
// ✅ Solution
const handleStatusUpdate = async (orderItems: OrderItem[], status: Status) => {
  const orderItemsIds = orderItems.map(orderItem => orderItem.id);
  await orderItemApiService.updateManyStatus(orderItemsIds, status);
  
  // Le store Redux se met à jour automatiquement via WebSockets
  // Pas besoin d'appeler updateOrderStatus qui met à jour TOUTE la commande
};
```

### 🐛 Problème 2: Affichage non synchronisé malgré mise à jour BDD

**Symptôme** :
- ✅ Statuts mis à jour en base de données
- ❌ Interface ne se rafraîchit pas en temps réel
- ✅ Interface admin fonctionne correctement
- ❌ Interface serveur ne fonctionne pas

**Cause** :
Les pages serveur utilisaient les hooks spécialisés (`useOrders`, `useTables`, etc.) **sans** initialiser la connexion WebSocket via `useRestaurant()`.

**Diagnostic** :
```typescript
// ❌ app/(server)/index.tsx - SANS WebSocket
const { rooms, currentRoom } = useRooms();
const { currentRoomTables } = useTables();
// Pas d'appel à useRestaurant() → Pas de WebSocket

// ✅ app/(admin)/service.tsx - AVEC WebSocket  
const { rooms, currentRoom } = useRooms();
const { isLoading } = useRestaurant(); // ← Initialise automatiquement le WebSocket !
```

**Solution** :
```typescript
// ✅ Ajouter l'initialisation WebSocket dans TOUTES les pages serveur
export default function ServerHome() {
  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();
  
  // Maintenant les hooks spécialisés reçoivent les mises à jour temps réel
  const { rooms, currentRoom } = useRooms();
  const { currentRoomTables } = useTables();
  // ...
}
```

## 📋 Checklist de migration

### ✅ Phase 1: Remplacement du state local
- [x] Supprimer `useState` pour les données métier
- [x] Remplacer par les hooks Redux appropriés
- [x] Utiliser les sélecteurs pour récupérer les données

### ✅ Phase 2: Migration des appels API
- [x] Supprimer les appels API directs (`orderApiService.get`)
- [x] Utiliser les actions des hooks Redux
- [x] Préserver les appels API pour les actions spécifiques (updateManyStatus)

### ✅ Phase 3: Simplification WebSocket
- [x] Supprimer la logique WebSocket manuelle
- [x] S'appuyer sur `useRestaurantSocket` automatique
- [x] **CRITIQUE** : Initialiser `useRestaurant()` dans chaque page

### ✅ Phase 4: Nettoyage
- [x] Supprimer le code commenté obsolète
- [x] Optimiser les imports
- [x] Vérifier la cohérence avec l'interface admin

## ⚠️ Points critiques à retenir

### 🔑 Règle d'or: Initialisation WebSocket
```typescript
// ✅ OBLIGATOIRE dans chaque page utilisant les hooks spécialisés
const { isLoading } = useRestaurant(); // Initialise useRestaurantSocket automatiquement

// ❌ ERREUR COMMUNE - Oublier cette ligne
const { orders } = useOrders(); // Pas de synchronisation temps réel !
```

### 🔑 Gestion des mises à jour de statut
```typescript
// ✅ Pour des orderItems spécifiques
await orderItemApiService.updateManyStatus(orderItemsIds, status);

// ✅ Pour tous les items d'un type dans une commande  
await updateOrderStatus(order.id, status, itemTypeId);

// ❌ Pour toute une commande (éviter sauf cas spécifique)
await updateOrderStatus(order.id, status); // Sans itemTypeId
```

## 🎁 Bénéfices de la migration

### 🚀 Performance
- **-35% de code** dans les composants
- **Élimination des re-renders inutiles** grâce aux sélecteurs Redux
- **Cache automatique** des données via le store

### 🔄 Synchronisation temps réel
- **WebSocket unifié** pour toutes les pages
- **Mises à jour automatiques** sans logique manuelle
- **Cohérence** entre interface admin et serveur

### 🛠️ Maintenabilité
- **Code centralisé** dans les hooks spécialisés
- **Réutilisabilité** des hooks entre pages
- **Tests unitaires** plus faciles

### 🎯 Fiabilité
- **Single Source of Truth** élimine les incohérences
- **Gestion d'erreur centralisée** via le store UI
- **État prévisible** grâce à Redux DevTools

## 📚 Ressources de référence

### Documentation projet
- `STATE_MANAGEMENT.md` - Architecture Redux détaillée
- `HOOKS_SIMPLIFIES.md` - Guide des hooks spécialisés
- `WEB_SOCKET_INTEGRATION.md` - Intégration temps réel

### Exemples de référence
- `app/(admin)/service.tsx` - Implémentation de référence
- `hooks/useRestaurant.ts` - Hook principal orchestrateur
- `store/restaurant/` - Structure Redux modulaire

## 🎯 Prochaines étapes

### Pages à migrer
- `app/(server)/order/menu` - Page de sélection menu
- `app/(chef)/` - Interface cuisine (si applicable)

### Améliorations possibles
- **Offline support** via Redux Persist
- **Optimistic updates** pour une UX plus fluide
- **Error boundaries** pour une gestion d'erreur robuste

---

## 🏁 Conclusion

Cette migration transforme les pages serveur d'une architecture fragmentée vers une architecture moderne et cohérente. Le **Single Source of Truth** via Redux Toolkit garantit la synchronisation temps réel et élimine les bugs de cohérence de données.

**Résultat** : Interface serveur aussi réactive et fiable que l'interface admin ! 🎉