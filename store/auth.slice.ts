import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { currentUser } from '~/types/auth.types';
import { User, UserProfile } from '~/types/user.types';
import { userApiService } from '~/api/user.api';

interface AuthState {
  token: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  currentUser: User | null;
  imageUpdateLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  userProfile: null,
  isLoading: true,
  currentUser: null,
  imageUpdateLoading: false,
  error: null,
};

// Action asynchrone pour mettre à jour l'image de profil
export const updateProfileImage = createAsyncThunk(
  'auth/updateProfileImage',
  async ({ userId, imageUri }: { userId: string; imageUri: string }, { rejectWithValue }) => {
    try {
      const updatedUser = await userApiService.updateProfileImage(userId, imageUri);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string | null; userProfile: UserProfile | null }>
    ) => {
      state.token = action.payload.token;
      state.userProfile = action.payload.userProfile;
      state.isLoading = false;
    },
    logout: (state) => {
      state.token = null;
      state.userProfile = null;
      state.currentUser = null;
      state.isLoading = false;
      state.imageUpdateLoading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update profile image
      .addCase(updateProfileImage.pending, (state) => {
        state.imageUpdateLoading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.imageUpdateLoading = false;
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(updateProfileImage.rejected, (state, action) => {
        state.imageUpdateLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCredentials, logout, setLoading, setCurrentUser, clearError } = authSlice.actions;
export default authSlice.reducer;