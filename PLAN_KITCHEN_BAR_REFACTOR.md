# Plan de Refonte UX/UI - Interfaces Cuisine & Bar

**Date:** 2025-12-30
**Branche:** `new-version-order`
**Statut:** En planification
**Objectif:** Optimiser les interfaces cuisine et bar pour un usage production en environnement restaurant réel

---

## Résumé Exécutif

Cette refonte vise à résoudre les problèmes UX critiques des interfaces cuisine et bar actuelles :
- **Problème actuel** : Interface Kanban 3 colonnes avec swipes complexes, cartes petites, interactions précises
- **Contexte d'usage** : Chefs et barmans avec mains sales, pression temporelle, pas de temps pour interactions complexes
- **Solution** : 3 modes de vue configurables + cartes simplifiées avec gros boutons tactiles

---

## 1. ANALYSE DE L'ARCHITECTURE ACTUELLE

### 1.1 Structure Actuelle

**Pages principales :**
- `app/(admin)/kitchen.tsx` (150 lignes)
- `app/(admin)/barman.tsx` (146 lignes)

**Composants clés :**
- `components/Kitchen/OrderColumn.tsx` (115 lignes) - Conteneur de colonne
- `components/Kitchen/KitchenItemCard.tsx` (717 lignes) - Carte complexe avec swipes
- `components/Kitchen/OrderCard.tsx` (410 lignes) - Legacy, non utilisé

**Flux de données :**
1. Filtrage des items par zone (kitchen/bar) et statut
2. Groupement via `useItemGrouping` hook
3. 3 colonnes hardcodées : PENDING → INPROGRESS → READY
4. Interactions actuelles :
   - Swipe carte entière (avant/arrière)
   - Swipe en-têtes de catégorie
   - Tap items individuels

**Problèmes identifiés :**
- ❌ Swipes complexes impraticables avec mains sales
- ❌ Cartes petites, informations denses
- ❌ Workflow 3 colonnes obligatoire (pas flexible)
- ❌ Groupement par catégories ajoute complexité inutile
- ❌ Gestes nécessitent précision

### 1.2 Flux de Statuts

**Statuts disponibles :**
```
DRAFT → PENDING → INPROGRESS → READY → SERVED → TERMINATED → ERROR
```

**Workflow actuel cuisine/bar :**
- `PENDING → INPROGRESS → READY`
- INPROGRESS est optionnel (certains restaurants le sautent)
- Serveurs gèrent READY → SERVED

**Stockage configuration :**
- Redux `session.accountConfig`
- Champs actuels : `kitchenEnabled`, `barEnabled`, `teamEnabled`, `reminderMinutes`, `reminderNotificationsEnabled`
- API : `accountConfigApiService.update()`

---

## 2. MODES DE VUE PROPOSÉS

### 🎯 Mode 1 - LISTE SIMPLE (Simple List View)

**Cas d'usage :** Restaurants à volume élevé, personnel expérimenté, tracking minimal

**Design :**
- Liste scrollable unique, pleine largeur
- Aucune colonne de statut
- Cartes larges avec gros bouton "Marquer Prêt"
- Transition directe : PENDING → READY (saute INPROGRESS)
- Serveurs contrôlent tout, cuisine valide juste la complétion

**Pattern d'interaction :**
```
┌─────────────────────────────────────┐
│ Table : B3 • 14:32 • 3 articles     │
│                                     │
│ 🍕 Pizza Margherita                │
│ 🍝 Pâtes Carbonara                 │
│ 🥗 Salade César                    │
│                                     │
│ [     MARQUER PRÊT     ]           │  ← Bouton large 60px
│                                     │
└─────────────────────────────────────┘
```

**Avantages :**
- ✅ Workflow le plus rapide possible
- ✅ Taille carte maximale (pleine largeur)
- ✅ Un tap par groupe de commande
- ✅ Aucune précision requise
- ✅ Charge cognitive minimale

---

### 📊 Mode 2 - VUE EN COLONNES (Column View Enhanced)

**Cas d'usage :** Restaurants moyens, besoin tracking statuts, étapes de préparation multiples

**Design :**
- 2 ou 3 colonnes configurables
- Toggle INPROGRESS : admin active/désactive colonne du milieu
- Mode 2 colonnes : PENDING → READY
- Mode 3 colonnes : PENDING → INPROGRESS → READY
- Cartes simplifiées : swipes supprimés, grandes zones de tap

