import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { currentUser } from '~/types/auth.types';

interface AuthCredentials {
  token: string;
  accountType: string;
}

interface AuthState {
  user: currentUser | null;
  token: string | null;
  accountType: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  accountType: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<currentUser>) => {
      state.user = action.payload;
    },
    setCredentials: (state, action: PayloadAction<AuthCredentials>) => {
      state.token = action.payload.token;
      state.accountType = action.payload.accountType;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.accountType = null;
    },
  },
});

export const { 
  setCurrentUser, 
  setCredentials,
  setLoading,
  logout 
} = authSlice.actions;

export default authSlice.reducer;