import { configureStore } from '@reduxjs/toolkit';
import entitiesReducer from './slices/entities.slice';
import sessionReducer from './slices/session.slice';
import uiReducer from './slices/ui.slice';

/**
 * Configuration du store Redux simplifié
 * De 8 slices à 3 slices : entities, session, ui
 */
export const store = configureStore({
  reducer: {
    entities: entitiesReducer,
    session: sessionReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer certaines actions si nécessaire (ex: pour les fonctions dans les modals)
        ignoredActions: ['ui/showModal'],
        ignoredPaths: ['ui.activeModal.onClose', 'ui.modalStack'],
      },
    }),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export des actions (pour faciliter l'import)
export { entitiesActions } from './slices/entities.slice';
export { sessionActions } from './slices/session.slice';
export { uiActions } from './slices/ui.slice';

// Export de tous les selectors
export * from './selectors';

// Export des selectors depuis les slices
export * from './slices/session.slice';
export * from './slices/ui.slice';