**Pattern d'interaction (3 colonnes) :**
```
┌──────────┬──────────┬──────────┐
│ EN ATTENTE│EN COURS  │  PRÊT    │
├──────────┼──────────┼──────────┤
│  [Carte] │  [Carte] │  [Carte] │
│    ↓     │    ↓     │          │
│ [Suivant]│ [Suivant]│          │
└──────────┴──────────┴──────────┘
```

**Design carte simplifiée :**
```
┌──────────────────┐
│ Table B3 • 14:32 │
│ 3 articles       │
│                  │
│ • Pizza x1       │
│ • Pâtes x1       │
│ • Salade x1      │
│                  │
│ [ ← Retour ]     │  ← Optionnel
│ [ Suivant → ]    │  ← Gros bouton avant
└──────────────────┘
```

**Avantages :**
- ✅ Séparation visuelle des statuts
- ✅ Workflow Kanban familier
- ✅ Configurable selon besoins restaurant
- ✅ Plus simple que cartes actuelles

---

### 🎫 Mode 3 - TABLEAU TICKETS (Ticket Board View)

**Cas d'usage :** Restaurants haut de gamme, commandes complexes, tracking détaillé

**Design :**
- Swimlanes horizontales par table
- Items au sein de chaque table progressent par statuts
- Points de statut colorés au lieu de colonnes
- Grosses checkboxes pour complétion individuelle

**Pattern d'interaction :**
```
Table B3 (3 articles) ──────────────────────────
 ○ Pizza Margherita          [✓ Terminé]
 ◐ Pâtes Carbonara (50%)     [✓ Terminé]  ← Mi-rempli = en cours
 ● Salade César (Prêt)       [   ]

Table A1 (2 articles) ──────────────────────────
 ○ Steak (En attente)        [✓ Terminé]
 ○ Frites (En attente)       [✓ Terminé]
```

**Indicateurs de statut :**
- ○ Cercle vide/blanc = PENDING
- ◐ Mi-rempli = INPROGRESS
- ● Rempli = READY

**Avantages :**
- ✅ Vue centrée table (modèle mental naturel)
- ✅ Tracking item individuel
- ✅ Pas de drag & drop
- ✅ Couleur + forme (accessibilité)
- ✅ Contexte complet de la commande visible

---

## 3. REDESIGN DES CARTES

### 3.1 Variantes de Cartes

#### SimpleListCard (Mode 1)
```typescript
<SimpleListCard
  itemGroup={group}
  onMarkReady={(group) => updateStatus(group, Status.READY)}
  isOverdue={group.isOverdue}
/>
```

**Caractéristiques :**
- Layout pleine largeur (pas de colonnes)
- Hauteur minimum 120px
- Bouton large 60px de hauteur
- Liste items simplifiée (nom + quantité uniquement)
- Pas de contrôles items individuels
- Polices larges, bold (16-18px)

#### ColumnCard (Mode 2)
```typescript
<ColumnCard
  itemGroup={group}
  currentColumn={status}
  canGoBack={canGoBack}
  canGoForward={canGoForward}
  onStatusChange={(group, newStatus) => updateStatus(group, newStatus)}
/>
```

**Caractéristiques :**
- Adapté à 1/2 ou 1/3 de largeur
- Grandes zones de tap (pas de swipes)
- Boutons avant/arrière simples
- Suppression en-têtes catégories
- Suppression swipes items individuels
- Hauteur minimum 100px

#### TicketBoardCard (Mode 3)
```typescript
<TicketBoardCard
  order={order}
  items={items}
  onItemToggle={(item, isDone) => handleItemToggle(item, isDone)}
  onTableComplete={(orderId) => markAllReady(orderId)}
/>
```

**Caractéristiques :**
- Layout swimlane horizontal
- Checkboxes larges (44px zone de tap)
- Points de statut (couleur + remplissage)
- Groupement par table/commande
- Bouton optionnel "Tout marquer prêt"

### 3.2 Principes de Design

**Toutes les cartes DOIVENT :**
1. **Zone de tap minimum :** 44x44px (standard Apple HIG)
2. **Polices larges :** 14px minimum, 16-18px préféré
3. **Contraste élevé :** Conformité WCAG AA
4. **Pas de gestes précis :** Taps uniquement, pas de swipes
5. **Hiérarchie visuelle claire :** Table → Items → Actions
6. **Indicateurs retard :** Bordure rouge + icône, pas juste couleur

