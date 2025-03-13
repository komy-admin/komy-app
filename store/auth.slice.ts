import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { currentUser } from '~/types/auth.types';
import { User, UserProfile } from '~/types/user.types';

interface AuthState {
  token: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  currentUser: User | null;
}

const initialState: AuthState = {
  token: null,
  userProfile: null,
  isLoading: true,
  currentUser: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; userProfile: UserProfile }>
    ) => {
      state.token = action.payload.token;
      state.userProfile = action.payload.userProfile;
      state.isLoading = false;
    },
    logout: (state) => {
      state.token = null;
      state.userProfile = null;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading, setCurrentUser } = authSlice.actions;
export default authSlice.reducer;