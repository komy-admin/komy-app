import { useCallback, useMemo, useRef } from 'react';
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
 * Instancié une seule fois dans WebSocketListener
 */
export const useInvalidationRefetch = () => {
  const { loadRooms } = useRooms();
  const { loadAllOrders } = useOrders();
  const { loadItems, loadItemTypes } = useMenu();
  const { loadAllMenus } = useMenus();
  const { loadUsers } = useUsers();
  const { loadConfig } = useAccountConfig();

  // Protection contre les appels multiples simultanés
  const isRefetchingRef = useRef(false);

  /**
   * Mapping mémorisé des ressources vers les fonctions de refetch
   */
  const refetchMap = useMemo<Record<ResourceName, (() => Promise<any>) | undefined>>(() => ({
    // Menu & Items
    items: loadItems,
    itemTypes: loadItemTypes,

    // Menus & Categories (tous chargés ensemble)
    menus: loadAllMenus,
    menuCategories: loadAllMenus,
    menuCategoryItems: loadAllMenus,

    // Rooms & Tables (tables incluses dans rooms)
    rooms: loadRooms,
    tables: loadRooms,

    // Orders (orderLines et items inclus)
    orders: loadAllOrders,
    orderLines: loadAllOrders,
    orderLineItems: loadAllOrders,

    // Users
    users: loadUsers,

    // Account Config
    accountConfig: loadConfig,

    // Non implémentées
    tags: undefined,
    statuses: undefined,
    accounts: undefined,
  }), [loadRooms, loadAllOrders, loadItems, loadItemTypes, loadAllMenus, loadUsers, loadConfig]);

  /**
   * Refetch une seule ressource
   */
  const refetchResource = useCallback(async (resource: ResourceName): Promise<void> => {
    const refetchFn = refetchMap[resource];

    if (!refetchFn) {
      console.warn(`⚠️ Pas de fonction de refetch pour: ${resource}`);
      return;
    }

    try {
      await refetchFn();
    } catch (error) {
      console.error(`❌ Erreur refetch ${resource}:`, error);
      throw error;
    }
  }, [refetchMap]);

  /**
   * Refetch plusieurs ressources (avec déduplication des appels)
   */
  const refetchResources = useCallback(async (resources: string[]): Promise<void> => {
    const uniqueResources = [...new Set(resources)] as ResourceName[];
    const validResources = uniqueResources.filter(r => refetchMap[r]);

    if (validResources.length === 0) {
      console.warn('[Invalidation] Aucune ressource valide:', resources);
      return;
    }

    // Grouper par fonction pour éviter les appels dupliqués
    const refetchFns = new Set<() => Promise<any>>();
    validResources.forEach(resource => {
      const fn = refetchMap[resource];
      if (fn) refetchFns.add(fn);
    });

    await Promise.all(
      [...refetchFns].map(fn => fn().catch(err => console.error('[Invalidation] Erreur:', err)))
    );
  }, [refetchMap]);

  /**
   * Refetch toutes les ressources (reconnexion WebSocket)
   * Protégé contre les appels multiples simultanés
   */
  const refetchAll = useCallback(async (): Promise<void> => {
    if (isRefetchingRef.current) {
      console.log('⏳ Refetch déjà en cours, ignoré');
      return;
    }

    isRefetchingRef.current = true;
    console.log('🔄 Refetch de toutes les ressources...');

    try {
      await Promise.all([
        loadRooms(),
        loadAllOrders(),
        loadItems(),
        loadItemTypes(),
        loadAllMenus(),
        loadUsers(),
        loadConfig(),
      ]);
      console.log('✅ Toutes les ressources synchronisées');
    } catch (error) {
      console.error('❌ Erreur refetch global:', error);
      throw error;
    } finally {
      isRefetchingRef.current = false;
    }
  }, [loadRooms, loadAllOrders, loadItems, loadItemTypes, loadAllMenus, loadUsers, loadConfig]);

  return {
    refetchResource,
    refetchResources,
    refetchAll,
  };
};