**Complexité supprimée :**
- ❌ Groupement par catégories (aplatir en liste items)
- ❌ En-têtes swipables
- ❌ Tap avant item individuel
- ❌ Sections extensibles
- ❌ Petits tags chips (consolider ou supprimer)

---

## 4. SYSTÈME DE CONFIGURATION ADMIN

### 4.1 Nouveaux Champs Config

**Ajout au schéma `accountConfig` :**

```typescript
// Backend API & Migration BDD requises
{
  // Champs existants
  kitchenEnabled: boolean,
  barEnabled: boolean,

  // NOUVEAUX CHAMPS
  kitchenViewMode: 'simple' | 'columns' | 'tickets',  // Mode vue 1, 2 ou 3
  kitchenShowInProgress: boolean,                      // Toggle colonne INPROGRESS
  kitchenColumnCount: 2 | 3,                          // Pour mode colonnes

  barViewMode: 'simple' | 'columns' | 'tickets',
  barShowInProgress: boolean,
  barColumnCount: 2 | 3,
}
```

### 4.2 Interface Configuration

**Emplacement :** `app/(admin)/configs.tsx` - Ajouter nouvel onglet ou section

**UI proposée :**
```
┌─────────────────────────────────────────────┐
│ Configuration Cuisine                        │
├─────────────────────────────────────────────┤
│                                             │
│ Mode d'affichage :                          │
│  ( ) Liste simple - Un seul bouton         │
│  ( ) Vue en colonnes - Workflow            │
│  (•) Tableau des tickets - Détaillé        │
│                                             │
│ ┌─ Options mode colonnes ───────────┐      │
│ │ Nombre de colonnes :              │      │
│ │  ( ) 2 colonnes (Sans "En cours") │      │
│ │  (•) 3 colonnes (Avec "En cours") │      │
│ │                                    │      │
│ │ [✓] Afficher "En préparation"     │      │
│ └────────────────────────────────────┘      │
│                                             │
│ [ Enregistrer ]                             │
└─────────────────────────────────────────────┘
```

**Implémentation :**
- Étendre composant `ViewsTab` dans `configuration.tsx`
- Boutons radio pour sélection mode vue
- Sections conditionnelles selon mode sélectionné
- Mise à jour hook `useAccountConfig`

### 4.3 Backend Requis

**Modifications API nécessaires :**
1. **Migration BDD :** Ajouter colonnes à table `account_configs`
2. **Validation :** Mise à jour validateur AccountConfig backend
3. **Valeurs par défaut :**
   - `kitchenViewMode: 'columns'` (préserver comportement actuel)
   - `kitchenShowInProgress: true`
   - `kitchenColumnCount: 3`
   - Idem pour bar

---

## 5. PLAN D'IMPLÉMENTATION

### Phase 1 : Fondations (Semaine 1)
**Objectif :** Setup système configuration sans casser fonctionnalité actuelle

**Tâches :**

**Backend API (coordination requise) :**
- [ ] Migration BDD pour nouveaux champs accountConfig
- [ ] Mise à jour schémas validation
- [ ] Déploiement staging

**Frontend types & config :**
- [ ] Mise à jour interface `AccountConfigPayload` dans `session.slice.ts`
- [ ] Étendre hook `useAccountConfig`
- [ ] Ajouter UI config dans `configs.tsx`
- [ ] Valeurs par défaut et compatibilité arrière

**Tests :**
- [ ] Vérifier chargement/sauvegarde config
- [ ] Assurer pages kitchen/bar fonctionnent sans changement

**Fichiers à modifier :**
- `store/slices/session.slice.ts`
- `hooks/useAccountConfig.ts`
- `components/config/configuration.tsx`
- `types/*.types.ts` (si besoin)

---

### Phase 2 : Vue Liste Simple (Semaine 2)
**Objectif :** Implémenter Mode 1 comme alternative à vue actuelle

**Tâches :**

**Nouveau composant carte :**
- [ ] Créer `components/Kitchen/SimpleListCard.tsx`
- [ ] Layout pleine largeur
- [ ] Gros bouton "Marquer Prêt"
- [ ] Affichage items simplifié

**Nouveau wrapper vue :**
- [ ] Créer `components/Kitchen/SimpleListView.tsx`
- [ ] ScrollView unique (pas de colonnes)
- [ ] Cartes larges avec espacement

