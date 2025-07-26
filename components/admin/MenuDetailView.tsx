import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Button } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { Plus, Trash2, Edit, Package } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';

interface MenuDetailViewProps {
  menu: Menu;
  items: Item[];
  onEditMenu: (menuId: string) => void;
  onDeleteMenu: (menuId: string) => void;
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<void>;
  onUpdateMenuCategoryItem: (id: string, data: Partial<MenuCategoryItem>) => Promise<void>;
  onDeleteMenuCategoryItem: (id: string) => Promise<void>;
  onLoadMenuCategoryItems: (menuCategoryId: string) => Promise<MenuCategoryItem[]>;
}

interface CategoryItemFormData {
  itemId: string;
  supplement: string;
  isAvailable: boolean;
}

export function MenuDetailView({
  menu,
  items,
  onEditMenu,
  onDeleteMenu,
  onCreateMenuCategoryItem,
  onUpdateMenuCategoryItem,
  onDeleteMenuCategoryItem,
  onLoadMenuCategoryItems
}: MenuDetailViewProps) {
  const [categoryItems, setCategoryItems] = useState<Record<string, MenuCategoryItem[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, CategoryItemFormData>>({});

  const { showToast } = useToast();

  useEffect(() => {
    // Charger les items pour toutes les catégories (une seule fois par catégorie)
    if (menu.categories) {
      menu.categories.forEach(category => {
        if (!loadedCategories.has(category.id)) {
          loadCategoryItems(category.id);
        }
      });
    }
  }, [menu.id]); // Ne dépendre que de l'ID du menu

  // Reset les données chargées quand on change de menu
  useEffect(() => {
    setLoadedCategories(new Set());
    setCategoryItems({});
    setLoadingCategories({});
    setShowAddForm({});
    setFormData({});
  }, [menu.id]);

  const loadCategoryItems = useCallback(async (categoryId: string) => {
    // Éviter les appels multiples
    if (loadingCategories[categoryId] || loadedCategories.has(categoryId)) {
      return;
    }

    setLoadingCategories(prev => ({ ...prev, [categoryId]: true }));
    try {
      console.log(`🔄 Chargement des items pour la catégorie: ${categoryId}`);
      const items = await onLoadMenuCategoryItems(categoryId);
      console.log(`✅ Items chargés pour ${categoryId}:`, items.length);
      
      setCategoryItems(prev => ({ ...prev, [categoryId]: items }));
      setLoadedCategories(prev => new Set([...prev, categoryId]));
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
      showToast('Erreur lors du chargement des articles', 'error');
    } finally {
      setLoadingCategories(prev => ({ ...prev, [categoryId]: false }));
    }
  }, [loadingCategories, loadedCategories, onLoadMenuCategoryItems, showToast]);

  const getAvailableItems = (category: MenuCategory) => {
    const assignedItemIds = categoryItems[category.id]?.map(ci => ci.itemId) || [];
    return items.filter(item => 
      item.itemType?.id === category.itemTypeId &&
      !assignedItemIds.includes(item.id) &&
      item.isActive
    );
  };

  const handleAddItem = async (categoryId: string) => {
    const data = formData[categoryId];
    if (!data || !data.itemId) {
      showToast('Veuillez sélectionner un article', 'warning');
      return;
    }

    try {
      const menuCategoryItemData: Partial<MenuCategoryItem> = {
        menuCategoryId: categoryId,
        itemId: data.itemId,
        supplement: parseFloat(data.supplement) || 0,
        isAvailable: data.isAvailable
      };

      await onCreateMenuCategoryItem(menuCategoryItemData);
      showToast('Article ajouté avec succès', 'success');
      
      // Forcer le rechargement en retirant la catégorie des catégories chargées
      setLoadedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
      
      // Recharger les items de cette catégorie
      loadCategoryItems(categoryId);
      
      // Reset form
      setFormData(prev => ({ ...prev, [categoryId]: { itemId: '', supplement: '0', isAvailable: true } }));
      setShowAddForm(prev => ({ ...prev, [categoryId]: false }));
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showToast('Erreur lors de l\'ajout de l\'article', 'error');
    }
  };

  const handleUpdateItem = async (menuCategoryItem: MenuCategoryItem, updates: Partial<MenuCategoryItem>) => {
    try {
      await onUpdateMenuCategoryItem(menuCategoryItem.id, updates);
      showToast('Article mis à jour', 'success');
      
      // Forcer le rechargement
      setLoadedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(menuCategoryItem.menuCategoryId);
        return newSet;
      });
      
      loadCategoryItems(menuCategoryItem.menuCategoryId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDeleteItem = async (menuCategoryItem: MenuCategoryItem) => {
    Alert.alert(
      'Supprimer l\'article',
      `Êtes-vous sûr de vouloir retirer "${menuCategoryItem.item?.name}" de cette catégorie ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteMenuCategoryItem(menuCategoryItem.id);
              showToast('Article retiré avec succès', 'success');
              
              // Forcer le rechargement
              setLoadedCategories(prev => {
                const newSet = new Set(prev);
                newSet.delete(menuCategoryItem.menuCategoryId);
                return newSet;
              });
              
              loadCategoryItems(menuCategoryItem.menuCategoryId);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              showToast('Erreur lors de la suppression', 'error');
            }
          }
        }
      ]
    );
  };

  const initFormData = (categoryId: string) => {
    if (!formData[categoryId]) {
      setFormData(prev => ({
        ...prev,
        [categoryId]: { itemId: '', supplement: '0', isAvailable: true }
      }));
    }
  };

  const updateFormData = (categoryId: string, field: keyof CategoryItemFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [field]: value }
    }));
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* En-tête du menu */}
      <View style={{
        backgroundColor: '#F9FAFB',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB'
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>
              🍽️ {menu.name}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#059669', marginBottom: 8 }}>
              Prix de base: {menu.basePrice.toFixed(2)}€
            </Text>
            {menu.description && (
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12, lineHeight: 20 }}>
                {menu.description}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: menu.isActive ? '#D1FAE5' : '#FEE2E2'
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: menu.isActive ? '#065F46' : '#991B1B'
                }}>
                  {menu.isActive ? 'Actif' : 'Inactif'}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#6B7280', marginLeft: 12 }}>
                {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => onEditMenu(menu.id)}
              style={{
                backgroundColor: '#3B82F6',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Edit size={16} color="white" />
            </Pressable>
            <Pressable
              onPress={() => onDeleteMenu(menu.id)}
              style={{
                backgroundColor: '#EF4444',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={16} color="white" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Catégories du menu */}
      {menu.categories && menu.categories.length > 0 ? (
        <View style={{ gap: 16 }}>
          {menu.categories.map((category) => {
            const categoryItemsList = categoryItems[category.id] || [];
            const availableItems = getAvailableItems(category);
            const isLoading = loadingCategories[category.id];
            const isFormVisible = showAddForm[category.id];
            const currentFormData = formData[category.id] || { itemId: '', supplement: '0', isAvailable: true };

            return (
              <View
                key={category.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1
                }}
              >
                {/* En-tête de la catégorie */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                      {category.itemType?.name}
                      {category.isRequired && <Text style={{ color: '#DC2626' }}> *</Text>}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                      Max {category.maxSelections} sélection{category.maxSelections > 1 ? 's' : ''}
                      {category.priceModifier && category.priceModifier !== 0 && (
                        <Text> • Modificateur: {category.priceModifier.toFixed(2)}€</Text>
                      )}
                    </Text>
                  </View>
                  
                  {availableItems.length > 0 && (
                    <Button
                      onPress={() => {
                        initFormData(category.id);
                        setShowAddForm(prev => ({ ...prev, [category.id]: !prev[category.id] }));
                      }}
                      style={{
                        backgroundColor: '#10B981',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Plus size={14} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '500', marginLeft: 4 }}>
                          Ajouter
                        </Text>
                      </View>
                    </Button>
                  )}
                </View>

                {/* Formulaire d'ajout */}
                {isFormVisible && (
                  <View style={{
                    backgroundColor: '#F3F4F6',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 12
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8 }}>
                      Ajouter un article
                    </Text>
                    
                    <View style={{ gap: 8 }}>
                      <Select
                        choices={availableItems.map(item => ({
                          label: `${item.name} (${item.price}€)`,
                          value: item.id,
                          id: item.id
                        }))}
                        selectedValue={currentFormData.itemId ? {
                          label: availableItems.find(i => i.id === currentFormData.itemId)?.name || '',
                          value: currentFormData.itemId,
                          id: currentFormData.itemId
                        } : { label: 'Sélectionner un article', value: '', id: '' }}
                        onValueChange={(option) => {
                          if (option) {
                            updateFormData(category.id, 'itemId', option.id);
                          }
                        }}
                        placeholder="Sélectionner un article"
                      />
                      
                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, marginBottom: 4 }}>Supplément (€)</Text>
                          <TextInput
                            value={currentFormData.supplement}
                            onChangeText={(value) => updateFormData(category.id, 'supplement', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            style={{
                              borderWidth: 1,
                              borderColor: '#D1D5DB',
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 6,
                              fontSize: 14,
                              backgroundColor: 'white'
                            }}
                          />
                        </View>
                        
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <Button
                            onPress={() => handleAddItem(category.id)}
                            style={{ backgroundColor: '#10B981', paddingHorizontal: 12 }}
                          >
                            <Text style={{ color: 'white', fontSize: 12 }}>Ajouter</Text>
                          </Button>
                          <Button
                            onPress={() => setShowAddForm(prev => ({ ...prev, [category.id]: false }))}
                            style={{ backgroundColor: '#6B7280', paddingHorizontal: 12 }}
                          >
                            <Text style={{ color: 'white', fontSize: 12 }}>Annuler</Text>
                          </Button>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* Liste des articles assignés */}
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 }}>
                    Articles assignés ({categoryItemsList.length})
                  </Text>
                  
                  {isLoading ? (
                    <Text style={{ color: '#6B7280', fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 }}>
                      Chargement...
                    </Text>
                  ) : categoryItemsList.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <Package size={24} color="#D1D5DB" />
                      <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                        {availableItems.length === 0 ? 
                          'Tous les articles de ce type sont déjà assignés' : 
                          'Aucun article assigné'
                        }
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {categoryItemsList.map((menuCategoryItem) => (
                        <View
                          key={menuCategoryItem.id}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 8,
                            backgroundColor: '#F9FAFB',
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: '#E5E7EB'
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500' }}>
                              {menuCategoryItem.item?.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>
                              Prix: {menuCategoryItem.item?.price}€
                              {menuCategoryItem.supplement > 0 && (
                                <Text> • Supplément: +{menuCategoryItem.supplement.toFixed(2)}€</Text>
                              )}
                            </Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            {/* Toggle disponibilité */}
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
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>✓</Text>
                              )}
                            </Pressable>
                            
                            {/* Bouton supprimer */}
                            <Pressable
                              onPress={() => handleDeleteItem(menuCategoryItem)}
                              style={{
                                backgroundColor: '#EF4444',
                                padding: 4,
                                borderRadius: 4
                              }}
                            >
                              <Trash2 size={12} color="white" />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Package size={48} color="#D1D5DB" />
          <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF', marginTop: 12 }}>
            Aucune catégorie configurée
          </Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
            Modifiez ce menu pour ajouter des catégories
          </Text>
        </View>
      )}
    </ScrollView>
  );
}