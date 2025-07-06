import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectUsers,
  selectUserByIdFromUsers,
  selectUsersLoading,
  selectUsersError,
} from '~/store/restaurant';
import { userApiService } from '~/api/user.api';
import { User, UserProfile } from '~/types/user.types';
import { FilterQueryBuilder } from './useFilter/query-builder';

/**
 * Hook spécialisé pour la gestion des utilisateurs
 */
export const useUsers = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const users = useSelector((state: any) => selectUsers({ users: state.restaurant.users }));
  const loading = useSelector((state: any) => selectUsersLoading({ users: state.restaurant.users }));
  const error = useSelector((state: any) => selectUsersError({ users: state.restaurant.users }));

  // Actions asynchrones pour charger les données
  const loadUsers = useCallback(async (filters?: any) => {
    try {
      dispatch(restaurantActions.setLoadingUsers(true));
      
      let queryString = '';
      if (filters) {
        queryString = FilterQueryBuilder.build({
          filters: filters.filters || [],
          sort: filters.sort || { field: 'firstName', direction: 'asc' },
          perPage: filters.perPage || 100
        });
      }
      
      const { data: users } = await userApiService.getAll(queryString);
      dispatch(restaurantActions.setUsers({ users }));
      return users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des utilisateurs';
      dispatch(restaurantActions.setErrorUsers(errorMessage));
      throw error;
    }
  }, [dispatch]);

  // Actions CRUD pour gérer les utilisateurs
  const createUser = useCallback(async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await userApiService.create(userData);
      dispatch(restaurantActions.createUser({ user: newUser }));
      return newUser;
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      
      // Gestion des nouvelles réponses d'erreur structurées du backend
      if (error?.response?.data?.message) {
        const errorData = error.response.data;
        
        // Erreurs de conflit (409) - contraintes d'unicité
        if (error.response.status === 409) {
          throw new Error(errorData.message);
        }
        
        // Erreurs de validation (422)
        if (error.response.status === 422) {
          throw new Error(errorData.message);
        }
        
        // Erreurs 404
        if (error.response.status === 404) {
          throw new Error(errorData.message);
        }
        
        // Erreurs 400
        if (error.response.status === 400) {
          throw new Error(errorData.message);
        }
      }
      
      throw error;
    }
  }, [dispatch]);

  const updateUser = useCallback(async (userId: string, userData: Partial<User>) => {
    try {
      const updatedUser = await userApiService.update(userId, userData);
      dispatch(restaurantActions.updateUser({ user: updatedUser }));
      return updatedUser;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      
      // Gestion des nouvelles réponses d'erreur structurées du backend
      if (error?.response?.data?.message) {
        const errorData = error.response.data;
        
        // Erreurs de conflit (409) - contraintes d'unicité
        if (error.response.status === 409) {
          throw new Error(errorData.message);
        }
        
        // Erreurs de validation (422)
        if (error.response.status === 422) {
          throw new Error(errorData.message);
        }
        
        // Erreurs 404
        if (error.response.status === 404) {
          throw new Error(errorData.message);
        }
        
        // Erreurs 400
        if (error.response.status === 400) {
          throw new Error(errorData.message);
        }
      }
      
      throw error;
    }
  }, [dispatch]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await userApiService.delete(userId);
      dispatch(restaurantActions.deleteUser({ userId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }, [dispatch]);

  // Actions QR spécialisées
  const getOrGenerateQrToken = useCallback(async (userId: string) => {
    try {
      const response = await userApiService.getOrGenerateQrToken(userId);
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération/génération du QR code:', error);
      throw error;
    }
  }, []);

  const regenerateQrToken = useCallback(async (userId: string) => {
    try {
      const response = await userApiService.regenerateQrToken(userId);
      return response;
    } catch (error) {
      console.error('Erreur lors de la régénération du QR code:', error);
      throw error;
    }
  }, []);

  // Utilitaires
  const getUserById = useCallback((userId: string) => {
    return users.find(user => user.id === userId) || null;
  }, [users]);

  const getUsersByProfile = useCallback((profile: UserProfile) => {
    return users.filter(user => user.profil === profile);
  }, [users]);

  const searchUsers = useCallback((searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }, [users]);

  return {
    // Données
    users,
    
    // État
    loading,
    error,
    
    // Actions de chargement
    loadUsers,
    
    // Actions CRUD
    createUser,
    updateUser,
    deleteUser,
    
    // Actions QR
    getOrGenerateQrToken,
    regenerateQrToken,
    
    // Utilitaires
    getUserById,
    getUsersByProfile,
    searchUsers,
  };
};