**Mise à jour pages :**
- [ ] Modifier `kitchen.tsx` et `barman.tsx`
- [ ] Rendu conditionnel selon `viewMode`
- [ ] Préserver vue colonnes existante
- [ ] Ajouter vue liste simple

**Handler statuts :**
- [ ] Transition directe PENDING → READY
- [ ] Sauter INPROGRESS entièrement

**Tests :**
- [ ] Tester avec différents nombres commandes
- [ ] Vérifier mises à jour WebSocket
- [ ] Tester indicateurs retard

**Fichiers à créer :**
- `components/Kitchen/SimpleListCard.tsx`
- `components/Kitchen/SimpleListView.tsx`

**Fichiers à modifier :**
- `app/(admin)/kitchen.tsx`
- `app/(admin)/barman.tsx`

---

### Phase 3 : Vue Colonnes Améliorée (Semaine 3)
**Objectif :** Simplifier vue colonnes actuelle et la rendre configurable

**Tâches :**

**Carte colonnes simplifiée :**
- [ ] Créer `components/Kitchen/ColumnCard.tsx`
- [ ] Supprimer gestes swipe
- [ ] Supprimer en-têtes catégories
- [ ] Gros boutons tap pour avant/arrière
- [ ] Aplatir liste items

**Mise à jour OrderColumn :**
- [ ] Accepter modes 2 ou 3 colonnes
- [ ] Calcul largeur dynamique
- [ ] Préserver logique existante

**Filtrage statuts :**
- [ ] Si `showInProgress: false`, filtrer items INPROGRESS
- [ ] Mapper items INPROGRESS vers PENDING ou READY

**Mise à jour pages :**
- [ ] Nombre colonnes conditionnel
- [ ] Array AVAILABLE_STATUSES conditionnel

**Tests :**
- [ ] Tester mode 2 colonnes
- [ ] Tester mode 3 colonnes
- [ ] Vérifier transitions statuts
- [ ] Tester avec statuts mixtes

**Fichiers à créer :**
- `components/Kitchen/ColumnCard.tsx`

**Fichiers à modifier :**
- `components/Kitchen/OrderColumn.tsx`
- `app/(admin)/kitchen.tsx`
- `app/(admin)/barman.tsx`

---

### Phase 4 : Vue Tableau Tickets (Semaine 4 - OPTIONNEL)
**Objectif :** Implémenter vue innovante centrée tables

**Tâches :**

**Composants tableau tickets :**
- [ ] Créer `components/Kitchen/TicketBoardView.tsx`
- [ ] Créer `components/Kitchen/TicketBoardCard.tsx`
- [ ] Créer `components/Kitchen/StatusDot.tsx`

**Logique groupement tables :**
- [ ] Grouper items par orderId (pas par statut)
- [ ] Afficher tous items pour chaque commande
- [ ] Tracking statut item individuel

**Interaction checkboxes :**
- [ ] Grandes zones de tap
- [ ] Feedback visuel
- [ ] Logique progression statut

**Ajout pages :**
- [ ] Rendu conditionnel pour mode 'tickets'

**Tests :**
- [ ] Tester avec commandes multiples
- [ ] Vérifier mises à jour items individuels
- [ ] Tester fonctionnalité "tout marquer prêt"

**Fichiers à créer :**
- `components/Kitchen/TicketBoardView.tsx`
- `components/Kitchen/TicketBoardCard.tsx`
- `components/Kitchen/StatusDot.tsx`

**Fichiers à modifier :**
- `app/(admin)/kitchen.tsx`
- `app/(admin)/barman.tsx`

---

### Phase 5 : Nettoyage & Optimisation (Semaine 5)
**Objectif :** Supprimer ancien code, optimiser performance, polish UX

**Tâches :**

**Dépréciation anciens composants :**
- [ ] Garder `KitchenItemCard.tsx` pour compatibilité initiale
- [ ] Ajouter warnings dépréciation
- [ ] Planifier suppression éventuelle

**Optimisation performance :**
- [ ] Memoize composants cartes
- [ ] Optimiser re-renders
- [ ] Tester avec 50+ commandes

**Accessibilité :**
- [ ] Ajouter feedback haptique
- [ ] Tester contraste couleurs
- [ ] Ajouter labels lecteur écran

**Documentation :**
- [ ] Mettre à jour CLAUDE.md
- [ ] Commentaires inline
- [ ] Guide migration

