import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Check, Plus, Minus } from 'lucide-react-native';
import { Menu, MenuCategory, MenuCategoryItem } from '~/types/menu.types';
import { useMenus } from '~/hooks/useMenus';
import { useMenuCalculator } from '~/hooks/useMenuCalculator';
import { Button } from '../ui';
import { formatPrice } from '~/lib/utils';

interface MenuSelectorProps {
  visible: boolean;
  onClose: () => void;
  onMenuSelect: (
    menu: Menu,
    selectedItems: Array<{ itemId: string; menuCategoryItemId: string }>,
    totalPrice: number
  ) => void;
}

interface CategorySelectionProps {
  category: MenuCategory;
  availableItems: MenuCategoryItem[];
  selectedItems: string[]; // itemIds
  onItemToggle: (itemId: string, menuCategoryItemId: string) => void;
  maxSelections: number;
}

function CategorySelection({
  category,
  availableItems,
  selectedItems,
  onItemToggle,
  maxSelections
}: CategorySelectionProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
      }}>
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#1A1A1A',
          flex: 1
        }}>
          {category.itemType.name}
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 12,
            color: category.isRequired ? '#DC2626' : '#666666',
            fontWeight: '500'
          }}>
            {category.isRequired ? 'OBLIGATOIRE' : 'OPTIONNEL'}
          </Text>
          <Text style={{ fontSize: 11, color: '#666666' }}>
            Max: {maxSelections} • Sélectionné: {selectedItems.length}
          </Text>
        </View>
      </View>

      {availableItems.map((item) => {
        const isSelected = selectedItems.includes(item.itemId);
        const canSelect = selectedItems.length < maxSelections || isSelected;
        const supplement = item.supplement;

        return (
          <Pressable
            key={item.id}
            onPress={() => canSelect && onItemToggle(item.itemId, item.id)}
            disabled={!canSelect}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: isSelected ? '#F3F4F6' : 'white',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isSelected ? '#D1D5DB' : '#E5E7EB',
              marginBottom: 8,
              opacity: canSelect ? 1 : 0.5,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 15,
                fontWeight: '500',
                color: '#1A1A1A',
                marginBottom: 2
              }}>
                {item.item.name}
              </Text>
              {item.item.description && (
                <Text style={{
                  fontSize: 13,
                  color: '#666666',
                  marginBottom: 4
                }}>
                  {item.item.description}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }}>
                  {item.item.price}€
                </Text>
                {supplement > 0 && (
                  <Text style={{ fontSize: 12, color: '#DC2626' }}>
                    +{supplement}€ supplément
                  </Text>
                )}
              </View>
            </View>

            <View style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: isSelected ? '#10B981' : '#E5E7EB',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {isSelected && <Check size={16} color="white" />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function MenuSelector({ visible, onClose, onMenuSelect }: MenuSelectorProps) {
  const { activeMenus, loadActiveMenus, loadMenuCategoryItems } = useMenus();
  const { calculateLocalMenuPrice, validateMenuSelection } = useMenuCalculator();

  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [categoryItems, setCategoryItems] = useState<Record<string, MenuCategoryItem[]>>({});
  const [selectedItemsByCategory, setSelectedItemsByCategory] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadActiveMenus();
    }
  }, [visible, loadActiveMenus]);

  useEffect(() => {
    if (selectedMenu) {
      loadCategoryItems();
    }
  }, [selectedMenu]);

  const loadCategoryItems = async () => {
    if (!selectedMenu) return;

    setLoading(true);
    try {
      const items: Record<string, MenuCategoryItem[]> = {};

      await Promise.all(
        selectedMenu.categories.map(async (category) => {
          const categoryItems = await loadMenuCategoryItems(category.id);
          items[category.id] = categoryItems.filter(item => item.isAvailable);
        })
      );

      setCategoryItems(items);
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
      Alert.alert('Erreur', 'Impossible de charger les items du menu');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = (menu: Menu) => {
    setSelectedMenu(menu);
    setSelectedItemsByCategory({});
  };

  const handleItemToggle = (categoryId: string, itemId: string, menuCategoryItemId: string) => {
    setSelectedItemsByCategory(prev => {
      const categorySelections = prev[categoryId] || [];
      const isSelected = categorySelections.includes(itemId);

      if (isSelected) {
        // Désélectionner
        return {
          ...prev,
          [categoryId]: categorySelections.filter(id => id !== itemId)
        };
      } else {
        // Sélectionner (vérifier la limite)
        const category = selectedMenu?.categories.find(cat => cat.id === categoryId);
        if (category && categorySelections.length < category.maxSelections) {
          return {
            ...prev,
            [categoryId]: [...categorySelections, itemId]
          };
        }
      }

      return prev;
    });
  };

  const handleConfirmSelection = () => {
    if (!selectedMenu) return;

    // Valider la sélection
    const validation = validateMenuSelection(selectedMenu, [], selectedItemsByCategory);
    if (!validation.isValid) {
      Alert.alert('Sélection incomplète', validation.errors.join('\n'));
      return;
    }

    // Calculer le prix
    const priceCalculation = calculateLocalMenuPrice(selectedMenu, selectedItemsByCategory, categoryItems);

    // Créer la liste des items sélectionnés avec leurs menuCategoryItemId
    const selectedItems: Array<{ itemId: string; menuCategoryItemId: string }> = [];

    Object.entries(selectedItemsByCategory).forEach(([categoryId, itemIds]) => {
      itemIds.forEach(itemId => {
        const menuCategoryItem = categoryItems[categoryId]?.find(item => item.itemId === itemId);
        if (menuCategoryItem) {
          selectedItems.push({
            itemId,
            menuCategoryItemId: menuCategoryItem.id
          });
        }
      });
    });

    onMenuSelect(selectedMenu, selectedItems, priceCalculation.totalPrice);
    handleClose();
  };

  const handleClose = () => {
    setSelectedMenu(null);
    setSelectedItemsByCategory({});
    setCategoryItems({});
    onClose();
  };

  if (!visible) return null;

  // Calculer le prix en temps réel
  const currentPrice = selectedMenu ?
    calculateLocalMenuPrice(selectedMenu, selectedItemsByCategory, categoryItems) :
    null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: 'white',
        marginTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#1A1A1A' }}>
            {selectedMenu ? selectedMenu.name : 'Choisir un menu'}
          </Text>
          <Pressable onPress={handleClose}>
            <X size={24} color="#666666" />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {!selectedMenu ? (
            /* Liste des menus disponibles */
            <View>
              {activeMenus.map((menu) => (
                <Pressable
                  key={menu.id}
                  onPress={() => handleMenuSelect(menu)}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 }}>
                    {menu.name}
                  </Text>
                  {menu.description && (
                    <Text style={{ fontSize: 14, color: '#666666', marginBottom: 8 }}>
                      {menu.description}
                    </Text>
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#059669' }}>
                    À partir de {menu.basePrice}€
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            /* Configuration du menu sélectionné */
            <View>
              {loading ? (
                <Text style={{ textAlign: 'center', color: '#666666', marginVertical: 20 }}>
                  Chargement des options...
                </Text>
              ) : (
                <>
                  {/* Description du menu */}
                  {selectedMenu.description && (
                    <Text style={{
                      fontSize: 14,
                      color: '#666666',
                      marginBottom: 20,
                      fontStyle: 'italic'
                    }}>
                      {selectedMenu.description}
                    </Text>
                  )}

                  {/* Catégories du menu */}
                  {selectedMenu.categories.map((category) => (
                    <CategorySelection
                      key={category.id}
                      category={category}
                      availableItems={categoryItems[category.id] || []}
                      selectedItems={selectedItemsByCategory[category.id] || []}
                      onItemToggle={(itemId, menuCategoryItemId) => handleItemToggle(category.id, itemId, menuCategoryItemId)}
                      maxSelections={category.maxSelections}
                    />
                  ))}
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer avec prix et boutons */}
        {selectedMenu && currentPrice && (
          <View style={{
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#F9FAFB',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, color: '#666666' }}>Prix total:</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#1A1A1A' }}>
                {formatPrice(currentPrice.totalPrice)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                onPress={() => setSelectedMenu(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderWidth: 1,
                  borderColor: '#D1D5DB'
                }}
              >
                <Text style={{ color: '#374151', fontWeight: '500' }}>Retour</Text>
              </Button>

              <Button
                onPress={handleConfirmSelection}
                style={{ flex: 2, backgroundColor: '#059669' }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  Ajouter à la commande
                </Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}