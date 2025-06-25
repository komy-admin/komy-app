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