**Tests utilisateurs :**
- [ ] Feedback personnel cuisine réel
- [ ] Itérer selon feedback

---

### Phase 6 : Déploiement Production (Semaine 6)
**Objectif :** Déploiement sécurisé avec options fallback

**Tâches :**

**Approche feature flag :**
- [ ] Garder ancienne vue comme fallback
- [ ] Permettre toggle dans admin

**Monitoring :**
- [ ] Tracker modes vue utilisés
- [ ] Monitorer taux erreurs
- [ ] Tracker métriques performance

**Matériel formation :**
- [ ] Guides référence rapide
- [ ] Tutoriels vidéo

**Déploiement graduel :**
- [ ] Commencer avec restaurants beta
- [ ] Collecter feedback
- [ ] Déploiement complet

---

## 6. CONSIDÉRATIONS TECHNIQUES

### 6.1 Compatibilité Arrière

**Stratégie :**
- Vue 3 colonnes par défaut (mode `columns`)
- Préserver composant `KitchenItemCard` existant
- Chemin migration graduel
- Feature flag pour rollback

**Chemin migration :**
```typescript
// Dans kitchen.tsx
const accountConfig = useSelector((state: RootState) => state.session.accountConfig);
const viewMode = accountConfig?.kitchenViewMode || 'columns'; // Défaut actuel

switch (viewMode) {
  case 'simple':
    return <SimpleListView {...props} />;
  case 'columns':
    return <ColumnView {...props} />; // Version améliorée
  case 'tickets':
    return <TicketBoardView {...props} />;
  default:
    return <ColumnView {...props} />; // Fallback
}
```

### 6.2 Gestion État

**Pas de nouvelles slices Redux :**
- Utiliser `session.accountConfig` pour préférences vue
- Utiliser `entities.orders` et `entities.orderLines` existants
- Utiliser hook `useOrders` pour mises à jour statuts

**État composants :**
- Garder transitions statuts locales aux composants
- Dispatcher mises à jour via thunk `updateOrderStatus` existant
- WebSocket synchronisera tous clients automatiquement

### 6.3 Mises à Jour Temps Réel

**Préserver flux WebSocket existant :**
1. User clique bouton → appel `updateOrderStatus`
2. API traite → émet événement WebSocket
3. Tous clients reçoivent mise à jour → Redux update
4. Composants re-render automatiquement

**Clé :** Les 3 modes vue consomment même état Redux, donc synchronisation temps réel pour tous.

### 6.4 Considérations Performance

**Optimisations :**

1. **Memoization :**
```typescript
const SimpleListCard = React.memo(({ itemGroup, onMarkReady }) => {
  // Implémentation composant
});
```

2. **Scroll virtuel** (si >100 items) :
   - Utiliser `react-native-reanimated` ou `FlashList`
   - Seulement pour mode liste simple

3. **Debounce mises à jour statuts :**
   - Prévenir taps rapides
   - Afficher état loading pendant update

### 6.5 Gestion Erreurs

**Scénarios :**
1. **Config échoue chargement :** Fallback vue 3 colonnes par défaut
2. **Mise à jour statut échoue :** Afficher toast, pas de mise à jour optimiste
3. **WebSocket déconnecte :** Afficher banner warning
4. **Mode vue non supporté :** Log erreur, fallback colonnes

---

## 7. SPÉCIFICATIONS DESIGN

### 7.1 Palette Couleurs (Préserver Existant)

**Couleurs statuts :** (depuis `lib/utils.ts`)
- PENDING : `#F9F1C8` (Jaune)
- INPROGRESS : `#FFD1AD` (Orange)
- READY : `#D7E3FC` (Bleu)
- OVERDUE : `#DC2626` (Bordure rouge)

### 7.2 Typographie

**Hiérarchie :**
- Nom table : 18px, bold (700)
- Noms items : 16px, medium (500)
- Métadonnées : 14px, regular (400)
- Heure : 13px, regular (400)

### 7.3 Espacement

**Padding cartes :**
- Interne : 16px
- Entre cartes : 12px
- Gap colonnes : 16px

**Zones de tap :**
- Boutons : 60px hauteur (liste simple), 48px (colonnes)
- Checkboxes : 44x44px
- Cartes : Zone tap pleine largeur

### 7.4 Animations

**Subtiles & Rapides :**
- Transitions statuts : 200ms ease-out
- Entrée carte : 150ms slide-up
- Pression bouton : Scale 0.98 (100ms)
- Pulse retard : 2s loop (subtil)

