import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOrderLinesForm } from '~/hooks/order/useOrderLinesForm';
import { OrderLinesNavigation } from '~/components/order/OrderLinesForm/OrderLinesNavigation';
import { OrderItemsList } from '~/components/order/OrderLinesForm/OrderItemsList';
import { OrderMenusList } from '~/components/order/OrderLinesForm/OrderMenusList';
import { MenuConfiguration } from '~/components/order/OrderLinesForm/MenuConfiguration';
import { OrderLinesFormProps, MenuSelections } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { OrderLine, OrderLineType, SelectedTag } from '~/types/order-line.types';
import { ItemCustomizationPanelContent } from '~/components/order/OrderLinesForm/ItemCustomizationPanelContent';
import { DraftFloatingButton } from '~/components/order/OrderLinesForm/DraftFloatingButton';
import { DraftReviewPanelContent } from '~/components/order/OrderLinesForm/DraftReviewPanelContent';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { SlidePanel } from '~/components/ui/SlidePanel';

/**
 * OrderLinesForm - Version refactorisée (composant présentationnel)
 *
 * Principe :
 * - NE GÈRE PLUS l'état des lignes (délégué au parent via useOrderLinesManager)
 * - Émet des événements pour chaque action (onAddItem, onUpdateItem, etc.)
 * - Gère uniquement l'état UI (modales, navigation)
 *
 * Changements majeurs :
 * - Suppression de draftLines (plus d'état local)
 * - Suppression de emitChanges (remplacé par callbacks directs)
 * - Fix : utilisation de line.id au lieu d'index
 * - Fix : édition de menu sans suppression/recréation
 */
