import { useState, useCallback, useMemo, useEffect } from 'react';
import { OrderLine, OrderLineType, OrderLineState, SelectedTag, DraftMenuItemWithMeta, CreateOrderLineRequest, OrderLineItem } from '~/types/order-line.types';
import { Status } from '~/types/status.enum';
import { generateBulkPayload } from '~/utils/order-line-tracker';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import type { MenuSelections } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { useOrderLines } from '~/hooks/useOrderLines';
import { useOrders } from '~/hooks/useOrders';

export interface UseOrderLinesManagerOptions {
  initialLines?: OrderLine[];
  mode: 'create' | 'edit';
  orderId?: string;
  tableId: string;
  onSuccess?: (order: any) => void;
  onError?: (error: Error) => void;
}

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
  const { initialLines = [], mode, orderId, tableId, onSuccess, onError } = options;
  const { createOrderWithLines } = useOrderLines();
  const { updateOrderWithLines } = useOrders();

  // ✅ État unique centralisé
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

      const newLine: OrderLine = {
        id: `draft-item-${Date.now()}-${Math.random()}`,
        orderId: '',
        type: OrderLineType.ITEM,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: Status.PENDING,
        note: customization.note,
        tags: customization.tags,
        item: {
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          allergens: item.allergens,
          itemType: item.itemType,
          snapshotAt: new Date().toISOString(),
          // Stocker les tags de l'item original pour édition future
          tags: item.tags,
        },
        menu: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrderLines((prev) => [...prev, newLine]);
    },
    []
  );

  /**
   * Modifier un item existant (tags + note uniquement)
   */
  const updateItem = useCallback(
    (lineId: string, customization: { tags: SelectedTag[]; note?: string }) => {
      setOrderLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId || line.type !== OrderLineType.ITEM) return line;

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
      // Construire les items du menu
      const menuItems: DraftMenuItemWithMeta[] = [];
      let totalPrice = menu.basePrice || 0;

      Object.entries(selections).forEach(([categoryId, selection]) => {
        const category = menu.categories?.find((c) => c.id === categoryId);
        if (!category) return;

        const menuCategoryItem = category.items?.find((mi) => mi.item?.id === selection.itemId);
        if (!menuCategoryItem?.item) return;

        const tagsPrice = selection.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);

        menuItems.push({
          id: `menu-item-${Date.now()}-${Math.random()}`,
          categoryId,
          categoryName: itemTypes.find((t) => t.id === category.itemTypeId)?.name || '',
          status: Status.PENDING,
          item: {
            id: menuCategoryItem.item.id,
            name: menuCategoryItem.item.name,
            price: menuCategoryItem.supplement || 0,
            description: menuCategoryItem.item.description,
            allergens: menuCategoryItem.item.allergens,
            itemType: menuCategoryItem.item.itemType,
            snapshotAt: new Date().toISOString(),
          },
          supplementPrice: menuCategoryItem.supplement || 0,
          tags: selection.tags,
          note: selection.note,
        });

        totalPrice += (menuCategoryItem.supplement || 0) + tagsPrice;
      });

      const newLine: OrderLine = {
        id: `draft-menu-${Date.now()}`,
        orderId: '',
        type: OrderLineType.MENU,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: Status.PENDING,
        item: null,
        menu: {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          basePrice: menu.basePrice,
          snapshotAt: new Date().toISOString(),
        },
        items: menuItems as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setOrderLines((prev) => [...prev, newLine]);
    },
    []
  );

  /**
   * Modifier un menu existant (remplace les items sélectionnés + tags + notes)
   */
  const updateMenu = useCallback(
    (lineId: string, menu: Menu, selections: MenuSelections, itemTypes: any[]) => {
      setOrderLines((prev) =>
        prev.map((line) => {
          if (line.id !== lineId || line.type !== OrderLineType.MENU) return line;

          // Reconstruire les items du menu
          const menuItems: DraftMenuItemWithMeta[] = [];
          let totalPrice = menu.basePrice || 0;

          Object.entries(selections).forEach(([categoryId, selection]) => {
            const category = menu.categories?.find((c) => c.id === categoryId);
            if (!category) return;

            const menuCategoryItem = category.items?.find((mi) => mi.item?.id === selection.itemId);
            if (!menuCategoryItem?.item) return;

            const tagsPrice = selection.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);

            menuItems.push({
              id: `menu-item-${Date.now()}-${Math.random()}`,
              categoryId,
              categoryName: itemTypes.find((t) => t.id === category.itemTypeId)?.name || '',
              status: Status.PENDING,
              item: {
                id: menuCategoryItem.item.id,
                name: menuCategoryItem.item.name,
                price: menuCategoryItem.supplement || 0,
                description: menuCategoryItem.item.description,
                allergens: menuCategoryItem.item.allergens,
                itemType: menuCategoryItem.item.itemType,
                snapshotAt: new Date().toISOString(),
              },
              supplementPrice: menuCategoryItem.supplement || 0,
              tags: selection.tags,
              note: selection.note,
            });

            totalPrice += (menuCategoryItem.supplement || 0) + tagsPrice;
          });

          return {
            ...line,
            items: menuItems as OrderLineItem[],
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
    setOrderLines((prev) => prev.filter((l) => l.id !== lineId));
  }, []);

  /**
   * Réinitialiser toutes les lignes (vider le panier)
   */
  const clearAllLines = useCallback(() => {
    setOrderLines([]);
  }, []);

  // ====================================================================
  // DÉTECTION DE CHANGEMENTS
  // ====================================================================

  /**
   * Vérifier s'il y a des changements non sauvegardés
   */
  const hasChanges = useMemo((): boolean => {
    if (mode === 'create') {
      return orderLines.length > 0;
    }
    return JSON.stringify(orderLines) !== JSON.stringify(initialOrderLines);
  }, [orderLines, initialOrderLines, mode]);

  /**
   * Analyser les changements (created, modified, deleted)
   */
  const analyzeChanges = useCallback((): OrderLineState[] => {
    const states: OrderLineState[] = [];
    const currentIds = new Set(orderLines.map((l) => l.id));
    const originalIds = new Set(initialOrderLines.map((l) => l.id));

    // Nouvelles lignes
    for (const line of orderLines) {
      if (line.id.startsWith('draft-')) {
        states.push({
          original: null,
          current: line,
          status: 'created',
          changes: undefined,
        });
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

    // Lignes supprimées
    for (const line of initialOrderLines) {
      if (!currentIds.has(line.id)) {
        states.push({
          original: line,
          current: line,
          status: 'deleted',
          changes: undefined,
        });
      }
    }

    return states;
  }, [orderLines, initialOrderLines]);

  // ====================================================================
  // SAUVEGARDE
  // ====================================================================

  /**
   * Convertir les lignes au format API pour création
   */
  const convertToApiFormat = useCallback((lines: OrderLine[]): CreateOrderLineRequest[] => {
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
        // MENU
        return {
          type: OrderLineType.MENU,
          menuId: line.menu!.id,
          note: line.note,
          selectedItems: Object.fromEntries(
            (line.items as DraftMenuItemWithMeta[] | undefined)?.map((item) => [
              item.categoryId,
              {
                itemId: item.item.id,
                tags: item.tags?.length
                  ? Object.fromEntries(item.tags.map((t) => [t.tagId, t.value]))
                  : undefined,
                note: item.note,
              },
            ]) || []
          ),
        };
      }
    });
  }, []);

  /**
   * Sauvegarder les changements
   */
  const save = useCallback(async () => {
    if (!hasChanges) {
      return null;
    }

    setIsProcessing(true);

    try {
      let result;

      if (mode === 'create') {
        // Création : convertir et envoyer via useOrderLines
        const apiData = convertToApiFormat(orderLines);
        result = await createOrderWithLines(tableId, apiData, Status.DRAFT);
      } else {
        // Mise à jour : analyser les changements et envoyer via useOrders
        const states = analyzeChanges();
        const payload = generateBulkPayload(states);
        result = await updateOrderWithLines(orderId!, payload);
      }

      onSuccess?.(result);
      return result;
    } catch (error) {
      onError?.(error as Error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [
    hasChanges,
    mode,
    orderLines,
    tableId,
    orderId,
    convertToApiFormat,
    analyzeChanges,
    createOrderWithLines,
    updateOrderWithLines,
    onSuccess,
    onError,
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
    clearAllLines,
    save,

    // Pour compatibilité avec OrderLinesForm actuel
    setOrderLines,
  };
};
