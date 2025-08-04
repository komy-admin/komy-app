import { useWindowDimensions, View, ScrollView, Text, StyleSheet } from "react-native";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, ForkTable } from "~/components/ui";
import { SidePanel } from "~/components/SidePanel";
import React, { useState, useMemo, useRef } from "react";
import { Item } from "~/types/item.types";
import { Menu } from "~/types/menu.types";
import { CustomModal } from "~/components/CustomModal";
import { MenuForm } from "~/components/form/MenuForm";
import { useToast } from '~/components/ToastProvider';
import { useMenu, useRestaurant } from '~/hooks/useRestaurant';
import { useMenus } from '~/hooks/useMenus';
import { MenuCategoryItem } from '~/types/menu.types';
import { MenuFilters, MenuFilterState } from '~/components/filters/MenuFilters';
import { filterMenuItems, createEmptyMenuFilters } from '~/utils/menuFilters';
import { CreditCard as Edit2, Trash, Power, UtensilsCrossed } from 'lucide-react-native';
import { ActionItem } from '~/components/ActionMenu';
import { MenuEditor } from '~/components/admin/MenuEditor';
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
  const { allMenus, loading: menusLoading, error: menusError, createMenu, updateMenu, deleteMenu, createMenuCategoryItem, updateMenuCategoryItem, deleteMenuCategoryItem, loadMenuCategoryItems } = useMenus();

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

  // Plus besoin de charger manuellement - useAppInit gère l'initialisation automatique

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

  const handleSaveMenu = async (menuData: Partial<Menu>) => {
    try {
      if (menuData.id) {
        await updateMenu(menuData.id, menuData);
        showToast('Menu modifié avec succès', 'success');
      } else {
        await createMenu(menuData);
        showToast('Menu créé avec succès', 'success');
      }
      handleCloseMenuModal();
    } catch (err) {
      console.error('Error saving menu:', err);
      showToast('Erreur lors de la sauvegarde du menu', 'error');
    }
  };

  // Nouvelle fonction de sauvegarde complexe pour les menus avec catégories et articles locaux
  const handleComplexMenuSave = async (menuData: any) => {
    try {
      // Préparer les données : convertir les localItems en vraies catégories avec leurs items
      const processedCategories = menuData.categories?.map((category: any) => {
        // Créer la catégorie de base
        const categoryBase = {
          id: category.id,
          itemTypeId: category.itemTypeId,
          isRequired: category.isRequired,
          maxSelections: category.maxSelections,
          priceModifier: category.priceModifier,
          itemType: category.itemType
        };
        
        return categoryBase;
      }) || [];
      
      const processedMenuData = {
        ...menuData,
        categories: processedCategories
      };
      
      let savedMenu: Menu;
      const isUpdate = Boolean(menuData.id);
      
      // 1. Sauvegarder le menu avec ses catégories (le hook gère déjà cela)
      if (isUpdate) {
        savedMenu = await updateMenu(menuData.id, processedMenuData);
      } else {
        savedMenu = await createMenu(processedMenuData);
      }
      
      // 2. Traiter SEULEMENT les nouveaux articles ajoutés localement
      if (menuData.categories && savedMenu.categories) {
        
        for (let i = 0; i < menuData.categories.length; i++) {
          const originalCategory = menuData.categories[i];
          const savedCategory = savedMenu.categories[i];
          
          if (originalCategory.localItems && originalCategory.localItems.length > 0) {
            // Séparer les différents types d'opérations
            const newLocalItems = originalCategory.localItems.filter((localItem: any) => 
              localItem.tempId.startsWith('local-')
            );
            
            const modifiedItems = originalCategory.localItems.filter((localItem: any) => 
              localItem.originalId && localItem.isModified && !localItem.isDeleted
            );
            
            const deletedItems = originalCategory.localItems.filter((localItem: any) => 
              localItem.originalId && localItem.isDeleted
            );
            
            // 1. Créer les nouveaux items
            for (const localItem of newLocalItems) {
              if (localItem.itemId && savedCategory.id) {
                const menuCategoryItemData = {
                  menuCategoryId: savedCategory.id,
                  itemId: localItem.itemId,
                  supplement: Number(localItem.supplement) || 0,
                  isAvailable: Boolean(localItem.isAvailable)
                };
                
                await createMenuCategoryItem(menuCategoryItemData);
              }
            }
            
            // 2. Mettre à jour les items modifiés
            for (const localItem of modifiedItems) {
              if (localItem.originalId) {
                const updateData = {
                  supplement: Number(localItem.supplement) || 0,
                  isAvailable: Boolean(localItem.isAvailable)
                };
                
                await updateMenuCategoryItem(localItem.originalId, updateData);
              }
            }
            
            // 3. Supprimer les items marqués comme supprimés
            for (const localItem of deletedItems) {
              if (localItem.originalId) {
                await deleteMenuCategoryItem(localItem.originalId);
              }
            }
          }
        }
      }
      
      showToast(menuData.id ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
      handleCloseMenuModal();
      
    } catch (err) {
      console.error('Error saving complex menu:', err);
      showToast('Erreur lors de la sauvegarde du menu', 'error');
      throw err; // Re-throw pour que AdminFormView sache que ça a échoué
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

  const { width, height } = useWindowDimensions();

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
              flexDirection: 'row',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{
                flex: 1,
                maxWidth: '80%'
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
                    style={{ width: 100, minWidth: 100 }}
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
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: '#FBFBFB',
                zIndex: 10,
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
            await handleComplexMenuSave(formData.data);
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

const styles = StyleSheet.create({});