export const OrderLinesForm: React.FC<OrderLinesFormProps> = ({
  lines,
  items,
  itemTypes,
  onAddItem,
  onUpdateItem,
  onAddMenu,
  onUpdateMenu,
  onDeleteLine,
  onConfigurationModeChange,
  onConfigurationActionsChange,
}) => {
  // ====================================================================
  // ÉTAT UI UNIQUEMENT (pas de données métier)
  // ====================================================================

  // Panel Portal
  const { renderPanel, clearPanel } = usePanelPortal();

  // Navigation
  const {
    activeMainTab,
    setActiveMainTab,
    activeItemType,
    setActiveItemType,
    activeMenus,
    activeItems,
    allItemTypes,
  } = useOrderLinesForm({ items, itemTypes });

  // Configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<Menu | null>(null);
  const [tempMenuSelections, setTempMenuSelections] = useState<MenuSelections>({});
  const [editingMenuLineId, setEditingMenuLineId] = useState<string | null>(null);

  // Customisation d'item (via SlidePanel)
  const [customizationPanelVisible, setCustomizationPanelVisible] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<{
    item: Item;
    lineId?: string; // Si édition
    initialData?: { tags: SelectedTag[]; note?: string };
  } | null>(null);

  // Customisation d'item de menu (via SlidePanel)
  const [menuItemPanelVisible, setMenuItemPanelVisible] = useState(false);
  const [menuItemToCustomize, setMenuItemToCustomize] = useState<{
    item: Item;
    categoryId: string;
  } | null>(null);

  // Revue de la commande (via SlidePanel)
  const [draftReviewPanelVisible, setDraftReviewPanelVisible] = useState(false);

  // ====================================================================
  // HANDLERS - ITEMS
  // ====================================================================

  /**
   * Ouvrir le panel de customisation pour ajouter un item
   */
  const handleOpenCustomization = useCallback(
    (item: Item) => {
      // Récupérer l'item complet depuis la liste
      const fullItem = items.find((i) => i.id === item.id) || item;
      setItemToCustomize({ item: fullItem });
      setCustomizationPanelVisible(true);
    },
    [items]
  );

  /**
   * Ouvrir le panel de customisation pour éditer un item existant
   */
  const handleEditItem = useCallback(
    (line: OrderLine) => {
      if (line.type !== OrderLineType.ITEM || !line.item) return;

      // Récupérer l'item complet
      const fullItem = items.find((i) => i.id === line.item!.id) || line.item;

      setItemToCustomize({
        item: fullItem as Item,
        lineId: line.id,
        initialData: {
          tags: line.tags || [],
          note: line.note,
        },
      });
      setCustomizationPanelVisible(true);
    },
    [items]
  );

  /**
   * Confirmer la customisation d'un item
   */
  const handleConfirmCustomization = useCallback(
    (customization: { tags: SelectedTag[]; note?: string }) => {
      if (!itemToCustomize) return;

      if (itemToCustomize.lineId) {
        // Édition : déléguer au parent
        onUpdateItem(itemToCustomize.lineId, customization);
      } else {
        // Création : déléguer au parent
        onAddItem(itemToCustomize.item, customization);
      }

      setCustomizationPanelVisible(false);
      setItemToCustomize(null);
    },
    [itemToCustomize, onAddItem, onUpdateItem]
  );

  const handleCancelCustomization = useCallback(() => {
    setCustomizationPanelVisible(false);
    setItemToCustomize(null);
  }, []);

  // ====================================================================
  // HANDLERS - MENUS
  // ====================================================================

  /**
   * Démarrer la configuration d'un menu (ajout)
   */
  const startMenuConfiguration = useCallback(
    (menu: Menu) => {
      // ❌ DÉSACTIVÉ - Auto-configuration des menus
      // Vérifier si le menu peut être auto-configuré
      // const isAutoConfigurable =
      //   menu.categories?.every(
      //     (cat) => cat.isRequired && cat.items && cat.items.length === 1
      //   ) || false;

      // if (isAutoConfigurable) {
      //   // Auto-configuration : ajouter directement
      //   const autoSelections: MenuSelections = {};
      //   menu.categories?.forEach((cat) => {
      //     if (cat.items && cat.items.length === 1) {
      //       autoSelections[cat.id] = {
      //         itemId: cat.items[0].item!.id,
      //         tags: [],
      //       };
      //     }
      //   });
      //   onAddMenu(menu, autoSelections, itemTypes);
      //   return;
      // }

      // Configuration manuelle - toujours ouvrir la configuration
      setMenuBeingConfigured(menu);
      setTempMenuSelections({});
      setEditingMenuLineId(null);
      setIsConfiguringMenu(true);
      onConfigurationModeChange?.(true);
    },
    [onConfigurationModeChange]
  );

  /**
   * Éditer un menu existant
   */
  const handleEditMenu = useCallback(
    (menuLine: OrderLine) => {
      if (!menuLine.menu || !menuLine.items) return;

      // Retrouver le menu complet
      const fullMenu = activeMenus.find((m) => m.id === menuLine.menu?.id);
      if (!fullMenu) return;

      // Reconstruire tempMenuSelections depuis menuLine.items
      const selections: MenuSelections = {};
      menuLine.items.forEach((menuItem) => {
        // Type guard : menuItem devrait avoir item et categoryName
        if (!menuItem.item || !menuItem.categoryName) return;

        const category = fullMenu.categories?.find((cat: { itemTypeId?: string }) => {
          const categoryName = itemTypes.find((t) => t.id === cat.itemTypeId)?.name;
          return categoryName === menuItem.categoryName;
        });

        if (category && 'id' in category) {
          selections[category.id] = {
            itemId: menuItem.item.id,
            // @ts-ignore - menuItem peut avoir tags et note selon le contexte
            tags: menuItem.tags || [],
            // @ts-ignore
            note: menuItem.note,
          };
        }
      });

      // Ouvrir la configuration en mode édition
      setEditingMenuLineId(menuLine.id);
      setMenuBeingConfigured(fullMenu);
      setTempMenuSelections(selections);
      setIsConfiguringMenu(true);
      setDraftReviewPanelVisible(false);
      onConfigurationModeChange?.(true);
    },
    [activeMenus, itemTypes, onConfigurationModeChange]
  );

  /**
   * Sélectionner un item de menu (avec customisation)
   */
  const handleOpenMenuItemCustomization = useCallback(
    (item: Item, categoryId: string) => {
      const fullItem = items.find((i) => i.id === item.id) || item;
      setMenuItemToCustomize({ item: fullItem, categoryId });
      setMenuItemPanelVisible(true);
    },
    [items]
  );

  /**
   * Confirmer la sélection d'un item de menu
   */
  const handleConfirmMenuItemCustomization = useCallback(
    (customization: { tags: SelectedTag[]; note?: string }) => {
      if (!menuItemToCustomize) return;

      const { item, categoryId } = menuItemToCustomize;

      // Ajouter/remplacer la sélection pour cette catégorie
      setTempMenuSelections((prev) => ({
        ...prev,
        [categoryId]: {
          itemId: item.id,
          tags: customization.tags,
          note: customization.note,
        },
      }));

      setMenuItemPanelVisible(false);
      setMenuItemToCustomize(null);
    },
    [menuItemToCustomize]
  );

  const handleCancelMenuItemCustomization = useCallback(() => {
    setMenuItemPanelVisible(false);
    setMenuItemToCustomize(null);
  }, []);

  /**
   * Désélectionner un item de menu
   */
  const handleDeselectMenuItem = useCallback((categoryId: string) => {
    setTempMenuSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[categoryId];
      return newSelections;
    });
  }, []);

  /**
   * Annuler la configuration de menu
   */
  const handleCancelMenuConfiguration = useCallback(() => {
    setIsConfiguringMenu(false);
    setMenuBeingConfigured(null);
    setTempMenuSelections({});
    setEditingMenuLineId(null);
    onConfigurationModeChange?.(false);
    onConfigurationActionsChange?.(null);
  }, [onConfigurationModeChange, onConfigurationActionsChange]);

  /**
   * Confirmer la configuration de menu
   */
  const handleConfirmMenuConfiguration = useCallback(() => {
    if (!menuBeingConfigured) return;

    if (editingMenuLineId) {
      // Mode édition
      onUpdateMenu(editingMenuLineId, menuBeingConfigured, tempMenuSelections, itemTypes);
    } else {
      // Mode création
      onAddMenu(menuBeingConfigured, tempMenuSelections, itemTypes);
    }

    handleCancelMenuConfiguration();
  }, [
    menuBeingConfigured,
    tempMenuSelections,
    editingMenuLineId,
    itemTypes,
    onAddMenu,
    onUpdateMenu,
    handleCancelMenuConfiguration,
  ]);

  /**
   * Validation : vérifier si toutes les catégories obligatoires sont sélectionnées
   */
  const isMenuConfigurationValid = useMemo(() => {
    if (!menuBeingConfigured?.categories) return false;

    return menuBeingConfigured.categories.every((category: any) => {
      if (!category.isRequired) return true;
      return tempMenuSelections[category.id] !== undefined;
    });
  }, [menuBeingConfigured, tempMenuSelections]);

  /**
   * Notifier le parent des actions de configuration
   */
  useEffect(() => {
    if (isConfiguringMenu && menuBeingConfigured) {
      onConfigurationActionsChange?.({
        onCancel: handleCancelMenuConfiguration,
        onConfirm: handleConfirmMenuConfiguration,
        isValid: isMenuConfigurationValid,
      });
    } else {
      onConfigurationActionsChange?.(null);
    }
  }, [
    isConfiguringMenu,
    menuBeingConfigured,
    isMenuConfigurationValid,
    handleCancelMenuConfiguration,
    handleConfirmMenuConfiguration,
    onConfigurationActionsChange,
  ]);

  // ====================================================================
  // HANDLERS - COMMANDE
  // ====================================================================

  const handleClearAllDraft = useCallback(() => {
    // Note : pour vider la commande, le parent doit appeler clearAllLines()
    // On ne gère pas l'état ici
    setDraftReviewPanelVisible(false);
  }, []);

  const handleCloseDraftReview = useCallback(() => {
    setDraftReviewPanelVisible(false);
  }, []);

  const handleOpenDraftReview = useCallback(() => {
    setDraftReviewPanelVisible(true);
  }, []);

  // ====================================================================
  // HANDLERS POUR DRAFTREVIEWPANEL (mémoïsés pour éviter re-renders)
  // ====================================================================

  const handleDraftEdit = useCallback(
    (index: number) => {
      const line = lines[index];
      if (line) {
        handleEditItem(line);
      }
    },
    [lines, handleEditItem]
  );

  const handleDraftEditMenu = useCallback(
    (menuLine: OrderLine) => {
      handleEditMenu(menuLine);
    },
    [handleEditMenu]
  );

  const handleDraftDelete = useCallback(
    (index: number) => {
      const line = lines[index];
      if (line) {
        onDeleteLine(line.id);
      }
    },
    [lines, onDeleteLine]
  );

  // ====================================================================
  // SYNCHRONISATION DES PANELS AVEC LE PORTAL
  // ====================================================================

  /**
   * Panel customisation d'item normal (Priorité 1)
   */
  useEffect(() => {
    if (customizationPanelVisible && itemToCustomize) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCancelCustomization} width={550}>
          <ItemCustomizationPanelContent
            item={itemToCustomize.item}
            availableTags={itemToCustomize.item.tags || []}
            initialData={itemToCustomize.initialData}
            onConfirm={handleConfirmCustomization}
            onCancel={handleCancelCustomization}
          />
        </SlidePanel>
      );
    } else if (!menuItemPanelVisible && !draftReviewPanelVisible) {
      clearPanel();
    }
  }, [
    customizationPanelVisible,
    itemToCustomize,
    menuItemPanelVisible,
    draftReviewPanelVisible,
    renderPanel,
    clearPanel,
    handleCancelCustomization,
    handleConfirmCustomization,
  ]);

  /**
   * Panel customisation d'item de menu (Priorité 2)
   */
  useEffect(() => {
    if (!customizationPanelVisible && menuItemPanelVisible && menuItemToCustomize) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCancelMenuItemCustomization} width={550}>
          <ItemCustomizationPanelContent
            item={menuItemToCustomize.item}
            availableTags={menuItemToCustomize.item.tags || []}
            initialData={undefined}
            onConfirm={handleConfirmMenuItemCustomization}
            onCancel={handleCancelMenuItemCustomization}
          />
        </SlidePanel>
      );
    } else if (!customizationPanelVisible && !draftReviewPanelVisible) {
      clearPanel();
    }
  }, [
    customizationPanelVisible,
    menuItemPanelVisible,
    menuItemToCustomize,
    draftReviewPanelVisible,
    renderPanel,
    clearPanel,
    handleCancelMenuItemCustomization,
    handleConfirmMenuItemCustomization,
  ]);

  /**
   * Panel de revue de la commande (Priorité 3)
   */
  useEffect(() => {
    if (!customizationPanelVisible && !menuItemPanelVisible && draftReviewPanelVisible) {
      renderPanel(
        <SlidePanel visible={true} onClose={handleCloseDraftReview} width={550}>
          <DraftReviewPanelContent
            draftLines={lines}
            onEdit={handleDraftEdit}
            onEditMenu={handleDraftEditMenu}
            onDelete={handleDraftDelete}
            onClose={handleCloseDraftReview}
            onClearAll={handleClearAllDraft}
          />
        </SlidePanel>
      );
    } else if (!customizationPanelVisible && !menuItemPanelVisible) {
      clearPanel();
    }
  }, [
    customizationPanelVisible,
    menuItemPanelVisible,
    draftReviewPanelVisible,
    lines,
    renderPanel,
    clearPanel,
    handleCloseDraftReview,
    handleClearAllDraft,
    handleDraftEdit,
    handleDraftEditMenu,
    handleDraftDelete,
  ]);

  // ====================================================================
  // HELPERS
  // ====================================================================

  const getMenuCategoryItems = useCallback(
    (categoryId: string) => {
      const category = menuBeingConfigured?.categories?.find((cat: any) => cat.id === categoryId);
      if (category && category.items) {
        return category.items.map((menuCategoryItem: any) => {
          if (!menuCategoryItem.item && menuCategoryItem.itemId) {
            const fullItem = items.find((i) => i.id === menuCategoryItem.itemId);
            return { ...menuCategoryItem, item: fullItem };
          }
          return menuCategoryItem;
        });
      }
      return [];
    },
    [menuBeingConfigured, items]
  );

  // ====================================================================
  // RENDER
  // ====================================================================

  return (
    <View style={styles.container}>
      {isConfiguringMenu && menuBeingConfigured ? (
        <MenuConfiguration
          menu={menuBeingConfigured}
          tempMenuSelections={tempMenuSelections}
          onSelectMenuItem={handleOpenMenuItemCustomization}
          onDeselectMenuItem={handleDeselectMenuItem}
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
            getTotalItemsCount={() => lines.filter((l) => l.type === OrderLineType.ITEM).length}
            getTotalMenusCount={() => lines.filter((l) => l.type === OrderLineType.MENU).length}
          />

          {activeMainTab === 'ITEMS' && (
            <OrderItemsList
              items={activeItems}
              activeItemType={activeItemType}
              onOpenCustomization={handleOpenCustomization}
            />
          )}

          {activeMainTab === 'MENUS' && (
            <OrderMenusList
              activeMenus={activeMenus}
              getTotalMenuQuantity={(menuId) =>
                lines.filter((l) => l.type === OrderLineType.MENU && l.menu?.id === menuId).length
              }
              getDraftMenuQuantity={() => 0} // Non utilisé avec nouvelle archi
              updateMenuQuantity={() => {}} // Non utilisé
              handleMenuAdd={startMenuConfiguration}
            />
          )}

          {/* Bouton flottant pour accéder à la commande */}
          <DraftFloatingButton count={lines.length} onPress={handleOpenDraftReview} />
        </View>
      )}

      {/* Panels rendus via Portal - voir useEffect ci-dessus */}
    </View>
  );
};

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

// Ré-exporter les composants utilisés par les parents
export { OrderLinesHeader } from './OrderLinesHeader';
export { OrderLinesButton } from './OrderLinesButton';
export { OrderLinesNavigation } from './OrderLinesNavigation';
export { OrderLinesFooter } from './OrderLinesFooter';
