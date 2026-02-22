import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { OrderLine, OrderLineType, OrderLineState, SelectedTag, DraftMenuItemWithMeta, CreateOrderLineRequest, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { generateBulkPayload } from '~/utils/order-line-tracker';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import type { MenuSelections } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useOrders } from '~/hooks/useOrders';
import { useToast } from '~/components/ToastProvider';
import { usePayments } from '~/hooks/usePayments';

export interface UseOrderLinesManagerOptions {
  initialLines?: OrderLine[];
  mode: 'create' | 'edit';
  orderId?: string;
  tableId: string;
  onSuccess?: (order: any) => void;
  onError?: (error: Error) => void;
}

// ====================================================================
// HELPERS PURS (hors du hook, pas recréés à chaque render)
// ====================================================================

/**
 * Construire les items et calculer le prix total d'un menu à partir des sélections
 */
function buildMenuData(
  menu: Menu,
  selections: MenuSelections,
  itemTypes: any[],
) {
  const now = new Date().toISOString();
  const menuItems: DraftMenuItemWithMeta[] = [];
  let totalPrice = menu.basePrice || 0;

  Object.entries(selections).forEach(([categoryId, selectionsArray]) => {
    const category = menu.categories?.find((c) => c.id === categoryId);
    if (!category) return;

    totalPrice += category.priceModifier || 0;

    for (const selection of selectionsArray) {
      const menuCategoryItem = category.items?.find((mi) => mi.item?.id === selection.itemId);
      if (!menuCategoryItem?.item) continue;

      const tagsPrice = selection.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);

      menuItems.push({
        id: `menu-item-${Date.now()}-${Math.random()}`,
        categoryId,
        categoryName: itemTypes.find((t) => t.id === category.itemTypeId)?.name || '',
        status: Status.DRAFT,
        item: {
          id: menuCategoryItem.item.id,
          name: menuCategoryItem.item.name,
          price: menuCategoryItem.supplement || 0,
          description: menuCategoryItem.item.description,
          allergens: menuCategoryItem.item.allergens,
          itemType: menuCategoryItem.item.itemType,
          snapshotAt: now,
        },
        supplementPrice: menuCategoryItem.supplement || 0,
        tags: selection.tags,
        note: selection.note,
      });

      totalPrice += (menuCategoryItem.supplement || 0) + tagsPrice;
    }
  });

  const items = menuItems.map((menuItem) => ({
    id: menuItem.id,
    categoryId: menuItem.categoryId,
    categoryName: menuItem.categoryName,
    status: menuItem.status,
    item: menuItem.item,
    supplementPrice: menuItem.supplementPrice,
    tags: menuItem.tags,
    note: menuItem.note,
  })) as OrderLineItem[];

  return { items, totalPrice, now };
}

/**
 * Convertir les lignes au format API pour création
 */
function convertToApiFormat(lines: OrderLine[]): CreateOrderLineRequest[] {
  return lines.map((line): CreateOrderLineRequest => {
    if (line.type === OrderLineType.ITEM) {
      return {
        type: OrderLineType.ITEM,
        itemId: line.item!.id,
        note: line.note,
        tags: line.tags?.length
          ? Object.fromEntries(line.tags.map((t) => [t.tagId, t.value]))
          : undefined,
      };
    } else {
      const selectedItems: Record<string, Array<{ itemId: string; tags?: Record<string, any>; note?: string }>> = {};
      const menuItems = (line.items as DraftMenuItemWithMeta[] | undefined) || [];
      for (const item of menuItems) {
        if (!selectedItems[item.categoryId]) {
          selectedItems[item.categoryId] = [];
        }
        selectedItems[item.categoryId].push({
          itemId: item.item.id,
          tags: item.tags?.length
            ? Object.fromEntries(item.tags.map((t) => [t.tagId, t.value]))
            : undefined,
          note: item.note,
        });
      }
      return {
        type: OrderLineType.MENU,
        menuId: line.menu!.id,
        note: line.note,
        selectedItems,
      };
    }
  });
}

/**
 * Analyser les changements entre lignes courantes et initiales
 */
