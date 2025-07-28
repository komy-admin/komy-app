import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { Button, ForkTable } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { Plus, Trash2, Settings } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { ItemType } from '@/types/item-type.types';

interface MenuConfigurationProps {
  menus: Menu[];
  items: Item[];
  itemTypes: ItemType[];
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<void>;
  onUpdateMenuCategoryItem: (id: string, data: Partial<MenuCategoryItem>) => Promise<void>;
  onDeleteMenuCategoryItem: (id: string) => Promise<void>;
  onLoadMenuCategoryItems: (menuCategoryId: string) => Promise<MenuCategoryItem[]>;
}

interface ItemAssignmentFormData {
  itemId: string;
  supplement: string;
  isAvailable: boolean;
}

export function MenuConfiguration({
  menus,
  items,
  itemTypes,
  onCreateMenuCategoryItem,
  onUpdateMenuCategoryItem,
  onDeleteMenuCategoryItem,
  onLoadMenuCategoryItems
}: MenuConfigurationProps) {
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [categoryItems, setCategoryItems] = useState<MenuCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignFormData, setAssignFormData] = useState<ItemAssignmentFormData>({
    itemId: '',
    supplement: '0',
    isAvailable: true
  });

  const { showToast } = useToast();

  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0]);
    }
  }, [menus, selectedMenu]);

  useEffect(() => {
    if (selectedMenu && selectedMenu.categories && selectedMenu.categories.length > 0) {
      setSelectedCategory(selectedMenu.categories[0]);
    }
  }, [selectedMenu]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryItems();
    }
  }, [selectedCategory]);

  const loadCategoryItems = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      const items = await onLoadMenuCategoryItems(selectedCategory.id);
      setCategoryItems(items);
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
      showToast('Erreur lors du chargement des articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = (menuId: string) => {
    const menu = menus.find(m => m.id === menuId);
    if (menu) {
      setSelectedMenu(menu);
      setSelectedCategory(null);
      setCategoryItems([]);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    const category = selectedMenu?.categories?.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleAssignItem = async () => {
    if (!selectedCategory || !assignFormData.itemId) {
      showToast('Veuillez sélectionner un article', 'warning');
      return;
    }

    // Vérifier si l'item est déjà assigné
    const existingItem = categoryItems.find(ci => ci.itemId === assignFormData.itemId);
    if (existingItem) {
      showToast('Cet article est déjà assigné à cette catégorie', 'warning');
      return;
    }

    try {
      const menuCategoryItemData: Partial<MenuCategoryItem> = {
        menuCategoryId: selectedCategory.id,
        itemId: assignFormData.itemId,
        supplement: assignFormData.supplement,
        isAvailable: assignFormData.isAvailable
      };

      await onCreateMenuCategoryItem(menuCategoryItemData);
      showToast('Article assigné avec succès', 'success');

      // Recharger les items
      loadCategoryItems();

      // Reset form
      setAssignFormData({
        itemId: '',
        supplement: '0',
        isAvailable: true
      });
      setShowAssignForm(false);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      showToast('Erreur lors de l\'assignation de l\'article', 'error');
    }
  };

  const handleUpdateItem = async (menuCategoryItem: MenuCategoryItem, updates: Partial<MenuCategoryItem>) => {
    try {
      await onUpdateMenuCategoryItem(menuCategoryItem.id, updates);
      showToast('Article mis à jour avec succès', 'success');
      loadCategoryItems();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteItem = async (menuCategoryItemId: string) => {
    await onDeleteMenuCategoryItem(menuCategoryItemId);
    showToast('Article retiré avec succès', 'success');
    loadCategoryItems();
  };

  // Items disponibles pour assignation (non déjà assignés à cette catégorie)
  const availableItems = items.filter(item =>
    item.itemType?.id === selectedCategory?.itemTypeId &&
    !categoryItems.some(ci => ci.itemId === item.id)
  );

  const categoryItemsTableColumns = [
    {
      label: 'Article',
      key: 'item',
      width: '40%',
      render: (menuCategoryItem: MenuCategoryItem) => (
        <View>
          <Text style={{ fontWeight: '600', fontSize: 14 }}>
            {menuCategoryItem.item?.name}
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {menuCategoryItem.item?.price}€
          </Text>
        </View>
      )
    },
    {
      label: 'Supplément',
      key: 'supplement',
      width: '20%',
      render: (menuCategoryItem: MenuCategoryItem) => {
        const supplement = parseFloat(menuCategoryItem.supplement);
        return (
          <TextInput
            value={menuCategoryItem.supplement}
            onChangeText={(value) => handleUpdateItem(menuCategoryItem, { supplement: value })}
            onBlur={() => { }} // Update is handled in onChangeText
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              fontSize: 14,
              backgroundColor: 'white',
              minWidth: 60
            }}
          />
        );
      }
    },
    {
      label: 'Disponible',
      key: 'isAvailable',
      width: '20%',
      render: (menuCategoryItem: MenuCategoryItem) => (
        <Pressable
          onPress={() => handleUpdateItem(menuCategoryItem, { isAvailable: !menuCategoryItem.isAvailable })}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: menuCategoryItem.isAvailable ? '#10B981' : '#D1D5DB',
            backgroundColor: menuCategoryItem.isAvailable ? '#10B981' : 'white',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {menuCategoryItem.isAvailable && (
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
          )}
        </Pressable>
      )
    },
    {
      key: 'actions',
      width: '20%'
    }
  ];

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* En-tête avec sélecteurs */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
          Configuration des menus
        </Text>

        {/* Sélecteur de menu */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Menu à configurer
          </Text>
          {menus.length > 0 ? (
            <Select
              choices={menus.map(menu => ({
                label: `${menu.name} (${menu.basePrice}€)`,
                value: menu.id,
                id: menu.id
              }))}
              selectedValue={selectedMenu ? {
                label: `${selectedMenu.name} (${selectedMenu.basePrice}€)`,
                value: selectedMenu.id,
                id: selectedMenu.id
              } : { label: 'Sélectionner un menu', value: '', id: '' }}
              onValueChange={(option) => {
                if (option) {
                  handleMenuSelect(option.id);
                }
              }}
              placeholder="Sélectionner un menu"
            />
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>
              Aucun menu disponible. Créez d'abord un menu.
            </Text>
          )}
        </View>

        {/* Sélecteur de catégorie */}
        {selectedMenu && selectedMenu.categories && selectedMenu.categories.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
              Catégorie à configurer
            </Text>
            <Select
              choices={selectedMenu.categories.map(category => ({
                label: `${category.itemType?.name} ${category.isRequired ? '(Obligatoire)' : '(Optionnel)'}`,
                value: category.id,
                id: category.id
              }))}
              selectedValue={selectedCategory ? {
                label: `${selectedCategory.itemType?.name} ${selectedCategory.isRequired ? '(Obligatoire)' : '(Optionnel)'}`,
                value: selectedCategory.id,
                id: selectedCategory.id
              } : { label: 'Sélectionner une catégorie', value: '', id: '' }}
              onValueChange={(option) => {
                if (option) {
                  handleCategorySelect(option.id);
                }
              }}
              placeholder="Sélectionner une catégorie"
            />
          </View>
        )}
      </View>

      {/* Section d'assignation */}
      {selectedCategory && (
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
              Articles assignés ({categoryItems.length})
            </Text>

            {availableItems.length > 0 && (
              <Button
                onPress={() => setShowAssignForm(!showAssignForm)}
                style={{ backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center' }}
              >
                <Plus size={16} color="white" style={{ marginRight: 4 }} />
                <Text style={{ color: 'white', fontWeight: '500' }}>
                  Assigner un article
                </Text>
              </Button>
            )}
          </View>

          {/* Formulaire d'assignation */}
          {showAssignForm && (
            <View style={{
              backgroundColor: '#F9FAFB',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E5E7EB'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
                Assigner un nouvel article
              </Text>

              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'end' }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 12, marginBottom: 4, color: '#374151' }}>Article</Text>
                  <Select
                    choices={availableItems.map(item => ({
                      label: `${item.name} (${item.price}€)`,
                      value: item.id,
                      id: item.id
                    }))}
                    selectedValue={assignFormData.itemId ? {
                      label: availableItems.find(i => i.id === assignFormData.itemId)?.name || '',
                      value: assignFormData.itemId,
                      id: assignFormData.itemId
                    } : { label: 'Sélectionner un article', value: '', id: '' }}
                    onValueChange={(option) => {
                      if (option) {
                        setAssignFormData(prev => ({ ...prev, itemId: option.id }));
                      }
                    }}
                    placeholder="Sélectionner un article"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, marginBottom: 4, color: '#374151' }}>Supplément (€)</Text>
                  <TextInput
                    value={assignFormData.supplement}
                    onChangeText={(value) => setAssignFormData(prev => ({ ...prev, supplement: value }))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    style={{
                      borderWidth: 1,
                      borderColor: '#D1D5DB',
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      backgroundColor: 'white'
                    }}
                  />
                </View>

                <Button
                  onPress={handleAssignItem}
                  style={{ backgroundColor: '#10B981' }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Assigner</Text>
                </Button>

                <Button
                  onPress={() => setShowAssignForm(false)}
                  style={{ backgroundColor: '#EF4444' }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Annuler</Text>
                </Button>
              </View>
            </View>
          )}

          {/* Table des articles assignés */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#666' }}>Chargement des articles...</Text>
            </View>
          ) : (
            <ForkTable
              data={categoryItems}
              columns={categoryItemsTableColumns}
              onRowDelete={(id) => handleDeleteItem(id)}
              useActionMenu={true}
              getActions={(item: MenuCategoryItem) => [
                {
                  icon: Trash2,
                  label: 'Retirer',
                  onPress: () => handleDeleteItem(item.id),
                  variant: 'destructive' as const
                }
              ]}
              isLoading={loading}
              loadingMessage="Chargement des articles..."
              emptyMessage={availableItems.length === 0 ?
                "Tous les articles de ce type sont déjà assignés" :
                "Aucun article assigné à cette catégorie"
              }
            />
          )}
        </View>
      )}

      {!selectedMenu && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Settings size={48} color="#ccc" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16, textAlign: 'center' }}>
            Configuration des menus
          </Text>
          <Text style={{ fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Sélectionnez un menu pour commencer à configurer les articles disponibles dans chaque catégorie.
          </Text>
        </View>
      )}
    </View>
  );
}