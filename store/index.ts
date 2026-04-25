import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer from './slices/entities.slice';
import sessionReducer from './slices/session.slice';
import uiReducer from './slices/ui.slice';
import printersReducer from './slices/printers.slice';

/**
 * Store Redux avec architecture simplifiée
 * 4 slices : entities, session, ui, printers
 */
export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    session: sessionReducer,
    ui: uiReducer,
    printers: printersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer certaines actions pour les modals et sockets
        ignoredActions: ['ui/showModal', 'session/socketConnected'],
        ignoredPaths: ['ui.activeModal.onClose', 'ui.modalStack', 'session.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export des actions pour faciliter l'import
export { entitiesActions } from './slices/entities.slice';
export {
  sessionActions,
  logout,
  // PIN selectors
  selectRequiresPin,
  selectRequiresPinSetup,
  selectTemporaryToken,
  selectIsPinVerified,
  // Auth selectors
  selectCurrentUser,
  selectAuthToken,
  selectIsAuthenticated,
  selectIsLoggingIn,
  selectAuthError,
  // Navigation selectors
  selectCurrentRoomId,
  selectSelectedTableId,
  selectCurrentRoom,
  // WebSocket selectors
  selectIsWebSocketConnected,
  selectLastSyncTime,
  selectIsConnected,
} from './slices/session.slice';
export { uiActions } from './slices/ui.slice';
export { printersActions } from './slices/printers.slice';
