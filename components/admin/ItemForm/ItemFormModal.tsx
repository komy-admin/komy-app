/**
 * ItemFormModal Component
 *
 * Full-screen modal for creating and editing menu items (articles).
 * Follows the same pattern as TeamFormModal.
 *
 * Features:
 * - Create/Edit modes
 * - AdminFormLayout integration (Header + Keyboard + Footer)
 * - Ref-based form handling for external save triggers
 *
 * @example
 * ```tsx
 * <ItemFormModal
 *   visible={itemFormView.isVisible}
 *   mode={itemFormView.mode}
 *   item={currentItem}
 *   itemTypes={itemTypes}
 *   tags={tags}
 *   activeTab={activeTab}
 *   onClose={handleCloseItemModal}
 *   onSave={handleSaveItem}
 * />
 * ```
 */

import React, { useRef } from 'react';
import { AdminFormLayout } from '~/components/admin/AdminForm/AdminFormLayout';
import { AdminFormView, AdminFormViewRef } from '../AdminForm/AdminFormView';
import { ItemForm } from '~/components/admin/ItemForm/ItemForm'
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Tag } from '~/types/tag.types';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

export interface ItemFormModalProps {
  /** Modal visibility */
  visible: boolean;

  /** Form mode: create or edit */
  mode: 'create' | 'edit';

  /** Item to edit (null for create mode) */
  item: Item | null;

  /** Available item types */
  itemTypes: ItemType[];

  /** Available tags */
  tags: Tag[];

  /** Active tab from parent for context */
  activeTab: string;

  /** Close handler */
  onClose: () => void;

  /** Save handler */
  onSave: (getFormData: () => any) => Promise<boolean>;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  visible,
  mode,
  item,
  itemTypes,
  tags,
  activeTab,
  onClose,
  onSave,
}) => {
  const formRef = useRef<AdminFormViewRef>(null);

  if (!visible) return null;

  // Determine title
  const title =
    mode === 'create'
      ? "Création d'un article"
      : item
        ? `Modification de "${item.name}"`
        : "Modifier l'article";

  // Determine save button text
  const saveButtonText = mode === 'create' ? "Créer l'article" : 'Enregistrer';

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
      <KeyboardAwareScrollViewWrapper
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        bottomOffset={40}
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
          <ItemForm item={item} itemTypes={itemTypes} tags={tags} activeTab={activeTab} />
        </AdminFormView>
      </KeyboardAwareScrollViewWrapper>
    </AdminFormLayout>
  );
};
