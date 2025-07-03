import { Room } from '~/types/room.types';
import { RoomFilterState } from '~/components/filters/RoomFilters';

/**
 * Filtre une liste de salles selon les critères spécifiés
 */
export const filterRooms = (rooms: Room[], filters: RoomFilterState): Room[] => {
  return rooms.filter(room => {
    const matchesName = !filters.name || room.name.toLowerCase().includes(filters.name.toLowerCase());
    
    // Logique améliorée pour permettre min seul, max seul, ou les deux
    const matchesWidth = (filters.minWidth === null || room.width >= filters.minWidth) && 
                        (filters.maxWidth === null || room.width <= filters.maxWidth);
    const matchesHeight = (filters.minHeight === null || room.height >= filters.minHeight) && 
                         (filters.maxHeight === null || room.height <= filters.maxHeight);
    
    const tableCount = room.tables?.length || 0;
    const matchesTables = (filters.minTables === null || tableCount >= filters.minTables) && 
                         (filters.maxTables === null || tableCount <= filters.maxTables);
    
    return matchesName && matchesWidth && matchesHeight && matchesTables;
  });
};

/**
 * Crée un état de filtres vide
 */
export const createEmptyFilters = (): RoomFilterState => ({
  name: '',
  minWidth: null,
  maxWidth: null,
  minHeight: null,
  maxHeight: null,
  minTables: null,
  maxTables: null
});