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
  totalQuantity,
  draftQuantity,
  onMenuAdd,
  onUpdateQuantity,
  dynamicButtonSize
}) => {
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  return (
    <Pressable
      style={styles.menuCard}
      onPress={handleAdd}
    >
      {/* Header avec nom et description */}
      <View style={styles.menuHeader}>
        <Text
          style={styles.itemName}
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
        <View style={styles.addButton}>
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
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 180,
    flexBasis: '48%',
    maxWidth: '48%',
  },

  // Header styles
  menuHeader: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
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
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.price,
    fontWeight: '800',
    textAlign: 'center',
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
    backgroundColor: COLORS.addButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.addButton,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});