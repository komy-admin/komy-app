import { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
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
    <>
      {/* Info du menu */}
      <View style={styles.itemInfo}>
        <Text
          style={styles.itemName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75}
        >
          {menu.name}
        </Text>
        {menu.description && (
          <Text
            style={styles.menuDescription}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.75}
          >
            {menu.description}
          </Text>
        )}
        <Text style={styles.itemPrice}>À partir de {((menu as any).price || menu.basePrice || 0).toFixed(2)}€</Text>
      </View>

      {/* Contrôles de quantité en bas */}
      <View style={styles.compactQuantityContainer}>
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
            strokeWidth={2}
          />
        </Pressable>

        <Text style={styles.compactQuantityText}>
          {isNaN(totalQuantity) ? '0' : totalQuantity}
        </Text>

        <Pressable
          style={dynamicButtonStyles}
          onPress={handleAdd}
        >
          <Plus
            size={16}
            color="#2A2E33"
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {filteredMenus.map((menu, index) => (
        <View
          key={menu.id}
          style={[
            styles.menuRow,
            // Supprime marginRight pour les 2ème cartes de chaque ligne
            (index + 1) % 2 === 0 && { marginRight: 0 }
          ]}
        >
          <OrderMenuRow
            menu={menu}
            totalQuantity={getTotalMenuQuantity(menu.id)}
            draftQuantity={getDraftMenuQuantity(menu.id)}
            onMenuAdd={handleMenuAdd}
            onUpdateQuantity={updateMenuQuantity}
            dynamicButtonSize={dynamicButtonSize}
          />
        </View>
      ))}
    </ScrollView>
  );
});

OrderMenusList.displayName = 'OrderMenusList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Même couleur que navigation et OrderItemsList
  },
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'flex-start',
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
    flexBasis: '49%',
    maxWidth: '49%',
    height: 180, // Hauteur augmentée
    padding: 16,
    marginBottom: 12,
    marginRight: 8,
    backgroundColor: '#F8F9FA', // Style ISO OrderItemsList
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB', // Style ISO OrderItemsList
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 6,
    lineHeight: 16,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 'auto',
  },
  menuDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 16,
    fontStyle: 'italic',
    textAlign: 'center',
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
    backgroundColor: '#FFFFFF', // Plus blanc pour plus de contraste
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB', // Border plus visible
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  compactQuantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  compactQuantityButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
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