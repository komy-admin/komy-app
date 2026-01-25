import { useCallback } from 'react';
import { ResourceName } from './websocket.config';
import { useRooms } from '../useRooms';
import { useOrders } from '../useOrders';
import { useMenu } from '../useMenu';
import { useMenus } from '../useMenus';
import { useUsers } from '../useUsers';
import { useAccountConfig } from '../useAccountConfig';

/**
 * Hook centralisé pour gérer le refetch des ressources invalidées
 * Utilisé par le système d'invalidation WebSocket
 */
export const useInvalidationRefetch = () => {
  const roomsHook = useRooms();
  const ordersHook = useOrders();
  const menuHook = useMenu();
  const menusHook = useMenus();
  const usersHook = useUsers();
  const accountConfigHook = useAccountConfig();

  /**
   * Mapping des noms de ressources backend vers les fonctions de refetch
   */
  const refetchMap: Record<ResourceName, (() => Promise<any>) | undefined> = {
    // Menu & Items
    items: menuHook.loadItems,
    itemTypes: menuHook.loadItemTypes,

    // Menus & Categories
    menus: menusHook.loadAllMenus,
    menuCategories: menusHook.loadAllMenus, // MenuCategories sont incluses dans les menus
    menuCategoryItems: menusHook.loadAllMenus, // MenuCategoryItems sont incluses dans les menus

    // Rooms & Tables
    rooms: roomsHook.loadRooms,
    tables: roomsHook.loadRooms, // Tables sont incluses dans les rooms

    // Orders
    orders: ordersHook.loadAllOrders,
    orderLines: ordersHook.loadAllOrders, // OrderLines sont incluses dans les orders
    orderLineItems: ordersHook.loadAllOrders, // OrderLineItems sont incluses dans les orders

    // Users
    users: usersHook.loadUsers,

    // Account Config
    accountConfig: accountConfigHook.loadConfig,

    // Resources non implémentées pour le moment
    tags: undefined,
    statuses: undefined,
    accounts: undefined,
  };

  /**
   * Refetch une seule ressource
   */
  const refetchResource = useCallback(async (resource: ResourceName): Promise<void> => {
    const refetchFn = refetchMap[resource];

    if (!refetchFn) {
      console.warn(`⚠️ Pas de fonction de refetch disponible pour la ressource: ${resource}`);
      return;
    }

    try {
      console.log(`🔄 Refetch de la ressource: ${resource}`);
      await refetchFn();
      console.log(`✅ Ressource refetch avec succès: ${resource}`);
    } catch (error) {
      console.error(`❌ Erreur lors du refetch de ${resource}:`, error);
      throw error;
    }
  }, [refetchMap]);

  const refetchResources = useCallback(async (resources: string[]): Promise<void> => {
    const uniqueResources = Array.from(new Set(resources)) as ResourceName[];
    const validResources = uniqueResources.filter(resource => resource in refetchMap);

    if (validResources.length === 0) {
      console.warn('[Invalidation] No valid resources to refetch:', resources);
      return;
    }

    const refetchGroups = new Map<Function, ResourceName[]>();

    validResources.forEach(resource => {
      const refetchFn = refetchMap[resource];
      if (refetchFn) {
        const group = refetchGroups.get(refetchFn) || [];
        group.push(resource);
        refetchGroups.set(refetchFn, group);
      }
    });

    const refetchPromises = Array.from(refetchGroups.entries()).map(([refetchFn]) => {
      return refetchFn().catch((error: any) => {
        console.error('[Invalidation] Refetch error:', error);
      });
    });

    await Promise.all(refetchPromises);
  }, [refetchMap]);

  /**
   * Refetch toutes les ressources principales (utilisé lors de la reconnexion WebSocket)
   */
  const refetchAll = useCallback(async (): Promise<void> => {
    console.log('🔄 Refetch de toutes les ressources...');
    try {
      await Promise.all([
        roomsHook.loadRooms(),
        ordersHook.loadAllOrders(),
        menuHook.loadItems(),
        menuHook.loadItemTypes(),
        menusHook.loadAllMenus(),
        usersHook.loadUsers(),
        accountConfigHook.loadConfig(),
      ]);
      console.log('✅ Toutes les ressources synchronisées');
    } catch (error) {
      console.error('❌ Erreur lors du refetch global:', error);
      throw error;
    }
  }, [roomsHook, ordersHook, menuHook, menusHook, usersHook, accountConfigHook]);

  return {
    refetchResource,
    refetchResources,
    refetchAll,
  };
};
