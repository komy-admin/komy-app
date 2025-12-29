# Keyboard Management - Fork'it App

> Gestion complète du clavier iOS/Android avec `react-native-keyboard-controller`

## 📦 Package utilisé

- **Package**: [`react-native-keyboard-controller`](https://github.com/kirillzyusko/react-native-keyboard-controller)
- **Version**: `^1.20.0`
- **Documentation officielle**: https://kirillzyusko.github.io/react-native-keyboard-controller/

### Pourquoi ce package ?

`react-native-keyboard-controller` offre un contrôle précis du clavier sur iOS et Android avec:
- ✅ Support natif iOS/Android (pas de hack JavaScript)
- ✅ Animations fluides synchronisées avec le clavier
- ✅ Gestion des gestes de fermeture (Android 11+)
- ✅ Événements temps réel (hauteur, progression, état)
- ✅ Support Reanimated pour animations complexes
- ✅ Fallback automatique sur Web

---

## 🏗️ Architecture du module

### Structure des fichiers

```
fork-it-app/
├── components/Keyboard/           # Composants UI
│   ├── KeyboardWrapper.tsx        # Wrappers platform-aware (2 wrappers)
│   ├── KeyboardSafeFormView.tsx   # Composant principal pour formulaires
│   ├── KeyboardDebugOverlay.tsx   # Overlay de debug (dev only)
│   └── index.ts                   # Exports publics
│
├── hooks/useKeyboard/             # Hooks React
│   ├── useKeyboard.ts             # Hook principal (état, contrôle)
│   ├── useKeyboardConfig.ts       # Configuration par rôle
│   ├── useKeyboardDebug.ts        # Debugging et métriques
│   ├── useKeyboardVisibility.ts   # État de visibilité (interne)
│   ├── types.ts                   # Définitions TypeScript
│   └── index.ts                   # Exports publics
│
├── config/
│   └── keyboard.config.ts         # Configurations par rôle (AUTH, ADMIN, etc.)
│
├── constants/
│   └── keyboard.constants.ts      # Constantes (offsets, z-index, états)
│
└── utils/
    └── keyboard.utils.ts          # Utilitaires (7 fonctions)
```

### Composants disponibles

| Composant | Usage | Platform |
|-----------|-------|----------|
| `KeyboardProviderWrapper` | Root provider (requis) | iOS/Android/Web |
| `KeyboardAvoidingViewWrapper` | Gestion d'évitement du clavier | iOS/Android/Web |
| `KeyboardSafeFormView` | Composant principal pour formulaires | iOS/Android/Web |
| `KeyboardDebugOverlay` | Overlay de debug visuel | iOS/Android (dev) |

### Hooks disponibles

| Hook | Description | Retour |
|------|-------------|--------|
| `useKeyboard(role?)` | État et contrôle du clavier | `{ state, isVisible, height, dismiss, ... }` |
| `useKeyboardConfig(role?)` | Configuration par rôle | `{ config, updateConfig }` |
| `useKeyboardDebug(role?)` | Métriques de performance | `{ debugInfo, clearMetrics }` |

---

## 🎯 Trois Patterns d'utilisation

Fork'it utilise **trois patterns distincts** selon le type d'interface:

### Pattern A: Écrans d'authentification (Login, PIN)

**Caractéristiques:**
- ✅ Peu d'inputs (2-4 champs)
- ✅ Contenu centré verticalement
- ✅ **SANS ScrollView**
- ✅ Tap-to-dismiss (fermeture au tap hors input)
- ✅ Offset vertical minimal (20px)

**Architecture:**
```
Pressable (tap-to-dismiss)
  └─ KeyboardSafeFormView (role="AUTH")
      └─ View (flex: 1, justifyContent: 'center')
          └─ Inputs (2-4 champs)
```

**Exemple complet:**
```tsx
// components/auth/AuthScreenLayout.tsx
import { Pressable, Keyboard } from 'react-native';
import { KeyboardSafeFormView } from '~/components/Keyboard';

export const AuthScreenLayout = ({ children }) => {
  const keyboardVerticalOffset = useAuthKeyboardOffset(); // 20-40px selon orientation

  return (
    <Pressable onPress={Keyboard.dismiss}>
      <KeyboardSafeFormView
        role="AUTH"
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {children}
        </View>
      </KeyboardSafeFormView>
    </Pressable>
  );
};
```

**Écrans utilisant Pattern A:**
- `app/(auth)/login.tsx`
- `app/(auth)/pin-verification.tsx`

---

### Pattern B: Formulaires administrateurs (Team, Menu, Room)

**Caractéristiques:**
- ✅ Nombreux inputs (10+)
- ✅ Contenu défilable
- ✅ **AVEC ScrollView**
- ✅ Header fixe en haut
- ✅ Footer avec boutons (Cancel/Save) couvert par le clavier
- ✅ Offset vertical élevé (150-200px)

**Architecture:**
```
View (container)
  ├─ FormHeader (FIXED)
  ├─ KeyboardSafeFormView (role="ADMIN")
  │   └─ ScrollView (keyboardShouldPersistTaps="handled")
  │       └─ Form content (10+ inputs)
  └─ Footer Actions (FIXED - couvert par clavier)
```

**Exemple complet:**
```tsx
// components/admin/AdminFormLayout.tsx
import { View, ScrollView } from 'react-native';
import { KeyboardSafeFormView } from '~/components/Keyboard';

export const AdminFormLayout = ({ title, onSave, onCancel, children }) => {
  return (
    <View style={{ flex: 1 }}>
      {/* Header fixe */}
      <FormHeader title={title} onBack={onCancel} />

      {/* Formulaire avec keyboard avoidance */}
      <KeyboardSafeFormView
        role="ADMIN"
        behavior="padding"
        keyboardVerticalOffset={150} // Offset important pour formulaires
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {children}
        </ScrollView>
      </KeyboardSafeFormView>

      {/* Footer avec boutons (couvert quand clavier ouvert) */}
      <View style={styles.footer}>
        <Button onPress={onCancel}>Annuler</Button>
        <Button onPress={onSave}>Enregistrer</Button>
      </View>
    </View>
  );
};
```

**Écrans utilisant Pattern B:**
- `app/(admin)/team.tsx` - Gestion d'équipe
- `app/(admin)/room/index.tsx` - Gestion de salles

---

### Pattern C: Panneaux de filtres latéraux (Menu, Room)

**Caractéristiques:**
- ✅ Inputs dans un panneau latéral (SidePanel)
- ✅ Zone principale adjacente qui NE DOIT PAS bouger
- ✅ Structure en row (flexDirection: 'row')
- ✅ ScrollView dans le panneau
- ✅ Offset vertical élevé (120px)

**Architecture:**
```
View (row)
  ├─ SidePanel (width fixe - ex: width/4)
  │   └─ KeyboardSafeFormView (role="FILTER")
  │       └─ FilterComponent (avec ScrollView)
  │           └─ Inputs de filtrage
  └─ View (flex: 1 - zone principale)
      └─ Liste/Tableau (NE BOUGE PAS)
```

**Exemple complet:**
```tsx
// app/(admin)/menu.tsx
import { KeyboardSafeFormView } from '~/components/Keyboard';

export default function MenuPage() {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Panneau de filtres - GÈRE le keyboard */}
      <SidePanel width={width / 4}>
        <KeyboardSafeFormView
          role="FILTER"
          behavior="padding"
          keyboardVerticalOffset={200}
          style={{ flex: 1 }}
        >
          <MenuFilters />
        </KeyboardSafeFormView>
      </SidePanel>

      {/* Zone principale - NE BOUGE PAS */}
      <View style={{ flex: 1 }}>
        <ForkTable data={items} />
      </View>
    </View>
  );
}
```

**Pourquoi ça fonctionne :**
1. **SidePanel a une width fixe** → ne peut pas déborder sur la zone adjacente
2. **KeyboardAvoidingView est À L'INTÉRIEUR** du SidePanel → affecte seulement ce conteneur
3. **Zone principale dans un View séparé** avec `flex: 1` → totalement isolé
4. **Architecture row** : Les enfants d'une row sont indépendants visuellement

**Écrans utilisant Pattern C:**
- `app/(admin)/menu.tsx` - Configuration menu avec filtres latéraux
- `app/(admin)/room/index.tsx` - Gestion de salles avec filtres latéraux

---

## 🔧 Configuration par rôle

Le module utilise un système de **rôles** pour adapter automatiquement les offsets:

| Rôle | Vertical Offset | Bottom Offset | Gesture Dismiss | Usage |
|------|-----------------|---------------|-----------------|-------|
| `AUTH` | 20px | 30px | ✅ (Android 11+) | Login, PIN |
| `ADMIN` | 60px | 50px | ✅ (Android 11+) | Forms admin |
| `SERVER` | 60px | 50px | ✅ (Android 11+) | Prise de commande |
| `FILTER` | 200px | 50px | ✅ (Android 11+) | Panneaux de filtres latéraux |
| `COOK` | 20px | 20px | ❌ | Interface cuisine (read-only) |
| `BARMAN` | 20px | 20px | ❌ | Interface bar (boutons) |
| `DEFAULT` | 0px | 0px | ❌ | Fallback |

**Fichier de configuration:** `config/keyboard.config.ts`

### Utilisation:

```tsx
import { KeyboardSafeFormView } from '~/components/Keyboard';

// Configuration automatique selon le rôle
<KeyboardSafeFormView role="AUTH">
  {/* ... */}
</KeyboardSafeFormView>

// Override manuel possible
<KeyboardSafeFormView
  role="ADMIN"
  keyboardVerticalOffset={200} // Override
>
  {/* ... */}
</KeyboardSafeFormView>
```

---

## 🎨 Quand utiliser quel Pattern ?

### ✅ Utiliser Pattern A (Auth) si:

- [ ] Moins de 5 inputs dans l'écran
- [ ] Contenu peut tenir sur un écran sans scroll
- [ ] Besoin de centrage vertical du contenu
- [ ] Interface minimaliste (login, PIN, mot de passe)
- [ ] Tap-to-dismiss est souhaité

**Exemple type:** Login avec email + password

---

### ✅ Utiliser Pattern B (Admin) si:

- [ ] Plus de 5 inputs dans le formulaire
- [ ] Contenu dépasse la hauteur de l'écran
- [ ] Besoin de ScrollView
- [ ] Header/Footer fixes
- [ ] Formulaires complexes (création/édition)

**Exemple type:** Formulaire de création d'utilisateur avec 15+ champs

---

### ✅ Utiliser Pattern C (Filter) si:

- [ ] Inputs dans un panneau latéral (SidePanel)
- [ ] Zone principale adjacente qui ne doit pas bouger
- [ ] Structure en row (deux zones côte à côte)
- [ ] Filtres de recherche ou configuration
- [ ] Le panneau a une width fixe

**Exemple type:** Panneau de filtres latéral avec liste de résultats adjacente

---

## 🐛 Debug et monitoring

### KeyboardDebugOverlay

Overlay visuel pour déboguer le clavier en temps réel (uniquement en `__DEV__`):

```tsx
import { KeyboardDebugOverlay } from '~/components/Keyboard';

// Dans _layout.tsx ou écran de dev
<KeyboardDebugOverlay
  visible={__DEV__}
  position="top-right"
  compact={false}
/>
```

**Informations affichées:**
- État du clavier (OPEN, CLOSED, OPENING, CLOSING)
- Hauteur en pixels et pourcentage
- Progression de l'animation (0-100%)
- Type de clavier (default, numeric, email, etc.)
- Apparence (light, dark)
- Performance (frame drops, temps moyen)
- Configuration active (rôle, behavior)

**Interactions:**
- **Tap**: Collapse/Expand l'overlay
- **Long press**: Reset des métriques de performance

---

## 📚 API Reference

### KeyboardSafeFormView Props

```typescript
interface KeyboardSafeFormViewProps {
  /** Rôle utilisateur (AUTO, ADMIN, SERVER, etc.) */
  role?: UserRole;

  /** Behavior de KeyboardAvoidingView (par défaut: "padding") */
  behavior?: 'padding' | 'height' | 'position';

  /** Offset vertical (override config rôle) */
  keyboardVerticalOffset?: number;

  /** Active le mode debug visuel */
  debugMode?: boolean;

  /** Style du conteneur */
  style?: ViewStyle;

  /** Enfants */
  children: React.ReactNode;
}
```

### useKeyboard Hook

```typescript
const {
  // État
  state,           // KeyboardState (height, progress, duration, etc.)
  isVisible,       // boolean
  height,          // number (en pixels)
  progress,        // number (0-1)

  // Configuration
  config,          // KeyboardConfig du rôle actif

  // Contrôle
  dismiss,         // () => Promise<void>

  // Animations (Reanimated)
  animated,        // { height: SharedValue, progress: SharedValue }
} = useKeyboard('AUTH');
```

---

## 🔄 Migration depuis l'ancien système

Si vous avez du vieux code avec `KeyboardAwareScrollView` ou autres wrappers, voici comment migrer:

### ❌ Avant (obsolète):
```tsx
<KeyboardAwareScrollView>
  <View>
    <TextInput />
  </View>
</KeyboardAwareScrollView>
```

### ✅ Après (optimisé):

**Pour Pattern A (peu d'inputs):**
```tsx
<Pressable onPress={Keyboard.dismiss}>
  <KeyboardSafeFormView role="AUTH">
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <TextInput />
    </View>
  </KeyboardSafeFormView>
</Pressable>
```

**Pour Pattern B (beaucoup d'inputs):**
```tsx
<KeyboardSafeFormView role="ADMIN">
  <ScrollView keyboardShouldPersistTaps="handled">
    <TextInput />
    <TextInput />
    {/* ... */}
  </ScrollView>
</KeyboardSafeFormView>
```

---

## ⚡ Optimisations effectuées

Le module a été optimisé pour réduire la complexité et améliorer la maintenabilité:

### Fichiers supprimés (1)
- ❌ `KeyboardSafeScrollView.tsx` - Composant obsolète avec bugs Reanimated

### Code nettoyé
- **KeyboardWrapper.tsx**: 338 → 164 lignes (-51%)
  - Supprimé 5 wrappers inutilisés
  - Conservé 2 wrappers essentiels

- **keyboard.utils.ts**: 310 → 109 lignes (-65%)
  - Supprimé 12 fonctions inutilisées (throttle, debounce, etc.)
  - Conservé 7 fonctions essentielles

- **keyboard.constants.ts**: 162 → 103 lignes (-36%)
  - Supprimé constantes inutilisées
  - Gardé offsets par rôle, z-index, états

- **keyboard.config.ts**: 196 → 140 lignes (-28%)
  - Supprimé 2 fonctions (merge, getRecommended)
  - Gardé getKeyboardConfig et validateKeyboardConfig

**Total:** ~490 lignes supprimées sans impact fonctionnel

---

## 📖 Exemples d'utilisation réels

### Login Screen (Pattern A)
```tsx
// app/(auth)/login.tsx
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';

export default function LoginScreen() {
  return (
    <AuthScreenLayout>
      <View style={styles.content}>
        <TextInput placeholder="Email" />
        <TextInput placeholder="Password" secureTextEntry />
        <Button title="Login" onPress={handleLogin} />
      </View>
    </AuthScreenLayout>
  );
}
```

### Team Management (Pattern B)
```tsx
// app/(admin)/team.tsx
import { AdminFormLayout } from '~/components/admin/AdminFormLayout';

export default function TeamScreen() {
  return (
    <AdminFormLayout
      title="Modifier l'utilisateur"
      onSave={handleSave}
      onCancel={handleCancel}
    >
      <TextInput placeholder="Nom" />
      <TextInput placeholder="Prénom" />
      <TextInput placeholder="Email" />
      <TextInput placeholder="Téléphone" />
      {/* 10+ autres champs */}
    </AdminFormLayout>
  );
}
```

---

## 🌐 Support Web

Le module détecte automatiquement la plateforme Web et utilise des fallbacks:

- `KeyboardProviderWrapper` → Pass-through sur Web
- `KeyboardAvoidingViewWrapper` → `<View>` simple sur Web
- `useKeyboard()` → Retourne état vide sur Web
- Keyboard dismiss → `document.activeElement.blur()` sur Web

**Aucun code spécifique Web nécessaire** - tout est transparent.

---

## 🔗 Ressources

- **Package GitHub**: https://github.com/kirillzyusko/react-native-keyboard-controller
- **Documentation officielle**: https://kirillzyusko.github.io/react-native-keyboard-controller/
- **API Reference**: https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api
- **Examples**: https://github.com/kirillzyusko/react-native-keyboard-controller/tree/main/example

---

## 🚀 Best Practices

### ✅ DO

- Utiliser `KeyboardSafeFormView` pour tous les formulaires
- Choisir le bon rôle selon le contexte (AUTH, ADMIN, etc.)
- Ajouter `keyboardShouldPersistTaps="handled"` sur ScrollView
- Wrapper avec `<Pressable onPress={Keyboard.dismiss}>` pour Pattern A
- Tester sur vraies devices iOS/Android (simulateurs != comportement réel)

### ❌ DON'T

- Ne pas imbriquer plusieurs `KeyboardAvoidingView`
- Ne pas utiliser `KeyboardAwareScrollView` (obsolète)
- Ne pas créer de custom keyboard avoidance (utiliser le module)
- Ne pas oublier `KeyboardProviderWrapper` au root de l'app
- Ne pas mettre `keyboardVerticalOffset` trop élevé sans raison

---

## 🛠️ Troubleshooting

### Le clavier couvre mes inputs

**Solution:** Augmenter `keyboardVerticalOffset`
```tsx
<KeyboardSafeFormView
  role="ADMIN"
  keyboardVerticalOffset={200} // Augmenter
>
```

### Le scroll ne fonctionne pas correctement

**Solution:** Ajouter `keyboardShouldPersistTaps="handled"`
```tsx
<ScrollView keyboardShouldPersistTaps="handled">
```

### L'overlay de debug ne s'affiche pas

**Vérifier:**
- Mode développement activé (`__DEV__ === true`)
- `visible={true}` passé au composant
- Aucun z-index qui masque l'overlay

### Performance dégradée

**Utiliser le debug overlay** pour monitorer:
- Frame drops
- Temps d'animation
- Si > 16ms → possible problème de performance

---

## 📝 Notes de maintenance

### Mise à jour du package

```bash
npm update react-native-keyboard-controller
# Puis rebuild natif
cd ios && pod install && cd ..
```

### Ajout d'un nouveau rôle

1. Ajouter dans `constants/keyboard.constants.ts`:
```typescript
export const KEYBOARD_OFFSETS = {
  // ...
  NEW_ROLE: {
    vertical: 40,
    bottom: 30,
  },
} as const;
```

2. Ajouter dans `config/keyboard.config.ts`:
```typescript
const NEW_ROLE_CONFIG: KeyboardConfig = {
  role: 'NEW_ROLE',
  behavior: KEYBOARD_BEHAVIOR.PADDING,
  verticalOffset: KEYBOARD_OFFSETS.NEW_ROLE.vertical,
  bottomOffset: KEYBOARD_OFFSETS.NEW_ROLE.bottom,
  enableGestureDismiss: isInteractiveDismissSupported(),
  enableDebug: __DEV__,
};

export const KEYBOARD_CONFIGS = {
  // ...
  NEW_ROLE: NEW_ROLE_CONFIG,
};
```

3. Ajouter type dans `hooks/useKeyboard/types.ts`

---

**Version:** 1.0.0
**Dernière mise à jour:** 2025-12-24
**Auteur:** Fork'it Team
