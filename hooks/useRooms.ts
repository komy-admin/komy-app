import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  restaurantActions,
  selectAllRooms,
  selectCurrentRoom,
  selectCurrentRoomId,
  selectRoomById,
  selectRoomsLoading,
  selectRoomsError,
} from '~/store/restaurant';
import { roomApiService } from '~/api/room.api';
import { Room } from '~/types/room.types';

/**
 * Hook spécialisé pour la gestion des salles
 */
export const useRooms = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const rooms = useSelector(selectAllRooms);
  const currentRoom = useSelector(selectCurrentRoom);
  const currentRoomId = useSelector(selectCurrentRoomId);
  const loading = useSelector(selectRoomsLoading);
  const error = useSelector(selectRoomsError);

  // Actions synchrones
  const setCurrentRoom = useCallback((roomId: string) => {
    dispatch(restaurantActions.setCurrentRoom(roomId));
  }, [dispatch]);

  // Actions asynchrones
  const loadRooms = useCallback(async () => {
    try {
      dispatch(restaurantActions.setLoadingRooms(true));
      const { data: rooms } = await roomApiService.getAll();
      dispatch(restaurantActions.setRooms({ rooms }));
      return rooms;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des salles';
      dispatch(restaurantActions.setErrorRooms(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const createRoom = useCallback(async (roomData: Partial<Room>) => {
    try {
      dispatch(restaurantActions.setLoadingRooms(true));
      const newRoom = await roomApiService.create(roomData);
      dispatch(restaurantActions.createRoom({ room: newRoom }));
      return newRoom;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la salle';
      dispatch(restaurantActions.setErrorRooms(errorMessage));
      throw error;
    }
  }, [dispatch]);

  const updateRoom = useCallback(async (roomId: string, roomData: Partial<Room>) => {
    try {
      const updatedRoom = await roomApiService.update(roomId, roomData);
      dispatch(restaurantActions.updateRoom({ room: updatedRoom }));
      return updatedRoom;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la salle:', error);
      throw error;
    }
  }, [dispatch]);

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      await roomApiService.delete(roomId);
      dispatch(restaurantActions.deleteRoom({ roomId }));
    } catch (error) {
      console.error('Erreur lors de la suppression de la salle:', error);
      throw error;
    }
  }, [dispatch]);

  // Utilitaires
  const getRoomById = useCallback((roomId: string) => {
    return rooms.find(room => room.id === roomId) || null;
  }, [rooms]);

  return {
    // Données
    rooms,
    currentRoom,
    currentRoomId,
    
    // État
    loading,
    error,
    
    // Actions de navigation
    setCurrentRoom,
    
    // Actions CRUD
    loadRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    
    // Utilitaires
    getRoomById,
  };
};