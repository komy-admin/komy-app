import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOrderLinesForm } from '~/hooks/order/useOrderLinesForm';
import { OrderLinesNavigation } from '~/components/order/OrderLinesForm/OrderLinesNavigation';
import { OrderItemsCardView } from '~/components/order/OrderLinesForm/OrderItemsCardView';
import { OrderItemsTableView } from '~/components/order/OrderLinesForm/OrderItemsTableView';
import { MenuConfiguration } from '~/components/order/OrderLinesForm/MenuConfiguration';
import { OrderLinesFormProps, MenuSelections } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { OrderLine, OrderLineType, SelectedTag } from '~/types/order-line.types';
import { ItemCustomizationPanelContent } from '~/components/order/OrderLinesForm/ItemCustomizationPanelContent';
import { DraftReviewPanelContent } from '~/components/order/OrderLinesForm/DraftReviewPanelContent';
import { SidePanel } from '~/components/SidePanel';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { usePanelPortal } from '~/hooks/usePanelPortal';
import { SlidePanel } from '~/components/ui/SlidePanel';
import { MenuCategory, MenuCategoryItem, MenuItemWithCustomization } from '~/types/menu-configuration.types';

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
  title,
  lines,
  items,
  itemTypes,
  onAddItem,
  onUpdateItem,
  onAddMenu,
  onUpdateMenu,
  onDeleteLine,
  onSave,
  onCancel,
  hasChanges,
  isProcessing,
  onConfigurationModeChange,
}) => {
  // ====================================================================
  // ÉTAT UI UNIQUEMENT (pas de données métier)
  // ====================================================================

  // Panel Portal
  const { renderPanel, clearPanel } = usePanelPortal();

  // Ref to cancel pending delete from outside the side panel
  const cancelDeleteRef = useRef<(() => void) | null>(null);

  // Navigation
  const {
    activeMainTab,
    setActiveMainTab,
    activeItemType,
    setActiveItemType,
    activeMenus,
    activeItems,
    itemsByType,
    allItemTypes,
  } = useOrderLinesForm({ items, itemTypes });

  // View mode (card ou list)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const handleViewModeChange = useCallback((mode: 'card' | 'list') => {
    setViewMode(mode);
    setActiveMainTab('MENUS');
    if (allItemTypes.length > 0) {
      setActiveItemType(allItemTypes[0].id);
    }
  }, [setActiveMainTab, setActiveItemType, allItemTypes]);

  // Configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<Menu | null>(null);
  const [tempMenuSelections, setTempMenuSelections] = useState<MenuSelections>({});
  const [editingMenuLineId, setEditingMenuLineId] = useState<string | null>(null);

  // Fermer la configuration menu si la ligne éditée a été supprimée
  if (editingMenuLineId && isConfiguringMenu && !lines.some(l => l.id === editingMenuLineId)) {
    setIsConfiguringMenu(false);
    setMenuBeingConfigured(null);
    setTempMenuSelections({});
    setEditingMenuLineId(null);
    onConfigurationModeChange?.(false);
  }

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


  // ====================================================================
  // HANDLERS - ITEMS
  // ====================================================================

  /**
   * Ouvrir le panel de customisation pour ajouter un item
   */
  const handleOpenCustomization = useCallback(
    (item: Item) => {
      // Annuler toute suppression en cours
      cancelDeleteRef.current?.();

      // Récupérer l'item complet depuis la liste
      const fullItem = items.find((i) => i.id === item.id) || item;

      // Si pas de notes et pas de tags, ajouter directement sans panel
      const hasTags = fullItem.tags && fullItem.tags.length > 0;
      if (!fullItem.hasNote && !hasTags) {
        onAddItem(fullItem, { tags: [] });
        return;
      }

      setItemToCustomize({ item: fullItem });
      setCustomizationPanelVisible(true);
    },
    [items, onAddItem]
  );

  /**
   * Ouvrir le panel de customisation pour éditer un item existant
   */
  const handleEditItem = useCallback(
    (line: OrderLine) => {
      if (line.type !== OrderLineType.ITEM || !line.item) return;

      // Récupérer l'item complet (préférer l'item actuel du catalogue au snapshot)
      const fullItem = items.find((i) => i.id === line.item!.id) as Item | undefined;
      if (!fullItem) return;

      // Si pas de notes et pas de tags, rien à éditer
      const hasTags = fullItem.tags && fullItem.tags.length > 0;
      if (!fullItem.hasNote && !hasTags) return;

      setItemToCustomize({
        item: fullItem,
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
      // Auto-add : si toutes les catégories sont obligatoires, chacune a 1 seul item disponible,
      // et aucun item n'a de tags ni de note → ajouter directement sans configuration
      const categories = menu.categories || [];
      if (categories.length > 0) {
        const canAutoAdd = categories.every((cat: MenuCategory) => {
          if (!cat.isRequired) return false;
          const availableItems = (cat.items || []).filter((mci: MenuCategoryItem) => {
            if (mci.isAvailable === false) return false;
            const fullItem = mci.item || items.find((i) => i.id === mci.itemId);
            return !!fullItem;
          });
          if (availableItems.length !== 1) return false;
          const fullItem = availableItems[0].item || items.find((i) => i.id === availableItems[0].itemId);
          if (!fullItem) return false;
          const hasTags = fullItem.tags && fullItem.tags.length > 0;
          return !fullItem.hasNote && !hasTags;
        });

        if (canAutoAdd) {
          const selections: MenuSelections = {};
          categories.forEach((cat: MenuCategory) => {
            const availableItems = (cat.items || []).filter((mci: MenuCategoryItem) => {
              if (mci.isAvailable === false) return false;
              return !!(mci.item || items.find((i) => i.id === mci.itemId));
            });
            const fullItem = availableItems[0].item || items.find((i) => i.id === availableItems[0].itemId);
            selections[cat.id] = [{ itemId: fullItem!.id, tags: [], note: undefined }];
          });
          onAddMenu(menu, selections, itemTypes);
          return;
        }
      }

      setMenuBeingConfigured(menu);
      setTempMenuSelections({});
      setEditingMenuLineId(null);
      setIsConfiguringMenu(true);
      onConfigurationModeChange?.(true);
    },
    [onConfigurationModeChange, items, itemTypes, onAddMenu]
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

      // Reconstruire tempMenuSelections depuis menuLine.items (groupé par catégorie)
      const selections: MenuSelections = {};
      menuLine.items.forEach((menuItem) => {
        // Type guard : menuItem devrait avoir item et categoryName
        if (!menuItem.item || !menuItem.categoryName) return;

        const category = fullMenu.categories?.find((cat: MenuCategory) => {
          const categoryName = itemTypes.find((t) => t.id === cat.itemTypeId)?.name;
          return categoryName === menuItem.categoryName;
        });

        if (category && 'id' in category) {
          // Cast pour accéder aux propriétés tags et note qui peuvent exister sur menuItem
          const itemWithCustomization = menuItem as unknown as MenuItemWithCustomization;
          if (!selections[category.id]) {
            selections[category.id] = [];
          }
          selections[category.id].push({
            itemId: menuItem.item.id,
            tags: itemWithCustomization.tags || [],
            note: itemWithCustomization.note,
          });
        }
      });

      // Ouvrir la configuration en mode édition
      setEditingMenuLineId(menuLine.id);
      setMenuBeingConfigured(fullMenu);
      setTempMenuSelections(selections);
      setIsConfiguringMenu(true);
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

      // Vérifier maxSelections pour cette catégorie
      const category = menuBeingConfigured?.categories?.find((c: any) => c.id === categoryId);
      const maxSelections = category?.maxSelections || 1;
      const currentSelections = tempMenuSelections[categoryId] || [];

      // Si déjà au max et max > 1, ne rien faire
      // Si max = 1, remplacer la sélection (comportement radio)
      if (currentSelections.length >= maxSelections && maxSelections > 1) return;

      // Si pas de notes et pas de tags, sélectionner directement sans panel
      const hasTags = fullItem.tags && fullItem.tags.length > 0;
      if (!fullItem.hasNote && !hasTags) {
        setTempMenuSelections((prev) => ({
          ...prev,
          [categoryId]: maxSelections === 1
            ? [{ itemId: fullItem.id, tags: [], note: undefined }]
            : [...(prev[categoryId] || []), { itemId: fullItem.id, tags: [], note: undefined }],
        }));
        return;
      }

      setMenuItemToCustomize({ item: fullItem, categoryId });
      setMenuItemPanelVisible(true);
    },
    [items, menuBeingConfigured, tempMenuSelections]
  );

  /**
   * Confirmer la sélection d'un item de menu
   */
  const handleConfirmMenuItemCustomization = useCallback(
    (customization: { tags: SelectedTag[]; note?: string }) => {
      if (!menuItemToCustomize) return;

      const { item, categoryId } = menuItemToCustomize;

      // Vérifier maxSelections pour comportement radio vs multi
      const category = menuBeingConfigured?.categories?.find((c: any) => c.id === categoryId);
      const maxSelections = category?.maxSelections || 1;

      setTempMenuSelections((prev) => ({
        ...prev,
        [categoryId]: maxSelections === 1
          ? [{ itemId: item.id, tags: customization.tags, note: customization.note }]
          : [...(prev[categoryId] || []), { itemId: item.id, tags: customization.tags, note: customization.note }],
      }));

      setMenuItemPanelVisible(false);
      setMenuItemToCustomize(null);
    },
    [menuItemToCustomize, menuBeingConfigured]
  );

  const handleCancelMenuItemCustomization = useCallback(() => {
    setMenuItemPanelVisible(false);
    setMenuItemToCustomize(null);
  }, []);

  /**
   * Désélectionner un item de menu
   */
  const handleDeselectMenuItem = useCallback((categoryId: string, itemId: string) => {
    setTempMenuSelections((prev) => {
      const currentSelections = prev[categoryId] || [];
      const filtered = currentSelections.filter(s => s.itemId !== itemId);
      if (filtered.length === 0) {
        const newSelections = { ...prev };
        delete newSelections[categoryId];
        return newSelections;
      }
      return { ...prev, [categoryId]: filtered };
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
  }, [onConfigurationModeChange]);

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

    // Toutes les catégories obligatoires doivent avoir au moins 1 sélection
    const requiredSatisfied = menuBeingConfigured.categories.every((category: MenuCategory) => {
      if (!category.isRequired) return true;
      const selections = tempMenuSelections[category.id];
      return selections && selections.length >= 1;
    });

    // Au moins 1 article sélectionné au total (évite un menu vide si tout est optionnel)
    const totalSelections = Object.values(tempMenuSelections).reduce(
      (sum, selections) => sum + (selections?.length || 0), 0
    );

    return requiredSatisfied && totalSelections >= 1;
  }, [menuBeingConfigured, tempMenuSelections]);

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
   * Gestion unifiée des panels avec priorités :
   * 1. Panel customisation d'item normal
   * 2. Panel customisation d'item de menu
   *
   * Note: Le récapitulatif de commande est maintenant un side panel permanent (pas dans le portal)
   */
  useEffect(() => {
    if (customizationPanelVisible && itemToCustomize) {
      // Priorité 1 : Customisation d'item normal
      renderPanel(
        <SlidePanel visible={true} onClose={handleCancelCustomization} width="35%" minWidth={350} maxWidth={600}>
          <ItemCustomizationPanelContent
            item={itemToCustomize.item}
            availableTags={itemToCustomize.item.tags || []}
            initialData={itemToCustomize.initialData}
            onConfirm={handleConfirmCustomization}
            onCancel={handleCancelCustomization}
          />
        </SlidePanel>
      );
    } else if (menuItemPanelVisible && menuItemToCustomize) {
      // Priorité 2 : Customisation d'item de menu
      renderPanel(
        <SlidePanel visible={true} onClose={handleCancelMenuItemCustomization} width="35%" minWidth={350} maxWidth={600}>
          <ItemCustomizationPanelContent
            item={menuItemToCustomize.item}
            availableTags={menuItemToCustomize.item.tags || []}
            initialData={undefined}
            onConfirm={handleConfirmMenuItemCustomization}
            onCancel={handleCancelMenuItemCustomization}
          />
        </SlidePanel>
      );
    } else {
      // Aucun panel actif : nettoyer
      clearPanel();
    }
  }, [
    customizationPanelVisible,
    itemToCustomize,
    menuItemPanelVisible,
    menuItemToCustomize,
    handleCancelCustomization,
    handleConfirmCustomization,
    handleCancelMenuItemCustomization,
    handleConfirmMenuItemCustomization,
    renderPanel,
    clearPanel,
  ]);

  // ====================================================================
  // HELPERS
  // ====================================================================

  const getMenuCategoryItems = useCallback(
    (categoryId: string) => {
      const category = menuBeingConfigured?.categories?.find((cat: MenuCategory) => cat.id === categoryId);
      if (category && category.items) {
        return category.items.map((menuCategoryItem: MenuCategoryItem) => {
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
      <View style={styles.mainContentRow}>
        {/* Side panel gauche : récapitulatif de commande */}
        <SidePanel
          title=""
          hideCloseButton={true}
          hideHeader={true}
          width={400}
        >
          <View style={styles.sidePanelContent}>
            <DraftReviewPanelContent
              title={title}
              draftLines={lines}
              onEdit={handleDraftEdit}
              onEditMenu={handleDraftEditMenu}
              onDelete={handleDraftDelete}
              onSave={onSave}
              onCancel={onCancel}
              hasChanges={hasChanges}
              isProcessing={isProcessing}
              cancelDeleteRef={cancelDeleteRef}
              hideFooter={isConfiguringMenu}
              itemTypes={itemTypes}
            />
          </View>
        </SidePanel>

        {/* Contenu principal droite : config menu OU items/menus + navigation */}
        <View style={styles.mainContent}>
          {isConfiguringMenu && menuBeingConfigured ? (
            <MenuConfiguration
              menu={menuBeingConfigured}
              tempMenuSelections={tempMenuSelections}
              onSelectMenuItem={handleOpenMenuItemCustomization}
              onDeselectMenuItem={handleDeselectMenuItem}
              getMenuCategoryItems={getMenuCategoryItems}
              itemTypes={itemTypes}
              onCancel={handleCancelMenuConfiguration}
              onConfirm={handleConfirmMenuConfiguration}
              isValid={isMenuConfigurationValid}
            />
          ) : (
            <View style={styles.contentWithNav}>
              {/* Zone de contenu (menus + articles dans un seul scroll) */}
              <View style={styles.contentArea}>
                {viewMode === 'card' && (
                  <OrderItemsCardView
                    items={activeItems}
                    itemsByType={itemsByType}
                    activeItemType={activeItemType}
                    onActiveItemTypeChange={setActiveItemType}
                    onOpenCustomization={handleOpenCustomization}
                    activeMenus={activeMenus}
                    handleMenuAdd={startMenuConfiguration}
                    activeMainTab={activeMainTab}
                    onMainTabChange={setActiveMainTab}
                  />
                )}

                {viewMode === 'list' && (
                  <OrderItemsTableView
                    items={activeItems}
                    itemsByType={itemsByType}
                    activeItemType={activeItemType}
                    onActiveItemTypeChange={setActiveItemType}
                    onOpenCustomization={handleOpenCustomization}
                    activeMenus={activeMenus}
                    handleMenuAdd={startMenuConfiguration}
                    activeMainTab={activeMainTab}
                    onMainTabChange={setActiveMainTab}
                  />
                )}
              </View>

              {/* Navigation verticale à droite */}
              <OrderLinesNavigation
                activeMainTab={activeMainTab}
                onMainTabChange={setActiveMainTab}
                activeItemType={activeItemType}
                onItemTypeChange={setActiveItemType}
                itemTypes={allItemTypes}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainContentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  sidePanelContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentWithNav: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  contentArea: {
    flex: 1,
  },
});

// Ré-exporter les composants utilisés par les parents
export { OrderLinesHeader } from './OrderLinesHeader';
export { OrderLinesButton } from './OrderLinesButton';
export { OrderLinesNavigation } from './OrderLinesNavigation';
export { OrderLinesFooter } from './OrderLinesFooter';
