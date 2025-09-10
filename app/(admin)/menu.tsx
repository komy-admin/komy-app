import { useWindowDimensions, View, ScrollView, Text } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useState, useMemo, useRef } from "react";
import { Item } from "~/types/item.types";
import { Menu } from "~/types/menu.types";
import { MenuForm } from "~/components/form/MenuForm";
import { useToast } from '~/components/ToastProvider';
import { useMenu, useRestaurant } from '~/hooks/useRestaurant';
import { useMenus } from '~/hooks/useMenus';
import { MenuFilters, MenuFilterState } from '~/components/filters/MenuFilters';
import { filterMenuItems, createEmptyMenuFilters } from '~/utils/menuFilters';
import { CreditCard as Edit2, Trash, Power } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { MenuEditor } from '~/components/Menu/MenuEditor';
import { AdminFormView, useAdminFormView } from '~/components/admin/AdminFormView';
import { DeleteConfirmationModal } from '~/components/ui/DeleteConfirmationModal';

export default function MenuPage() {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("items");
  const [filters, setFilters] = useState<MenuFilterState>(createEmptyMenuFilters());

  // États pour les items
  const itemFormView = useAdminFormView();
  const [isDeleteItemModalVisible, setIsDeleteItemModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour les menus
  const menuFormView = useAdminFormView();
  const [isDeleteMenuModalVisible, setIsDeleteMenuModalVisible] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [isDeletingMenu, setIsDeletingMenu] = useState(false);

  // Référence pour le scroll automatique du menu editor
  const menuScrollViewRef = useRef<ScrollView>(null);


  const { showToast } = useToast();

  // Initialiser la connexion WebSocket via useRestaurant
  const { isLoading: globalLoading } = useRestaurant();

  // Utilisation des hooks Redux
  const { items, itemTypes, loading, error, createMenuItem, updateMenuItem, deleteMenuItem, getItemsByType, toggleItemStatus } = useMenu();
  const { allMenus, loading: menusLoading, error: menusError, createMenuBulk, updateMenuBulk, deleteMenu, createMenuCategoryItem, updateMenuCategoryItem, deleteMenuCategoryItem, loadMenuCategoryItems } = useMenus();

  // Filtrer les articles avec les filtres appliqués et trier par statut
  const filteredItems = useMemo(() => {
    if (activeTab === 'menus') return [];

    let result = activeTab === 'items' ? items : getItemsByType(activeTab);
    result = filterMenuItems(result, filters);
    // Trier pour mettre les items actifs en premier
    return result.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  }, [items, activeTab, filters, getItemsByType]);

  // Filtrer les menus
  const filteredMenus = useMemo(() => {
    return allMenus.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return 0;
    });
  }, [allMenus]);

  // Gestion des filtres
  const handleFiltersChange = (newFilters: MenuFilterState) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(createEmptyMenuFilters());
    setActiveTab('items');
  };

  // Gestion des items
  const handleCreateItem = () => {
    setCurrentItem(null);
    itemFormView.openCreate();
  };

  const handleEditItem = (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;
    setCurrentItem(item);
    itemFormView.openEdit();
  };

  const handleCloseItemModal = () => {
    itemFormView.close();
    setCurrentItem(null);
  };

  const handleSaveItem = async (item: Item) => {
    try {
      const itemType = itemTypes.find(type => type.id === item.itemType?.id);
      if (!itemType) {
        throw new Error("Type not found");
      }

      const itemWithType = {
        ...item,
        itemType: itemType
      };

      if (item.id) {
        await updateMenuItem(item.id, itemWithType);
        showToast('Article modifié avec succès', 'success');
      } else {
        await createMenuItem(itemWithType);
        showToast('Article créé avec succès', 'success');
      }
      handleCloseItemModal();
    } catch (err) {
      console.error('Error saving item:', err);
      showToast('Erreur lors de la sauvegarde de l\'article', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = items.find(item => item.id === id);
    if (!item) return;
    setItemToDelete(item);
    setIsDeleteItemModalVisible(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      await deleteMenuItem(itemToDelete.id);
      showToast('Article supprimé avec succès', 'success');
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast('Erreur lors de la suppression de l\'article', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteItemModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleCloseDeleteItemModal = () => {
    setIsDeleteItemModalVisible(false);
    setItemToDelete(null);
  };

  const handleToggleItemStatus = async (id: string) => {
    try {
      await toggleItemStatus(id);
      showToast('Statut modifié avec succès', 'success');
    } catch (err) {
      console.error('Error toggling item status:', err);
      showToast('Erreur lors de la modification du statut', 'error');
    }
  };

  // Gestion des menus
  const handleCreateMenu = () => {
    setCurrentMenu(null);
    menuFormView.openCreate();
  };

  const handleEditMenu = (id: string) => {
    const menu = allMenus.find(menu => menu.id === id);
    if (!menu) return;
    setCurrentMenu(menu);
    menuFormView.openEdit();
  };

  const handleCloseMenuModal = () => {
    menuFormView.close();
    setCurrentMenu(null);
  };

  // ✅ Nouvelle fonction de sauvegarde bulk pour les menus (1 seule requête API)
  const handleBulkMenuSave = async (menuData: any) => {
    try {
      const isUpdate = Boolean(menuData.id);
      
      if (isUpdate) {
        // ✅ Utiliser l'API bulk pour les mises à jour
        const bulkUpdateData = {
          menu: {
            name: menuData.name,
            description: menuData.description || '',
            basePrice: Number(menuData.basePrice),
            isActive: Boolean(menuData.isActive)
          },
          categories: menuData.categories?.map((category: any) => ({
            id: category.id, // Présent = update, absent = create
            itemTypeId: category.itemTypeId,
            isRequired: Boolean(category.isRequired),
            maxSelections: Number(category.maxSelections),
            priceModifier: Number(category.priceModifier),
            // ✅ Seulement les items actifs (pas isDeleted) - suppression automatique par absence
            items: category.localItems?.filter((localItem: any) => !localItem.isDeleted)
              .map((localItem: any) => ({
                id: localItem.originalId || undefined, // originalId = update, undefined = create
                itemId: localItem.itemId,
                supplement: Number(localItem.supplement) || 0,
                isAvailable: Boolean(localItem.isAvailable)
              })) || []
          })) || []
        };

        console.log('🚀 Sauvegarde bulk menu update:', bulkUpdateData);
        await updateMenuBulk(menuData.id, bulkUpdateData);
      } else {
        // ✅ Utiliser l'API bulk pour la création aussi
        const bulkCreateData = {
          menu: {
            name: menuData.name,
            description: menuData.description || '',
            basePrice: Number(menuData.basePrice),
            isActive: Boolean(menuData.isActive)
          },
          categories: menuData.categories?.map((category: any) => ({
            // Pas d'id pour la création (toutes nouvelles catégories)
            itemTypeId: category.itemTypeId,
            isRequired: Boolean(category.isRequired),
            maxSelections: Number(category.maxSelections),
            priceModifier: Number(category.priceModifier),
            // ✅ Seulement les items actifs (pas isDeleted)
            items: category.localItems?.filter((localItem: any) => !localItem.isDeleted)
              .map((localItem: any) => ({
                // Pas d'id pour la création (tous nouveaux items)
                itemId: localItem.itemId,
                supplement: Number(localItem.supplement) || 0,
                isAvailable: Boolean(localItem.isAvailable)
              })) || []
          })) || []
        };

        console.log('🚀 Sauvegarde bulk menu create:', bulkCreateData);
        await createMenuBulk(bulkCreateData);
      }

      showToast(menuData.id ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
      handleCloseMenuModal();

    } catch (err) {
      console.error('Error saving bulk menu:', err);
      showToast('Erreur lors de la sauvegarde du menu', 'error');
      throw err;
    }
  };

  const handleDeleteMenu = async (id: string) => {
    const menu = allMenus.find(menu => menu.id === id);
    if (!menu) return;
    setMenuToDelete(menu);
    setIsDeleteMenuModalVisible(true);
  };

  const confirmDeleteMenu = async () => {
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
  };

  const handleCloseDeleteMenuModal = () => {
    setIsDeleteMenuModalVisible(false);
    setMenuToDelete(null);
  };

  const getItemActions = (item: Item): ActionItem[] => {
    return [
      {
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditItem(item.id ? item.id : '')
      },
      {
        label: item.isActive ? 'Désactiver' : 'Activer',
        icon: <Power size={16} color={item.isActive ? '#EF4444' : '#10B981'} />,
        onPress: () => handleToggleItemStatus(item.id ? item.id : '')
      },
      {
        label: 'Supprimer',
        icon: <Trash size={16} color="#ef4444" />,
        type: 'destructive',
        onPress: () => handleDeleteItem(item.id ? item.id : '')
      }
    ];
  };

  const getMenuActions = (menu: Menu): ActionItem[] => {
    return [
      {
        label: 'Modifier',
        icon: <Edit2 size={16} color="#4F46E5" />,
        onPress: () => handleEditMenu(menu.id)
      },
      {
        label: 'Supprimer',
        icon: <Trash size={16} color="#ef4444" />,
        type: 'destructive',
        onPress: () => handleDeleteMenu(menu.id)
      }
    ];
  };

  const { width } = useWindowDimensions();

  const itemTableColumns = [
    {
      label: 'Nom',
      key: 'name',
      width: '50%',
    },
    {
      label: 'Prix',
      key: 'price',
      width: '20%',
    },
    {
      label: 'Statut',
      key: 'statut',
      width: '20%',
      render: (item: Item) => (
        <Text style={{
          color: item.isActive ? '#10B981' : '#EF4444',
          fontWeight: '500'
        }}>
          {item.isActive ? 'Actif' : 'Inactif'}
        </Text>
      )
    },
    {
      key: 'actions',
      width: '10%',
    }
  ];

  const menuTableColumns = [
    {
      label: 'Nom',
      key: 'name',
      width: '40%',
    },
    {
      label: 'Prix de base',
      key: 'basePrice',
      width: '15%',
      render: (menu: Menu) => (
        <Text>{menu.basePrice.toFixed(2)}€</Text>
      )
    },
    {
      label: 'Catégories',
      key: 'categories',
      width: '25%',
      render: (menu: Menu) => (
        <Text style={{ fontSize: 12, color: '#666666' }}>
          {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) > 1 ? 's' : ''}
        </Text>
      )
    },
    {
      label: 'Statut',
      key: 'statut',
      width: '10%',
      render: (menu: Menu) => (
        <Text style={{
          color: menu.isActive ? '#10B981' : '#EF4444',
          fontWeight: '500'
        }}>
          {menu.isActive ? 'Actif' : 'Inactif'}
        </Text>
      )
    },
    {
      key: 'actions',
      width: '10%',
    }
  ];

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <SidePanel
        title="Filtrage"
        width={width / 4}
        isCollapsed={isPanelCollapsed}
        onCollapsedChange={setIsPanelCollapsed}
      >
        <MenuFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      </SidePanel>
      <View style={{ flex: 1 }}>
        <Tabs
          style={{ flex: 1, backgroundColor: '#FFFFFF' }}
          value={activeTab}
          onValueChange={(newValue: string) => {
            setActiveTab(newValue);
          }}
          className="w-full mx-auto flex-col"
        >
          <View
            style={{
              backgroundColor: '#FBFBFB',
              height: 50,
              flexDirection: 'row'
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              bounces={false}
              style={{
                flex: 1
              }}
              contentContainerStyle={{
                alignItems: 'center'
              }}
            >
              <TabsList
                className="flex-row justify-start h-full"
                style={{
                  paddingTop: 4,
                  height: 50,
                }}
              >
                <TabsTrigger value="menus" className="flex-row h-full" style={{ width: 100, minWidth: 100 }}>
                  <Text
                    style={{ color: activeTab === 'menus' ? '#2A2E33' : '#A0A0A0' }}
                  >
                    Menus
                  </Text>
                </TabsTrigger>
                <TabsTrigger value="items" className="flex-row h-full" style={{ width: 100, minWidth: 100 }}>
                  <Text
                    style={{ color: activeTab === 'items' ? '#2A2E33' : '#A0A0A0' }}
                  >
                    Articles
                  </Text>
                </TabsTrigger>
                {itemTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id!}
                    className="flex-row h-full"
                    style={{ minWidth: 100, paddingHorizontal: 10 }}
                  >
                    <Text
                      style={{ color: activeTab === type.id ? '#2A2E33' : '#A0A0A0' }}
                    >
                      {type.name}
                    </Text>
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollView>

            <View
              style={{
                width: 200,
                backgroundColor: '#FBFBFB',
                shadowColor: '#000',
                shadowOffset: { width: -4, height: 0 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              }}
            >
              <Button
                onPress={activeTab === 'menus' ? handleCreateMenu : handleCreateItem}
                className="w-[200px] h-[50px] flex items-center justify-center"
                style={{
                  backgroundColor: '#2A2E33',
                  borderRadius: 0,
                  height: 50,
                  width: 200,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: '#FBFBFB',
                    fontWeight: '500',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeTab === 'menus' ? 'Créer un menu' : 'Créer un article'}
                </Text>
              </Button>
            </View>
          </View>

          <TabsContent style={{ flex: 1 }} value={activeTab}>
            {activeTab === 'menus' ? (
              // Affichage des menus
              menusLoading || globalLoading || menusError ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: menusError ? '#ef4444' : '#666', fontSize: 16 }}>
                    {menusLoading || globalLoading ? 'Chargement...' : menusError || 'Erreur lors du chargement'}
                  </Text>
                </View>
              ) : (
                // Table des menus
                <ForkTable
                  data={filteredMenus}
                  columns={menuTableColumns}
                  onRowPress={handleEditMenu}
                  onRowDelete={handleDeleteMenu}
                  useActionMenu={true}
                  getActions={getMenuActions}
                  isLoading={menusLoading}
                  loadingMessage="Chargement des menus..."
                  emptyMessage="Aucun menu trouvé"
                />
              )
            ) : (
              // Affichage des items (articles)
              loading || globalLoading || error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Text style={{ color: error ? '#ef4444' : '#666', fontSize: 16 }}>
                    {loading || globalLoading ? 'Chargement...' : error || 'Erreur lors du chargement'}
                  </Text>
                </View>
              ) : (
                <ForkTable
                  data={filteredItems}
                  columns={itemTableColumns}
                  onRowPress={handleEditItem}
                  onRowDelete={handleDeleteItem}
                  useActionMenu={true}
                  getActions={getItemActions}
                  isLoading={loading}
                  loadingMessage="Chargement des articles..."
                  emptyMessage="Aucun article trouvé"
                />
              )
            )}
          </TabsContent>
        </Tabs>
      </View>

      {/* Vue formulaire pour les items */}
      <AdminFormView
        visible={itemFormView.isVisible}
        mode={itemFormView.mode}
        title={
          itemFormView.mode === 'create'
            ? "Création d'un article"
            : currentItem
              ? `Modification de "${currentItem.name}"`
              : "Modifier l'article"
        }
        onClose={handleCloseItemModal}
        onCancel={handleCloseItemModal}
        onSave={async (getFormData) => {
          const formData = getFormData();
          if (!formData.isValid) return false;

          try {
            await handleSaveItem(formData.data);
            return true;
          } catch (error) {
            console.error('Erreur lors de la sauvegarde de l\'article:', error);
            return false;
          }
        }}
      >
        <MenuForm
          item={currentItem}
          itemTypes={itemTypes}
          activeTab={activeTab}
        />
      </AdminFormView>

      {/* Vue formulaire pour les menus */}
      <AdminFormView
        visible={menuFormView.isVisible}
        mode={menuFormView.mode}
        title={
          menuFormView.mode === 'create'
            ? "Création d'un menu"
            : currentMenu
              ? `Modification de "${currentMenu.name}"`
              : "Modifier le menu"
        }
        onClose={handleCloseMenuModal}
        onCancel={handleCloseMenuModal}
        scrollViewRef={menuScrollViewRef}
        onSave={async (getFormData) => {
          const formData = getFormData();
          if (!formData.isValid) return false;

          try {
            await handleBulkMenuSave(formData.data);
            return true;
          } catch (error) {
            console.error('Erreur lors de la sauvegarde du menu:', error);
            return false;
          }
        }}
      >
        <MenuEditor
          menu={currentMenu}
          items={items}
          itemTypes={itemTypes}
          onCreateMenuCategoryItem={createMenuCategoryItem}
          onUpdateMenuCategoryItem={updateMenuCategoryItem}
          onDeleteMenuCategoryItem={deleteMenuCategoryItem}
          onLoadMenuCategoryItems={loadMenuCategoryItems}
          scrollViewRef={menuScrollViewRef}
        />
      </AdminFormView>

      {/* Modal de suppression des items */}
      <DeleteConfirmationModal
        isVisible={isDeleteItemModalVisible}
        onClose={handleCloseDeleteItemModal}
        onConfirm={confirmDeleteItem}
        entityName={itemToDelete?.name || ''}
        entityType="l'article"
        isLoading={isDeleting}
      />

      {/* Modal de suppression des menus */}
      <DeleteConfirmationModal
        isVisible={isDeleteMenuModalVisible}
        onClose={handleCloseDeleteMenuModal}
        onConfirm={confirmDeleteMenu}
        entityName={menuToDelete?.name || ''}
        entityType="le menu"
        isLoading={isDeletingMenu}
      />
    </View>
  );
}