import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type AccountType = 'server' | 'admin' | 'kitchen';

interface AuthState {
  token: string | null;
  accountType: AccountType | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  token: null,
  accountType: null,
  isLoading: true,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; accountType: AccountType }>
    ) => {
      state.token = action.payload.token;
      state.accountType = action.payload.accountType;
      state.isLoading = false;
    },
    logout: (state) => {
      state.token = null;
      state.accountType = null;
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;