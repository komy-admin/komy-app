/**
 * MenuFormModal Component
 *
 * Full-screen modal for creating and editing menus with MenuEditor.
 * Follows the same pattern as TeamFormModal.
 *
 * Features:
 * - Create/Edit modes
 * - AdminFormLayout integration (Header + Keyboard + Footer)
 * - Ref-based form handling for external save triggers
 *
 * @example
 * ```tsx
 * <MenuFormModal
 *   visible={menuFormView.isVisible}
 *   mode={menuFormView.mode}
 *   menu={currentMenu}
 *   items={items}
 *   itemTypes={itemTypes}
 *   onClose={handleCloseMenuModal}
 *   onSave={handleSaveMenu}
 *   onCreateMenuCategoryItem={createMenuCategoryItem}
 *   onLoadMenuCategoryItems={loadMenuCategoryItems}
 * />
 * ```
 */

import React, { useRef } from 'react';
import { ScrollView } from 'react-native';
import { AdminFormLayout } from '~/components/admin/AdminForm/AdminFormLayout';
import { AdminFormView, AdminFormViewRef } from '../AdminForm/AdminFormView';
import { MenuEditor } from '@/components/admin/MenuForm';
import { Menu, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';

export interface MenuFormModalProps {
  /** Modal visibility */
  visible: boolean;

  /** Form mode: create or edit */
  mode: 'create' | 'edit';

  /** Menu to edit (null for create mode) */
  menu: Menu | null;

  /** Available items */
  items: Item[];

  /** Available item types */
  itemTypes: ItemType[];

  /** Close handler */
  onClose: () => void;

  /** Save handler */
  onSave: (getFormData: () => any) => Promise<boolean>;

  /** Create menu category item handler */
  onCreateMenuCategoryItem: (itemData: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;

  /** Load menu category items handler */
  onLoadMenuCategoryItems: (menuCategoryId: string) => MenuCategoryItem[];
}

export const MenuFormModal: React.FC<MenuFormModalProps> = ({
  visible,
  mode,
  menu,
  items,
  itemTypes,
  onClose,
  onSave,
  onCreateMenuCategoryItem,
  onLoadMenuCategoryItems,
}) => {
  const formRef = useRef<AdminFormViewRef>(null);

  if (!visible) return null;

  // Determine title
  const title =
    mode === 'create'
      ? "Création d'un menu"
      : menu
        ? `Modification de "${menu.name}"`
        : 'Modifier le menu';

  // Determine save button text
  const saveButtonText = mode === 'create' ? 'Créer le menu' : 'Enregistrer';

  // Check if saving
  const isSaving = formRef.current?.isSaving || false;

  return (
    <AdminFormLayout
      title={title}
      onBack={onClose}
      onCancel={onClose}
      onSave={() => formRef.current?.handleSave()}
      isSaving={isSaving}
      saveButtonText={saveButtonText}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AdminFormView
          ref={formRef}
          visible={true}
          mode={mode}
          onClose={onClose}
          onCancel={onClose}
          onSave={onSave}
          hideHeaderAndActions={true}
        >
          <MenuEditor
            menu={menu}
            items={items}
            itemTypes={itemTypes}
            onCreateMenuCategoryItem={onCreateMenuCategoryItem}
            onLoadMenuCategoryItems={onLoadMenuCategoryItems}
          />
        </AdminFormView>
      </ScrollView>
    </AdminFormLayout>
  );
};
