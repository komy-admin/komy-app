import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { getContrastColor, formatPrice } from '~/lib/utils';

/**
 * Props pour le composant OrderItemsList
 */
export interface OrderItemsListProps {
  items: Item[];
  activeItemType: string;
  onOpenCustomization: (item: Item) => void;
}

/**
 * Composant pour afficher un item individuel
 */
interface OrderItemRowProps {
  item: Item;
  onOpenCustomization: (item: Item) => void;
  isTablet: boolean;
  cardWidth: number;
}

const OrderItemCard = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization,
  isTablet,
  cardWidth
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  return (
    <Pressable
      style={[styles.itemCard, { width: cardWidth }]}
      onPress={handleAdd}
    >
      {/* Header coloré avec nom */}
      {item.color ? (
        <View style={[
          styles.coloredHeader,
          { backgroundColor: item.color }
        ]}>
          <Text
            style={[
              styles.itemName,
              { color: getContrastColor(item.color) }
            ]}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      ) : (
        <View style={styles.plainHeader}>
          <Text
            style={styles.itemNamePlain}
            numberOfLines={2}
          >
            {item.name}
          </Text>
        </View>
      )}

      {/* Prix */}
      <View style={styles.priceContainer}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price)}
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

OrderItemCard.displayName = 'OrderItemCard';

/**
 * Composant de liste des articles pour OrderLinesForm
 * Affiche les articles filtrés par type
 */
export const OrderItemsList = memo<OrderItemsListProps>(({
  items,
  activeItemType,
  onOpenCustomization
}) => {
  // Détection taille écran pour adapter la disposition
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isMobile = width < 480;
  const isSmallTablet = width >= 480 && width < 768;

  // Calculer le nombre de colonnes en fonction de la largeur
  const getColumnsPerRow = () => {
    if (isMobile) return 2; // Mobile: 2 colonnes
    if (isSmallTablet) return 3; // Petite tablette: 3 colonnes
    return 4; // Grande tablette: 4 colonnes
  };

  const columnsPerRow = getColumnsPerRow();

  // Articles filtrés par type actif - mémorisé pour performance
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.itemTypeId === activeItemType && item.isActive
    );
  }, [items, activeItemType]);

  // Calculer la largeur des cartes
  const cardWidth = useMemo(() => {
    const gap = 12;
    const padding = 16;
    const availableWidth = width - (padding * 2) - (gap * (columnsPerRow - 1));
    const calculatedWidth = availableWidth / columnsPerRow;

    return Math.max(160, Math.min(220, calculatedWidth));
  }, [width, columnsPerRow]);

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.gridContainer,
          { paddingHorizontal: isMobile ? 12 : 16 }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
      >
        <View style={styles.itemsGrid}>
          {filteredItems.map((item, index) => (
            <OrderItemCard
              key={item.id}
              item={item}
              onOpenCustomization={onOpenCustomization}
              isTablet={isTablet}
              cardWidth={cardWidth}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

OrderItemsList.displayName = 'OrderItemsList';

const COLORS = {
  background: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  price: '#059669',
  addButton: '#2A2E33',
};

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingVertical: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  itemCard: {
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
    minHeight: 160,
    position: 'relative',
  },

  // Header styles
  coloredHeader: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plainHeader: {
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
    textAlign: 'center',
    lineHeight: 20,
  },
  itemNamePlain: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Prix
  priceContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
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
