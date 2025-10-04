import { createAsyncThunk } from '@reduxjs/toolkit';
import { userApiService } from '~/api/user.api';
import { User } from '~/types/user.types';

/**
 * Thunk asynchrone pour uploader une photo de profil
 *
 * @param userId - ID de l'utilisateur
 * @param imageBase64 - Image en base64 (data:image/jpeg;base64,...)
 * @returns User mis à jour avec la nouvelle photo
 */
export const uploadProfileImage = createAsyncThunk<
  User,
  { userId: string; imageBase64: string },
  { rejectValue: string }
>(
  'session/uploadProfileImage',
  async ({ userId, imageBase64 }, { rejectWithValue }) => {
    try {
      const updatedUser = await userApiService.updateProfileImage(
        userId,
        imageBase64
      );
      return updatedUser;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Échec de l\'upload de l\'image';

      console.error('Upload profile image error:', error);
      return rejectWithValue(errorMessage);
    }
  }
);
