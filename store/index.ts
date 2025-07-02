import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import { restaurantReducer } from './restaurant';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    restaurant: restaurantReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
