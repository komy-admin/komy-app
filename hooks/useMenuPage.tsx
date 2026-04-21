import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Item } from '~/types/item.types';
import { Menu } from '~/types/menu.types';
import { useToast } from '~/components/ToastProvider';
import { useMenu } from '~/hooks/useRestaurant';
import { useMenus } from '~/hooks/useMenus';
import { useTags } from '~/hooks/useTags';
import { MenuFilterState } from '~/components/filters/MenuFilters';
import { filterMenuItems, filterMenus, createEmptyMenuFilters } from '~/utils/menuFilters';
import { CreditCard as Edit2, Trash, Power } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { formatPrice, sortActiveFirst } from '~/lib/utils';
import { getMenuPrice, getColorWithOpacity } from '~/lib/color-utils';
import { showApiError } from '~/lib/apiErrorHandler';
import { colors } from '~/theme';

// ============================================================
// Types
// ============================================================

export type MenuPanelType = 'none' | 'item' | 'menu';

// ============================================================
// Hook principal — logique métier de la page Menu admin
// ============================================================

export function useMenuPage() {
  const [activeTab, setActiveTab] = useState<string>('tous');
  const [filters, setFilters] = useState<MenuFilterState>(createEmptyMenuFilters());

  const { showToast } = useToast();

  // Redux hooks
  const { items, itemTypes, loading, createMenuItem, updateMenuItem, deleteMenuItem, getItemsByType, toggleItemStatus } = useMenu();
  const { allMenus, loading: menusLoading, createMenuBulk, updateMenuBulk, updateMenu, deleteMenu, createMenuCategoryItem, loadMenuCategoryItems } = useMenus();
  const { tags } = useTags();

  const [panelType, setPanelType] = useState<MenuPanelType>('none');
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);

  // Delete confirmation panel
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteType, setPendingDeleteType] = useState<'item' | 'menu' | null>(null);
  const [pendingDeleteName, setPendingDeleteName] = useState<string>('');

  // ============================================================
  // Panel handlers
  // ============================================================

  const clearPendingDelete = useCallback(() => {
    setPendingDeleteId(null);
    setPendingDeleteType(null);
    setPendingDeleteName('');
  }, []);

  // Clear pending delete when tab changes
  useEffect(() => {
    clearPendingDelete();
  }, [activeTab]);

  const closePanel = useCallback(() => {
    setPanelType('none');
    setCurrentItem(null);
    setCurrentMenu(null);
  }, []);

  // ============================================================
  // Items — handlers
  // ============================================================

  const handleCreateItem = useCallback(() => {
    clearPendingDelete();
    setCurrentItem(null);
    setCurrentMenu(null);
    setPanelType('item');
  }, [clearPendingDelete]);

  const handleEditItem = useCallback((id: string) => {
    clearPendingDelete();
    const item = items.find(i => i.id === id);
    if (!item) return;
    setCurrentItem(item);
    setCurrentMenu(null);
    setPanelType('item');
  }, [items, clearPendingDelete]);

  const handleSaveItem = useCallback(async (item: Item) => {
    const itemType = itemTypes.find(type => type.id === item.itemType?.id);

    const itemData: any = {
      ...item,
      color: item.color || undefined,
      itemType: itemType || undefined,
      tags: item.tags?.map(t => t.id) || [],
    };

    if (item.id) {
      await updateMenuItem(item.id, itemData);
      showToast('Article modifié avec succès', 'success');
    } else {
      await createMenuItem(itemData);
      showToast('Article créé avec succès', 'success');
    }
    closePanel();
  }, [itemTypes, updateMenuItem, createMenuItem, showToast, closePanel]);

  const handleDeleteItem = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    setPendingDeleteId(id);
    setPendingDeleteType('item');
    setPendingDeleteName(item?.name || '');
  }, [items]);

  const handleToggleItemStatus = useCallback(async (id: string) => {
    try {
      await toggleItemStatus(id);
      showToast('Statut modifié avec succès', 'success');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la modification du statut');
    }
  }, [toggleItemStatus, showToast]);

  // ============================================================
  // Menus — handlers
  // ============================================================

  const handleCreateMenu = useCallback(() => {
    clearPendingDelete();
    setCurrentMenu(null);
    setCurrentItem(null);
    setPanelType('menu');
  }, [clearPendingDelete]);

  const handleEditMenu = useCallback((id: string) => {
    clearPendingDelete();
    const menu = allMenus.find(m => m.id === id);
    if (!menu) return;
    setCurrentMenu(menu);
    setCurrentItem(null);
    setPanelType('menu');
  }, [allMenus, clearPendingDelete]);

  const handleToggleMenuStatus = useCallback(async (id: string) => {
    const menu = allMenus.find(m => m.id === id);
    if (!menu) return;
    try {
      await updateMenu(id, { isActive: !menu.isActive });
      showToast(`Menu ${menu.isActive ? 'désactivé' : 'activé'} avec succès`, 'success');
    } catch (error) {
      showApiError(error, showToast, 'Erreur lors de la modification du statut');
    }
  }, [allMenus, updateMenu, showToast]);

  const handleBulkMenuSave = useCallback(async (menuData: any) => {
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

    // Trier les catégories par priorityOrder de l'itemType, puis alphabétiquement
    const sortedCategories = [...(menuData.categories || [])].sort((a: any, b: any) => {
      const priorityA = itemTypes.find(t => t.id === a.itemTypeId)?.priorityOrder ?? 999;
      const priorityB = itemTypes.find(t => t.id === b.itemTypeId)?.priorityOrder ?? 999;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const nameA = itemTypes.find(t => t.id === a.itemTypeId)?.name || '';
      const nameB = itemTypes.find(t => t.id === b.itemTypeId)?.name || '';
      return nameA.localeCompare(nameB);
    });

    const menuPayload = {
      menu: {
        name: menuData.name,
        description: menuData.description || '',
        basePrice: Number(menuData.basePrice),
        isActive: Boolean(menuData.isActive),
        vatRate: Number(menuData.vatRate) || 10,
      },
      categories: mapCategories(sortedCategories, Boolean(menuData.id)),
    };

    if (menuData.id) {
      await updateMenuBulk(menuData.id, menuPayload);
    } else {
      await createMenuBulk(menuPayload);
    }

    showToast(menuData.id ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
    closePanel();
  }, [itemTypes, updateMenuBulk, createMenuBulk, showToast, closePanel]);

  const handleDeleteMenu = useCallback((id: string) => {
    const menu = allMenus.find(m => m.id === id);
    setPendingDeleteId(id);
    setPendingDeleteType('menu');
    setPendingDeleteName(menu?.name || '');
  }, [allMenus]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId || !pendingDeleteType) return;
    try {
      if (pendingDeleteType === 'item') {
        await deleteMenuItem(pendingDeleteId);
        showToast('Article supprimé avec succès', 'success');
      } else {
        await deleteMenu(pendingDeleteId);
        showToast('Menu supprimé avec succès', 'success');
      }
    } catch (error) {
      showApiError(error, showToast, pendingDeleteType === 'item'
        ? "Erreur lors de la suppression de l'article"
        : 'Erreur lors de la suppression du menu');
    } finally {
      clearPendingDelete();
    }
  }, [pendingDeleteId, pendingDeleteType, deleteMenuItem, deleteMenu, showToast, clearPendingDelete]);

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
    return filterMenus(allMenus, filters).sort(sortActiveFirst);
  }, [allMenus, filters]);

  const tousSections = useMemo(() => {
    if (activeTab !== 'tous') return undefined;
    const sections: { title: string; data: any[] }[] = [];

    if (filteredMenus.length > 0) {
      sections.push({ title: 'Menus', data: filteredMenus.map(m => ({ ...m, _type: 'menu' as const })) });
    }

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
    { label: 'Modifier', icon: <Edit2 size={16} color={colors.brand.accentDark} />, onPress: () => handleEditItem(item.id ?? '') },
    { label: item.isActive ? 'Désactiver' : 'Activer', icon: <Power size={16} color={item.isActive ? colors.error.base : colors.success.base} />, onPress: () => handleToggleItemStatus(item.id ?? '') },
    { label: 'Supprimer', icon: <Trash size={16} color={colors.error.base} />, type: 'destructive', onPress: () => handleDeleteItem(item.id ?? '') },
  ], [handleEditItem, handleToggleItemStatus, handleDeleteItem]);

  const getMenuActions = useCallback((menu: Menu): ActionItem[] => [
    { label: 'Modifier', icon: <Edit2 size={16} color={colors.brand.accentDark} />, onPress: () => handleEditMenu(menu.id) },
    { label: menu.isActive ? 'Désactiver' : 'Activer', icon: <Power size={16} color={menu.isActive ? colors.error.base : colors.success.base} />, onPress: () => handleToggleMenuStatus(menu.id) },
    { label: 'Supprimer', icon: <Trash size={16} color={colors.error.base} />, type: 'destructive', onPress: () => handleDeleteMenu(menu.id) },
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

  const renderColorCircle = useCallback((bgColor: string, name: string | undefined) => (
    <View style={{
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: getColorWithOpacity(bgColor, 0.12),
      borderWidth: 1.5, borderColor: bgColor,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: bgColor, fontSize: 14, fontWeight: '600' }}>
        {name?.charAt(0)?.toUpperCase() || ''}
      </Text>
    </View>
  ), []);

  const renderStatus = useCallback((isActive: boolean) => (
    <Text style={{ color: isActive ? colors.success.base : colors.error.base, fontWeight: '500' }}>
      {isActive ? 'Actif' : 'Inactif'}
    </Text>
  ), []);

  const itemTableColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, render: (item: Item) => renderColorCircle(item.color || colors.gray[500], item.name) },
    { label: 'Nom', key: 'name', width: '46%' },
    { label: 'Prix', key: 'price', width: '23%', render: (item: Item) => <Text>{formatPrice(item.price)}</Text> },
    { label: 'Statut', key: 'statut', width: '24%', render: (item: Item) => renderStatus(item.isActive) },
  ], [renderColorCircle, renderStatus]);

  const menuTableColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, render: (menu: Menu) => renderColorCircle(colors.success.base, menu.name) },
    { label: 'Nom', key: 'name', width: '34%' },
    { label: 'Prix', key: 'basePrice', width: '17%', render: (menu: Menu) => <Text>{formatPrice(getMenuPrice(menu))}</Text> },
    { label: 'Catégories', key: 'categories', width: '28%', render: (menu: Menu) => (
      <Text style={{ fontSize: 12, color: colors.gray[500] }}>
        {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) > 1 ? 's' : ''}
      </Text>
    ) },
    { label: 'Statut', key: 'statut', width: '14%', render: (menu: Menu) => renderStatus(menu.isActive) },
  ], [renderColorCircle, renderStatus]);

  const tousColumns = useMemo(() => [
    { label: '', key: 'color', width: 64, render: (entry: any) => {
      const isMenu = entry._type === 'menu';
      return renderColorCircle(isMenu ? colors.success.base : (entry.color || colors.gray[500]), entry.name);
    } },
    { label: 'Nom', key: 'name', width: '46%' },
    { label: 'Prix', key: 'price', width: '23%', render: (entry: any) => (
      <Text>{formatPrice(entry._type === 'menu' ? getMenuPrice(entry) : entry.price)}</Text>
    ) },
    { label: 'Statut', key: 'statut', width: '24%', render: (entry: any) => renderStatus(entry.isActive) },
  ], [renderColorCircle, renderStatus]);

  // ============================================================
  // Return public API
  // ============================================================

  return {
    // Tab & filtres
    activeTab, setActiveTab,
    filters, setFilters, handleClearFilters,

    // Données
    items, itemTypes, tags,
    loading, menusLoading,
    filteredItems, filteredMenus, tousSections,

    // Panel state
    panelType, currentItem, currentMenu, closePanel,

    // Items CRUD
    handleCreateItem, handleEditItem, handleSaveItem,

    // Menus CRUD
    handleCreateMenu, handleEditMenu, handleBulkMenuSave,
    createMenuCategoryItem, loadMenuCategoryItems,

    // Delete confirmation panel
    pendingDeleteId, pendingDeleteType, pendingDeleteName, confirmDelete, clearPendingDelete,

    // Actions & colonnes
    getItemActions, getMenuActions, getTousActions, handleTousRowPress,
    itemTableColumns, menuTableColumns, tousColumns,
  };
}
