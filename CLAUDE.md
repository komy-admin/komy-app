# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

- **Multi-platform** : cette app tourne sur iOS, Android ET Web. Toujours tester/penser les 3 plateformes. Utiliser `Platform.select()` ou `Platform.OS` quand un comportement diffère.
- **Keyboard management** : utiliser `KeyboardAwareScrollViewWrapper` (`~/components/Keyboard`) pour les écrans avec inputs. Ne jamais wrapper un formulaire dans un `<Pressable onPress={Keyboard.dismiss}>` sur web (cela vole le focus des inputs).
- **Pas de select natif** : ne jamais utiliser de composant `<Select>` ou liste déroulante native. Utiliser des alternatives custom (bottom sheet, modal picker, segmented control).
- **Gestion centralisée des erreurs** : utiliser `showApiError(error, showToast, fallback)` et `extractApiError(error)` depuis `~/lib/apiErrorHandler` pour afficher les erreurs API. Ne pas hardcoder de messages d'erreur dans les `catch` — laisser le backend fournir les messages.
- **Validation de formulaire** : utiliser le hook `useFormErrors()` (`~/hooks/useFormErrors`) pour gérer les erreurs de validation backend (422). Il extrait automatiquement les erreurs par champ.
- **Styles et thème** : utiliser les styles et couleurs du thème global. Ne pas introduire de nouvelles couleurs arbitraires.
- **Texte** : utiliser `Text as RNText` depuis `react-native` (importé comme `RNText`) pour tout texte affiché. Ne pas utiliser `<Text>` de NativeWind/styled directement.

## Development Commands

### Start Development Server
```bash
npm run dev        # Start Expo with iOS iPad Pro simulator
npm run dev:web    # Start web development server
npm run dev:android # Start Android development server
```

### Build Commands
```bash
npm run build:web  # Build for web deployment
npm run android    # Build and run on Android
npm run ios        # Build and run on iOS
```

### Maintenance
```bash
npm run clean      # Clean .expo and node_modules
npm run postinstall # Generate TailwindCSS cache
```

## Architecture Overview

### Technology Stack
- **Framework**: Expo React Native (cross-platform mobile app)
- **UI**: React Native Reusables + TailwindCSS/NativeWind
- **State Management**: Redux Toolkit + React Context
- **Navigation**: Expo Router (file-based routing)
- **Real-time**: Socket.io WebSocket connections
- **Animations**: React Native Reanimated

### App Structure
Fork'it is a restaurant management application with role-based access:
- **Server**: Order management and table service
- **Admin**: Restaurant configuration, kitchen/bar management, menu, team, payments, reservations
- **Chef**: Kitchen order preparation interface
- **Barman**: Bar order preparation interface

### Key Directories

#### `/app/` - Screen Routes
- `(auth)/` - Login, PIN verification, device verification (2FA), standby, password/PIN reset, account setup
- `(server)/` - Room view, order detail, order form
- `(admin)/` - Dashboard, menu, kitchen, bar, service, team, configs, reservation, room editor, payments, payment history
- `(cook)/` - Kitchen display
- `(barman)/` - Bar display
- `_layout.tsx` - Root layout with authentication routing and AppState auto-lock

#### `/api/` - API Services
- `base.api.ts` - Abstract base class with axios interceptors, auto token refresh, `SessionExpiredError`
- 18 services (auth, order, payment, menu, room, table, user, tag, item, itemType, menuCategory, menuCategoryItem, cashRegister, accountConfig, reservation)

#### `/store/` - Redux State Management (3 slices)
- `session.slice.ts` - Auth tokens, user, PIN/2FA state, navigation, WebSocket status, account config, init progress
- `entities.slice.ts` - Normalized records (rooms, tables, orders, orderLines, items, menus, users, tags, payments…)
- `ui.slice.ts` - Sidebar, modals, toasts, theme, preferences, dirty state

#### `/hooks/` - Custom Hooks
- `useRestaurant.ts` - Main restaurant data initialization
- `useSocket/` - WebSocket connection, listeners, invalidation, force logout
- Domain hooks: `useOrders`, `useOrderLines`, `useRooms`, `useTables`, `useMenus`, `useUsers`, `useTags`, `useItemTypes`
- Finance hooks: `usePayments`, `useCashRegister`
- Form hooks: `useFormErrors`, `useFilter/`
- App hooks: `useAppInit`, `useAccountConfig`, `useDeviceType`

#### `/components/` - UI Components
- `ui/` - Reusable primitives (inputs, modals, toast, PIN input, overlays, selectors)
- `Room/` - Room visualization and table management
- `Service/` - Order management, ticket views, status selectors
- `OrderDetail/` - Order detail panels
- `Payment/` - Payment components
- `admin/` - Admin-specific components (sidebar, forms)
- `auth/` - Auth-specific components
- `order/` - Order form components
- `Keyboard/` - KeyboardAwareScrollViewWrapper

#### `/types/` - TypeScript Definitions
- Comprehensive type definitions for all API entities
- Status enums, kitchen types, payment history types, QR types

### Authentication & Routing
- Dual JWT tokens: `authToken` (long-lived, for PIN/standby flow) + `sessionToken` (4h, for API calls)
- PIN-based login for admin users, QR code login for non-admin roles
- Optional 2FA (TOTP/email) with trusted device tracking
- Standby screen for `skipPinRequired` users (lock without PIN)
- Role-based protected routes with automatic redirection
- AppState auto-lock after 5 min in background

### Real-time Features
- WebSocket integration for live order/table/room updates
- Socket.io with token-based handshake, scoped to account room
- Invalidation cascade: backend tracks model dependencies, frontend refetches

### Data Flow
1. Login (credentials or QR) → authToken → 2FA if enabled → PIN or standby → sessionToken
2. `AppInitializer` loads all data via `useAppInit`, `SocketProvider` connects WebSocket
3. Domain hooks manage CRUD (useOrders, useMenus, etc.) via API services
4. Real-time: HTTP action → backend WebSocket emit → Redux dispatch → UI re-render
5. Lock/standby → clear sessionToken → unlock → re-init (fresh data + WebSocket)

### Development Notes
- Uses absolute imports with `~/*` and `@/*` path aliases
- StyleSheet.create for styling, with theme colors from `~/theme`
- Haptic feedback on iOS for UX
- Toast notifications with deduplication (counter on repeated messages)
- Environment variables configured in `.env` files
- Android: no BlurView (unreliable), use opaque `Platform.select` backgrounds instead