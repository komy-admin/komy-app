import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useOrderLinesForm } from '~/hooks/order/useOrderLinesForm';
import { useTags } from '~/hooks/useTags';
import { OrderLinesNavigation } from '~/components/order/OrderLinesForm/OrderLinesNavigation';
import { OrderItemsList } from '~/components/order/OrderLinesForm/OrderItemsList';
import { OrderMenusList } from '~/components/order/OrderLinesForm/OrderMenusList';
import { MenuConfiguration } from '~/components/order/OrderLinesForm/MenuConfiguration';
import { OrderLinesFooter } from '~/components/order/OrderLinesForm/OrderLinesFooter';
import { OrderLinesHeader } from '~/components/order/OrderLinesForm/OrderLinesHeader';
import { OrderLinesFormProps } from '~/components/order/OrderLinesForm/OrderLinesForm.types';
import { OrderLine, OrderLineType, SelectedTag } from '~/types/order-line.types';
import { OrderLinesButton } from '~/components/order/OrderLinesForm/OrderLinesButton';
import { ItemCustomizationModal } from '~/components/order/OrderLinesForm/ItemCustomizationModal';
import { DraftFloatingButton } from '~/components/order/OrderLinesForm/DraftFloatingButton';
import { DraftReviewModal } from '~/components/order/OrderLinesForm/DraftReviewModal';
import { Item } from '~/types/item.types';
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

  // Type pour une sélection d'item de menu avec customisation
  type MenuItemSelection = {
    itemId: string;
    tags: SelectedTag[];
    note?: string;
  };

  // Configuration de menu
  const [isConfiguringMenu, setIsConfiguringMenu] = useState(false);
  const [menuBeingConfigured, setMenuBeingConfigured] = useState<any>(null);
  const [tempMenuSelections, setTempMenuSelections] = useState<Record<string, MenuItemSelection[]>>({});
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null); // ID du menu en cours d'édition

  // États pour les modales de customisation d'items
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<Item | null>(null);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);

  // États pour customiser un item de menu
  const [isCustomizingMenuItem, setIsCustomizingMenuItem] = useState(false);
  const [menuItemToCustomize, setMenuItemToCustomize] = useState<{ item: Item; categoryId: string } | null>(null);
  const [isDraftReviewOpen, setIsDraftReviewOpen] = useState(false);

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

  // Fonction pour récupérer les tags disponibles pour un item
  const getItemTags = useCallback((item: Item) => {
    // Retourner uniquement les tags directement liés à l'item
    return item.tags || [];
  }, []);

  // Émettre les changements au parent
  const emitChanges = useCallback((newLines: OrderLine[]) => {
    setDraftLines(newLines);
    onLinesChange(newLines);
  }, [onLinesChange]);


  // Handlers pour la customisation d'items
  const handleOpenCustomization = useCallback((item: Item, draftIndex?: number) => {
    // Essayer de récupérer l'item complet depuis la liste des items disponibles
    // car celui passé en paramètre peut être un snapshot sans les tags
    const fullItem = items.find(i => i.id === item.id);
    setItemToCustomize(fullItem || item);

    // Utiliser directement l'index passé
    setEditingDraftIndex(draftIndex !== undefined ? draftIndex : null);
    setIsCustomizing(true);
  }, [items]);

  const handleConfirmCustomization = useCallback((data: { note?: string; tags: SelectedTag[] }) => {
    if (!itemToCustomize) return;

    // Calculer le prix total avec les modifiers des tags
    const tagsPrice = data.tags.reduce((sum, tag) => sum + (tag.priceModifier || 0), 0);
    const totalPrice = itemToCustomize.price + tagsPrice;

    if (editingDraftIndex !== null) {
      // Mode édition : mettre à jour la ligne existante
      const newLines = [...draftLines];
      const existingLine = newLines[editingDraftIndex];

      if (existingLine && existingLine.type === OrderLineType.ITEM) {
        newLines[editingDraftIndex] = {
          ...existingLine,
          note: data.note,
          tags: data.tags,
          totalPrice: totalPrice,
          unitPrice: totalPrice,
        };
        emitChanges(newLines);
      }
    } else {
      // Mode ajout : créer une nouvelle ligne
      const newLine: Partial<OrderLine> = {
        id: `draft-item-${Date.now()}`,
        type: OrderLineType.ITEM,
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: Status.PENDING,
        note: data.note,
        tags: data.tags,
        item: {
          id: itemToCustomize.id,
          name: itemToCustomize.name,
          price: itemToCustomize.price,
          description: itemToCustomize.description,
          allergens: itemToCustomize.allergens,
          itemType: itemToCustomize.itemType,
          snapshotAt: new Date().toISOString(),
          // Stocker les tags de l'item original pour pouvoir éditer plus tard
          tags: itemToCustomize.tags
        } as any,
        menu: null
      };

      const newLines = [...draftLines, newLine as OrderLine];
      emitChanges(newLines);
    }

    // Fermer la modale
    setIsCustomizing(false);
    setItemToCustomize(null);
    setEditingDraftIndex(null);
  }, [itemToCustomize, editingDraftIndex, draftLines, emitChanges]);

  const handleCancelCustomization = useCallback(() => {
    setIsCustomizing(false);
    setItemToCustomize(null);
    setEditingDraftIndex(null);
  }, []);

  // Handlers pour la customisation d'items de menu
  const handleOpenMenuItemCustomization = useCallback((item: Item, categoryId: string) => {
    // Récupérer l'item complet depuis la liste
    const fullItem = items.find(i => i.id === item.id);
    setMenuItemToCustomize({ item: fullItem || item, categoryId });
    setIsCustomizingMenuItem(true);
  }, [items]);

  const handleConfirmMenuItemCustomization = useCallback((data: { note?: string; tags: SelectedTag[] }) => {
    if (!menuItemToCustomize) return;

    const { item, categoryId } = menuItemToCustomize;

    // Ajouter ou remplacer la sélection pour cette catégorie
    const newSelections = { ...tempMenuSelections };
    newSelections[categoryId] = [{
      itemId: item.id,
      tags: data.tags,
      note: data.note
    }];

    setTempMenuSelections(newSelections);
    setIsCustomizingMenuItem(false);
    setMenuItemToCustomize(null);
  }, [menuItemToCustomize, tempMenuSelections]);

  const handleCancelMenuItemCustomization = useCallback(() => {
    setIsCustomizingMenuItem(false);
    setMenuItemToCustomize(null);
  }, []);

  const handleDeleteDraftLine = useCallback((index: number) => {
    // Utiliser directement l'index sans filtrer
    const lineToDelete = draftLines[index];

    if (lineToDelete) {
      // Filtrer toutes les lignes pour enlever celle à supprimer
      const newLines = draftLines.filter(line => line.id !== lineToDelete.id);
      emitChanges(newLines);
    }
  }, [draftLines, emitChanges]);

  const handleClearAllDraft = useCallback(() => {
    emitChanges([]);
    setIsDraftReviewOpen(false);
  }, [emitChanges]);

  // Handler pour éditer un menu
  const handleEditMenu = useCallback((menuLine: OrderLine, index: number) => {
    if (!menuLine.menu || !menuLine.items) return;

    // Retrouver le menu complet depuis activeMenus
    const fullMenu = activeMenus.find(m => m.id === menuLine.menu?.id);
    if (!fullMenu) return;

    // Utiliser directement l'index
    const lineToEdit = draftLines[index];
    if (!lineToEdit) return;

    // Sauvegarder l'ID original du menu pour le réutiliser après édition
    setEditingMenuId(lineToEdit.id);

    // Supprimer le menu du draft
    const newLines = draftLines.filter(line => line.id !== lineToEdit.id);
    emitChanges(newLines);

    // Reconstruire tempMenuSelections à partir des items du menu
    const menuSelections: Record<string, MenuItemSelection[]> = {};

    menuLine.items.forEach((menuItem: any) => {
      // Trouver la catégorie correspondante dans le menu complet
      if (fullMenu.categories) {
        const category = fullMenu.categories.find((cat: any) => {
          const categoryName = itemTypes?.find(type => type.id === cat.itemTypeId)?.name;
          return categoryName === menuItem.categoryName;
        });

        if (category) {
          menuSelections[category.id] = [{
            itemId: menuItem.item.id,
            tags: menuItem.tags || [],
            note: menuItem.note
          }];
        }
      }
    });

    // Ouvrir la configuration avec le menu complet et les sélections pré-remplies
    setMenuBeingConfigured(fullMenu);
    setTempMenuSelections(menuSelections);
    setIsConfiguringMenu(true);
    setIsDraftReviewOpen(false);
    onConfigurationModeChange?.(true);
  }, [draftLines, activeMenus, itemTypes, emitChanges, onConfigurationModeChange]);

  // Calculer le nombre total d'items (existants + drafts) dans le panier
  const draftCount = draftLines.length;


  // Utiliser un ref pour accéder aux sélections actuelles dans les callbacks
  const tempMenuSelectionsRef = useRef<Record<string, MenuItemSelection[]>>({});

  // Mettre à jour le ref quand tempMenuSelections change
  useEffect(() => {
    tempMenuSelectionsRef.current = tempMenuSelections;
  }, [tempMenuSelections]);

  // Fonction pour ajouter un menu (définie avant startMenuConfiguration)
  const addMenu = useCallback((menu: any, selectedItems: Record<string, string>, menuSelections: Record<string, MenuItemSelection[]>) => {

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
        // Récupérer les tags et note pour cet item depuis menuSelections
        const menuItemSelection = menuSelections[categoryId]?.find(sel => sel.itemId === itemId);
        const tags = menuItemSelection?.tags || [];
        const note = menuItemSelection?.note;

        // Calculer le price modifier des tags
        const tagsPriceModifier = tags.reduce((sum, tag) => sum + (tag.priceModifier || 0), 0);

        menuItems.push({
          id: `menu-item-${Date.now()}-${Math.random()}`,
          categoryId: categoryId,
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
          supplementPrice: selectedMenuItem?.supplement || 0,
          tags: tags,
          note: note
        });
        totalPrice += (selectedMenuItem?.supplement || 0) + tagsPriceModifier;
      }
    });

    const newLine: Partial<OrderLine> = {
      id: editingMenuId || `draft-menu-${Date.now()}`, // Utiliser l'ID original si on édite
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
      items: menuItems,
      // Stocker les selectedItems originaux pour l'API
      selectedItems
    };

    const newLines = [...draftLines, newLine as OrderLine];
    emitChanges(newLines);
    setEditingMenuId(null); // Réinitialiser l'ID d'édition après confirmation
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
  const validateMenuSelections = useCallback((menu: any, selections: Record<string, MenuItemSelection[]>): boolean => {
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
    setEditingMenuId(null); // Réinitialiser l'ID d'édition
    onConfigurationModeChange?.(false);
    onConfigurationActionsChange?.(null);
  }, [onConfigurationModeChange, onConfigurationActionsChange]);

  const handleConfirmMenuConfiguration = useCallback(() => {
    const selectedItems: Record<string, string> = {};
    Object.entries(tempMenuSelections).forEach(([categoryId, selections]) => {
      if (selections && selections.length > 0) {
        selectedItems[categoryId] = selections[0].itemId;
      }
    });

    if (menuBeingConfigured && Object.keys(selectedItems).length > 0) {
      addMenu(menuBeingConfigured, selectedItems, tempMenuSelections);
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
        // Pour l'auto-configuration, créer un objet vide pour les sélections (pas de tags/notes)
        const emptyMenuSelections: Record<string, MenuItemSelection[]> = {};
        addMenu(menu, autoSelectedItems, emptyMenuSelections);
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
          onSelectMenuItem={handleOpenMenuItemCustomization}
          onDeselectMenuItem={(categoryId) => {
            const newSelections = { ...tempMenuSelections };
            delete newSelections[categoryId];
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
              onOpenCustomization={handleOpenCustomization}
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

          {/* Bouton flottant pour accéder au panier */}
          <DraftFloatingButton
            count={draftCount}
            onPress={() => setIsDraftReviewOpen(true)}
          />
        </View>
      )}

      {/* Modale de customisation d'item */}
      {itemToCustomize && (
        <ItemCustomizationModal
          visible={isCustomizing}
          item={itemToCustomize}
          availableTags={getItemTags(itemToCustomize)}
          initialData={
            editingDraftIndex !== null
              ? {
                note: draftLines[editingDraftIndex]?.note,
                tags: draftLines[editingDraftIndex]?.tags || []
              }
              : undefined
          }
          onConfirm={handleConfirmCustomization}
          onCancel={handleCancelCustomization}
        />
      )}

      {/* Modale de customisation d'item de menu */}
      {menuItemToCustomize && (
        <ItemCustomizationModal
          visible={isCustomizingMenuItem}
          item={menuItemToCustomize.item}
          availableTags={getItemTags(menuItemToCustomize.item)}
          initialData={undefined}
          onConfirm={handleConfirmMenuItemCustomization}
          onCancel={handleCancelMenuItemCustomization}
        />
      )}

      {/* Modale de revue du panier */}
      <DraftReviewModal
        visible={isDraftReviewOpen}
        draftLines={draftLines}
        onEdit={handleOpenCustomization}
        onEditMenu={handleEditMenu}
        onDelete={handleDeleteDraftLine}
        onClose={() => setIsDraftReviewOpen(false)}
        onClearAll={handleClearAllDraft}
      />
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