**Pas d'animations pour :**
- Changements statuts (feedback instantané)
- Mises à jour listes (pourrait être perturbant)

---

## 8. STRATÉGIE TESTS

### 8.1 Tests Unitaires

**Fonctions critiques :**
- Logique transition statuts
- Groupement items par table/statut
- Parsing configuration
- Sélection mode vue

### 8.2 Tests Intégration

**Scénarios :**
1. Charger page cuisine avec différents modes vue
2. Mettre à jour statut et vérifier sync WebSocket
3. Changer mode vue sans perdre données
4. Gérer items en retard dans toutes vues

### 8.3 Tests Acceptation Utilisateurs

**Avec personnel cuisine réel :**
1. Tâche chronométrée (marquer 10 commandes prêtes)
2. Test précision (marquer items spécifiques)
3. Test mains sales (doigts mouillés/huileux)
4. Test stress (30+ commandes actives)

**Critères succès :**
- 50% plus rapide que version actuelle
- 0% erreurs tap avec mains sales
- 95%+ satisfaction utilisateur

---

## 9. RISQUES & MITIGATIONS

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| API Backend pas prête | Élevé | Moyen | Mock frontend pour tests, fallback gracieux |
| Performance avec 100+ commandes | Élevé | Faible | Scroll virtuel, pagination, tests charge |
| Résistance personnel au changement | Moyen | Moyen | Formation, déploiement graduel, garder ancienne vue |
| Problèmes sync WebSocket | Élevé | Faible | Système existant éprouvé, tests extensifs |
| Conformité accessibilité | Moyen | Moyen | Audit WCAG, tests lecteur écran |

---

## 10. MÉTRIQUES DE SUCCÈS

**Quantitatives :**
- Temps moyen marquer commande prête : **< 3 secondes** (actuellement ~8s)
- Taux erreur : **< 1%** (actuellement ~5%)
- Satisfaction utilisateur : **> 90%** (actuellement ~60%)
- Taux adoption : **> 80%** dans 3 mois

**Qualitatives :**
- Feedback personnel cuisine : "Plus facile à utiliser"
- Réduction plaintes interface
- Débit commandes plus rapide heures pointe

---

## 11. TIMELINE DÉPLOIEMENT

**Semaine 1-2 :** Fondations + Vue Liste Simple
**Semaine 3-4 :** Vue Colonnes Améliorée
**Semaine 5-6 :** Vue Tableau Tickets (optionnel)
**Semaine 7 :** Tests & Polish
**Semaine 8 :** Déploiement beta (5 restaurants)
**Semaine 9-10 :** Collecter feedback, itérer
**Semaine 11 :** Déploiement production complet
**Semaine 12 :** Monitoring, support, optimisation

---

## 12. FICHIERS CRITIQUES

### Priorité 1 (Critique)
- `store/slices/session.slice.ts` - Config accountConfig pour modes vue
- `app/(admin)/kitchen.tsx` - Logique rendu conditionnel vues
- `components/config/configuration.tsx` - UI admin sélection mode

### Priorité 2 (Haute)
- `hooks/useAccountConfig.ts` - Gestion nouveaux champs config
- `components/Kitchen/KitchenItemCard.tsx` - Étude carte complexe actuelle

### Support
- `hooks/useItemGrouping.ts` - Logique groupement tous modes
- `lib/utils.ts` - Helpers statuts et utilitaires couleurs
- `types/kitchen.types.ts` - Définitions types ItemGroup

---

## NOTES DE DÉVELOPPEMENT

**Points d'attention :**
- 🔴 **Critique :** Backend doit déployer migration BDD avant Phase 1 complète
- 🟡 **Important :** Tests avec personnel cuisine réel avant déploiement
- 🟢 **Nice to have :** Mode 3 (Tickets) peut être reporté si timeline serrée

**Décisions architecturales :**
- Réutiliser hooks Redux existants (`useOrders`, `useItemGrouping`)
- Pas de nouvelle architecture état - augmenter existant
- Compatibilité arrière via feature flags
- Migration progressive restaurant par restaurant

**Contacts :**
- Frontend Lead : [À définir]
- Backend Lead : [À définir]
- UX Research : [À définir]
- Restaurant Beta Testers : [À définir]

---

**Dernière mise à jour :** 2025-12-30
**Prochaine révision :** Après Phase 1 (fin Semaine 1)
