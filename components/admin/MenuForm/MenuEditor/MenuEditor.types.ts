import { ScrollView } from 'react-native';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { AdminFormRef, AdminConfirmationContext } from '@/components/admin/AdminForm/AdminFormView';

export interface MenuEditorProps {
  menu?: Menu | null;
  items: Item[];
  itemTypes: ItemType[];
  onSave?: (menuData: Partial<Menu>) => Promise<void>;
  onCancel?: () => void;
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
  onLoadMenuCategoryItems: (menuCategoryId: string) => MenuCategoryItem[];
  scrollViewRef?: React.RefObject<ScrollView | null>;
  confirmationContext?: AdminConfirmationContext;
}

export interface MenuFormData {
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
  categories: MenuCategoryFormData[];
}

export interface MenuCategoryFormData {
  id?: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: string;
  priceModifier: string;
}

export interface CategoryItemFormData {
  itemId: string;
  supplement: string;
  isAvailable: boolean;
}

export interface LocalMenuCategoryItem {
  tempId: string;
  originalId?: string;
  itemId: string;
  supplement: number;
  isAvailable: boolean;
  item?: Item;
  isModified?: boolean;
  isDeleted?: boolean;
}

export type MenuEditorRef = AdminFormRef<Menu>;