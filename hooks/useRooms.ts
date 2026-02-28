import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { entitiesActions } from '~/store';
import {
  selectCurrentRoom,
  selectCurrentRoomId,
  sessionActions
} from '~/store/slices/session.slice';
import { selectRooms } from '~/store/selectors';
import { roomApiService } from '~/api/room.api';
import { Room } from '~/types/room.types';

/**
 * Hook spécialisé pour la gestion des salles
 */
export const useRooms = () => {
  const dispatch = useDispatch();

  // Sélecteurs
  const rooms = useSelector(selectRooms);
  const currentRoom = useSelector(selectCurrentRoom);
  const currentRoomId = useSelector(selectCurrentRoomId);
  // Actions synchrones
  const setCurrentRoom = useCallback((roomId: string) => {
    dispatch(sessionActions.setCurrentRoom(roomId));
  }, [dispatch]);

  // Actions asynchrones
  const loadRooms = useCallback(async () => {
    try {
      const { data: rooms } = await roomApiService.getAll();
      
      // Extraire toutes les tables des rooms et les ajouter au store
      const allTables = rooms.flatMap(room => room.tables || []);
      
      // Dispatch les rooms ET les tables
      dispatch(entitiesActions.setRooms({ rooms }));
      if (allTables.length > 0) {
        dispatch(entitiesActions.setTables({ tables: allTables }));
      }
      
      // Définir la première room comme room courante par défaut si aucune n'est sélectionnée
      if (rooms && rooms.length > 0 && !currentRoomId) {
        dispatch(sessionActions.setCurrentRoom(rooms[0].id));
      }

      return rooms;
    } catch (error) {
      throw error;
    }
  }, [dispatch, currentRoomId]);

  const createRoom = useCallback(async (roomData: Partial<Room>) => {
    try {
      const newRoom = await roomApiService.create(roomData);
      dispatch(entitiesActions.createRoom({ room: newRoom }));
      return newRoom;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const updateRoom = useCallback(async (roomId: string, roomData: Partial<Room>) => {
    try {
      const updatedRoom = await roomApiService.update(roomId, roomData);
      dispatch(entitiesActions.updateRoom({ room: updatedRoom }));
      return updatedRoom;
    } catch (error) {
      throw error;
    }
  }, [dispatch]);

  const deleteRoom = useCallback(async (roomId: string) => {
    try {
      await roomApiService.delete(roomId);
      dispatch(entitiesActions.deleteRoom({ roomId }));

      if (currentRoomId === roomId) {
        const remainingRooms = rooms.filter(room => room.id !== roomId);
        if (remainingRooms.length > 0) {
          dispatch(sessionActions.setCurrentRoom(remainingRooms[0].id));
        } else {
          dispatch(sessionActions.setCurrentRoom(null));
        }
      }
    } catch (error) {
      throw error;
    }
  }, [dispatch, currentRoomId, rooms]);

  // Utilitaires
  const getRoomById = useCallback((roomId: string) => {
    return rooms.find(room => room.id === roomId) || null;
  }, [rooms]);

  return {
    // Données
    rooms,
    currentRoom,
    currentRoomId,

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