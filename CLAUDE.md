# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **Admin**: Restaurant configuration and kitchen management  
- **Chef**: Kitchen order preparation interface

### Key Directories

#### `/app/` - Screen Routes
- `(auth)/` - Authentication screens (login, password reset)
- `(server)/` - Server role screens (table management, orders)
- `(admin)/` - Admin role screens (kitchen, menu, room management)
- `(cook)/` - Chef role screens (kitchen interface)
- `_layout.tsx` - Root layout with authentication routing

#### `/api/` - API Services
- `base.api.ts` - Abstract base class for API services with axios interceptors
- Individual API services extend BaseApiService for type safety
- Environment-aware endpoint configuration

#### `/store/` - Redux State Management
- `auth.slice.ts` - Authentication state
- `restaurant/` - Restaurant-specific state slices (menu, rooms, tables, orders, users)
- Centralized store configuration with typed hooks

#### `/hooks/` - Custom Hooks
- `useRestaurant.ts` - Main restaurant data management hook
- `useSocket/` - WebSocket connection management
- Feature-specific hooks (useMenu, useOrders, useRooms, etc.)

#### `/components/` - UI Components
- `ui/` - Reusable UI primitives
- `Room/` - Room visualization and table management
- `Service/` - Order management components
- `Kitchen/` - Kitchen workflow components

#### `/types/` - TypeScript Definitions
- Comprehensive type definitions for all API entities
- Status enums and business logic types

### Authentication & Routing
- Role-based protected routes with automatic redirection
- Token-based authentication with automatic refresh
- Persistent login state using AsyncStorage

### Real-time Features
- WebSocket integration for live order updates
- Socket.io context provider for connection management
- Real-time room and table status synchronization

### Data Flow
1. Authentication establishes user role and permissions
2. Restaurant hook initializes WebSocket connections
3. Role-specific hooks manage domain data (rooms, tables, orders, menu)
4. Components subscribe to state changes via Redux selectors
5. Real-time updates propagate through WebSocket events

### Development Notes
- Uses absolute imports with `~/*` and `@/*` path aliases
- TailwindCSS classes are used throughout for styling
- Haptic feedback integrated for better UX
- Toast notifications for user feedback
- Environment variables configured in `.env` files

## Specialized Agents

When working on this codebase, use the appropriate specialized agents for specific tasks:

### notion-docs-consultant
- **When to use**: Before implementing new features or making architectural changes
- **Purpose**: Access project documentation, coding guidelines, and API specifications
- **Examples**: API route implementations, component patterns, coding standards

### react-native-docs-researcher  
- **When to use**: Working with React Native, Expo, or AdonisJS specific features
- **Purpose**: Retrieve version-specific documentation that matches the project setup
- **Examples**: Expo Router navigation, React Native components, AdonisJS validation

### architecture-optimizer
- **When to use**: Performance optimization, architectural decisions, or structural improvements
- **Purpose**: Expert analysis of code architecture and optimization opportunities
- **Examples**: State management refactoring, performance bottlenecks, feature integration planning