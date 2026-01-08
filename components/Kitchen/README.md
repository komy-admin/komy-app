# Architecture Kitchen/Bar - Fork'it

Ce document décrit l'architecture et le fonctionnement du système d'affichage Kitchen/Bar de l'application Fork'it.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Modes d'affichage (ViewModes)](#modes-daffichage-viewmodes)
3. [Architecture des composants](#architecture-des-composants)
4. [Configuration des variants](#configuration-des-variants)
5. [Flow de données](#flow-de-données)
6. [Composants partagés](#composants-partagés)
7. [Hooks personnalisés](#hooks-personnalisés)
8. [Statuts et états](#statuts-et-états)
9. [Personnalisation et extension](#personnalisation-et-extension)

---

## 🎯 Vue d'ensemble

Le système Kitchen/Bar est un système unifié pour afficher et gérer les commandes en cuisine et au bar. Il supporte **deux modes d'affichage** configurables dynamiquement :

- **Vue Colonnes** (`columns`) - Vue Kanban avec colonnes par statut
- **Vue Tickets** (`tickets`) - Vue horizontale avec scroll de tickets

### Caractéristiques principales

✅ Architecture unifiée pour Kitchen et Bar
✅ 2 modes d'affichage configurables par module
✅ Synchronisation temps réel via WebSocket
✅ Gestion des items en retard (overdue)
✅ Groupement automatique par commande
✅ Tri intelligent par priorité de statut
✅ Variants de cards configurables

---

## 🎨 Modes d'affichage (ViewModes)

### Configuration

Les viewModes sont configurés au niveau du compte dans `AccountConfig` :

```typescript
{
  kitchenViewMode: 'columns' | 'tickets',
  barViewMode: 'columns' | 'tickets'
}
```

La configuration est modifiable depuis l'interface admin dans **Paramètres Restaurant > Gestion Module**.

### Vue Colonnes (`columns`)

**Utilisation** : Vue Kanban traditionnelle avec colonnes verticales

**Caractéristiques** :
- 3 colonnes : EN ATTENTE, EN COURS, PRÊT
- Cards fixes (non scrollable individuellement)
- Un seul bouton d'action par card
- Statuts visibles : `PENDING`, `INPROGRESS`, `READY`
- Pas de statut DRAFT (brouillons)
- Optimal pour vue desktop/tablette

**Composant** : `KitchenColumnView.tsx`

```typescript
<KitchenColumnView
  itemGroups={groupedItems.filter(group => group.status === status)}
  status={status}
  onStatusChange={handleStatusChange}
/>
```

### Vue Tickets (`tickets`)

**Utilisation** : Vue liste horizontale avec scroll

**Caractéristiques** :
- Scroll horizontal de tickets
- Tickets scrollables individuellement
- Deux boutons d'action simultanés (mode dual)
- Badges de statut visibles sur chaque item
- Backgrounds colorés par statut
- Statuts visibles : `DRAFT`, `PENDING`, `INPROGRESS`, `READY`
- Bandeaux diagonaux ("BROUILLON", "À SERVIR")
- Modal de confirmation pour notification
- Largeur fixe de 300px par ticket
- Tri par priorité (INPROGRESS > PENDING > autres)

**Composant** : `KitchenTicketView.tsx`

```typescript
<KitchenTicketView
  itemGroups={groupedItems}
  onStatusChange={handleStatusChange}
/>
```

---

## 🏗️ Architecture des composants

### Structure des dossiers

```
components/Kitchen/
├── cards/
│   ├── config/
│   │   └── card-variants.config.ts    # Configuration centralisée des variants
│   ├── variants/
│   │   ├── KitchenCardColumn.tsx      # Variant pour mode colonnes
│   │   └── KitchenCardTicket.tsx      # Variant pour mode tickets
│   └── KitchenCard.tsx                # Composant card unifié
├── shared/
│   ├── components/
│   │   ├── ActionButtons.tsx          # Boutons d'action (Commencer, Prêt)
│   │   ├── CardHeader.tsx             # Header de card (table, timer, count)
│   │   ├── CategorySection.tsx        # Section par catégorie d'items
│   │   ├── ItemRow.tsx                # Ligne d'item individuel
│   │   ├── ItemCustomization.tsx      # Notes + tags d'un item
│   │   ├── NoteChip.tsx               # Chip pour afficher une note
│   │   └── TagChip.tsx                # Chip pour afficher un tag
│   ├── hooks/
│   │   ├── useItemPriorityMap.ts      # Tri des items par priorité
│   │   ├── useItemsByCategory.ts      # Groupement par catégorie
│   │   └── useOverdueTimer.ts         # Gestion du timer de retard
│   └── types/
│       └── kitchen-card.types.ts      # Types TypeScript partagés
├── KitchenColumnView.tsx              # Vue colonnes (Kanban)
└── KitchenTicketView.tsx              # Vue tickets (Horizontal)
```

### Hiérarchie des composants

```
┌─────────────────────────────────────────────┐
│  (cook)/index.tsx ou (admin)/kitchen.tsx    │
│  - Récupère kitchenViewMode                 │
│  - Utilise CARD_VARIANTS[viewMode]          │
│  - Filtre items avec filterItemsByArea()    │
│  - Groupe items avec useItemGrouping()      │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼─────────┐  ┌────────▼─────────┐
│ KitchenColumnView│  │ KitchenTicketView│
│  (mode columns)  │  │  (mode tickets)  │
└───────┬─────────┘  └────────┬─────────┘
        │                     │
        └──────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │   KitchenCard      │
         │ (composant unifié) │
         └─────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼─────┐  ┌────▼────┐  ┌──────▼──────┐
│CardHeader│  │ItemRows │  │ActionButtons│
└──────────┘  └─────────┘  └─────────────┘
```

---

## ⚙️ Configuration des variants

Les variants sont définis dans `cards/config/card-variants.config.ts` :

### Variant `column`

```typescript
column: {
  showHeader: true,               // Affiche le header (table + timer)
  showTimer: true,                // Affiche le timer de retard
  showItemCount: true,            // Affiche le nombre d'items
  showStatusBadges: false,        // Pas de badges sur les items
  showItemBackgroundColors: false,// Pas de backgrounds colorés
  scrollable: false,              // Card non scrollable
  clickable: false,               // Card non cliquable
  showButtons: true,              // Affiche les boutons d'action
  buttonMode: 'single',           // Un seul bouton à la fois
  buttonPosition: 'bottom',       // Boutons en bas
  cardStyle: 'default',
  availableStatuses: [            // Statuts affichés
    Status.PENDING,
    Status.INPROGRESS,
    Status.READY
  ],
  features: {
    modal: false,                 // Pas de modal
    swipe: false,                 // Pas de swipe
    notification: false,          // Pas de notification
    banner: false,                // Pas de bandeau
  }
}
```

### Variant `ticket`

```typescript
ticket: {
  showHeader: true,
  showTimer: true,
  showItemCount: true,
  showStatusBadges: true,          // Badges visibles sur items
  showItemBackgroundColors: true,  // Backgrounds colorés par statut
  scrollable: true,                // Card scrollable
  clickable: false,
  showButtons: true,
  buttonMode: 'dual',              // Deux boutons simultanés
  buttonPosition: 'bottom',
  maxHeight: 600,                  // Hauteur max de 600px
  cardStyle: 'default',
  availableStatuses: [             // Tous les statuts incluant DRAFT
    Status.DRAFT,
    Status.PENDING,
    Status.INPROGRESS,
    Status.READY
  ],
  features: {
    modal: true,                   // Modal de confirmation
    swipe: false,
    notification: true,            // Notifications activées
    banner: true,                  // Bandeaux diagonaux
  }
}
```

### Utilisation

```typescript
import { CARD_VARIANTS } from '~/components/Kitchen/cards/config/card-variants.config';

// Déterminer le variant selon le mode de vue
const currentVariant = kitchenViewMode === 'tickets'
  ? CARD_VARIANTS.ticket
  : CARD_VARIANTS.column;

// Filtrer les items selon les statuts disponibles du variant
const filteredItems = filterItemsByArea(
  kitchenItems,
  'kitchen',
  currentVariant.availableStatuses
);
```

---

## 🔄 Flow de données

### 1. Initialisation

```typescript
// Dans (cook)/index.tsx ou (admin)/kitchen.tsx

// 1. Récupérer la configuration
const { kitchenViewMode } = useAccountConfig();

// 2. Déterminer le variant
const currentVariant = kitchenViewMode === 'tickets'
  ? CARD_VARIANTS.ticket
  : CARD_VARIANTS.column;

// 3. Récupérer tous les items kitchen depuis Redux
const kitchenItems = useSelector(selectAllKitchenItems);

// 4. Filtrer selon les statuts disponibles du variant
const filteredKitchenItems = useMemo(() => {
  return filterItemsByArea(
    kitchenItems,
    'kitchen',
    currentVariant.availableStatuses
  );
}, [kitchenItems, currentVariant.availableStatuses]);

// 5. Récupérer les commandes qui ont des items en cuisine
const kitchenOrders = useMemo(() => {
  const orderIds = [...new Set(filteredKitchenItems.map(item => item.orderId))];
  return orders.filter(order => orderIds.includes(order.id));
}, [orders, filteredKitchenItems]);

// 6. Grouper les items par commande avec tri intelligent
const groupedItems = useItemGrouping(
  kitchenOrders,
  filteredKitchenItems,
  overdueOrderItemIds || []
);
```

### 2. Affichage

```typescript
// Mode tickets
{kitchenViewMode === 'tickets' ? (
  <KitchenTicketView
    itemGroups={groupedItems}
    onStatusChange={handleStatusChange}
  />
) : (
  // Mode columns
  <View style={styles.columnsContainer}>
    {currentVariant.availableStatuses.map((status) => (
      <KitchenColumnView
        key={status}
        itemGroups={groupedItems.filter(group => group.status === status)}
        status={status}
        onStatusChange={handleStatusChange}
      />
    ))}
  </View>
)}
```

### 3. Changement de statut

```typescript
const handleStatusChange = async (itemGroup: ItemGroup, newStatus: Status) => {
  try {
    // Séparer OrderLines (articles) et OrderLineItems (items de menu)
    const orderLineIds: string[] = [];
    const orderLineItemIds: string[] = [];

    itemGroup.items.forEach(item => {
      if (item.type === 'ITEM') {
        orderLineIds.push(item.id);
      } else if (item.type === 'MENU_ITEM') {
        orderLineItemIds.push(item.id);
      }
    });

    // Appel API unique avec les deux types d'items
    await updateOrderStatus(itemGroup.orderId, {
      status: newStatus,
      orderLineIds: orderLineIds.length > 0 ? orderLineIds : undefined,
      orderLineItemIds: orderLineItemIds.length > 0 ? orderLineItemIds : undefined,
    });

    // WebSocket confirmera la mise à jour
  } catch (error) {
    showToast('Impossible de mettre à jour le statut', 'error');
  }
};
```

### 4. Synchronisation temps réel

```
┌──────────────┐
│  User action │
│ (click button)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   API PATCH  │
│ /api/order/:id│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Backend update  │
│   + WebSocket    │
│ order:updated    │
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ useRestaurantSocket  │
│ (all clients)        │
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│  Redux update    │
│ entities.slice   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   UI re-render   │
│  (auto update)   │
└──────────────────┘
```

---

## 🧩 Composants partagés

### CardHeader

Affiche les informations de header d'une card (table, timer, count).

```typescript
<CardHeader
  itemGroup={itemGroup}
  showTimer={variant.showTimer}
  showItemCount={variant.showItemCount}
/>
```

**Props** :
- `itemGroup` : Groupe d'items de la commande
- `showTimer` : Afficher le timer de retard
- `showItemCount` : Afficher le nombre d'items

### ActionButtons

Gère les boutons d'action pour changer le statut.

```typescript
<ActionButtons
  mode="dual"
  itemGroup={itemGroup}
  onStatusChange={onStatusChange}
  showModal={true}
  onNotify={handleNotify}
  tableShortId={itemGroup.tableShortId}
/>
```

**Modes** :
- `'single'` : Un seul bouton selon le statut (column mode)
- `'dual'` : Deux boutons simultanés (ticket mode)
- `'none'` : Aucun bouton

**Props** :
- `mode` : Mode de boutons
- `itemGroup` : Groupe d'items
- `status` : Statut actuel (optionnel, pour mode single)
- `onStatusChange` : Callback de changement de statut
- `showModal` : Afficher modal de confirmation
- `onNotify` : Callback de notification (optionnel)
- `tableShortId` : ID court de la table

### ItemRow

Affiche une ligne d'item avec personnalisations.

```typescript
<ItemRow
  item={item}
  isLastItem={isLastItem}
  showStatusBadge={variant.showStatusBadges}
  showBackgroundColors={variant.showItemBackgroundColors}
/>
```

**Affiche** :
- Nom de l'item
- Badge "Menu: [nom]" si item de menu
- Badge de statut (optionnel)
- Background coloré par statut (optionnel)
- Notes et tags (via ItemCustomization)

**États visuels** :
- Items en DRAFT : opacité réduite (0.3)
- Items en retard : background rouge (#FEE2E2)
- Items PENDING : background jaune (#FFFBEB)
- Items INPROGRESS : background orange (#FFF8F0)
- Items READY : background bleu (#DBEAFE)

### ItemCustomization

Affiche les notes et tags d'un item.

```typescript
<ItemCustomization
  note={item.note}
  tags={item.tags}
/>
```

### CategorySection

Groupe et affiche les items par catégorie (type d'article).

```typescript
<CategorySection
  category={category}
  items={categoryItems}
  isLastCategory={isLastCategory}
  variant={variant}
/>
```

---

## 🪝 Hooks personnalisés

### useItemsByCategory

Groupe les items par catégorie (type d'article) avec tri par priorité.

```typescript
const { categories, itemsByCategory } = useItemsByCategory(items);

// categories: Array<{ id: string, name: string, priorityOrder: number }>
// itemsByCategory: Map<categoryId, Array<KitchenItem>>
```

**Logique** :
1. Groupe les items par `itemTypeId`
2. Tri les catégories par `priorityOrder` (asc)
3. Tri les items dans chaque catégorie par `itemName`

### useItemPriorityMap

Crée une map de priorités pour les items en retard.

```typescript
const priorityMap = useItemPriorityMap(items, overdueOrderItemIds);

// priorityMap: Map<itemId, boolean>
```

### useOverdueTimer

Gère le timer de retard avec mise à jour automatique.

```typescript
const { displayTime, isOverdue } = useOverdueTimer(
  createdAt,
  reminderMinutes,
  itemGroup.items.every(item => item.status === Status.READY)
);

// displayTime: string (ex: "12min", "1h 45min")
// isOverdue: boolean
```

**Logique** :
- Calcule le temps écoulé depuis `createdAt`
- Compare avec `reminderMinutes`
- Update toutes les minutes
- Désactivé si tous les items sont READY

---

## 📊 Statuts et états

### Statuts d'items (Status enum)

```typescript
enum Status {
  DRAFT = 'DRAFT',           // Brouillon (pas encore demandé)
  PENDING = 'PENDING',       // En attente de préparation
  INPROGRESS = 'INPROGRESS', // En cours de préparation
  READY = 'READY',           // Prêt à servir
  SERVED = 'SERVED',         // Servi (pas utilisé en cuisine)
  TERMINATED = 'TERMINATED', // Terminé (pas utilisé en cuisine)
  ERROR = 'ERROR'            // Erreur (pas utilisé en cuisine)
}
```

### Statuts par mode

**Mode columns** : `PENDING`, `INPROGRESS`, `READY`
**Mode tickets** : `DRAFT`, `PENDING`, `INPROGRESS`, `READY`

### États visuels

#### Cards
- **Normal** : Background blanc (#FFFFFF)
- **En retard** : Border rouge (#EF4444)
- **DRAFT (ticket)** : Bandeau diagonal "BROUILLON" orange (#F59E0B)
- **Notifié (ticket)** : Bandeau diagonal "À SERVIR" bleu (#3B82F6)

#### Items
- **PENDING** : Jaune (#FFFBEB)
- **INPROGRESS** : Orange (#FFF8F0)
- **READY** : Bleu (#DBEAFE)
- **En retard** : Rouge (#FEE2E2) - prioritaire
- **DRAFT** : Grisé (opacity: 0.3)

### Couleurs de référence (lib/utils.ts)

```typescript
export const getStatusColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#D7E3FC',     // Bleu
    [Status.PENDING]: '#F9F1C8',   // Jaune
    [Status.INPROGRESS]: '#FFD1AD',// Orange
    [Status.SERVED]: '#B7E1CC',    // Vert (Service uniquement)
    [Status.ERROR]: '#F7BFB5',
    [Status.TERMINATED]: '#EBEBEB',
    [Status.DRAFT]: '#EBEBEB',
  };
  return colors[status] || colors[Status.ERROR];
}
```

---

## 🔧 Personnalisation et extension

### Ajouter un nouveau variant

1. **Définir la configuration dans `card-variants.config.ts`** :

```typescript
export const CARD_VARIANTS: Record<CardVariant, CardVariantConfig> = {
  column: { /* ... */ },
  ticket: { /* ... */ },

  // Nouveau variant
  compact: {
    showHeader: true,
    showTimer: false,
    showItemCount: false,
    showStatusBadges: true,
    showItemBackgroundColors: false,
    scrollable: false,
    clickable: true,
    showButtons: false,
    buttonMode: 'none',
    buttonPosition: 'bottom',
    cardStyle: 'compact',
    availableStatuses: [Status.PENDING, Status.INPROGRESS],
    features: {
      modal: false,
      swipe: true,
      notification: false,
      banner: false,
    }
  }
};
```

2. **Créer le wrapper dans `cards/variants/`** :

```typescript
// KitchenCardCompact.tsx
export default function KitchenCardCompact({ itemGroup, ...props }) {
  return (
    <View style={styles.compactWrapper}>
      <KitchenCard
        variant="compact"
        itemGroup={itemGroup}
        {...props}
      />
    </View>
  );
}
```

3. **Créer la vue dans le dossier principal** :

```typescript
// KitchenCompactView.tsx
export function KitchenCompactView({ itemGroups, onStatusChange }) {
  return (
    <ScrollView horizontal>
      {itemGroups.map((itemGroup) => (
        <KitchenCardCompact
          key={itemGroup.id}
          itemGroup={itemGroup}
          onStatusChange={onStatusChange}
        />
      ))}
    </ScrollView>
  );
}
```

4. **Ajouter au type ViewMode** :

```typescript
// types/account-config.type.ts
export type ViewMode = 'columns' | 'tickets' | 'compact';
```

5. **Mettre à jour la migration et le validator backend**.

### Modifier les couleurs d'un statut

Modifier `lib/utils.ts` :

```typescript
export const getStatusColor = (status: Status) => {
  const colors = {
    [Status.READY]: '#NEW_COLOR',  // Modifier ici
    // ...
  };
  return colors[status] || colors[Status.ERROR];
}
```

Puis mettre à jour les composants qui utilisent des couleurs hardcodées :
- `ActionButtons.tsx`
- `ItemRow.tsx`
- `KitchenCardTicket.tsx`

### Ajouter une fonctionnalité

Exemple : Ajouter un bouton "Annuler" sur les items en cours.

1. **Ajouter la feature dans la config** :

```typescript
ticket: {
  // ...
  features: {
    modal: true,
    swipe: false,
    notification: true,
    banner: true,
    cancelButton: true,  // Nouvelle feature
  }
}
```

2. **Modifier ActionButtons** :

```typescript
// Dans ActionButtons.tsx
{variant.features.cancelButton && item.status === Status.INPROGRESS && (
  <TouchableOpacity onPress={() => handleCancel(item)}>
    <Text>Annuler</Text>
  </TouchableOpacity>
)}
```

3. **Implémenter le handler** :

```typescript
const handleCancel = async (item: KitchenItem) => {
  await updateItemStatus(item.id, Status.PENDING);
};
```

---

## 📝 Notes importantes

### Différences Kitchen vs Bar

Le système est **100% unifié**. La seule différence est le filtre d'aire :

```typescript
// Kitchen
filterItemsByArea(items, 'kitchen', availableStatuses)

// Bar
filterItemsByArea(items, 'bar', availableStatuses)
```

### Gestion des items en retard

Un item est considéré en retard si :
1. `createdAt + reminderMinutes < now`
2. Son statut n'est pas `READY`

Les items en retard :
- Ont un border rouge sur la card
- Ont un background rouge sur l'item row
- Sont affichés avec un timer rouge
- Sont prioritaires visuellement

### Performance

**Optimisations en place** :
- `useMemo` pour les calculs coûteux (filtrage, groupement)
- `useCallback` pour les handlers
- Sélecteurs Redux optimisés
- Update timer toutes les minutes uniquement
- Pas de re-render inutile avec React.memo (à implémenter si besoin)

### Multi-tenancy

Toutes les données sont filtrées par `accountId` :
- Au niveau de l'API
- Au niveau du WebSocket (rooms)
- Au niveau de Redux (entities)

---

## 🚀 Utilisation recommandée

### Pour Kitchen (Cuisine)

```typescript
const { kitchenViewMode, kitchenEnabled } = useAccountConfig();

if (!kitchenEnabled) return null;

const currentVariant = kitchenViewMode === 'tickets'
  ? CARD_VARIANTS.ticket
  : CARD_VARIANTS.column;

const filteredItems = filterItemsByArea(
  kitchenItems,
  'kitchen',
  currentVariant.availableStatuses
);

const groupedItems = useItemGrouping(orders, filteredItems, overdueIds);

return kitchenViewMode === 'tickets' ? (
  <KitchenTicketView itemGroups={groupedItems} onStatusChange={handleStatusChange} />
) : (
  <KitchenColumnView itemGroups={groupedItems} status={status} onStatusChange={handleStatusChange} />
);
```

### Pour Bar

```typescript
const { barViewMode, barEnabled } = useAccountConfig();

if (!barEnabled) return null;

const currentVariant = barViewMode === 'tickets'
  ? CARD_VARIANTS.ticket
  : CARD_VARIANTS.column;

const filteredItems = filterItemsByArea(
  barItems,
  'bar',
  currentVariant.availableStatuses
);

const groupedItems = useItemGrouping(orders, filteredItems, overdueIds);

return barViewMode === 'tickets' ? (
  <KitchenTicketView itemGroups={groupedItems} onStatusChange={handleStatusChange} />
) : (
  <KitchenColumnView itemGroups={groupedItems} status={status} onStatusChange={handleStatusChange} />
);
```

---

## 📚 Ressources

### Fichiers clés à consulter

- `cards/config/card-variants.config.ts` - Configuration des variants
- `shared/types/kitchen-card.types.ts` - Types TypeScript
- `hooks/useItemGrouping.ts` - Logique de groupement
- `lib/itemFilters.ts` - Logique de filtrage
- `lib/utils.ts` - Couleurs de référence

### Hooks externes utilisés

- `useAccountConfig()` - Configuration du compte
- `useOrders()` - Gestion des commandes
- `useSelector(selectAllKitchenItems)` - Items depuis Redux
- `useRestaurantSocket()` - Synchronisation temps réel

---

**Dernière mise à jour** : 2026-01-06
**Version** : 1.0.0
**Maintenu par** : Équipe Fork'it
