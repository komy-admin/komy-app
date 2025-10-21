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
}

const OrderItemCard = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization,
  isTablet
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  // Convertir la couleur hex en rgba avec opacité 12%
  const getColorWithOpacity = (hexColor: string, opacity: number): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const itemColor = item.color || '#6B7280';
  const headerBgColor = getColorWithOpacity(itemColor, 0.12);
  const buttonIconColor = getContrastColor(itemColor);

  return (
    <Pressable
      style={[
        styles.itemCard,
        {
          flex: 1,
          minWidth: 190,
          maxWidth: 250,
          borderColor: itemColor
        }
      ]}
      onPress={handleAdd}
    >
      {/* Header coloré avec nom */}
      <View style={[
        styles.coloredHeader,
        { backgroundColor: headerBgColor }
      ]}>
        <Text
          style={[
            styles.itemName,
            { color: itemColor }
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </View>

      {/* Prix */}
      <View style={styles.priceContainer}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price)}
        </Text>
      </View>

      {/* Bouton Ajouter */}
      <View style={styles.addButtonContainer}>
        <View style={[
          styles.addButton,
          { backgroundColor: itemColor }
        ]}>
          <Plus size={22} color={buttonIconColor} strokeWidth={3} />
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

  // Articles filtrés par type actif - mémorisé pour performance
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.itemTypeId === activeItemType && item.isActive
    );
  }, [items, activeItemType]);

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
          { paddingHorizontal: 16 }
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
      >
        <View style={styles.itemsGrid}>
          {filteredItems.map((item) => (
            <OrderItemCard
              key={item.id}
              item={item}
              onOpenCustomization={onOpenCustomization}
              isTablet={isTablet}
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
  },

  // Header styles
  coloredHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 64, // Hauteur fixe pour aligner toutes les cartes (2 lignes de texte)
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
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
    color: '#1F2937',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
