# Keyboard Management

Gestion cross-platform du clavier pour iOS/Android avec fallback Web.
Basé sur `react-native-keyboard-controller`.

## Architecture

```
_layout.tsx
  └─ KeyboardProviderWrapper          ← Provider racine (1x dans l'app)
       └─ Screens
            ├─ KeyboardAwareScrollViewWrapper   ← Formulaires scrollables
            └─ KeyboardSafeFormView             ← Formulaires simples (auth)
```

## Composants

### `KeyboardProviderWrapper`

Provider à placer **une seule fois** au root de l'app (`_layout.tsx`).
Sur Web : pass-through transparent. Sur Native : active `react-native-keyboard-controller`.

### `KeyboardAwareScrollViewWrapper`

**Usage principal.** Remplace `ScrollView` dans tout formulaire avec inputs.
Auto-scroll vers l'input focusé + espace entre input et clavier.

```tsx
<KeyboardAwareScrollViewWrapper bottomOffset={40}>
  <TextInput placeholder="Nom" />
  <TextInput placeholder="Email" />
</KeyboardAwareScrollViewWrapper>
```

| Prop | Default | Description |
|------|---------|-------------|
| `bottomOffset` | `20` | Espace (px) entre input et clavier |
| `extraKeyboardSpace` | `0` | Espace supplémentaire en bas du scroll |
| `disableScrollOnKeyboardHide` | `false` | Désactive le scroll au dismiss |
| `enabled` | `true` | Active/désactive le comportement |

Sur Web : fallback `ScrollView` standard.

### `KeyboardSafeFormView`

Pour les formulaires **sans scroll** (écrans auth : login, reset password/PIN).
Wrap `KeyboardAvoidingView` avec `behavior="padding"`.

```tsx
<KeyboardSafeFormView keyboardVerticalOffset={150}>
  <TextInput placeholder="Code PIN" />
  <Button title="Valider" />
</KeyboardSafeFormView>
```

## Quand utiliser quoi ?

| Contexte | Composant |
|----------|-----------|
| Formulaire dans SidePanel/SlidePanel | `KeyboardAwareScrollViewWrapper` |
| Filtres dans SidePanel | `KeyboardAwareScrollViewWrapper` |
| Écran auth (login, PIN) | `KeyboardSafeFormView` |

**Ne jamais combiner les deux.** `KeyboardSafeFormView` intercepte les events clavier et empêche `KeyboardAwareScrollViewWrapper` de calculer l'offset.

## Fichiers

```
Keyboard/
  ├─ index.ts                  API publique
  ├─ KeyboardWrapper.tsx       Provider + AvoidingView + AwareScrollView
  └─ KeyboardSafeFormView.tsx  Wrapper pré-configuré pour auth
```

## Dépendances

- `react-native-keyboard-controller` (native uniquement)
- `~/utils/keyboard.utils.ts` — helpers (`isWeb`, `logKeyboardEvent`)
- `~/hooks/useKeyboard/types.ts` — types partagés
- `~/constants/keyboard.constants.ts` — constantes
