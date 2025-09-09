import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { Text } from '~/components/ui';
import { Plus, Minus } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';

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
    console.log('🔍 OrderMenuRow handleAdd called with menu:', {
      id: menu.id,
      name: menu.name,
      categoriesCount: menu.categories?.length
    });
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  const handleRemove = useCallback(() => {
    onUpdateQuantity(menu.id, 'remove');
  }, [menu.id, onUpdateQuantity]);

  const dynamicButtonStyles = {
    ...styles.compactQuantityButton,
    width: dynamicButtonSize,
    height: dynamicButtonSize,
  };

  const canRemove = draftQuantity > 0;

  return (
    <View style={styles.menuRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{menu.name}</Text>
        {menu.description && (
          <Text style={styles.menuDescription}>{menu.description}</Text>
        )}
        <Text style={styles.itemPrice}>À partir de {((menu as any).price || menu.basePrice || 0).toFixed(2)}€</Text>
      </View>
      
      {/* Toujours afficher les contrôles - et + (comme dans l'original) */}
      <View style={styles.compactQuantityContainer}>
        {/* Bouton - */}
        <Pressable
          style={[
            dynamicButtonStyles,
            !canRemove && styles.compactQuantityButtonDisabled
          ]}
          onPress={handleRemove}
          disabled={!canRemove}
        >
          <Minus 
            size={16} 
            color={canRemove ? "#2A2E33" : "#9CA3AF"} 
            strokeWidth={2.5} 
          />
        </Pressable>

        {/* Quantité */}
        <Text style={styles.compactQuantityText}>
          {isNaN(totalQuantity) ? '0' : totalQuantity}
        </Text>

        {/* Bouton + */}
        <Pressable
          style={dynamicButtonStyles}
          onPress={handleAdd}
        >
          <Plus 
            size={16} 
            color="#2A2E33" 
            strokeWidth={2.5} 
          />
        </Pressable>
      </View>
    </View>
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
    <View style={styles.container}>
      {filteredMenus.map(menu => (
        <OrderMenuRow
          key={menu.id}
          menu={menu}
          totalQuantity={getTotalMenuQuantity(menu.id)}
          draftQuantity={getDraftMenuQuantity(menu.id)}
          onMenuAdd={handleMenuAdd}
          onUpdateQuantity={updateMenuQuantity}
          dynamicButtonSize={dynamicButtonSize}
        />
      ))}
    </View>
  );
});

OrderMenusList.displayName = 'OrderMenusList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 80,
  },
  itemInfo: {
    flex: 1,
    marginRight: 20,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 6,
    lineHeight: 22,
  },
  itemPrice: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  menuActions: {
    alignItems: 'center',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  menuButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  compactQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  compactQuantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  compactQuantityButtonDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  compactQuantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2E33',
    textAlign: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },
});