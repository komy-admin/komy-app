import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react-native';
import { Menu, MenuCategory } from '~/types/menu.types';
import { ItemType } from '~/types/item-type.types';
import { Button } from '../ui';
import { Select } from '../ui/select';

interface MenuManagementFormProps {
  menu?: Menu | null;
  itemTypes: ItemType[];
  onSave: (menu: Partial<Menu>) => Promise<void>;
  onCancel: () => void;
}

interface MenuCategoryFormData {
  id?: string;
  itemTypeId: string;
  isRequired: boolean;
  maxSelections: number;
  priceModifier: string;
}

interface CategorySelectOption {
  value: string;
  label: string;
  id: string;
}

export function MenuManagementForm({ menu, itemTypes, onSave, onCancel }: MenuManagementFormProps) {
  const [formData, setFormData] = useState({
    name: menu?.name || '',
    description: menu?.description || '',
    basePrice: menu?.basePrice || '',
    isActive: menu?.isActive ?? true,
  });
  
  const [categories, setCategories] = useState<MenuCategoryFormData[]>(
    menu?.categories?.map(cat => ({
      id: cat.id,
      itemTypeId: cat.itemTypeId,
      isRequired: cat.isRequired,
      maxSelections: cat.maxSelections,
      priceModifier: cat.priceModifier,
    })) || []
  );

  // État pour gérer les sélections de type d'item pour chaque catégorie
  const [categorySelections, setCategorySelections] = useState<Record<number, CategorySelectOption>>(
    categories.reduce((acc, cat, index) => {
      const itemType = itemTypes.find(type => type.id === cat.itemTypeId);
      if (itemType) {
        acc[index] = {
          value: itemType.name,
          label: itemType.name,
          id: itemType.id
        };
      }
      return acc;
    }, {} as Record<number, CategorySelectOption>)
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }
    
    if (!formData.basePrice || parseFloat(formData.basePrice) < 0) {
      newErrors.basePrice = 'Le prix de base doit être un nombre positif';
    }
    
    if (categories.length === 0) {
      newErrors.categories = 'Au moins une catégorie est requise';
    }
    
    categories.forEach((category, index) => {
      if (!category.itemTypeId) {
        newErrors[`category_${index}_type`] = 'Type d\'item requis';
      }
      if (category.maxSelections < 1) {
        newErrors[`category_${index}_max`] = 'Au moins 1 sélection requise';
      }
      if (parseFloat(category.priceModifier) < 0) {
        newErrors[`category_${index}_price`] = 'Le modificateur de prix ne peut pas être négatif';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      console.log('💾 MenuManagementForm.handleSave() - formData:', formData);
      console.log('💾 MenuManagementForm.handleSave() - categories raw:', categories);
      
      const menuData: Partial<Menu> = {
        ...formData,
        categories: categories.map(cat => ({
          ...cat,
          itemType: itemTypes.find(type => type.id === cat.itemTypeId)!,
          // Ne pas inclure menuId lors de la création, il sera ajouté par le hook
        } as Partial<MenuCategory>)),
      };
      
      if (menu?.id) {
        menuData.id = menu.id;
      }
      
      console.log('💾 MenuManagementForm.handleSave() - menuData final:', menuData);
      console.log('💾 MenuManagementForm.handleSave() - categories mappées:', menuData.categories);
      
      await onSave(menuData);
      console.log('✅ MenuManagementForm.handleSave() - sauvegarde réussie');
    } catch (error) {
      console.error('❌ MenuManagementForm.handleSave() - erreur:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le menu');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newIndex = categories.length;
    setCategories(prev => [...prev, {
      itemTypeId: '',
      isRequired: true,
      maxSelections: 1,
      priceModifier: '0',
    }]);
    
    // Initialiser la sélection vide pour la nouvelle catégorie
    setCategorySelections(prev => ({
      ...prev,
      [newIndex]: { value: '', label: 'Sélectionner un type', id: '' }
    }));
  };

  const removeCategory = (index: number) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
    
    // Supprimer la sélection correspondante et réindexer les autres
    setCategorySelections(prev => {
      const newSelections: Record<number, CategorySelectOption> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const idx = parseInt(key);
        if (idx < index) {
          newSelections[idx] = value;
        } else if (idx > index) {
          newSelections[idx - 1] = value;
        }
      });
      return newSelections;
    });
  };

  const updateCategory = (index: number, field: keyof MenuCategoryFormData, value: any) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, [field]: value } : cat
    ));
  };

  const handleCategoryTypeChange = (index: number, selectedOption: CategorySelectOption) => {
    // Mettre à jour la sélection
    setCategorySelections(prev => ({
      ...prev,
      [index]: selectedOption
    }));
    
    // Mettre à jour la catégorie avec le nouvel itemTypeId
    updateCategory(index, 'itemTypeId', selectedOption.id);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      {/* Informations générales */}
      <View style={{ marginBottom: 24 }}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
      </View>

      {/* Catégories */}
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A' }}>
            Catégories du menu
          </Text>
          <Pressable
            onPress={addCategory}
            style={{
              backgroundColor: '#10B981',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Plus size={16} color="white" />
            <Text style={{ color: 'white', marginLeft: 4, fontWeight: '500' }}>
              Ajouter
            </Text>
          </Pressable>
        </View>

        {errors.categories && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 16 }}>
            {errors.categories}
          </Text>
        )}

        {categories.map((category, index) => (
          <View key={index} style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A' }}>
                Catégorie {index + 1}
              </Text>
              {categories.length > 1 && (
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
                selectedValue={categorySelections[index] || { value: '', label: 'Sélectionner un type', id: '' }}
                placeholder="Sélectionner un type"
                onValueChange={(selectedOption) => {
                  if (selectedOption) {
                    handleCategoryTypeChange(index, selectedOption);
                  }
                }}
                error={errors[`category_${index}_type`]}
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
        ))}
      </View>

      {/* Boutons d'action */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <Button
          onPress={onCancel}
          style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderWidth: 1,
            borderColor: '#D1D5DB',
          }}
        >
          <Text style={{ color: '#374151', fontWeight: '500' }}>Annuler</Text>
        </Button>
        
        <Button
          onPress={handleSave}
          disabled={saving}
          style={{
            flex: 2,
            backgroundColor: saving ? '#9CA3AF' : '#2563EB',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {saving ? 'Sauvegarde...' : menu ? 'Modifier' : 'Créer'}
          </Text>
        </Button>
      </View>
    </ScrollView>
  );
}