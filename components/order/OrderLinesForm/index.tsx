import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOrderLinesForm } from '~/hooks/order/useOrderLinesForm';
import { OrderLinesNavigation } from '~/components/order/OrderLinesForm/OrderLinesNavigation';
import { OrderItemsList } from '~/components/order/OrderLinesForm/OrderItemsList';
import { OrderMenusList } from '~/components/order/OrderLinesForm/OrderMenusList';
import { MenuConfiguration } from '~/components/order/OrderLinesForm/MenuConfiguration';
import { OrderLinesFooter } from '~/components/order/OrderLinesForm/OrderLinesFooter';
import { OrderLinesHeader } from '~/components/order/OrderLinesForm/OrderLinesHeader';
import { OrderLinesFormProps } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { OrderLine, OrderLineType } from '~/types/order-line.types';
import { OrderLinesButton } from '~/components/order/OrderLinesForm/OrderLinesButton';
import { Status } from '@/types/status.enum';

/**
 * OrderLinesForm - Version simplifiée
 * 
 * Principe : 
 * - Un seul état : draftLines (array simple)
 * - Ajouter un item = push dans l'array
 * - Ajouter un menu = push dans l'array après configuration
 * - Émettre les changements au parent à chaque modification
 */
export const OrderLinesForm: React.FC<OrderLinesFormProps> = ({
  lines,
  items,
  itemTypes,
  onLinesChange,
  onConfigurationModeChange,
  onConfigurationActionsChange
}) => {
  // État principal : juste un array de lignes
  const [draftLines, setDraftLines] = useState<OrderLine[]>(lines);

  // Synchroniser avec les props
  useEffect(() => {
    setDraftLines(lines);
  }, [lines]);

  // Configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<any>(null);
  const [tempMenuSelections, setTempMenuSelections] = useState<Record<string, string[]>>({});

  // Hook pour l'UI (navigation, filtres)
  const {
    activeMainTab,
    setActiveMainTab,
    activeItemType,
    setActiveItemType,
    activeMenus,
    activeItems,
    allItemTypes,
  } = useOrderLinesForm({ items, itemTypes });

  // Émettre les changements au parent
  const emitChanges = useCallback((newLines: OrderLine[]) => {
    setDraftLines(newLines);
    onLinesChange(newLines);
  }, [onLinesChange]);


  const addItem = useCallback((item: any) => {
    const newLine: Partial<OrderLine> = {
      id: `draft-item-${Date.now()}`,
      type: OrderLineType.ITEM,
      quantity: 1,
      unitPrice: item.price,
      totalPrice: item.price,
      status: Status.PENDING,
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        allergens: item.allergens,
        itemType: item.itemType,
        snapshotAt: new Date().toISOString()
      },
      menu: null
    };

    const newLines = [...draftLines, newLine as OrderLine];
    emitChanges(newLines);
  }, [draftLines, emitChanges]);

  const removeItem = useCallback((itemId: string) => {
    // Trouver la dernière ligne avec cet item
    const lineIndex = draftLines.findLastIndex(
      line => line.type === OrderLineType.ITEM && line.item?.id === itemId
    );

    if (lineIndex >= 0) {
      const newLines = draftLines.filter((_, index) => index !== lineIndex);
      emitChanges(newLines);
    }
  }, [draftLines, emitChanges]);

  const updateItemQuantity = useCallback((itemId: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      const item = items.find(i => i.id === itemId);
      if (item) addItem(item);
    } else {
      removeItem(itemId);
    }
  }, [items, addItem, removeItem]);

  // Calculer les quantités pour l'affichage
  const getTotalItemQuantity = useCallback((itemId: string) => {
    return draftLines.filter(
      line => line.type === OrderLineType.ITEM && line.item?.id === itemId
    ).length;
  }, [draftLines]);

  const getDraftItemQuantity = useCallback((itemId: string) => {
    const currentCount = getTotalItemQuantity(itemId);
    const initialCount = lines.filter(
      line => line.type === OrderLineType.ITEM && line.item?.id === itemId
    ).length;
    return Math.max(0, currentCount - initialCount);
  }, [getTotalItemQuantity, lines]);


  // Utiliser un ref pour accéder aux sélections actuelles dans les callbacks
  const tempMenuSelectionsRef = useRef<Record<string, string[]>>({});

  // Mettre à jour le ref quand tempMenuSelections change
  useEffect(() => {
    tempMenuSelectionsRef.current = tempMenuSelections;
  }, [tempMenuSelections]);

  // Fonction pour ajouter un menu (définie avant startMenuConfiguration)
  const addMenu = useCallback((menu: any, selectedItems: Record<string, string>) => {

    // Créer les items du menu
    const menuItems: any[] = [];
    let totalPrice = menu.basePrice || 0;

    Object.entries(selectedItems).forEach(([categoryId, itemId]) => {
      const category = menu.categories?.find((cat: any) => cat.id === categoryId);

      // Chercher l'item dans les items de la catégorie
      let selectedMenuItem = null;
      let selectedItem = null;

      if (category && category.items) {
        selectedMenuItem = category.items.find((mi: any) => mi.item?.id === itemId);
        selectedItem = selectedMenuItem?.item;
      }

      if (selectedItem && category) {
        menuItems.push({
          id: `menu-item-${Date.now()}-${Math.random()}`,
          categoryName: itemTypes.find(t => t.id === category.itemTypeId)?.name || '',
          status: Status.PENDING,
          item: {
            id: selectedItem.id,
            name: selectedItem.name,
            price: selectedMenuItem?.supplement || 0,
            description: selectedItem.description,
            allergens: selectedItem.allergens,
            itemType: selectedItem.itemType,
            snapshotAt: new Date().toISOString()
          },
          supplementPrice: selectedMenuItem?.supplement || 0
        });
        totalPrice += selectedMenuItem?.supplement || 0;
      }
    });

    const newLine: Partial<OrderLine> = {
      id: `draft-menu-${Date.now()}`,
      type: OrderLineType.MENU,
      quantity: 1,
      unitPrice: totalPrice,
      totalPrice: totalPrice,
      status: Status.PENDING,
      item: null,
      menu: {
        id: menu.id,
        name: menu.name,
        description: menu.description,
        basePrice: menu.basePrice,
        snapshotAt: new Date().toISOString()
      },
      items: menuItems
    };

    const newLines = [...draftLines, newLine as OrderLine];
    emitChanges(newLines);
  }, [draftLines, itemTypes, emitChanges]);

  // Fonction pour vérifier si un menu peut être auto-configuré
  const isMenuAutoConfigurable = useCallback((menu: any): boolean => {
    if (!menu?.categories || menu.categories.length === 0) return false;

    // Vérifier que toutes les catégories sont obligatoires ET ont exactement 1 item
    return menu.categories.every((category: any) => {
      // Doit être obligatoire
      if (!category.isRequired) return false;

      // Doit avoir exactement 1 item
      const categoryItems = category.items || [];
      return categoryItems.length === 1;
    });
  }, []);

  // Fonction pour auto-configurer un menu simple
  const getAutoMenuConfiguration = useCallback((menu: any): Record<string, string> => {
    if (!menu?.categories) return {};

    const selectedItems: Record<string, string> = {};

    menu.categories.forEach((category: any) => {
      if (category.isRequired && category.items && category.items.length === 1) {
        const singleItem = category.items[0];
        if (singleItem.item?.id) {
          selectedItems[category.id] = singleItem.item.id;
        }
      }
    });

    return selectedItems;
  }, []);

  // Fonction de validation pour vérifier si toutes les catégories obligatoires sont sélectionnées
  const validateMenuSelections = useCallback((menu: any, selections: Record<string, string[]>): boolean => {
    if (!menu?.categories) return false;

    // Vérifier que toutes les catégories obligatoires ont au moins une sélection
    return menu.categories.every((category: any) => {
      if (!category.isRequired) return true; // Les catégories optionnelles passent toujours

      const categorySelections = selections[category.id] || [];
      return categorySelections.length > 0; // Au moins un item sélectionné
    });
  }, []);

  // Gérer les actions de configuration de menu
  const handleCancelMenuConfiguration = useCallback(() => {
    setIsConfiguringMenu(false);
    setMenuBeingConfigured(null);
    setTempMenuSelections({});
    tempMenuSelectionsRef.current = {};
    onConfigurationModeChange?.(false);
    onConfigurationActionsChange?.(null);
  }, [onConfigurationModeChange, onConfigurationActionsChange]);

  const handleConfirmMenuConfiguration = useCallback(() => {
    const selectedItems: Record<string, string> = {};
    Object.entries(tempMenuSelections).forEach(([categoryId, itemIds]) => {
      if (itemIds && itemIds.length > 0) {
        selectedItems[categoryId] = itemIds[0];
      }
    });

    if (menuBeingConfigured && Object.keys(selectedItems).length > 0) {
      addMenu(menuBeingConfigured, selectedItems);
    }

    handleCancelMenuConfiguration();
  }, [tempMenuSelections, menuBeingConfigured, addMenu, handleCancelMenuConfiguration]);

  // Notifier le parent quand on entre/sort du mode configuration
  useEffect(() => {
    if (isConfiguringMenu && menuBeingConfigured) {
      onConfigurationModeChange?.(true);
      const isValid = validateMenuSelections(menuBeingConfigured, tempMenuSelections);
      onConfigurationActionsChange?.({
        onCancel: handleCancelMenuConfiguration,
        onConfirm: handleConfirmMenuConfiguration,
        isValid
      });
    } else {
      onConfigurationModeChange?.(false);
      onConfigurationActionsChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfiguringMenu, menuBeingConfigured, tempMenuSelections, validateMenuSelections]);

  const startMenuConfiguration = useCallback((menu: any) => {
    // Vérifier si le menu peut être auto-configuré
    if (isMenuAutoConfigurable(menu)) {
      // Auto-configuration : ajouter directement le menu
      const autoSelectedItems = getAutoMenuConfiguration(menu);
      if (Object.keys(autoSelectedItems).length > 0) {
        addMenu(menu, autoSelectedItems);
        return; // Pas besoin d'ouvrir la configuration
      }
    }

    // Configuration manuelle : ouvrir l'interface de configuration
    setMenuBeingConfigured(menu);
    setTempMenuSelections({});
    tempMenuSelectionsRef.current = {};
    setIsConfiguringMenu(true);
    onConfigurationModeChange?.(true);
    // Les actions seront créées automatiquement par le useEffect
  }, [isMenuAutoConfigurable, getAutoMenuConfiguration, addMenu, onConfigurationModeChange]);

  const removeMenu = useCallback((menuId: string) => {
    // Trouver la dernière ligne avec ce menu
    const lineIndex = draftLines.findLastIndex(
      line => line.type === OrderLineType.MENU && line.menu?.id === menuId
    );

    if (lineIndex >= 0) {
      const newLines = draftLines.filter((_, index) => index !== lineIndex);
      emitChanges(newLines);
    }
  }, [draftLines, emitChanges]);

  const updateMenuQuantity = useCallback((menuId: string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      removeMenu(menuId);
    }
    // Pour 'add', on passe par la configuration
  }, [removeMenu]);

  // Calculer les quantités de menus
  const getTotalMenuQuantity = useCallback((menuId: string) => {
    return draftLines.filter(
      line => line.type === OrderLineType.MENU && line.menu?.id === menuId
    ).length;
  }, [draftLines]);

  const getDraftMenuQuantity = useCallback((menuId: string) => {
    const currentCount = getTotalMenuQuantity(menuId);
    const initialCount = lines.filter(
      line => line.type === OrderLineType.MENU && line.menu?.id === menuId
    ).length;
    return Math.max(0, currentCount - initialCount);
  }, [getTotalMenuQuantity, lines]);


  const getTotalItemsCount = () => {
    return draftLines.filter(line => line.type === OrderLineType.ITEM).length;
  };

  const getTotalMenusCount = () => {
    return draftLines.filter(line => line.type === OrderLineType.MENU).length;
  };

  const getTotalPrice = () => {
    const total = draftLines.reduce((sum, line) => {
      const linePrice = Number(line.totalPrice) || 0;
      return sum + linePrice;
    }, 0);
    return Number(total) || 0; // S'assurer que c'est toujours un nombre
  };

  const getMenuCategoryItems = useCallback((categoryId: string) => {
    const category = menuBeingConfigured?.categories?.find((cat: any) => cat.id === categoryId);

    // Les items sont directement dans category.items
    if (category && category.items) {
      // Enrichir les items avec les données complètes si nécessaire
      return category.items.map((menuCategoryItem: any) => {
        // Si l'item n'a pas de propriété 'item' mais a un 'itemId', on essaie de le récupérer
        if (!menuCategoryItem.item && menuCategoryItem.itemId) {
          const fullItem = items.find(i => i.id === menuCategoryItem.itemId);
          return {
            ...menuCategoryItem,
            item: fullItem
          };
        }
        return menuCategoryItem;
      });
    }

    return [];
  }, [menuBeingConfigured, items]);


  return (
    <View style={styles.container}>
      {isConfiguringMenu && menuBeingConfigured ? (
        <MenuConfiguration
          menu={menuBeingConfigured}
          tempMenuSelections={tempMenuSelections}
          onUpdateTempMenuSelection={(categoryId, itemId, isSelected) => {
            const newSelections = { ...tempMenuSelections };
            if (isSelected) {
              newSelections[categoryId] = [itemId];
            } else {
              delete newSelections[categoryId];
            }
            setTempMenuSelections(newSelections);
          }}
          getMenuCategoryItems={getMenuCategoryItems}
          itemTypes={itemTypes}
        />
      ) : (
        <View style={styles.mainContent}>
          <OrderLinesNavigation
            activeMainTab={activeMainTab}
            onMainTabChange={setActiveMainTab}
            activeItemType={activeItemType}
            onItemTypeChange={setActiveItemType}
            itemTypes={allItemTypes}
            getTotalItemsCount={getTotalItemsCount}
            getTotalMenusCount={getTotalMenusCount}
          />

          {activeMainTab === 'ITEMS' && (
            <OrderItemsList
              items={activeItems}
              activeItemType={activeItemType}
              getTotalItemQuantity={getTotalItemQuantity}
              getDraftItemQuantity={getDraftItemQuantity}
              updateItemQuantity={updateItemQuantity}
            />
          )}

          {activeMainTab === 'MENUS' && (
            <OrderMenusList
              activeMenus={activeMenus}
              getTotalMenuQuantity={getTotalMenuQuantity}
              getDraftMenuQuantity={getDraftMenuQuantity}
              updateMenuQuantity={updateMenuQuantity}
              handleMenuAdd={startMenuConfiguration}
            />
          )}

          {/* <OrderLinesFooter
            totalPrice={getTotalPrice()}
            getTotalItemsCount={getTotalItemsCount}
            getTotalMenusCount={getTotalMenusCount}
          /> */}
        </View>
      )}
    </View>
  );
};

// Export des types et composants
export type { OrderLinesFormProps };
export { OrderLinesNavigation, OrderItemsList, OrderMenusList, MenuConfiguration, OrderLinesFooter, OrderLinesHeader, OrderLinesButton };


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});