import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Room } from '~/types/room.types';

// Types pour le state des rooms
export interface RoomsState {
  rooms: Record<string, Room>;
  currentRoomId: string | null;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: RoomsState = {
  rooms: {},
  currentRoomId: null,
  loading: false,
  error: null,
};

// Types pour les actions
interface SetRoomsPayload {
  rooms: Room[];
}

// Slice pour les rooms
const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    // Actions de chargement
    setLoadingRooms: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
      if (action.payload) state.error = null;
    },
    
    setErrorRooms: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    // Actions pour les données
    setRooms: (state, action: PayloadAction<SetRoomsPayload>) => {
      const { rooms } = action.payload;
      
      // Normaliser les rooms
      state.rooms = {};
      rooms.forEach(room => {
        state.rooms[room.id] = room;
      });
      
      // Sélectionner la première room par défaut si aucune n'est sélectionnée
      if (rooms.length > 0 && !state.currentRoomId) {
        state.currentRoomId = rooms[0].id;
      }
      
      state.loading = false;
      state.error = null;
    },
    
    // Actions de navigation
    setCurrentRoom: (state, action: PayloadAction<string>) => {
      state.currentRoomId = action.payload;
    },
    
    // Actions WebSocket CRUD
    createRoom: (state, action: PayloadAction<{ room: Room }>) => {
      const { room } = action.payload;
      state.rooms[room.id] = room;
    },
    
    updateRoom: (state, action: PayloadAction<{ room: Room }>) => {
      const { room } = action.payload;
      state.rooms[room.id] = room;
    },
    
    deleteRoom: (state, action: PayloadAction<{ roomId: string }>) => {
      const { roomId } = action.payload;
      delete state.rooms[roomId];
      
      // Changer de room si c'était la room courante
      if (state.currentRoomId === roomId) {
        const remainingRooms = Object.keys(state.rooms);
        state.currentRoomId = remainingRooms.length > 0 ? remainingRooms[0] : null;
      }
    },
    
    // Action pour nettoyer l'état
    resetRoomsState: () => initialState,
  },
});

// Selectors de base
const selectRoomsState = (state: { rooms: RoomsState }) => state.rooms;

export const selectAllRooms = createSelector(
  [selectRoomsState],
  (roomsState) => {
    if (!roomsState) return [];
    return Object.values(roomsState.rooms);
  }
);

export const selectCurrentRoom = createSelector(
  [selectRoomsState],
  (roomsState) => {
    if (!roomsState || !roomsState.currentRoomId) return null;
    return roomsState.rooms[roomsState.currentRoomId] || null;
  }
);

export const selectCurrentRoomId = createSelector(
  [selectRoomsState],
  (roomsState) => roomsState?.currentRoomId || null
);

export const selectRoomById = (roomId: string) => createSelector(
  [selectRoomsState],
  (roomsState) => roomsState?.rooms[roomId] || null
);

export const selectRoomsLoading = createSelector(
  [selectRoomsState],
  (roomsState) => roomsState?.loading || false
);

export const selectRoomsError = createSelector(
  [selectRoomsState],
  (roomsState) => roomsState?.error || null
);

// Actions exportées
export const roomsActions = roomsSlice.actions;
export default roomsSlice.reducer;

// Types exportés
export type { SetRoomsPayload };