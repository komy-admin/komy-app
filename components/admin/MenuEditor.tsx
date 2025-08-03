import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Platform, StyleSheet } from 'react-native';
import { Button } from '~/components/ui';
import { Select } from '~/components/ui/select';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { Plus, Trash2, Edit3, Save, X, Package, Settings, Eye, EyeOff, FileText, PencilLine } from 'lucide-react-native';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';

interface MenuEditorProps {
  menu?: Menu | null; // Si null = création, sinon modification
  items: Item[];
  itemTypes: ItemType[];
  onSave?: (menuData: Partial<Menu>) => Promise<void>; // Optionnel car maintenant géré par AdminFormView
  onCancel?: () => void;
  // Actions pour les categories (hooks via le store) - utilisées seulement à la sauvegarde finale
  onCreateMenuCategoryItem: (data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
  onUpdateMenuCategoryItem: (id: string, data: Partial<MenuCategoryItem>) => Promise<MenuCategoryItem>;
  onDeleteMenuCategoryItem: (id: string) => Promise<void>;
  onLoadMenuCategoryItems: (menuCategoryId: string) => Promise<MenuCategoryItem[]>;
  scrollViewRef?: React.RefObject<ScrollView | null>;
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
  maxSelections: string; // String pour permettre la saisie temporaire
  priceModifier: string;
}

interface CategoryItemFormData {
  itemId: string;
  supplement: string;
  isAvailable: boolean;
}

// Interface pour les articles assignés localement (avant sauvegarde)
interface LocalMenuCategoryItem {
  tempId: string; // ID temporaire pour identifier l'item localement
  originalId?: string; // ID original du MenuCategoryItem (pour les existants)
  itemId: string;
  supplement: number;
  isAvailable: boolean;
  item?: Item; // Référence à l'item pour affichage
  isModified?: boolean; // Flag pour savoir si l'item a été modifié
  isDeleted?: boolean; // Flag pour savoir si l'item a été supprimé
}

export const MenuEditor = forwardRef<AdminFormRef<Menu>, MenuEditorProps>(({
  menu,
  items,
  itemTypes,
  onSave,
  onCancel,
  onCreateMenuCategoryItem,
  onUpdateMenuCategoryItem,
  onDeleteMenuCategoryItem,
  onLoadMenuCategoryItems,
  scrollViewRef
}, ref) => {
  const [formData, setFormData] = useState<MenuFormData>({
    name: menu?.name || '',
    description: menu?.description || '',
    basePrice: menu?.basePrice?.toString() || '',
    isActive: menu?.isActive ?? true,
    categories: menu?.categories?.map(cat => ({
      id: cat.id,
      itemTypeId: cat.itemTypeId,
      isRequired: cat.isRequired,
      maxSelections: cat.maxSelections?.toString() || '1', // Convertir en string
      priceModifier: cat.priceModifier?.toString() || '0',
    })) || []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // États pour la gestion LOCALE des MenuCategoryItems (pas de requêtes immédiates)
  const [localCategoryItems, setLocalCategoryItems] = useState<Record<number, LocalMenuCategoryItem[]>>({});
  const [showAddItemForm, setShowAddItemForm] = useState<Record<string, boolean>>({});
  const [itemFormData, setItemFormData] = useState<Record<string, CategoryItemFormData>>({});
  const [categorySelections, setCategorySelections] = useState<Record<number, any>>({});
  const [editingItem, setEditingItem] = useState<{ categoryIndex: number, tempId: string } | null>(null);
  const [editItemData, setEditItemData] = useState<{ supplement: string, isAvailable: boolean }>({ supplement: '0', isAvailable: true });

  const { showToast } = useToast();

  // Charger et convertir les items des catégories existantes en données locales (pour modification)
  useEffect(() => {
    if (menu && menu.categories) {
      const localItems: Record<number, LocalMenuCategoryItem[]> = {};
      
      menu.categories.forEach((category, index) => {
        if (category.id) {
          // Simuler le chargement des items existants et les convertir en local
          onLoadMenuCategoryItems(category.id).then((existingItems) => {
            localItems[index] = existingItems.map((item, itemIndex) => ({
              tempId: `existing-${category.id}-${itemIndex}`,
              originalId: item.id, // Conserver l'ID original pour les mises à jour/suppressions
              itemId: item.itemId,
              supplement: item.supplement,
              isAvailable: item.isAvailable,
              item: items.find(i => i.id === item.itemId),
              isModified: false,
              isDeleted: false
            }));
            
            setLocalCategoryItems(prev => ({
              ...prev,
              [index]: localItems[index]
            }));
          }).catch(error => {
            console.error('Erreur lors du chargement des items:', error);
          });
        }
      });
    } else {
      // Reset pour nouveau menu
      setLocalCategoryItems({});
      setShowAddItemForm({});
      setItemFormData({});
    }
  }, [menu?.id, items, onLoadMenuCategoryItems]);

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

  const validateForm = (): Record<string, string> => {
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
      
      // Validation pour maxSelections
      const maxSelections = parseInt(category.maxSelections);
      if (!category.maxSelections.trim() || isNaN(maxSelections) || maxSelections < 1) {
        newErrors[`category_${index}_max`] = 'Au moins 1 sélection requise';
      }
      
      const priceModifier = parseFloat(category.priceModifier);
      if (isNaN(priceModifier) || priceModifier < 0) {
        newErrors[`category_${index}_price`] = 'Le modificateur de prix doit être un nombre positif ou zéro';
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  // Expose l'interface AdminFormRef
  useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<Menu> => {
      const newErrors = validateForm();
      const isValid = Object.keys(newErrors).length === 0;
      
      // Afficher un toast d'erreur générique pour informer l'utilisateur
      if (!isValid) {
        showToast('Veuillez corriger les erreurs dans le formulaire', 'error');
      }
      
      let menuData: Menu | null = null;
      
      if (isValid) {
        menuData = {
          id: menu?.id,
          name: formData.name,
          description: formData.description,
          basePrice: parseFloat(formData.basePrice),
          isActive: formData.isActive,
          categories: formData.categories.map((cat, index) => ({
            id: cat.id,
            menuId: menu?.id,
            itemTypeId: cat.itemTypeId,
            isRequired: cat.isRequired,
            maxSelections: parseInt(cat.maxSelections) || 1,
            priceModifier: parseFloat(cat.priceModifier) || 0,
            itemType: itemTypes.find(type => type.id === cat.itemTypeId)!,
            // Ajouter les données locales des articles assignés
            localItems: localCategoryItems[index] || []
          } as MenuCategory & { localItems: LocalMenuCategoryItem[] })),
        } as Menu;
      }

      return {
        data: menuData!,
        isValid,
        errors: newErrors
      };
    },
    
    resetForm: () => {
      setFormData({
        name: '',
        description: '',
        basePrice: '',
        isActive: true,
        categories: []
      });
      setLocalCategoryItems({});
      setErrors({});
      setCategorySelections({});
    },
    
    validateForm: () => {
      const newErrors = validateForm();
      if (Object.keys(newErrors).length > 0) {
        showToast(Object.values(newErrors)[0] as string, 'error');
      }
      return Object.keys(newErrors).length === 0;
    }
  }), [formData, localCategoryItems, itemTypes, menu?.id, showToast]);

  // Fonction de sauvegarde héritée (pour compatibilité si nécessaire)
  const handleSave = async () => {
    const formDataResult = (ref as any).current?.getFormData();
    if (formDataResult && formDataResult.isValid && onSave) {
      try {
        await onSave(formDataResult.data);
        showToast(menu ? 'Menu modifié avec succès' : 'Menu créé avec succès', 'success');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showToast('Erreur lors de la sauvegarde du menu', 'error');
      }
    }
  };

  const addCategory = () => {
    const newCategory: MenuCategoryFormData = {
      itemTypeId: '',
      isRequired: true,
      maxSelections: '1',
      priceModifier: '0',
    };

    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));

    showToast('Nouvelle catégorie ajoutée', 'success');
    
    // Scroll automatique vers le bas après un petit délai pour que la nouvelle catégorie soit rendue
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
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
    // Récupérer l'ancien type pour voir s'il y a un changement
    const oldItemTypeId = formData.categories[index]?.itemTypeId;
    const newItemTypeId = selectedOption.id;
    
    setCategorySelections(prev => ({
      ...prev,
      [index]: selectedOption
    }));

    updateCategory(index, 'itemTypeId', selectedOption.id);
    
    // Si le type d'item a changé et qu'il y avait des articles assignés, les marquer comme supprimés
    if (oldItemTypeId && oldItemTypeId !== newItemTypeId && localCategoryItems[index]?.length > 0) {
      setLocalCategoryItems(prev => ({
        ...prev,
        [index]: prev[index].map(item => ({
          ...item,
          isDeleted: true // Marquer tous les articles comme supprimés pour la sauvegarde
        }))
      }));
      
      showToast('Articles supprimés suite au changement de type', 'info');
    }
  };

  // Fonctions pour gérer les MenuCategoryItems (version locale)
  const getAvailableItems = (categoryIndex: number) => {
    const category = formData.categories[categoryIndex];
    if (!category) return [];

    const assignedItemIds = localCategoryItems[categoryIndex]?.map(ci => ci.itemId) || [];
    return items.filter(item =>
      item.itemType?.id === category.itemTypeId &&
      !assignedItemIds.includes(item.id) &&
      item.isActive
    );
  };

  const handleAddItem = (categoryIndex: number) => {
    const data = itemFormData[categoryIndex];
    if (!data || !data.itemId) {
      showToast('Veuillez sélectionner un article', 'warning');
      return;
    }

    const selectedItem = items.find(item => item.id === data.itemId);
    if (!selectedItem) {
      showToast('Article introuvable', 'error');
      return;
    }

    // Créer un nouvel item local (pas de requête backend)
    const newLocalItem: LocalMenuCategoryItem = {
      tempId: `local-${categoryIndex}-${Date.now()}`,
      itemId: data.itemId,
      supplement: parseFloat(data.supplement) || 0,
      isAvailable: data.isAvailable,
      item: selectedItem
    };

    // Ajouter à l'état local
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: [...(prev[categoryIndex] || []), newLocalItem]
    }));

    showToast('Article ajouté avec succès', 'success');

    // Reset form
    setItemFormData(prev => ({
      ...prev,
      [categoryIndex]: { itemId: '', supplement: '0', isAvailable: true }
    }));
    setShowAddItemForm(prev => ({ ...prev, [categoryIndex]: false }));
  };

  const handleUpdateItem = (categoryIndex: number, localItem: LocalMenuCategoryItem) => {
    // Mettre à jour l'item local et marquer comme modifié
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: prev[categoryIndex]?.map(item =>
        item.tempId === localItem.tempId 
          ? { 
              ...item, 
              isAvailable: !item.isAvailable,
              isModified: true // Marquer comme modifié
            } 
          : item
      ) || []
    }));

    showToast('Statut modifié avec succès', 'success');
  };

  const handleDeleteItem = (categoryIndex: number, localItem: LocalMenuCategoryItem) => {
    if (localItem.originalId) {
      // Pour les items existants, marquer comme supprimé au lieu de les supprimer
      setLocalCategoryItems(prev => ({
        ...prev,
        [categoryIndex]: prev[categoryIndex]?.map(item =>
          item.tempId === localItem.tempId 
            ? { ...item, isDeleted: true }
            : item
        ) || []
      }));
    } else {
      // Pour les nouveaux items locaux, les supprimer directement
      setLocalCategoryItems(prev => ({
        ...prev,
        [categoryIndex]: prev[categoryIndex]?.filter(
          item => item.tempId !== localItem.tempId
        ) || []
      }));
    }

    showToast('Article retiré avec succès', 'success');
  };

  const handleEditItem = (categoryIndex: number, localItem: LocalMenuCategoryItem) => {
    setEditingItem({ categoryIndex, tempId: localItem.tempId });
    setEditItemData({
      supplement: localItem.supplement.toString(),
      isAvailable: localItem.isAvailable
    });
  };

  const handleSaveEditItem = () => {
    if (!editingItem) return;

    const { categoryIndex, tempId } = editingItem;
    
    setLocalCategoryItems(prev => ({
      ...prev,
      [categoryIndex]: prev[categoryIndex]?.map(item =>
        item.tempId === tempId 
          ? { 
              ...item, 
              supplement: parseFloat(editItemData.supplement) || 0,
              isAvailable: editItemData.isAvailable,
              isModified: true
            } 
          : item
      ) || []
    }));

    setEditingItem(null);
    setEditItemData({ supplement: '0', isAvailable: true });
    showToast('Article modifié avec succès', 'success');
  };

  const handleCancelEditItem = () => {
    setEditingItem(null);
    setEditItemData({ supplement: '0', isAvailable: true });
  };

  return (
    <View style={styles.container}>
      {/* Formulaire en grille compacte */}
      <View style={styles.formGrid}>
        {/* Section principale - Informations de base */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderInline}>
            <View style={styles.sectionIconContainer}>
              <FileText size={20} color="#2A2E33" />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionHeaderTitle}>1. Informations générales</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Définissez le nom, prix et description de votre menu
              </Text>
            </View>
          </View>
          
          {/* Ligne 1: Nom + Prix + Statut */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Nom du menu *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Ex: Menu Déjeuner"
                placeholderTextColor="#A0A0A0"
                style={[styles.input, errors.name && { borderColor: '#EF4444' }]}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
            
            <View style={[styles.field, styles.fieldSmall]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Prix de base (€) *</Text>
              <TextInput
                value={formData.basePrice}
                onChangeText={(text) => setFormData(prev => ({ ...prev, basePrice: text }))}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#A0A0A0"
                style={[styles.input, errors.basePrice && { borderColor: '#EF4444' }]}
              />
              {errors.basePrice && (
                <Text style={styles.errorText}>{errors.basePrice}</Text>
              )}
            </View>
            
            <View style={[styles.field, styles.fieldSmall, {marginLeft: 12}]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280', marginBottom: 8}]}>Statut</Text>
              <Pressable
                style={[styles.statusToggleV2, formData.isActive && styles.statusToggleV2Active]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                <View style={[styles.statusIconContainer, formData.isActive && styles.statusIconContainerActive]}>
                  <View style={[styles.statusPulse, formData.isActive && styles.statusPulseActive]} />
                  <View style={[styles.statusCore, formData.isActive && styles.statusCoreActive]} />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={[styles.statusLabelV2, formData.isActive && styles.statusLabelV2Active]}>
                    {formData.isActive ? 'Actif' : 'Inactif'}
                  </Text>
                  <Text style={[styles.statusSubtext, formData.isActive && styles.statusSubtextActive]}>
                    {formData.isActive ? 'Visible' : 'Masqué'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
          
          {/* Ligne 2: Description seule */}
          <View style={[styles.row, {marginBottom: 0}]}>
            <View style={[styles.field, {flex: 1}]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Description du menu (optionnel)"
                placeholderTextColor="#A0A0A0"
                multiline
                style={[styles.input, styles.descriptionInput]}
              />
            </View>
          </View>

        </View>
      </View>
      
      {/* Section Catégories - Redesignée */}
      <View style={styles.categoriesSection}>
        <View style={styles.categoriesSectionHeader}>
          <View style={styles.sectionHeaderContent}>
            <View style={styles.sectionIconContainer}>
              <Settings size={20} color="#2A2E33" />
            </View>
            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionHeaderTitle}>2. Configuration des catégories</Text>
              <Text style={styles.sectionHeaderSubtitle}>
                Organisez votre menu en catégories d'articles
              </Text>
            </View>
          </View>
          {formData.categories.length > 0 && (
            <Pressable
              onPress={addCategory}
              style={styles.primaryActionButton}
            >
              <Plus size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.primaryActionButtonText}>Nouvelle catégorie</Text>
            </Pressable>
          )}
        </View>

        {errors.categories && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 16 }}>
            {errors.categories}
          </Text>
        )}

        {formData.categories.length === 0 ? (
          // État vide - Gros bouton d'ajout
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Settings size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyStateTitle}>
              Configurez vos catégories de menu
            </Text>
            <Text style={styles.emptyStateDescription}>
              Organisez votre offre en créant des catégories d'articles comme "Entrées", "Plats principaux", "Desserts"...
            </Text>
            <Pressable
              onPress={addCategory}
              style={styles.emptyStateButton}
            >
              <Plus size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.emptyStateButtonText}>
                Créer ma première catégorie
              </Text>
            </Pressable>
          </View>
        ) : (
          // Liste des catégories
          <View style={{ gap: 16 }}>
            {formData.categories.map((category, index) => {
              const categoryItemsList = localCategoryItems[index] || [];
              const visibleItemsCount = categoryItemsList.filter(item => !item.isDeleted).length; // Compter seulement les items non supprimés
              const availableItems = getAvailableItems(index);
              const isFormVisible = showAddItemForm[index];
              const currentFormData = itemFormData[index] || { itemId: '', supplement: '0', isAvailable: true };

              return (
                <View
                  key={`category-${index}`}
                  style={styles.categoryCardNew}
                >
                  {/* Configuration de la catégorie */}
                  <View style={{ marginBottom: 16 }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12
                    }}>
                      <View style={styles.categoryHeaderContent}>
                        <View style={styles.categoryNumberBadge}>
                          <Text style={styles.categoryNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.categoryHeaderInfo}>
                          <Text style={styles.categoryHeaderTitle}>
                            {categorySelections[index]?.label || 'Configuration de catégorie'}
                          </Text>
                          <Text style={styles.categoryHeaderSubtitle}>
                            {category.isRequired ? 'Obligatoire' : 'Optionnel'} • Max {category.maxSelections} sélection{parseInt(category.maxSelections) > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
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

                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Type d'item *</Text>
                      <View style={styles.categoryButtons}>
                        {itemTypes.map((itemType) => (
                          <Pressable
                            key={itemType.id}
                            style={[
                              styles.categoryButton,
                              categorySelections[index]?.id === itemType.id && styles.categoryButtonActive
                            ]}
                            onPress={() => handleCategoryTypeChange(index, {
                              value: itemType.name,
                              label: itemType.name,
                              id: itemType.id
                            })}
                          >
                            <Text style={[
                              styles.categoryButtonText,
                              categorySelections[index]?.id === itemType.id && styles.categoryButtonTextActive
                            ]}>
                              {itemType.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                      {errors[`category_${index}_type`] && (
                        <Text style={styles.errorText}>{errors[`category_${index}_type`]}</Text>
                      )}
                    </View>

                    <View style={[styles.row, {marginBottom: 12}]}>
                      <View style={[styles.field, styles.fieldSmall]}>
                        <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>
                          Sélections max *
                        </Text>
                        <TextInput
                          value={category.maxSelections}
                          onChangeText={(text) => updateCategory(index, 'maxSelections', text)}
                          keyboardType="number-pad"
                          style={[styles.input, errors[`category_${index}_max`] && { borderColor: '#EF4444' }]}
                        />
                        {errors[`category_${index}_max`] && (
                          <Text style={styles.errorText}>
                            {errors[`category_${index}_max`]}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.field, styles.fieldSmall]}>
                        <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>
                          Modificateur prix (€)
                        </Text>
                        <TextInput
                          value={category.priceModifier}
                          onChangeText={(text) => updateCategory(index, 'priceModifier', text)}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor="#A0A0A0"
                          style={[styles.input, errors[`category_${index}_price`] && { borderColor: '#EF4444' }]}
                        />
                        {errors[`category_${index}_price`] && (
                          <Text style={styles.errorText}>
                            {errors[`category_${index}_price`]}
                          </Text>
                        )}
                      </View>
                      
                      <View style={[styles.field, styles.fieldSmall, {marginLeft: 12}]}>
                        <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Options</Text>
                        <Pressable
                          style={[styles.requiredToggle, category.isRequired && styles.requiredToggleActive]}
                          onPress={() => updateCategory(index, 'isRequired', !category.isRequired)}
                        >
                          <View style={[styles.requiredIndicator, category.isRequired && styles.requiredIndicatorActive]} />
                          <Text style={[styles.requiredText, category.isRequired && styles.requiredTextActive]}>
                            {category.isRequired ? 'Obligatoire' : 'Optionnel'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {/* Section Articles assignés (si catégorie sauvegardée OU itemType sélectionné) */}
                  {(category.id || category.itemTypeId) && (
                    <View style={styles.articlesSection}>
                      <View style={styles.articlesSectionHeader}>
                        <View style={styles.articlesSectionBadge}>
                          <Package size={16} color="#FFFFFF" />
                        </View>
                        <View style={styles.articlesSectionContent}>
                          <Text style={styles.articlesSectionTitle}>
                            Articles de cette catégorie
                          </Text>
                          <Text style={styles.articlesSectionSubtitle}>
                            {visibleItemsCount} article{visibleItemsCount > 1 ? 's' : ''} configuré{visibleItemsCount > 1 ? 's' : ''}
                            {availableItems.length > 0 && (
                              <Text style={styles.articlesSectionAvailable}>
                                {' • '}{availableItems.length} disponible{availableItems.length > 1 ? 's' : ''}
                              </Text>
                            )}
                          </Text>
                        </View>
                        {availableItems.length > 0 && (
                          <Pressable
                            onPress={() => {
                              if (!itemFormData[index]) {
                                setItemFormData(prev => ({
                                  ...prev,
                                  [index]: { itemId: '', supplement: '0', isAvailable: true }
                                }));
                              }
                              setShowAddItemForm(prev => ({ ...prev, [index]: !prev[index] }));
                            }}
                            style={styles.addItemButtonOptimized}
                          >
                            <Plus size={14} color="white" style={{ marginRight: 6 }} />
                            <Text style={styles.addItemButtonOptimizedText}>Ajouter</Text>
                          </Pressable>
                        )}
                      </View>

                      {/* Formulaire d'ajout d'article */}
                      {isFormVisible && (
                        <View style={styles.addItemForm}>
                          <View style={styles.addItemFormContent}>
                            <View style={styles.addItemFormRow}>
                              <View style={[styles.field, styles.fieldLarge]}>
                                <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Article *</Text>
                                <Select
                                  choices={availableItems.map(item => ({
                                    label: item.name,
                                    value: item.id,
                                    id: item.id
                                  }))}
                                  selectedValue={currentFormData.itemId ? {
                                    label: availableItems.find(i => i.id === currentFormData.itemId)?.name || '',
                                    value: currentFormData.itemId,
                                    id: currentFormData.itemId
                                  } : undefined}
                                  placeholder="Sélectionner un article"
                                  style={styles.addItemSelect}
                                  maxHeight={200}
                                  onValueChange={(option) => {
                                    if (option) {
                                      setItemFormData(prev => ({
                                        ...prev,
                                        [index]: { ...prev[index], itemId: option.id }
                                      }));
                                    }
                                  }}
                                />
                              </View>
                              
                              <View style={[styles.field, styles.fieldSmall]}>
                                <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Supplément (€)</Text>
                                <TextInput
                                  value={currentFormData.supplement}
                                  onChangeText={(value) => setItemFormData(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], supplement: value }
                                  }))}
                                  keyboardType="decimal-pad"
                                  placeholder="0.00"
                                  placeholderTextColor="#A0A0A0"
                                  style={styles.input}
                                />
                              </View>
                            </View>
                            
                            <View style={styles.addItemFormActions}>
                              <Pressable
                                onPress={() => handleAddItem(index)}
                                style={styles.addItemFormButtonPrimary}
                              >
                                <Text style={styles.addItemFormButtonTextPrimary}>Confirmer</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => setShowAddItemForm(prev => ({ ...prev, [index]: false }))}
                                style={styles.addItemFormButtonSecondary}
                              >
                                <Text style={styles.addItemFormButtonTextSecondary}>Annuler</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Liste des articles assignés */}
                      {categoryItemsList.length === 0 ? (
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
                        <View style={styles.assignedItemsListNew}>
                          {categoryItemsList
                            .filter((localItem: LocalMenuCategoryItem) => !localItem.isDeleted) // Masquer les items supprimés
                            .map((localItem: LocalMenuCategoryItem) => (
                            <View key={localItem.tempId} style={styles.assignedItemNew}>
                              {editingItem && editingItem.categoryIndex === index && editingItem.tempId === localItem.tempId ? (
                                // Mode édition - Formulaire inline
                                <View style={styles.editItemForm}>
                                  <View style={styles.editItemFormHeader}>
                                    <Text style={styles.editItemFormTitle}>
                                      Modifier "{localItem.item?.name}"
                                    </Text>
                                  </View>
                                  
                                  <View style={styles.editItemFormContent}>
                                    <View style={styles.editItemFormRow}>
                                      <View style={[styles.field, styles.fieldLarge]}>
                                        <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Supplément (€)</Text>
                                        <TextInput
                                          value={editItemData.supplement}
                                          onChangeText={(value) => setEditItemData(prev => ({ ...prev, supplement: value }))}
                                          keyboardType="decimal-pad"
                                          placeholder="0.00"
                                          placeholderTextColor="#A0A0A0"
                                          style={styles.input}
                                        />
                                      </View>
                                      
                                      <View style={[styles.field, styles.fieldSmall, {marginLeft: 12}]}>
                                        <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Disponibilité</Text>
                                        <Pressable
                                          style={[styles.editAvailabilityToggle, editItemData.isAvailable && styles.editAvailabilityToggleActive]}
                                          onPress={() => setEditItemData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
                                        >
                                          <View style={[styles.editAvailabilityIndicator, editItemData.isAvailable && styles.editAvailabilityIndicatorActive]} />
                                          <Text style={[styles.editAvailabilityText, editItemData.isAvailable && styles.editAvailabilityTextActive]}>
                                            {editItemData.isAvailable ? 'Disponible' : 'Indisponible'}
                                          </Text>
                                        </Pressable>
                                      </View>
                                    </View>
                                    
                                    <View style={styles.editItemFormActions}>
                                      <Pressable
                                        onPress={handleSaveEditItem}
                                        style={styles.addItemFormButtonPrimary}
                                      >
                                        <Text style={styles.addItemFormButtonTextPrimary}>Confirmer</Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={handleCancelEditItem}
                                        style={styles.addItemFormButtonSecondary}
                                      >
                                        <Text style={styles.addItemFormButtonTextSecondary}>Annuler</Text>
                                      </Pressable>
                                    </View>
                                  </View>
                                </View>
                              ) : (
                                // Mode affichage normal
                                <View style={styles.assignedItemMainContent}>
                                  <View style={styles.assignedItemInfoNew}>
                                    <Text style={styles.assignedItemNameNew}>
                                      {localItem.item?.name}
                                    </Text>
                                    <View style={styles.assignedItemMetrics}>
                                      {localItem.supplement > 0 && (
                                        <View style={styles.assignedItemSupplement}>
                                          <Text style={styles.assignedItemSupplementText}>
                                            +{localItem.supplement}€
                                          </Text>
                                        </View>
                                      )}
                                      <View style={[
                                        styles.assignedItemStatus,
                                        localItem.isAvailable ? styles.assignedItemStatusActive : styles.assignedItemStatusInactive
                                      ]}>
                                        <View style={[
                                          styles.assignedItemStatusDot,
                                          localItem.isAvailable ? styles.assignedItemStatusDotActive : styles.assignedItemStatusDotInactive
                                        ]} />
                                        <Text style={[
                                          styles.assignedItemStatusText,
                                          localItem.isAvailable ? styles.assignedItemStatusTextActive : styles.assignedItemStatusTextInactive
                                        ]}>
                                          {localItem.isAvailable ? 'Disponible' : 'Indisponible'}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                  
                                  <View style={styles.assignedItemActionsNew}>
                                    <Pressable
                                      onPress={() => handleUpdateItem(index, localItem)}
                                      style={[
                                        styles.assignedItemActionButtonNew,
                                        styles.assignedItemToggleButtonNew,
                                        localItem.isAvailable && styles.assignedItemToggleButtonActiveNew
                                      ]}
                                    >
                                      {localItem.isAvailable ? (
                                        <Eye size={20} color="#059669" />
                                      ) : (
                                        <EyeOff size={20} color="#9CA3AF" />
                                      )}
                                    </Pressable>
                                    
                                    <Pressable
                                      onPress={() => handleEditItem(index, localItem)}
                                      style={[styles.assignedItemActionButtonNew, styles.assignedItemEditButtonNew]}
                                    >
                                      <PencilLine size={18} color="#0EA5E9" />
                                    </Pressable>
                                    
                                    <Pressable
                                      onPress={() => handleDeleteItem(index, localItem)}
                                      style={[styles.assignedItemActionButtonNew, styles.assignedItemDeleteButtonNew]}
                                    >
                                      <Trash2 size={20} color="white" />
                                    </Pressable>
                                  </View>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formGrid: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    ...(Platform.OS === 'web' ? {} : { gap: 16 })
  },
  field: {
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },
  fieldSmall: {
    flex: 1,
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },
  fieldMedium: {
    flex: 1.5,
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },
  fieldLarge: {
    flex: 2,
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && { fontFamily: 'system-ui, -apple-system, sans-serif' })
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      outline: 'none',
      transition: 'all 0.2s ease',
      ':focus': {
        borderColor: '#2A2E33',
        shadowOpacity: 0.1,
      }
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  
  descriptionInput: {
    minHeight: 44, // Même hauteur qu'un input normal au départ
    maxHeight: 120, // Limite maximale pour éviter qu'elle devienne trop grande
    textAlignVertical: 'top',
    paddingTop: 12, // Alignement du texte en haut
  },
  statusToggleV2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44, // Force la hauteur exacte au lieu de minHeight
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        transform: 'translateY(-1px)',
        shadowOpacity: 0.08,
      }
    })
  },
  statusToggleV2Active: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 0 3px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)',
    })
  },
  statusIconContainer: {
    width: 12,
    height: 12,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconContainerActive: {},
  statusPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  statusPulseActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    ...(Platform.OS === 'web' && {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    })
  },
  statusCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    zIndex: 1,
  },
  statusCoreActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  statusTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statusLabelV2: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  statusLabelV2Active: {
    color: '#047857',
    fontWeight: '700',
  },
  statusSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    marginTop: 0,
    lineHeight: 11,
  },
  statusSubtextActive: {
    color: '#059669',
  },
  categorySection: {
    flex: 1,
    width: '100%',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    minHeight: 44,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    }),
  },
  categoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Toggle spécifique pour Obligatoire/Optionnel
  requiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F3F4F6',
      }
    })
  },
  
  requiredToggleActive: {
    backgroundColor: '#FEF3E2',
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  requiredIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginRight: 10,
  },
  
  requiredIndicatorActive: {
    backgroundColor: '#F59E0B',
  },
  
  requiredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  requiredTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  
  // Articles assignés - Header
  assignedItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  assignedItemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    letterSpacing: 0.3,
  },
  
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1A1E23',
        transform: 'translateY(-1px)',
        shadowOpacity: 0.2,
      }
    })
  },
  
  addItemButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Formulaire d'ajout
  addItemForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  
  addItemFormContent: {
    gap: 16,
  },
  
  addItemFormRow: {
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? {
      overflow: 'visible',
      position: 'relative',
      zIndex: 1,
    } : { gap: 16 })
  },
  
  addItemSelect: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    ...(Platform.OS === 'web' && {
      zIndex: 99999,
      position: 'relative',
    }),
  },
  
  addItemFormActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  
  addItemFormButtonPrimary: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1A1E23',
      }
    })
  },
  
  addItemFormButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  
  addItemFormButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#F9FAFB',
        borderColor: '#D1D5DB',
      }
    })
  },
  
  addItemFormButtonTextSecondary: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Liste des articles assignés
  assignedItemsList: {
    gap: 8,
  },
  
  assignedItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  
  assignedItemContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  
  assignedItemInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  
  assignedItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 4,
  },
  
  assignedItemDetails: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  assignedItemActions: {
    flexDirection: 'row',
  },
  
  assignedItemActionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70, // Largeur fixe identique pour les 2 boutons
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    })
  },
  
  assignedItemToggleButton: {
    backgroundColor: '#F9FAFB',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#F3F4F6',
      }
    })
  },
  
  assignedItemToggleButtonActive: {
    backgroundColor: '#ECFDF5',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#D1FAE5',
      }
    })
  },
  
  assignedItemDeleteButton: {
    backgroundColor: '#EF4444',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#DC2626',
      }
    })
  },
  
  // Styles de texte supprimés car remplacés par des icônes
  
  // === NOUVEAUX STYLES REDESIGNÉS ===
  
  // Section Catégories - Header redesigné
  categoriesSection: {
    marginBottom: 32,
  },
  
  categoriesSectionHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  sectionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  sectionHeaderText: {
    flex: 1,
  },
  
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  
  sectionHeaderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  primaryActionButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1A1E23',
        transform: 'translateY(-2px)',
        shadowOpacity: 0.3,
      }
    })
  },
  
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  // État vide amélioré
  emptyState: {
    backgroundColor: '#FAFBFC',
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  
  emptyStateIcon: {
    marginBottom: 20,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  emptyStateDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  
  emptyStateButton: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ':hover': {
        backgroundColor: '#1A1E23',
        transform: 'translateY(-3px)',
        shadowOpacity: 0.35,
      }
    })
  },
  
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  
  // Header de catégorie amélioré
  categoryHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  categoryNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  
  categoryNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  categoryHeaderInfo: {
    flex: 1,
  },
  
  categoryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  
  categoryHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Articles assignés - Header redesigné
  assignedItemsHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  assignedItemsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  assignedItemsIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  assignedItemsInfo: {
    flex: 1,
  },
  
  assignedItemsTitleNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  
  assignedItemsCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  addItemButtonNew: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 40, // Hauteur minimum augmentée
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1A1E23',
        transform: 'translateY(-1px)',
        shadowOpacity: 0.25,
      }
    })
  },
  
  addItemButtonTextNew: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  
  // Style pour les cards de catégorie
  categoryCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5F3FF',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 4, // Petit espace entre les cards
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#BFDBFE',
        shadowOpacity: 0.12,
        transform: 'translateY(-2px)',
      }
    })
  },
  
  // Header inline pour la section informations générales
  sectionHeaderInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
  },
  
  // Section Articles optimisée
  articlesSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  articlesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  
  articlesSectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  articlesSectionContent: {
    flex: 1,
  },
  
  articlesSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  
  articlesSectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  
  articlesSectionAvailable: {
    color: '#059669',
    fontWeight: '600',
  },
  
  addItemButtonOptimized: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#2563EB',
        transform: 'translateY(-1px)',
        shadowOpacity: 0.3,
      }
    })
  },
  
  addItemButtonOptimizedText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  
  // === NOUVEAU STYLE POUR LES ARTICLES ASSIGNÉS ===
  
  assignedItemsListNew: {
    gap: 12,
  },
  
  assignedItemNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#CBD5E1',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    })
  },
  
  assignedItemMainContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  
  assignedItemInfoNew: {
    flex: 1,
    marginRight: 16,
    justifyContent: 'center',
  },
  
  assignedItemNameNew: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  
  assignedItemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  assignedItemPrice: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  assignedItemPriceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  
  assignedItemSupplement: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  assignedItemSupplementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  
  assignedItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  
  assignedItemStatusActive: {
    backgroundColor: '#ECFDF5',
  },
  
  assignedItemStatusInactive: {
    backgroundColor: '#FEF2F2',
  },
  
  assignedItemStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  
  assignedItemStatusDotActive: {
    backgroundColor: '#059669',
  },
  
  assignedItemStatusDotInactive: {
    backgroundColor: '#DC2626',
  },
  
  assignedItemStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  assignedItemStatusTextActive: {
    color: '#047857',
  },
  
  assignedItemStatusTextInactive: {
    color: '#B91C1C',
  },
  
  assignedItemActionsNew: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    alignSelf: 'center',
  },
  
  // Nouvelle ligne pour titre + tags
  assignedItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  
  assignedItemActionButtonNew: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    })
  },
  
  assignedItemToggleButtonNew: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#F1F5F9',
        borderColor: '#CBD5E1',
        transform: 'scale(1.05)',
      }
    })
  },
  
  assignedItemToggleButtonActiveNew: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#D1FAE5',
        borderColor: '#10B981',
        transform: 'scale(1.05)',
      }
    })
  },
  
  assignedItemEditButtonNew: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#0EA5E9',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#E0F2FE',
        borderColor: '#0284C7',
        transform: 'scale(1.08)',
        shadowOpacity: 0.2,
        shadowRadius: 6,
      }
    })
  },

  assignedItemDeleteButtonNew: {
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#DC2626',
    ...(Platform.OS === 'web' && {
      ':hover': {
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        transform: 'scale(1.05)',
      }
    })
  },

  // === STYLES POUR LE FORMULAIRE D'ÉDITION ===
  
  editItemForm: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  editItemFormHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  
  editItemFormTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  
  editItemFormContent: {
    gap: 16,
  },
  
  editItemFormRow: {
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? {} : { gap: 16 })
  },
  
  editItemFormActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  
  // Toggle pour la disponibilité dans le formulaire d'édition
  editAvailabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
      }
    })
  },
  
  editAvailabilityToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  
  editAvailabilityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginRight: 10,
  },
  
  editAvailabilityIndicatorActive: {
    backgroundColor: '#10B981',
  },
  
  editAvailabilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  
  editAvailabilityTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
});