import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Button } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item, ItemType } from '~/types/item.types';
import { Plus, Trash2, Edit3, Save, X, Package, Settings } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';

interface MenuEditorProps {
  menu?: Menu | null; // Si null = création, sinon modification
  items: Item[];
  itemTypes: ItemType[];
  onSave: (menuData: Partial<Menu>) => Promise<void>;
  onCancel: () => void;
  // Actions pour les categories (hooks via le store)
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<void>;
  onUpdateMenuCategoryItem: (id: string, data: Partial<MenuCategoryItem>) => Promise<void>;
  onDeleteMenuCategoryItem: (id: string) => Promise<void>;
  onLoadMenuCategoryItems: (menuCategoryId: string) => Promise<MenuCategoryItem[]>;
}

interface MenuFormData {
  name: string;
  description: string;
  basePrice: string;
  isActive: boolean;
  categories: MenuCategoryFormData[];
}

interface MenuCategoryFormData {
  id?: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: number;
  priceModifier: string;
}

interface CategoryItemFormData {
  itemId: string;
  supplement: string;
  isAvailable: boolean;
}

export function MenuEditor({
  menu,
  items,
  itemTypes,
  onSave,
  onCancel,
  onCreateMenuCategoryItem,
  onUpdateMenuCategoryItem,
  onDeleteMenuCategoryItem,
  onLoadMenuCategoryItems
}: MenuEditorProps) {
  const [formData, setFormData] = useState<MenuFormData>({
    name: menu?.name || '',
    description: menu?.description || '',
    basePrice: menu?.basePrice?.toString() || '',
    isActive: menu?.isActive ?? true,
    categories: menu?.categories?.map(cat => ({
      id: cat.id,
      itemTypeId: cat.itemTypeId,
      isRequired: cat.isRequired,
      maxSelections: cat.maxSelections,
      priceModifier: cat.priceModifier?.toString() || '0',
    })) || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // États pour la gestion des MenuCategoryItems
  const [categoryItems, setCategoryItems] = useState<Record<string, MenuCategoryItem[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Record<string, boolean>>({});
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());
  const [showAddItemForm, setShowAddItemForm] = useState<Record<string, boolean>>({});
  const [itemFormData, setItemFormData] = useState<Record<string, CategoryItemFormData>>({});
  const [categorySelections, setCategorySelections] = useState<Record<number, any>>({});

  const { showToast } = useToast();

  // Charger les items des catégories existantes (pour modification)
  useEffect(() => {
    if (menu && menu.categories) {
      menu.categories.forEach(category => {
        if (category.id && !loadedCategories.has(category.id)) {
          loadCategoryItems(category.id);
        }
      });
    }
  }, [menu?.id]);

  // Reset pour nouveau menu
  useEffect(() => {
    if (!menu) {
      setLoadedCategories(new Set());
      setCategoryItems({});
      setLoadingCategories({});
      setShowAddItemForm({});
      setItemFormData({});
    }
  }, [menu]);

  // Initialiser les sélections de catégories
  useEffect(() => {
    const selections: Record<number, any> = {};
    formData.categories.forEach((cat, index) => {
      const itemType = itemTypes.find(type => type.id === cat.itemTypeId);
      if (itemType) {
        selections[index] = {
          value: itemType.name,
          label: itemType.name,
          id: itemType.id
        };
      }
    });
    setCategorySelections(selections);
  }, [formData.categories, itemTypes]);

  const loadCategoryItems = useCallback(async (categoryId: string) => {
    if (loadingCategories[categoryId] || loadedCategories.has(categoryId)) {
      return;
    }

    setLoadingCategories(prev => ({ ...prev, [categoryId]: true }));
    try {
      const items = await onLoadMenuCategoryItems(categoryId);
      setCategoryItems(prev => ({ ...prev, [categoryId]: items }));
      setLoadedCategories(prev => new Set([...prev, categoryId]));
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
      showToast('Erreur lors du chargement des articles', 'error');
    } finally {
      setLoadingCategories(prev => ({ ...prev, [categoryId]: false }));
    }
  }, [loadingCategories, loadedCategories, onLoadMenuCategoryItems, showToast]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    const basePrice = parseFloat(formData.basePrice);
    if (!formData.basePrice || isNaN(basePrice) || basePrice < 0) {
      newErrors.basePrice = 'Le prix de base doit être un nombre positif';
    }
    
    if (formData.categories.length === 0) {
      newErrors.categories = 'Au moins une catégorie est requise';
    }
    
    formData.categories.forEach((category, index) => {
      if (!category.itemTypeId) {
        newErrors[`category_${index}_type`] = 'Type d\'item requis';
      }
      if (category.maxSelections < 1) {
        newErrors[`category_${index}_max`] = 'Au moins 1 sélection requise';
      }
      const priceModifier = parseFloat(category.priceModifier);
      if (isNaN(priceModifier) || priceModifier < 0) {
        newErrors[`category_${index}_price`] = 'Le modificateur de prix doit être un nombre positif ou zéro';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const menuData: Partial<Menu> = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        categories: formData.categories.map(cat => ({
          ...cat,
          priceModifier: parseFloat(cat.priceModifier) || 0,
          itemType: itemTypes.find(type => type.id === cat.itemTypeId)!,
        } as Partial<MenuCategory>)),
      };
      
      if (menu?.id) {
        menuData.id = menu.id;
      }
      
      await onSave(menuData);
      showToast(menu ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showToast('Erreur lors de la sauvegarde du menu', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = () => {
    const newCategory: MenuCategoryFormData = {
      itemTypeId: '',
      isRequired: true,
      maxSelections: 1,
      priceModifier: '0',
    };
    
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
  };

  const removeCategory = (index: number) => {
    const categoryToRemove = formData.categories[index];
    
    Alert.alert(
      'Supprimer la catégorie',
      'Êtes-vous sûr de vouloir supprimer cette catégorie ? Tous les articles assignés seront également supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setFormData(prev => ({
              ...prev,
              categories: prev.categories.filter((_, i) => i !== index)
            }));
            
            // Réindexer les sélections
            const newSelections: Record<number, any> = {};
            Object.entries(categorySelections).forEach(([key, value]) => {
              const idx = parseInt(key);
              if (idx < index) {
                newSelections[idx] = value;
              } else if (idx > index) {
                newSelections[idx - 1] = value;
              }
            });
            setCategorySelections(newSelections);
          }
        }
      ]
    );
  };

  const updateCategory = (index: number, field: keyof MenuCategoryFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const handleCategoryTypeChange = (index: number, selectedOption: any) => {
    setCategorySelections(prev => ({
      ...prev,
      [index]: selectedOption
    }));
    
    updateCategory(index, 'itemTypeId', selectedOption.id);
  };

  // Fonctions pour gérer les MenuCategoryItems
  const getAvailableItems = (categoryIndex: number) => {
    const category = formData.categories[categoryIndex];
    if (!category || !category.id) return items.filter(item => item.itemType?.id === category.itemTypeId);
    
    const assignedItemIds = categoryItems[category.id]?.map(ci => ci.itemId) || [];
    return items.filter(item => 
      item.itemType?.id === category.itemTypeId &&
      !assignedItemIds.includes(item.id) &&
      item.isActive
    );
  };

  const handleAddItem = async (categoryIndex: number) => {
    const category = formData.categories[categoryIndex];
    if (!category.id) {
      showToast('Sauvegardez d\'abord le menu pour assigner des articles', 'warning');
      return;
    }

    const data = itemFormData[categoryIndex];
    if (!data || !data.itemId) {
      showToast('Veuillez sélectionner un article', 'warning');
      return;
    }

    try {
      const menuCategoryItemData: Partial<MenuCategoryItem> = {
        menuCategoryId: category.id,
        itemId: data.itemId,
        supplement: parseFloat(data.supplement) || 0,
        isAvailable: data.isAvailable
      };

      const newItem = await onCreateMenuCategoryItem(menuCategoryItemData);
      showToast('Article ajouté avec succès', 'success');
      
      // Mettre à jour immédiatement l'état local
      setCategoryItems(prev => ({
        ...prev,
        [category.id!]: [...(prev[category.id!] || []), newItem as MenuCategoryItem]
      }));
      
      // Reset form
      setItemFormData(prev => ({ 
        ...prev, 
        [categoryIndex]: { itemId: '', supplement: '0', isAvailable: true } 
      }));
      setShowAddItemForm(prev => ({ ...prev, [categoryIndex]: false }));
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showToast('Erreur lors de l\'ajout de l\'article', 'error');
    }
  };

  const handleUpdateItem = async (menuCategoryItem: MenuCategoryItem) => {
    try {
      await onUpdateMenuCategoryItem(menuCategoryItem.id, { isAvailable: !menuCategoryItem.isAvailable });
      showToast('Article mis à jour', 'success');
      
      // Mettre à jour immédiatement l'état local
      setCategoryItems(prev => ({
        ...prev,
        [menuCategoryItem.menuCategoryId]: prev[menuCategoryItem.menuCategoryId]?.map(item => 
          item.id === menuCategoryItem.id ? { ...item, isAvailable: !item.isAvailable } : item
        ) || []
      }));
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
              
              // Mettre à jour immédiatement l'état local
              setCategoryItems(prev => ({
                ...prev,
                [menuCategoryItem.menuCategoryId]: prev[menuCategoryItem.menuCategoryId]?.filter(
                  item => item.id !== menuCategoryItem.id
                ) || []
              }));
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              showToast('Erreur lors de la suppression', 'error');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {/* En-tête */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
          {menu ? `Modifier le menu "${menu.name}"` : 'Créer un nouveau menu'}
        </Text>
      </View>

      {/* Informations générales du menu */}
      <View style={{
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1A1A1A' }}>
          Informations générales
        </Text>
        
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Nom du menu *
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Ex: Menu Déjeuner"
            style={{
              borderWidth: 1,
              borderColor: errors.name ? '#EF4444' : '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: 'white',
            }}
          />
          {errors.name && (
            <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
              {errors.name}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Description
          </Text>
          <TextInput
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Description du menu (optionnel)"
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: 'white',
              textAlignVertical: 'top',
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
            Prix de base (€) *
          </Text>
          <TextInput
            value={formData.basePrice}
            onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: errors.basePrice ? '#EF4444' : '#D1D5DB',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 16,
              backgroundColor: 'white',
            }}
          />
          {errors.basePrice && (
            <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
              {errors.basePrice}
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
          }}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: formData.isActive ? '#10B981' : '#D1D5DB',
            backgroundColor: formData.isActive ? '#10B981' : 'white',
            marginRight: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {formData.isActive && (
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
            )}
          </View>
          <Text style={{ fontSize: 16, color: '#374151' }}>Menu actif</Text>
        </Pressable>
      </View>

      {/* Section Catégories */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A' }}>
            Catégories du menu
          </Text>
          {formData.categories.length > 0 && (
            <Button
              onPress={addCategory}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Plus size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontWeight: '500' }}>Ajouter une catégorie</Text>
            </Button>
          )}
        </View>

        {errors.categories && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 16 }}>
            {errors.categories}
          </Text>
        )}

        {formData.categories.length === 0 ? (
          // État vide - Gros bouton d'ajout
          <View style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 16,
            padding: 40,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#E5E7EB',
            borderStyle: 'dashed'
          }}>
            <Settings size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '500', color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
              Aucune catégorie configurée
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center', marginBottom: 20 }}>
              Ajoutez des catégories pour organiser les articles de votre menu
            </Text>
            <Button
              onPress={addCategory}
              style={{
                backgroundColor: '#10B981',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Plus size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
                Ajouter une catégorie
              </Text>
            </Button>
          </View>
        ) : (
          // Liste des catégories
          <View style={{ gap: 16 }}>
            {formData.categories.map((category, index) => {
              const categoryItemsList = category.id ? (categoryItems[category.id] || []) : [];
              const availableItems = getAvailableItems(index);
              const isLoading = category.id ? loadingCategories[category.id] : false;
              const isFormVisible = showAddItemForm[index];
              const currentFormData = itemFormData[index] || { itemId: '', supplement: '0', isAvailable: true };

              return (
                <View
                  key={`category-${index}`}
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
                  {/* Configuration de la catégorie */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: 12 
                    }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                        Catégorie {index + 1}
                      </Text>
                      {formData.categories.length > 1 && (
                        <Pressable
                          onPress={() => removeCategory(index)}
                          style={{
                            backgroundColor: '#EF4444',
                            borderRadius: 6,
                            padding: 6,
                          }}
                        >
                          <X size={16} color="white" />
                        </Pressable>
                      )}
                    </View>

                    <View style={{ marginBottom: 12, zIndex: 1000 - index }}>
                      <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
                        Type d'item *
                      </Text>
                      <Select
                        choices={itemTypes.map(type => ({ 
                          label: type.name, 
                          value: type.name, 
                          id: type.id 
                        }))}
                        selectedValue={categorySelections[index]}
                        placeholder="Sélectionner un type"
                        onValueChange={(selectedOption) => {
                          if (selectedOption) {
                            handleCategoryTypeChange(index, selectedOption);
                          }
                        }}
                        error={errors[`category_${index}_type`]}
                        style={{
                          backgroundColor: 'white',
                          borderWidth: 1,
                          borderColor: errors[`category_${index}_type`] ? '#EF4444' : '#D1D5DB',
                          borderRadius: 8
                        }}
                        maxHeight={200}
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
                          Sélections max *
                        </Text>
                        <TextInput
                          value={category.maxSelections.toString()}
                          onChangeText={(text) => updateCategory(index, 'maxSelections', parseInt(text) || 1)}
                          keyboardType="number-pad"
                          style={{
                            borderWidth: 1,
                            borderColor: errors[`category_${index}_max`] ? '#EF4444' : '#D1D5DB',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 16,
                            backgroundColor: 'white',
                          }}
                        />
                        {errors[`category_${index}_max`] && (
                          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                            {errors[`category_${index}_max`]}
                          </Text>
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#374151' }}>
                          Modificateur prix (€)
                        </Text>
                        <TextInput
                          value={category.priceModifier}
                          onChangeText={(text) => updateCategory(index, 'priceModifier', text)}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          style={{
                            borderWidth: 1,
                            borderColor: errors[`category_${index}_price`] ? '#EF4444' : '#D1D5DB',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 16,
                            backgroundColor: 'white',
                          }}
                        />
                        {errors[`category_${index}_price`] && (
                          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
                            {errors[`category_${index}_price`]}
                          </Text>
                        )}
                      </View>
                    </View>

                    <Pressable
                      onPress={() => updateCategory(index, 'isRequired', !category.isRequired)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 8,
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: category.isRequired ? '#10B981' : '#D1D5DB',
                        backgroundColor: category.isRequired ? '#10B981' : 'white',
                        marginRight: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        {category.isRequired && (
                          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 16, color: '#374151' }}>Catégorie obligatoire</Text>
                    </Pressable>
                  </View>

                  {/* Section Articles assignés (seulement si catégorie sauvegardée) */}
                  {category.id && (
                    <View style={{
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                      paddingTop: 16
                    }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: 12 
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151' }}>
                          Articles assignés ({categoryItemsList.length})
                        </Text>
                        
                        {availableItems.length > 0 && (
                          <Button
                            onPress={() => {
                              if (!itemFormData[index]) {
                                setItemFormData(prev => ({
                                  ...prev,
                                  [index]: { itemId: '', supplement: '0', isAvailable: true }
                                }));
                              }
                              setShowAddItemForm(prev => ({ ...prev, [index]: !prev[index] }));
                            }}
                            style={{
                              backgroundColor: '#10B981',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Plus size={12} color="white" />
                              <Text style={{ color: 'white', fontSize: 11, fontWeight: '500', marginLeft: 4 }}>
                                Ajouter
                              </Text>
                            </View>
                          </Button>
                        )}
                      </View>

                      {/* Formulaire d'ajout d'article */}
                      {isFormVisible && (
                        <View style={{
                          backgroundColor: '#F3F4F6',
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 12
                        }}>
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
                              } : undefined}
                              placeholder="Sélectionner un article"
                              style={{
                                backgroundColor: 'white',
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 8
                              }}
                              maxHeight={200}
                              onValueChange={(option) => {
                                if (option) {
                                  setItemFormData(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], itemId: option.id }
                                  }));
                                }
                              }}
                              placeholder="Sélectionner un article"
                            />
                            
                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, marginBottom: 4 }}>Supplément (€)</Text>
                                <TextInput
                                  value={currentFormData.supplement}
                                  onChangeText={(value) => setItemFormData(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], supplement: value }
                                  }))}
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
                                  onPress={() => handleAddItem(index)}
                                  style={{ backgroundColor: '#10B981', paddingHorizontal: 12 }}
                                >
                                  <Text style={{ color: 'white', fontSize: 12 }}>Ajouter</Text>
                                </Button>
                                <Button
                                  onPress={() => setShowAddItemForm(prev => ({ ...prev, [index]: false }))}
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
                                    <Text> • Supplément: +{menuCategoryItem.supplement}€</Text>
                                  )}
                                </Text>
                              </View>
                              
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Pressable
                                  onPress={() => handleUpdateItem(menuCategoryItem)}
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
                  )}

                  {/* Message pour catégorie non sauvegardée */}
                  {!category.id && menu && (
                    <View style={{
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                      paddingTop: 16,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>
                        Sauvegardez le menu pour pouvoir assigner des articles à cette catégorie
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Boutons d'action */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 40 }}>
        <Button
          onPress={onCancel}
          style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderWidth: 1,
            borderColor: '#D1D5DB',
            paddingVertical: 16,
          }}
          disabled={isLoading}
        >
          <Text style={{ color: '#374151', fontWeight: '500' }}>Annuler</Text>
        </Button>
        
        <Button
          onPress={handleSave}
          disabled={isLoading}
          style={{
            flex: 2,
            backgroundColor: isLoading ? '#9CA3AF' : '#2563EB',
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Save size={16} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isLoading ? 'Sauvegarde...' : menu ? 'Modifier le menu' : 'Créer le menu'}
            </Text>
          </View>
        </Button>
      </View>
    </ScrollView>
  );
}