import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { User } from '~/types/user.types';

// Types pour le state des users
export interface UsersState {
  users: Record<string, User>;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: UsersState = {
  users: {},
  loading: false,
  error: null,
};

// Types pour les actions
interface SetUsersPayload {
  users: User[];
}

// Slice pour les users
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingUsers: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorUsers: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données
    setUsers: (state, action: PayloadAction<SetUsersPayload>) => {
      const { users } = action.payload;
      
      // Normaliser les users
      state.users = {};
      users.forEach(user => {
        state.users[user.id] = user;
      });
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions WebSocket CRUD pour les users
    createUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      state.users[user.id] = user;
    },
    
    updateUser: (state, action: PayloadAction<{ user: User }>) => {
      const { user } = action.payload;
      state.users[user.id] = user;
    },
    
    deleteUser: (state, action: PayloadAction<{ userId: string }>) => {
      const { userId } = action.payload;
      delete state.users[userId];
    },
    
    // Action pour nettoyer l'état
    resetUsersState: () => initialState,
  },
});

// Selectors de base
const selectUsersState = (state: { users: UsersState }) => state.users;

export const selectUsers = createSelector(
  [selectUsersState],
  (usersState) => usersState ? Object.values(usersState.users) : []
);

export const selectUserById = (userId: string) => createSelector(
  [selectUsersState],
  (usersState) => usersState?.users[userId] || null
);

export const selectUsersLoading = createSelector(
  [selectUsersState],
  (usersState) => usersState?.loading || false
);

export const selectUsersError = createSelector(
  [selectUsersState],
  (usersState) => usersState?.error || null
);

export const selectUsersByProfile = (profile: string) => createSelector(
  [selectUsers],
  (users) => users.filter(user => user.profil === profile)
);

// Actions exportées
export const usersActions = usersSlice.actions;
export default usersSlice.reducer;

// Types exportés
export type {
  SetUsersPayload,
};