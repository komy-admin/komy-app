# Fork It App - Guide pour Claude

## Vue d'ensemble du projet
Fork It est une application mobile/web de gestion de restaurant développée avec Expo/React Native. L'app permet une gestion complete, création de plan de salle, gestion des commandes, des tables, des menus, des utilisateurs et des statuts. Elle comporte 3 parties principale, admin, serveur et cuisine.

## Architecture technique
- **Framework**: Expo (React Native) avec support web
- **Navigation**: Expo Router avec layout-based routing
- **State Management**: Redux Toolkit + Zustand
- **Styling**: NativeWind (Tailwind CSS pour React Native)
- **Backend**: API REST (Adonis.JS) externe avec Socket.io pour temps réel (statut commande)

## Scripts de développement
```bash
# Développement
npm run dev           # iOS (iPad Pro par défaut)
npm run dev:web       # Version web
npm run dev:android   # Android

# Build
npm run build:web     # Export web

# Nettoyage
npm run clean         # Supprime .expo et node_modules
```

## Structure des dossiers

### `/app` - Pages et navigation
- `(auth)/` - Authentification (login, mot de passe oublié)
- `(admin)/` - Interface administrateur/manager (cuisine, menu, équipe)
- `(server)/` - Interface serveur (commandes, tables, menu)
- `(chef)/` - Interface cuisine (commandes)

### `/components` - Composants réutilisables  
- `Kitchen/` - Composants pour la cuisine
- `Service/` - Composants pour le service
- `Room/` - Gestion des salles et tables
- `ui/` - Composants UI de base (boutons, modals, etc.)
- `auth/` - Scanner QR code

### `/api` - Services API
- Gestion des utilisateurs, commandes, tables, menus
- Configuration Axios centralisée
- Mocks pour le développement

### `/store` - État global
- `auth.slice.ts` - Authentification
- `orders.slice.ts` - Commandes (TODO)
- `tables.slice.ts` - Tables (TODO)
- Redux Toolkit configuré

### `/types` - Types TypeScript
- Types pour toutes les entités (User, Order, Table, Item, etc.)
- Enums pour statuts et types d'items

## Fonctionnalités principales

### QR Code Login
- Scanner QR pour connexion utilisateur
- Gestion des équipes et codes QR admin

### Gestion des commandes
- Création/modification de commandes
- Suivi en temps réel via Socket.io
- Interface cuisine distincte

### Gestion des tables
- Plan de salle interactif
- Association tables/commandes
- Gestion des statuts

### Interface responsive
- Support mobile/tablette
- Détection automatique du type d'appareil

TODO: créer un layout par type de device (mobile/tablette) pour une meilleure expérience utilisateur

## Spécificités techniques

### Authentification
- Système de rôles (admin, serveur, cuisine, manager)
- Stockage sécurisé avec AsyncStorage
- QR code pour connexion rapide des utilisateurs

### Temps réel
- Mise à jour automatique des commandes (statut uniquement pour le moment)

### Navigation
- File-based routing avec Expo Router
- Layouts imbriqués pour différents rôles
- Navigation conditionnelle selon le rôle

## Contraintes et conventions

### Code Style
- TypeScript strict
- Composants fonctionnels uniquement
- Hooks personnalisés dans `/hooks`
- Pas de classes, utiliser les fonctions

### Naming
- PascalCase pour les composants
- camelCase pour les fonctions/variables
- kebab-case pour les fichiers de pages
- Types suffixés par `.types.ts`

### State Management
- Redux pour l'état global partagé
- Zustand pour l'état local complexe
- React hooks pour l'état simple

## Environnement de développement
- Node.js avec npm
- Expo CLI pour le développement
- Support iOS/Android/Web simultané
- Hot reload activé

## Notes importantes
- L'app fonctionne principalement sur tablette pour la partie admin et sur mobile pour la partie serveur
- Temps réel critique pour les commandes
- Gestion offline non implémentée

## Dépendances clés
- `expo-camera` - Scanner QR
- `socket.io-client` - Temps réel  
- `react-native-qrcode-svg` - Génération QR
- `@reduxjs/toolkit` - State management
- `lucide-react-native` - Icônes
- `tailwindcss` - Styling via NativeWind

## API Endpoints
Voir `/api/*.api.ts` pour les endpoints disponibles :
- Auth, Users, Orders, Tables, Items, Rooms

## Status actuel
Branch: `feat/server-view` - Travail sur la partie mobile pour les serveurs