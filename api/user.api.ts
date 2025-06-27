import { UserQrTokenResponse } from '@/types/user.qr.types';
import { BaseApiService } from './base.api';
import { User } from '~/types/user.types';

export class UserApiService extends BaseApiService<User> {
  protected endpoint = '/user';

  constructor() {
    super();
  }

  // Méthode spécialisée pour la mise à jour de l'image de profil
  async updateProfileImage(userId: string, imageUri: string): Promise<User> {
    try {
      const updatedUser = await this.update(userId, { 
        profileImage: imageUri,
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Erreur mise à jour image de profil:', error);
      throw new Error('Impossible de mettre à jour la photo de profil');
    }
  }

  /**
   * Génère ou régénère un QR token pour un utilisateur (admin only)
   */
  async generateQrToken(userId: string): Promise<UserQrTokenResponse> {
    try {
      const response = await this.axiosInstance.post<UserQrTokenResponse>(`/admin/user/${userId}/generate-qr`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      throw error;
    }
  }

  /**
   * Révoque le QR token d’un utilisateur (admin only)
   */
  async revokeQrToken(userId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/admin/user/${userId}/revoke-qr`);
    } catch (error) {
      console.error('Erreur lors de la révocation du QR code:', error);
      throw error;
    }
  }

  // Méthode pour valider la taille d'image côté front
  validateImageSize(fileSize: number): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return fileSize <= maxSize;
  }

  validateImageType(mimeType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(mimeType);
  }
}

export const userApiService = new UserApiService();