function analyzeChanges(orderLines: OrderLine[], initialOrderLines: OrderLine[]): OrderLineState[] {
  const states: OrderLineState[] = [];
  const currentIds = new Set(orderLines.map((l) => l.id));
  const originalIds = new Set(initialOrderLines.map((l) => l.id));

  for (const line of orderLines) {
    if (line.id.startsWith('draft-')) {
      states.push({ original: null, current: line, status: 'created', changes: undefined });
    } else if (originalIds.has(line.id)) {
      const originalLine = initialOrderLines.find((l) => l.id === line.id)!;
      const isModified = JSON.stringify(originalLine) !== JSON.stringify(line);
      states.push({
        original: originalLine,
        current: line,
        status: isModified ? 'modified' : 'unchanged',
        changes: isModified ? line : undefined,
      });
    }
  }

  for (const line of initialOrderLines) {
    if (!currentIds.has(line.id)) {
      states.push({ original: line, current: line, status: 'deleted', changes: undefined });
    }
  }

  return states;
}

// ====================================================================
// HOOK
// ====================================================================

/**
 * Hook centralisé pour gérer les OrderLines (création, modification, suppression)
 *
 * Utilisé par:
 * - app/(server)/order/form.tsx
 * - app/(admin)/service.tsx
 *
 * Responsabilités:
 * - Gestion de l'état des lignes (state unique)
 * - CRUD sur les lignes (add, update, delete)
 * - Détection des changements
 * - Sauvegarde via API
 */
