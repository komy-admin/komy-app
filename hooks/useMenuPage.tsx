import { useState, useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { useToast } from '~/components/ToastProvider';
import { useMenu } from '~/hooks/useRestaurant';
import { useMenus } from '~/hooks/useMenus';
import { useTags } from '~/hooks/useTags';
import { MenuFilterState } from '~/components/filters/MenuFilters';
import { filterMenuItems, filterMenus, createEmptyMenuFilters } from '~/utils/menuFilters';
import { useAdminFormView } from '@/components/admin/AdminForm/AdminFormView';
import { CreditCard as Edit2, Trash, Power, ListFilter } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { formatPrice, getContrastColor, sortActiveFirst } from '~/lib/utils';

// ============================================================
// Hook principal — logique métier de la page Menu admin
// ============================================================

export function useMenuPage() {
  const [activeTab, setActiveTab] = useState<string>('tous');
  const [filters, setFilters] = useState<MenuFilterState>(createEmptyMenuFilters());

  const { showToast } = useToast();

  // Redux hooks
  const { items, itemTypes, loading, error, createMenuItem, updateMenuItem, deleteMenuItem, getItemsByType, toggleItemStatus } = useMenu();
  const { allMenus, loading: menusLoading, error: menusError, createMenuBulk, updateMenuBulk, updateMenu, deleteMenu, createMenuCategoryItem, loadMenuCategoryItems } = useMenus();
  const { tags } = useTags();

  // ============================================================
  // CRUD générique — état partagé items & menus
  // ============================================================

  const itemFormView = useAdminFormView();
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleteItemModalVisible, setIsDeleteItemModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuFormView = useAdminFormView();
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [isDeleteMenuModalVisible, setIsDeleteMenuModalVisible] = useState(false);
  const [isDeletingMenu, setIsDeletingMenu] = useState(false);

  // ============================================================
  // Items — handlers
  // ============================================================

  const handleCreateItem = useCallback(() => {
    setCurrentItem(null);
    itemFormView.openCreate();
  }, [itemFormView]);

  const handleEditItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setCurrentItem(item);
    itemFormView.openEdit();
  }, [items, itemFormView]);

  const handleCloseItemModal = useCallback(() => {
    itemFormView.close();
    setCurrentItem(null);
  }, [itemFormView]);

  const handleSaveItem = useCallback(async (item: Item) => {
    try {
      const itemType = itemTypes.find(type => type.id === item.itemType?.id);
      if (!itemType) throw new Error('Type not found');

      const itemData: any = {
        ...item,
        color: item.color || undefined,
        itemType,
        tags: item.tags?.map(t => t.id) || [],
      };

      if (item.id) {
        await updateMenuItem(item.id, itemData);
        showToast('Article modifié avec succès', 'success');
      } else {
        await createMenuItem(itemData);
        showToast('Article créé avec succès', 'success');
      }
      handleCloseItemModal();
    } catch (err) {
      console.error('Error saving item:', err);
      showToast("Erreur lors de la sauvegarde de l'article", 'error');
    }
  }, [itemTypes, updateMenuItem, createMenuItem, showToast, handleCloseItemModal]);

  const handleDeleteItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItemToDelete(item);
    setIsDeleteItemModalVisible(true);
  }, [items]);

  const confirmDeleteItem = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMenuItem(itemToDelete.id);
      showToast('Article supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast("Erreur lors de la suppression de l'article", 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteItemModalVisible(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteMenuItem, showToast]);

  const handleCloseDeleteItemModal = useCallback(() => {
    setIsDeleteItemModalVisible(false);
    setItemToDelete(null);
  }, []);

  const handleToggleItemStatus = useCallback(async (id: string) => {
    try {
      await toggleItemStatus(id);
      showToast('Statut modifié avec succès', 'success');
    } catch (err) {
      console.error('Error toggling item status:', err);
      showToast('Erreur lors de la modification du statut', 'error');
    }
  }, [toggleItemStatus, showToast]);

  // ============================================================
  // Menus — handlers
  // ============================================================

  const handleCreateMenu = useCallback(() => {
    setCurrentMenu(null);
    menuFormView.openCreate();
  }, [menuFormView]);

  const handleEditMenu = useCallback((id: string) => {
    const menu = allMenus.find(m => m.id === id);
    if (!menu) return;
    setCurrentMenu(menu);
    menuFormView.openEdit();
  }, [allMenus, menuFormView]);

  const handleCloseMenuModal = useCallback(() => {
    menuFormView.close();
    setCurrentMenu(null);
  }, [menuFormView]);

  const handleToggleMenuStatus = useCallback(async (id: string) => {
    const menu = allMenus.find(m => m.id === id);
    if (!menu) return;
    try {
      await updateMenu(id, { isActive: !menu.isActive });
      showToast(`Menu ${menu.isActive ? 'désactivé' : 'activé'} avec succès`, 'success');
    } catch (err) {
      console.error('Error toggling menu status:', err);
      showToast('Erreur lors de la modification du statut', 'error');
    }
  }, [allMenus, updateMenu, showToast]);

  /**
   * Mappe les données du formulaire vers le format API bulk, puis crée ou met à jour
   */
  const handleBulkMenuSave = useCallback(async (menuData: any) => {
    try {
      const mapCategories = (categories: any[], includeIds: boolean) =>
        categories?.map((cat: any) => ({
          ...(includeIds && cat.id ? { id: cat.id } : {}),
          itemTypeId: cat.itemTypeId,
          isRequired: Boolean(cat.isRequired),
          maxSelections: Number(cat.maxSelections),
          priceModifier: Number(cat.priceModifier),
          items: cat.localItems
            ?.filter((li: any) => !li.isDeleted)
            .map((li: any) => ({
              ...(includeIds && li.originalId ? { id: li.originalId } : {}),
              itemId: li.itemId,
              supplement: Number(li.supplement) || 0,
              isAvailable: Boolean(li.isAvailable),
            })) || [],
        })) || [];

      const menuPayload = {
        menu: {
          name: menuData.name,
          description: menuData.description || '',
          basePrice: Number(menuData.basePrice),
          isActive: Boolean(menuData.isActive),
        },
        categories: mapCategories(menuData.categories, Boolean(menuData.id)),
      };

      if (menuData.id) {
        await updateMenuBulk(menuData.id, menuPayload);
      } else {
        await createMenuBulk(menuPayload);
      }

      showToast(menuData.id ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
      handleCloseMenuModal();
    } catch (err) {
      console.error('Error saving bulk menu:', err);
      showToast('Erreur lors de la sauvegarde du menu', 'error');
      throw err;
    }
  }, [updateMenuBulk, createMenuBulk, showToast, handleCloseMenuModal]);

  const handleDeleteMenu = useCallback((id: string) => {
    const menu = allMenus.find(m => m.id === id);
    if (!menu) return;
    setMenuToDelete(menu);
    setIsDeleteMenuModalVisible(true);
  }, [allMenus]);

  const confirmDeleteMenu = useCallback(async () => {
    if (!menuToDelete) return;
    setIsDeletingMenu(true);
    try {
      await deleteMenu(menuToDelete.id);
      showToast('Menu supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting menu:', err);
      showToast('Erreur lors de la suppression du menu', 'error');
    } finally {
      setIsDeletingMenu(false);
      setIsDeleteMenuModalVisible(false);
      setMenuToDelete(null);
    }
  }, [menuToDelete, deleteMenu, showToast]);

  const handleCloseDeleteMenuModal = useCallback(() => {
    setIsDeleteMenuModalVisible(false);
    setMenuToDelete(null);
  }, []);

  // ============================================================
  // Filtres
  // ============================================================

  const handleClearFilters = useCallback(() => {
    setFilters(createEmptyMenuFilters());
    setActiveTab('tous');
  }, []);

  // ============================================================
  // Données filtrées & sections
  // ============================================================

  const filteredItems = useMemo(() => {
    if (activeTab === 'tous' || activeTab === 'menus') return [];
    return filterMenuItems(getItemsByType(activeTab), filters).sort(sortActiveFirst);
  }, [activeTab, filters, getItemsByType]);

  const filteredMenus = useMemo(() => {
    return filterMenus([...allMenus], filters).sort(sortActiveFirst);
  }, [allMenus, filters]);

  const tousSections = useMemo(() => {
    if (activeTab !== 'tous') return undefined;
    const sections: { title: string; data: any[] }[] = [];

    // Menus filtrés
    const menusFiltered = filterMenus(filteredMenus, filters);
    if (menusFiltered.length > 0) {
      sections.push({ title: 'Menus', data: menusFiltered.map(m => ({ ...m, _type: 'menu' as const })) });
    }

    // Items par type, triés par priorité puis alpha
    const sortedTypes = [...itemTypes].sort((a, b) => {
      if (a.priorityOrder !== b.priorityOrder) return a.priorityOrder - b.priorityOrder;
      return a.name.localeCompare(b.name);
    });
    for (const type of sortedTypes) {
      const typeItems = filterMenuItems(
        items.filter(i => i.itemType?.id === type.id),
        filters
      ).sort(sortActiveFirst);
      if (typeItems.length > 0) {
        sections.push({ title: type.name, data: typeItems.map(i => ({ ...i, _type: 'item' as const })) });
      }
    }
    return sections;
  }, [activeTab, filteredMenus, items, itemTypes, filters]);

  // ============================================================
  // Actions (menus contextuels par row)
  // ============================================================

  const getItemActions = useCallback((item: Item): ActionItem[] => [
    { label: 'Modifier', icon: <Edit2 size={16} color="#4F46E5" />, onPress: () => handleEditItem(item.id ?? '') },
    { label: item.isActive ? 'Désactiver' : 'Activer', icon: <Power size={16} color={item.isActive ? '#EF4444' : '#10B981'} />, onPress: () => handleToggleItemStatus(item.id ?? '') },
    { label: 'Supprimer', icon: <Trash size={16} color="#ef4444" />, type: 'destructive', onPress: () => handleDeleteItem(item.id ?? '') },
  ], [handleEditItem, handleToggleItemStatus, handleDeleteItem]);

  const getMenuActions = useCallback((menu: Menu): ActionItem[] => [
    { label: 'Modifier', icon: <Edit2 size={16} color="#4F46E5" />, onPress: () => handleEditMenu(menu.id) },
    { label: menu.isActive ? 'Désactiver' : 'Activer', icon: <Power size={16} color={menu.isActive ? '#EF4444' : '#10B981'} />, onPress: () => handleToggleMenuStatus(menu.id) },
    { label: 'Supprimer', icon: <Trash size={16} color="#ef4444" />, type: 'destructive', onPress: () => handleDeleteMenu(menu.id) },
  ], [handleEditMenu, handleToggleMenuStatus, handleDeleteMenu]);

  const getTousActions = useCallback((entry: any): ActionItem[] => {
    return entry._type === 'menu' ? getMenuActions(entry) : getItemActions(entry);
  }, [getMenuActions, getItemActions]);

  const handleTousRowPress = useCallback((id: string) => {
    if (allMenus.some(m => m.id === id)) handleEditMenu(id);
    else handleEditItem(id);
  }, [allMenus, handleEditMenu, handleEditItem]);

  // ============================================================
  // Colonnes
  // ============================================================

  const headerFilterIcon = useCallback(() => (
    <View style={{
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB',
      justifyContent: 'center', alignItems: 'center',
    }}>
      <ListFilter size={17} color="#2A2E33" strokeWidth={2.5} />
    </View>
  ), []);

  const renderColorCircle = useCallback((bgColor: string, name: string | undefined, textColor?: string) => (
    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: textColor || getContrastColor(bgColor), fontSize: 14, fontWeight: '600' }}>
        {name?.charAt(0)?.toUpperCase() || ''}
      </Text>
    </View>
  ), []);

  const renderStatus = useCallback((isActive: boolean) => (
    <Text style={{ color: isActive ? '#10B981' : '#EF4444', fontWeight: '500' }}>
      {isActive ? 'Actif' : 'Inactif'}
    </Text>
  ), []);

  const itemTableColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, headerRender: headerFilterIcon, render: (item: Item) => renderColorCircle(item.color || '#6B7280', item.name) },
    { label: 'Nom', key: 'name', width: '46%' },
    { label: 'Prix', key: 'price', width: '23%', render: (item: Item) => <Text>{formatPrice(item.price)}</Text> },
    { label: 'Statut', key: 'statut', width: '24%', render: (item: Item) => renderStatus(item.isActive) },
  ], [renderColorCircle, renderStatus, headerFilterIcon]);

  const menuTableColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, headerRender: headerFilterIcon, render: (menu: Menu) => renderColorCircle('#7C3AED', menu.name, '#FFFFFF') },
    { label: 'Nom', key: 'name', width: '34%' },
    { label: 'Prix de base', key: 'basePrice', width: '17%', render: (menu: Menu) => <Text>{formatPrice(Number(menu.basePrice))}</Text> },
    { label: 'Catégories', key: 'categories', width: '28%', render: (menu: Menu) => (
      <Text style={{ fontSize: 12, color: '#666666' }}>
        {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) > 1 ? 's' : ''}
      </Text>
    ) },
    { label: 'Statut', key: 'statut', width: '14%', render: (menu: Menu) => renderStatus(menu.isActive) },
  ], [renderColorCircle, renderStatus, headerFilterIcon]);

  const tousColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, headerRender: headerFilterIcon, render: (entry: any) => {
      const isMenu = entry._type === 'menu';
      return renderColorCircle(isMenu ? '#7C3AED' : (entry.color || '#6B7280'), entry.name, isMenu ? '#FFFFFF' : undefined);
    } },
    { label: 'Nom', key: 'name', width: '46%' },
    { label: 'Prix', key: 'price', width: '23%', render: (entry: any) => (
      <Text>{formatPrice(entry._type === 'menu' ? Number(entry.basePrice) : entry.price)}</Text>
    ) },
    { label: 'Statut', key: 'statut', width: '24%', render: (entry: any) => renderStatus(entry.isActive) },
  ], [renderColorCircle, renderStatus, headerFilterIcon]);

  // ============================================================
  // Return public API
  // ============================================================

  return {
    // Tab & filtres
    activeTab, setActiveTab,
    filters, setFilters, handleClearFilters,

    // Données
    items, itemTypes, tags, allMenus,
    loading, menusLoading, error, menusError,
    filteredItems, filteredMenus, tousSections,

    // Items CRUD
    itemFormView, currentItem, handleCreateItem, handleEditItem, handleCloseItemModal, handleSaveItem,
    isDeleteItemModalVisible, itemToDelete, isDeleting, handleDeleteItem, confirmDeleteItem, handleCloseDeleteItemModal,

    // Menus CRUD
    menuFormView, currentMenu, handleCreateMenu, handleEditMenu, handleCloseMenuModal, handleBulkMenuSave,
    isDeleteMenuModalVisible, menuToDelete, isDeletingMenu, handleDeleteMenu, confirmDeleteMenu, handleCloseDeleteMenuModal,
    createMenuCategoryItem, loadMenuCategoryItems,

    // Actions & colonnes
    getItemActions, getMenuActions, getTousActions, handleTousRowPress,
    itemTableColumns, menuTableColumns, tousColumns,
  };
}
