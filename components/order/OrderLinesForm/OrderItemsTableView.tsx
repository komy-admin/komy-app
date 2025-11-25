import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, StyleSheet, ScrollView, Text as RNText } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { formatPrice, getContrastColor } from '~/lib/utils';
import { TableFilterButton } from './TableFilterTooltip';

/**
 * Props pour le composant OrderItemsTableView
 */
export interface OrderItemsTableViewProps {
  items: Item[];
  activeItemType: string;
  onOpenCustomization: (item: Item) => void;
}

/**
 * Composant pour afficher une ligne d'item dans la table
 */
interface OrderItemRowProps {
  item: Item;
  onOpenCustomization: (item: Item) => void;
}

const OrderItemRow = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  const itemColor = item.color || '#6B7280';
  const buttonBgColor = itemColor;
  const buttonIconColor = getContrastColor(itemColor);

  return (
    <Pressable
      style={styles.row}
      onPress={handleAdd}
    >
      {/* Lettre circulaire */}
      <View style={styles.letterCell}>
        <View style={[styles.letterCircle, { backgroundColor: itemColor }]}>
          <Text style={[styles.letterText, { color: buttonIconColor }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Nom */}
      <View style={styles.nameCell}>
        <Text
          style={styles.nameText}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </View>

      {/* Prix */}
      <View style={styles.priceCell}>
        <Text style={styles.priceText}>
          {formatPrice(item.price)}
        </Text>
      </View>

      {/* Tags */}
      <View style={styles.tagsCell}>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag) => {
              const tagColor = (typeof tag === 'object' && 'color' in tag && typeof tag.color === 'string' ? tag.color : null) || '#6B7280';
              return (
                <View
                  key={tag.id}
                  style={[
                    styles.tagBadge,
                    { backgroundColor: `${tagColor}15` }
                  ]}
                >
                  <RNText
                    style={[styles.tagText, { color: tagColor }]}
                    numberOfLines={1}
                  >
                    {tag.name}
                  </RNText>
                </View>
              );
            })}
            {item.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}
      </View>

      {/* Bouton Ajouter */}
      <View style={styles.actionCell}>
        <View
          style={[
            styles.addButton,
            { backgroundColor: buttonBgColor }
          ]}
        >
          <Plus size={20} color={buttonIconColor} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
});

OrderItemRow.displayName = 'OrderItemRow';

/**
 * Composant de vue liste (table) pour les items
 */
export const OrderItemsTableView = memo<OrderItemsTableViewProps>(({
  items,
  activeItemType,
  onOpenCustomization
}) => {
  // Les items reçus sont déjà filtrés par le hook useOrderLinesForm (activeItems)
  // Pas besoin de re-filtrer ici
  const filteredItems = items;

  // Si aucun article disponible
  if (filteredItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aucun article disponible dans cette catégorie
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
          <Text style={styles.headerText}>Article</Text>
        </View>
        <View style={styles.priceCell}>
          <Text style={styles.headerText}>Prix</Text>
        </View>
        <View style={styles.tagsCell}>
          <Text style={styles.headerText}>Tags</Text>
        </View>
        <View style={styles.actionCell}>
          <Text style={styles.headerText}>Action</Text>
        </View>
      </View>

      {/* Contenu de la table */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {filteredItems.map((item, index) => (
          <View
            key={item.id}
            style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
          >
            <OrderItemRow
              item={item}
              onOpenCustomization={onOpenCustomization}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

OrderItemsTableView.displayName = 'OrderItemsTableView';

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
  },
  priceCell: {
    flex: 1.5,
    padding: 16,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#2A2E33',
  },
  tagsCell: {
    flex: 2.5,
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    borderWidth: 0,
    maxWidth: 100,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  moreTagsText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
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