export const useOrderLinesManager = (options: UseOrderLinesManagerOptions) => {
  const { initialLines = [], mode, orderId, tableId } = options;
  const { createOrderWithLines } = useOrderLines();
  const { updateOrderWithLines } = useOrders();
  const { showToast } = useToast();
  const { isOrderLinePaid } = usePayments();

  // Stabiliser onSuccess/onError via refs pour ne pas recréer save à chaque render parent
  const onSuccessRef = useRef(options.onSuccess);
  onSuccessRef.current = options.onSuccess;
  const onErrorRef = useRef(options.onError);
  onErrorRef.current = options.onError;

  // État unique centralisé
  const [orderLines, setOrderLines] = useState<OrderLine[]>(initialLines);
  const [initialOrderLines, setInitialOrderLines] = useState<OrderLine[]>(initialLines);
  const [isProcessing, setIsProcessing] = useState(false);

  // Synchroniser les lignes quand initialLines change (ex: ouverture d'une nouvelle commande)
  useEffect(() => {
    setOrderLines(initialLines);
    setInitialOrderLines(initialLines);
  }, [initialLines]);

  // ====================================================================
  // ACTIONS CRUD
  // ====================================================================

  /**
   * Ajouter un item au panier
   */
  const addItem = useCallback(
    (item: Item, customization: { tags: SelectedTag[]; note?: string }) => {
      const tagsPrice = customization.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);
      const totalPrice = item.price + tagsPrice;
      const now = new Date().toISOString();

      const newLine: OrderLine = {
        id: `draft-item-${Date.now()}-${Math.random()}`,
        orderId: '',
        type: OrderLineType.ITEM,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: Status.DRAFT,
        note: customization.note,
        tags: customization.tags,
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          allergens: item.allergens,
          itemType: item.itemType,
          snapshotAt: now,
          tags: item.tags,
        },
        menu: null,
        createdAt: now,
        updatedAt: now,
      };

      setOrderLines((prev) => [...prev, newLine]);
      showToast(`${item.name} ajouté`, 'success');
    },
    [showToast]
  );

  /**
   * Modifier un item existant (tags + note uniquement)
   */
  const updateItem = useCallback(
    (lineId: string, customization: { tags: SelectedTag[]; note?: string }) => {
      setOrderLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId || line.type !== OrderLineType.ITEM) return line;
          if (!line.id.startsWith('draft-') && line.status !== Status.DRAFT) return line;

          const tagsPrice = customization.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);
          const totalPrice = line.item!.price + tagsPrice;

          return {
            ...line,
            note: customization.note,
            tags: customization.tags,
            unitPrice: totalPrice,
            totalPrice: totalPrice,
          };
        })
      );
    },
    []
  );

  /**
   * Ajouter un menu au panier
   */
  const addMenu = useCallback(
    (menu: Menu, selections: MenuSelections, itemTypes: any[]) => {
      const { items, totalPrice, now } = buildMenuData(menu, selections, itemTypes);

      const newLine: OrderLine = {
        id: `draft-menu-${Date.now()}`,
        orderId: '',
        type: OrderLineType.MENU,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: Status.DRAFT,
        item: null,
        menu: {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          basePrice: menu.basePrice,
          snapshotAt: now,
        },
        items,
        createdAt: now,
        updatedAt: now,
      };

      setOrderLines((prev) => [...prev, newLine]);
      showToast(`${menu.name} ajouté`, 'success');
    },
    [showToast]
  );

  /**
   * Modifier un menu existant (remplace les items sélectionnés + tags + notes)
   */
  const updateMenu = useCallback(
    (lineId: string, menu: Menu, selections: MenuSelections, itemTypes: any[]) => {
      setOrderLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId || line.type !== OrderLineType.MENU) return line;

          const { items, totalPrice } = buildMenuData(menu, selections, itemTypes);

          return {
            ...line,
            items,
            unitPrice: totalPrice,
            totalPrice: totalPrice,
          };
        })
      );
    },
    []
  );

  /**
   * Supprimer une ligne
   */
  const deleteLine = useCallback((lineId: string) => {
    setOrderLines((prev) => {
      const line = prev.find((l) => l.id === lineId);
      if (!line) return prev;

      // Vérifier les allocations de paiement
      if (!line.id.startsWith('draft-') && isOrderLinePaid(line.id)) {
        const name = line.type === OrderLineType.MENU
          ? line.menu?.name || 'Menu'
          : line.item?.name || 'Article';
        showToast(`Impossible de supprimer "${name}": déjà payé`, 'error');
        return prev;
      }

      // Empêcher la suppression de lignes sauvegardées non-draft (ITEM uniquement, MENU toujours éditable)
      if (!line.id.startsWith('draft-') && line.type !== OrderLineType.MENU && line.status !== Status.DRAFT) return prev;

      const name = line.type === OrderLineType.MENU
        ? line.menu?.name || 'Menu'
        : line.item?.name || 'Article';
      showToast(`${name} supprimé`, 'warning');
      return prev.filter((l) => l.id !== lineId);
    });
  }, [showToast, isOrderLinePaid]);

  /**
   * Réinitialiser l'état aux valeurs initiales (annuler les modifications)
   */
  const reset = useCallback(() => {
    setOrderLines(initialOrderLines);
  }, [initialOrderLines]);

  // ====================================================================
  // DÉTECTION DE CHANGEMENTS
  // ====================================================================

  /**
   * Vérifier s'il y a des changements non sauvegardés
   * ET qu'il y a au moins une ligne (on ne peut pas sauvegarder une commande vide)
   */
  const hasChanges = useMemo((): boolean => {
    if (orderLines.length === 0) return false;
    if (mode === 'create') return true;

    // Comparaison rapide : si le nombre de lignes diffère, c'est modifié
    if (orderLines.length !== initialOrderLines.length) return true;

    // Comparaison par identité de référence avant JSON (court-circuit rapide)
    if (orderLines === initialOrderLines) return false;

    return JSON.stringify(orderLines) !== JSON.stringify(initialOrderLines);
  }, [orderLines, initialOrderLines, mode]);

  // ====================================================================
  // SAUVEGARDE
  // ====================================================================

  /**
   * Sauvegarder les changements
   */
  const save = useCallback(async () => {
    if (!hasChanges) return null;

    setIsProcessing(true);

    try {
      let result;

      if (mode === 'create') {
        const apiData = convertToApiFormat(orderLines);
        result = await createOrderWithLines(tableId, apiData, Status.DRAFT);
      } else {
        const states = analyzeChanges(orderLines, initialOrderLines);
        const payload = generateBulkPayload(states);
        result = await updateOrderWithLines(orderId!, payload);
      }

      // Mettre à jour les lignes initiales après sauvegarde réussie
      if (result?.lines) {
        setInitialOrderLines(result.lines);
        setOrderLines(result.lines);
      }

      onSuccessRef.current?.(result);
      return result;
    } catch (error: any) {
      // Rollback vers l'état initial en cas d'erreur
      setOrderLines([...initialOrderLines]);

      let errorMessage = 'Erreur lors de la sauvegarde';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      if (errorMessage.includes('allocation') || errorMessage.includes('payé') || errorMessage.includes('payment')) {
        showToast('Impossible de modifier: certaines lignes ont déjà été payées', 'error');
      } else {
        showToast(errorMessage, 'error');
      }

      onErrorRef.current?.(error as Error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [
    hasChanges,
    mode,
    orderLines,
    initialOrderLines,
    tableId,
    orderId,
    createOrderWithLines,
    updateOrderWithLines,
    showToast,
  ]);

  // ====================================================================
  // RETOUR
  // ====================================================================

  return {
    // État
    orderLines,
    isProcessing,
    hasChanges,

    // Actions
    addItem,
    updateItem,
    addMenu,
    updateMenu,
    deleteLine,
    reset,
    save,
  };
};
