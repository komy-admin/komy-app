import { memo, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { formatPrice } from '~/lib/utils';
import { getMenuPrice } from '~/lib/color-utils';
import { TableFilterButton } from './TableFilterTooltip';

/**
 * Props pour le composant OrderMenusTableView
 */
export interface OrderMenusTableViewProps {
  activeMenus: Menu[];
  handleMenuAdd: (menu: Menu) => void;
}

/**
 * Composant pour afficher une ligne de menu dans la table
 */
interface OrderMenuRowProps {
  menu: Menu;
  onMenuAdd: (menu: Menu) => void;
}

const OrderMenuRow = memo<OrderMenuRowProps>(({
  menu,
  onMenuAdd
}) => {

  // Couleur indigo pour les menus
  const menuColor = '#6366F1';

  return (
    <Pressable
      style={styles.row}
      onPress={() => onMenuAdd(menu)}
    >
      {/* Lettre circulaire */}
      <View style={styles.letterCell}>
        <View style={[styles.letterCircle, { backgroundColor: menuColor }]}>
          <RNText style={styles.letterText}>
            {menu.name.charAt(0).toUpperCase()}
          </RNText>
        </View>
      </View>

      {/* Nom */}
      <View style={styles.nameCell}>
        <RNText
          style={styles.nameText}
          numberOfLines={1}
        >
          {menu.name}
        </RNText>
        {menu.description && (
          <RNText
            style={styles.descriptionText}
            numberOfLines={1}
          >
            {menu.description}
          </RNText>
        )}
      </View>

      {/* Prix */}
      <View style={styles.priceCell}>
        <RNText style={styles.priceText}>
          À partir de {formatPrice(getMenuPrice(menu))}
        </RNText>
      </View>

      {/* Catégories */}
      <View style={styles.categoriesCell}>
        <RNText style={styles.categoriesText}>
          {menu.categories?.length || 0} catégorie{(menu.categories?.length || 0) > 1 ? 's' : ''}
        </RNText>
      </View>

      {/* Bouton Ajouter */}
      <View style={styles.actionCell}>
        <View style={[styles.addButton, { backgroundColor: menuColor }]}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
});

OrderMenuRow.displayName = 'OrderMenuRow';

/**
 * Composant de vue liste (table) pour les menus
 */
export const OrderMenusTableView = memo<OrderMenusTableViewProps>(({
  activeMenus,
  handleMenuAdd
}) => {
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
      {/* Header de la table */}
      <View style={styles.header}>
        <View style={styles.filterCell}>
          <TableFilterButton activeFiltersCount={0} />
        </View>
        <View style={styles.nameCell}>
          <RNText style={styles.headerText}>Menu</RNText>
        </View>
        <View style={styles.priceCell}>
          <RNText style={styles.headerText}>Prix</RNText>
        </View>
        <View style={styles.categoriesCell}>
          <RNText style={styles.headerText}>Composition</RNText>
        </View>
        <View style={styles.actionCell}>
          <RNText style={styles.headerText}>Action</RNText>
        </View>
      </View>

      {/* Contenu de la table */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {filteredMenus.map((menu, index) => (
          <View
            key={menu.id}
            style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
          >
            <OrderMenuRow
              menu={menu}
              onMenuAdd={handleMenuAdd}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

OrderMenusTableView.displayName = 'OrderMenusTableView';

const COLORS = {
  background: '#FFFFFF',
  textSecondary: '#6B7280',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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

  // Header
  header: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F5',
    minHeight: 52,
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#2A2E33',
    textDecorationLine: 'underline',
  },

  // Row
  row: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F4F5F5',
    alignItems: 'center',
    height: 58,
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8F9FA',
  },

  // Cells
  filterCell: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCell: {
    width: 64,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  nameCell: {
    flex: 3,
    padding: 16,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  priceCell: {
    flex: 2,
    padding: 16,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
  },
  categoriesCell: {
    flex: 1.5,
    padding: 16,
  },
  categoriesText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionCell: {
    flex: 1,
    padding: 16,
    alignItems: 'flex-end',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
