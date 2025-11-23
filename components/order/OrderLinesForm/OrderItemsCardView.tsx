import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, ScrollView, LayoutChangeEvent, Dimensions } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Item } from '~/types/item.types';
import { getContrastColor, formatPrice } from '~/lib/utils';
import { getColorWithOpacity } from '~/lib/color-utils';
import { calculateOptimalCardWidth } from '~/lib/card-layout-utils';

/**
 * Props pour le composant OrderItemsCardView
 */
export interface OrderItemsCardViewProps {
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
  cardWidth: number;
}

const OrderItemCard = memo<OrderItemRowProps>(({
  item,
  onOpenCustomization,
  cardWidth,
}) => {
  const handleAdd = useCallback(() => {
    onOpenCustomization(item);
  }, [item, onOpenCustomization]);

  // Mémoiser les couleurs pour éviter les recalculs
  const colors = useMemo(() => {
    const itemColor = item.color || '#6B7280';
    return {
      itemColor,
      headerBgColor: getColorWithOpacity(itemColor, 0.12),
      buttonIconColor: getContrastColor(itemColor)
    };
  }, [item.color]);

  // Mémoiser le style dynamique pour éviter la création d'un nouvel objet à chaque render
  const dynamicStyle = useMemo(() => ({
    width: cardWidth,
    minWidth: cardWidth,
    maxWidth: cardWidth,
    flexShrink: 0,
    flexGrow: 0,
    borderColor: colors.itemColor
  }), [cardWidth, colors.itemColor]);

  return (
    <Pressable
      style={[styles.itemCard, dynamicStyle]}
      onPress={handleAdd}
    >
      {/* Header coloré avec nom */}
      <View style={[
        styles.coloredHeader,
        { backgroundColor: colors.headerBgColor }
      ]}>
        <Text
          style={[
            styles.itemName,
            { color: colors.itemColor }
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
          { backgroundColor: colors.itemColor }
        ]}>
          <Plus size={22} color={colors.buttonIconColor} strokeWidth={3} />
        </View>
      </View>
    </Pressable>
  );
});

OrderItemCard.displayName = 'OrderItemCard';

/**
 * Composant de vue cartes pour les articles
 * Affiche les articles filtrés par type
 */
export const OrderItemsCardView = memo<OrderItemsCardViewProps>(({
  items,
  activeItemType,
  onOpenCustomization
}) => {
  // État pour stocker la largeur réelle du container
  // Initialisation avec une estimation basée sur la largeur de la fenêtre
  // pour éviter le flash visuel au premier render
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    const windowWidth = Dimensions.get('window').width;
    // Soustraire le padding du gridContainer (paddingHorizontal: 16 * 2)
    return Math.max(0, windowWidth - 32);
  });

  // État pour gérer le fade-in après le premier layout
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Ref pour gérer le requestAnimationFrame et éviter les race conditions
  const layoutTimeoutRef = useRef<number | null>(null);

  // Réinitialiser isLayoutReady quand le type d'item change
  useEffect(() => {
    setIsLayoutReady(false);
    // Nettoyer tout requestAnimationFrame en attente
    if (layoutTimeoutRef.current !== null) {
      cancelAnimationFrame(layoutTimeoutRef.current);
      layoutTimeoutRef.current = null;
    }
  }, [activeItemType]);

  // Callback pour mesurer la largeur - mise à jour IMMÉDIATE sans debounce
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);

    // Nettoyer le précédent timeout si existant
    if (layoutTimeoutRef.current !== null) {
      cancelAnimationFrame(layoutTimeoutRef.current);
    }

    // Marquer le layout comme prêt après la stabilisation
    layoutTimeoutRef.current = requestAnimationFrame(() => {
      setIsLayoutReady(true);
      layoutTimeoutRef.current = null;
    });
  }, []);

  // Cleanup à la destruction du composant
  useEffect(() => {
    return () => {
      if (layoutTimeoutRef.current !== null) {
        cancelAnimationFrame(layoutTimeoutRef.current);
      }
    };
  }, []);

  // Articles filtrés par type actif - mémorisé pour performance
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.itemTypeId === activeItemType && item.isActive
    );
  }, [items, activeItemType]);

  // Calcul de la largeur optimale des cartes
  // containerWidth mesure itemsGrid directement (déjà sans padding)
  const cardWidth = useMemo(() => {
    return calculateOptimalCardWidth({
      containerWidth,
      padding: 0, // itemsGrid n'a pas de padding
      gap: 12,
      minCardWidth: 180,
      maxCardWidth: 240,
    });
  }, [containerWidth]);

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
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        bounces={false}
      >
        <View
          style={[
            styles.itemsGrid,
            { opacity: isLayoutReady ? 1 : 0 }
          ]}
          onLayout={handleLayout}
        >
          {filteredItems.map((item) => (
            <OrderItemCard
              key={item.id}
              item={item}
              onOpenCustomization={onOpenCustomization}
              cardWidth={cardWidth}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

OrderItemsCardView.displayName = 'OrderItemsCardView';

const COLORS = {
  background: '#FFFFFF',
  textSecondary: '#6B7280',
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
    paddingHorizontal: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
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
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Card styles
  itemCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
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
