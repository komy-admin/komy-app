import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import { restaurantReducer } from './restaurant';
import configReducer from './config.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurant: restaurantReducer,
    config: configReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
