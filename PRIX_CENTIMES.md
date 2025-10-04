# Migration Prix en Centimes

## 📋 Résumé

Toutes les valeurs de prix dans l'application sont maintenant gérées en **centimes** côté backend.
Le frontend effectue automatiquement la conversion pour l'affichage (centimes → euros) et l'envoi API (euros → centimes).

## 🔄 Fonctions Utilitaires

Dans [`lib/utils.ts`](lib/utils.ts), plusieurs fonctions ont été ajoutées :

### Conversion
- **`centsToEuros(centimes: number)`** - Convertit centimes → euros (pour affichage)
- **`eurosToCents(euros: number)`** - Convertit euros → centimes (pour envoi API)

### Formatage
- **`formatPrice(centimes: number, decimals?: number)`** - Formate un prix en centimes avec symbole € (ex: "3,00€")
- **`formatPriceWithoutSymbol(centimes: number, decimals?: number)`** - Formate sans symbole (ex: "3,00")

## 📊 Types Mis à Jour

Tous les types de prix ont été annotés avec le commentaire `// 💰 Prix en centimes` :

### [`types/item.types.ts`](types/item.types.ts)
```typescript
export type Item = {
  price: number; // 💰 Prix en centimes (ex: 300 = 3€)
  // ...
}
```

### [`types/menu.types.ts`](types/menu.types.ts)
```typescript
export type Menu = {
  basePrice: number; // 💰 Prix en centimes (ex: 1500 = 15€)
  // ...
}

export type MenuCategory = {
  priceModifier: number; // 💰 Modificateur en centimes (ex: 200 = +2€)
  // ...
}

export type MenuCategoryItem = {
  supplement: number; // 💰 Supplément en centimes (ex: 150 = +1,50€)
  // ...
}
```

### [`types/order-line.types.ts`](types/order-line.types.ts)
```typescript
export type OrderLine = {
  unitPrice: number; // 💰 Prix unitaire en centimes
  totalPrice: number; // 💰 Prix total en centimes (unitPrice * quantity)
  // ...
}
```

## 🎨 Composants Mis à Jour

### Affichage de Prix
Tous les composants affichant des prix utilisent maintenant `formatPrice()` :

- ✅ [`components/Service/PaymentView.tsx`](components/Service/PaymentView.tsx)
- ✅ [`components/Service/MenuSelector.tsx`](components/Service/MenuSelector.tsx)
- ✅ [`components/order/OrderLinesForm/OrderLinesFooter.tsx`](components/order/OrderLinesForm/OrderLinesFooter.tsx)
- ✅ [`components/order/OrderLinesForm/OrderMenusList.tsx`](components/order/OrderLinesForm/OrderMenusList.tsx)
- ✅ [`components/order/OrderLinesForm/OrderItemsList.tsx`](components/order/OrderLinesForm/OrderItemsList.tsx)
- ✅ [`components/order/OrderLinesForm/MenuConfiguration.tsx`](components/order/OrderLinesForm/MenuConfiguration.tsx)
- ✅ [`components/admin/MenuDetailView.tsx`](components/admin/MenuDetailView.tsx)
- ✅ [`app/(admin)/menu.tsx`](app/(admin)/menu.tsx)

### Formulaires de Saisie
Les formulaires convertissent automatiquement :
- **Affichage** : centimes → euros (via `centsToEuros`)
- **Sauvegarde** : euros → centimes (via `eurosToCents`)

#### [`components/form/MenuForm.tsx`](components/form/MenuForm.tsx)
- Conversion au chargement : `price: centsToEuros(item.price)`
- Conversion à la sauvegarde : `price: eurosToCents(formData.price)`

#### [`hooks/menu/useMenuEditor.ts`](hooks/menu/useMenuEditor.ts)
- **Chargement** :
  - `basePrice`: centimes → euros
  - `priceModifier`: centimes → euros
  - `supplement` des items : centimes → euros

- **Sauvegarde** (dans `getMenuData()`) :
  - `basePrice`: euros → centimes
  - `priceModifier`: euros → centimes
  - `supplement` des localItems : euros → centimes

## 🔍 Points d'Attention

### Backend
Le backend doit **toujours envoyer les prix en centimes** :
- Item avec prix 3€ → `{ price: 300 }`
- Menu 15€ → `{ basePrice: 1500 }`
- Supplément 1,50€ → `{ supplement: 150 }`

### Frontend
Le frontend gère automatiquement la conversion :
- **Réception API** : Les valeurs arrivent en centimes et sont affichées correctement
- **Envoi API** : Les valeurs saisies en euros sont converties en centimes

### Exemple de Flux
```
Backend (3€) → 300 (centimes)
    ↓
Frontend reçoit : 300
    ↓
Affichage : formatPrice(300) → "3,00€"
    ↓
Formulaire : centsToEuros(300) → 3 (input)
    ↓
Utilisateur modifie : 3.50
    ↓
Sauvegarde : eurosToCents(3.50) → 350
    ↓
Backend reçoit : 350 (centimes = 3,50€)
```

## ✅ Tests Recommandés

1. **Affichage** : Vérifier que tous les prix s'affichent correctement (3€ = "3,00€")
2. **Création** : Créer un article à 5,50€ → Backend doit recevoir 550
3. **Édition** : Modifier un prix de 3€ à 4,20€ → Backend doit recevoir 420
4. **Menus** : Vérifier basePrice, priceModifier et supplements
5. **Commandes** : Vérifier totalPrice et unitPrice

## 🚀 Migration Backend

Si le backend n'envoie pas encore les prix en centimes, deux options :

### Option 1 : Adapter le Backend (Recommandé)
Multiplier tous les prix par 100 avant l'envoi.

### Option 2 : Ajouter un Interceptor (Temporaire)
```typescript
// Dans api/base.api.ts - À éviter si possible
response.interceptors.use(
  response => {
    // Convertir les prix du backend en centimes
    // NOTE: Ceci est temporaire !
    return response;
  }
);
```

---

**Date de migration** : 2025-10-04
**Status** : ✅ Terminé
