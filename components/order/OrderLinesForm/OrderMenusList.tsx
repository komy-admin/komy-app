import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { Text } from '~/components/ui';
import { Plus, Minus } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { formatPrice } from '~/lib/utils';

/**
 * Props pour le composant OrderMenusList
 */
export interface OrderMenusListProps {
  activeMenus: Menu[];
  getTotalMenuQuantity: (menuId: string) => number;
  getDraftMenuQuantity: (menuId: string) => number;
  updateMenuQuantity: (menuId: string, action: 'remove' | 'add') => void;
  handleMenuAdd: (menu: Menu) => void;
}

/**
 * Composant pour afficher un menu individuel avec contrôles
 */
interface OrderMenuRowProps {
  menu: Menu;
  totalQuantity: number;
  draftQuantity: number;
  onMenuAdd: (menu: Menu) => void;
  onUpdateQuantity: (menuId: string, action: 'remove' | 'add') => void;
  dynamicButtonSize: number;
}

const OrderMenuRow = memo<OrderMenuRowProps>(({
  menu,
  onMenuAdd,
}) => {
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  // Couleurs neutres pour les menus (pas de couleur spécifique)
  const menuColor = '#6366F1'; // Indigo pour différencier des items
  const menuBgColor = 'rgba(99, 102, 241, 0.08)'; // Indigo avec 8% d'opacité

  return (
    <Pressable
      style={[
        styles.menuCard,
        {
          flex: 1,
          minWidth: 190,
          maxWidth: 250,
          borderColor: menuColor
        }
      ]}
      onPress={handleAdd}
    >
      {/* Header avec nom et description */}
      <View style={[
        styles.menuHeader,
        { backgroundColor: menuBgColor }
      ]}>
        <Text
          style={[
            styles.itemName,
            { color: menuColor }
          ]}
          numberOfLines={2}
        >
          {menu.name}
        </Text>
        {menu.description && (
          <Text
            style={styles.menuDescription}
            numberOfLines={2}
          >
            {menu.description}
          </Text>
        )}
      </View>

      {/* Prix */}
      <View style={styles.priceContainer}>
        <Text style={styles.itemPrice}>
          À partir de {formatPrice((menu as any).price || menu.basePrice || 0)}
        </Text>
      </View>

      {/* Bouton Ajouter */}
      <View style={styles.addButtonContainer}>
        <View style={[
          styles.addButton,
          { backgroundColor: menuColor }
        ]}>
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </View>
      </View>
    </Pressable>
  );
});

OrderMenuRow.displayName = 'OrderMenuRow';

/**
 * Composant de liste des menus pour OrderLinesForm
 * Affiche tous les menus actifs avec leurs contrôles d'ajout
 * 
 * @param props - Props du composant
 * @returns Composant de liste de menus mémorisé
 */
export const OrderMenusList = memo<OrderMenusListProps>(({
  activeMenus,
  getTotalMenuQuantity,
  getDraftMenuQuantity,
  updateMenuQuantity,
  handleMenuAdd
}) => {
  // Détection taille écran pour optimiser tactile tablette
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Styles dynamiques pour boutons optimisés tablette
  const dynamicButtonSize = isTablet ? 38 : 32;

  // Menus filtrés - seulement les actifs
  const filteredMenus = useMemo(() => {
    return activeMenus.filter(menu => menu.isActive);
  }, [activeMenus]);

  // Render item function for FlatList - défini après tous les hooks
  const renderMenu = useCallback(({ item: menu, index }: { item: Menu; index: number }) => (
    <OrderMenuRow
      menu={menu}
      totalQuantity={getTotalMenuQuantity(menu.id)}
      draftQuantity={getDraftMenuQuantity(menu.id)}
      onMenuAdd={handleMenuAdd}
      onUpdateQuantity={updateMenuQuantity}
      dynamicButtonSize={dynamicButtonSize}
    />
  ), [getTotalMenuQuantity, getDraftMenuQuantity, handleMenuAdd, updateMenuQuantity, dynamicButtonSize]);

  // Si aucun menu disponible
  if (filteredMenus.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aucun menu disponible actuellement
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={false}
    >
      {filteredMenus.map((menu, index) => {
        const menuElement = renderMenu({ item: menu, index });
        return React.cloneElement(menuElement, { key: menu.id });
      })}
    </ScrollView>
  );
});

OrderMenusList.displayName = 'OrderMenusList';

const COLORS = {
  background: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  price: '#059669',
  addButton: '#2A2E33',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'flex-start',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Card styles
  menuCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 180,
  },

  // Header styles
  menuHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 90, // Hauteur fixe pour aligner toutes les cartes
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },

  // Prix
  priceContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    height: 50, // Hauteur fixe pour gérer les prix à 2 ou 3 chiffres
    justifyContent: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Bouton Ajouter
  addButtonContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  addButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});