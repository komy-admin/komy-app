import React, { useCallback } from 'react';
import { OrderLinesForm } from './index';
import { OrderLine, SelectedTag } from '~/types/order-line.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Menu } from '~/types/menu.types';
import { MenuSelections } from './OrderLinesForm.types';

/**
 * OrderLinesFormLegacy - Wrapper de compatibilité pour l'ancienne interface
 *
 * Permet à service.tsx de continuer à fonctionner avec l'ancienne interface
 * pendant qu'on migre progressivement.
 *
 * Ancienne interface: onLinesChange(lines: OrderLine[])
 * Nouvelle interface: onAddItem, onUpdateItem, onAddMenu, etc.
 */

interface OrderLinesFormLegacyProps {
  lines: OrderLine[];
  items: Item[];
  itemTypes: ItemType[];
  onLinesChange: (lines: OrderLine[]) => void;
  onConfigurationModeChange?: (isConfiguring: boolean) => void;
  onConfigurationActionsChange?: (actions: any) => void;
}

export const OrderLinesFormLegacy: React.FC<OrderLinesFormLegacyProps> = ({
  lines,
  items,
  itemTypes,
  onLinesChange,
  onConfigurationModeChange,
  onConfigurationActionsChange,
}) => {
  // Convertir l'ancienne interface vers la nouvelle

  const handleAddItem = useCallback(
    (item: Item, customization: { tags: SelectedTag[]; note?: string }) => {
      // Calculer le prix
      const tagsPrice = customization.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);
      const totalPrice = item.price + tagsPrice;

      // Créer la nouvelle ligne
      const newLine: any = {
        id: `draft-item-${Date.now()}-${Math.random()}`,
        type: 'ITEM',
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: 'draft',
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
          tags: item.tags,
        },
        menu: null,
      };

      onLinesChange([...lines, newLine]);
    },
    [lines, onLinesChange]
  );

  const handleUpdateItem = useCallback(
    (lineId: string, customization: { tags: SelectedTag[]; note?: string }) => {
      const newLines = lines.map((line) => {
        if (line.id !== lineId || line.type !== 'ITEM') return line;

        const tagsPrice = customization.tags.reduce((sum, t) => sum + (t.priceModifier || 0), 0);
        const totalPrice = line.item!.price + tagsPrice;

        return {
          ...line,
          note: customization.note,
          tags: customization.tags,
          unitPrice: totalPrice,
          totalPrice: totalPrice,
        };
      });

      onLinesChange(newLines);
    },
    [lines, onLinesChange]
  );

  const handleAddMenu = useCallback(
    (menu: Menu, selections: MenuSelections, itemTypesParam: ItemType[]) => {
      // Construire les items du menu
      const menuItems: any[] = [];
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
          categoryName: itemTypesParam.find((t) => t.id === category.itemTypeId)?.name || '',
          status: 'draft',
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

      const newLine: any = {
        id: `draft-menu-${Date.now()}`,
        type: 'MENU',
        quantity: 1,
        unitPrice: totalPrice,
        totalPrice: totalPrice,
        status: 'draft',
        item: null,
        menu: {
          id: menu.id,
          name: menu.name,
          description: menu.description,
          basePrice: menu.basePrice,
          snapshotAt: new Date().toISOString(),
        },
        items: menuItems,
      };

      onLinesChange([...lines, newLine]);
    },
    [lines, onLinesChange]
  );

  const handleUpdateMenu = useCallback(
    (lineId: string, menu: Menu, selections: MenuSelections, itemTypesParam: ItemType[]) => {
      const newLines = lines.map((line) => {
        if (line.id !== lineId || line.type !== 'MENU') return line;

        // Reconstruire les items
        const menuItems: any[] = [];
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
            categoryName: itemTypesParam.find((t) => t.id === category.itemTypeId)?.name || '',
            status: 'draft',
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
          items: menuItems,
          unitPrice: totalPrice,
          totalPrice: totalPrice,
        };
      });

      onLinesChange(newLines);
    },
    [lines, onLinesChange]
  );

  const handleDeleteLine = useCallback(
    (lineId: string) => {
      onLinesChange(lines.filter((l) => l.id !== lineId));
    },
    [lines, onLinesChange]
  );

  return (
    <OrderLinesForm
      lines={lines}
      items={items}
      itemTypes={itemTypes}
      onAddItem={handleAddItem}
      onUpdateItem={handleUpdateItem}
      onAddMenu={handleAddMenu}
      onUpdateMenu={handleUpdateMenu}
      onDeleteLine={handleDeleteLine}
      onConfigurationModeChange={onConfigurationModeChange}
      onConfigurationActionsChange={onConfigurationActionsChange}
    />
  );
};
