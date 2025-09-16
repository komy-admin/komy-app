import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet, ScrollView } from 'react-native';
import { Text } from '~/components/ui';
import { Plus, Minus } from 'lucide-react-native';
import { Item } from '~/types/item.types';

/**
 * Props pour le composant OrderItemsList
 */
export interface OrderItemsListProps {
  items: Item[];
  activeItemType: string;
  getTotalItemQuantity: (itemId: string) => number;
  getDraftItemQuantity: (itemId: string) => number;
  updateItemQuantity: (itemId: string, action: 'remove' | 'add') => void;
}

/**
 * Composant pour afficher un item individuel avec contrôles de quantité
 */
interface OrderItemRowProps {
  item: Item;
  totalQuantity: number;
  draftQuantity: number;
  onUpdateQuantity: (itemId: string, action: 'remove' | 'add') => void;
  isTablet: boolean;
  dynamicButtonSize: number;
}

const OrderItemCard = memo<OrderItemRowProps>(({
  item,
  totalQuantity,
  draftQuantity,
  onUpdateQuantity,
  isTablet,
  dynamicButtonSize
}) => {
  const handleAdd = useCallback(() => {
    onUpdateQuantity(item.id, 'add');
  }, [item.id, onUpdateQuantity]);

  const handleRemove = useCallback(() => {
    onUpdateQuantity(item.id, 'remove');
  }, [item.id, onUpdateQuantity]);

  const canRemove = draftQuantity > 0;


  return (
    <>
      {/* Info de l'item */}
      <View style={styles.itemInfo}>
        <Text
          style={styles.itemName}
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          minimumFontScale={0.75}
        >
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>{item.price.toFixed(2)}€</Text>
      </View>

      {/* Contrôles de quantité */}
      <View style={styles.quantityContainer}>
        <Pressable
          style={[
            styles.quantityButton,
            !canRemove && styles.quantityButtonDisabled
          ]}
          onPress={handleRemove}
          disabled={!canRemove}
        >
          <Minus
            size={16}
            color={canRemove ? COLORS.primary : COLORS.textSecondary}
            strokeWidth={2}
          />
        </Pressable>

        <Text style={styles.quantityText}>
          {totalQuantity}
        </Text>

        <Pressable
          style={styles.quantityButton}
          onPress={handleAdd}
        >
          <Plus
            size={16}
            color={COLORS.primary}
            strokeWidth={2}
          />
        </Pressable>
      </View>
    </>
  );
});

OrderItemCard.displayName = 'OrderItemCard';

/**
 * Composant de liste des articles pour OrderLinesForm
 * Affiche les articles filtrés par type avec contrôles de quantité
 * 
 * @param props - Props du composant
 * @returns Composant de liste d'articles mémorisé
 */
export const OrderItemsList = memo<OrderItemsListProps>(({
  items,
  activeItemType,
  getTotalItemQuantity,
  getDraftItemQuantity,
  updateItemQuantity
}) => {
  // Détection taille écran pour optimiser tactile tablette
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  
  // Styles dynamiques pour boutons optimisés tablette
  const dynamicButtonSize = isTablet ? 38 : 32;
  
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
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              // Supprime marginRight pour les 3ème cartes de chaque ligne
              (index + 1) % 3 === 0 && { marginRight: 0 }
            ]}
          >
            <OrderItemCard
              item={item}
              totalQuantity={getTotalItemQuantity(item.id)}
              draftQuantity={getDraftItemQuantity(item.id)}
              onUpdateQuantity={updateItemQuantity}
              isTablet={isTablet}
              dynamicButtonSize={dynamicButtonSize}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

OrderItemsList.displayName = 'OrderItemsList';

// Constantes de style communes - Style MenuForm avec plus de contraste
const COLORS = {
  primary: '#2A2E33',
  success: '#059669',
  background: '#F8F9FA', // Background plus clair et visible
  backgroundSecondary: '#f8fafc',
  border: '#D1D5DB', // Border plus sombre et contrastée
  borderLight: '#D1D5DB',
  disabled: '#E5E7EB',
  text: '#2A2E33',
  textSecondary: '#6b7280',
};

const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};

const styles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Même couleur que navigation (blanc pur)
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
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

  // Card styles
  itemCard: {
    flexBasis: '32.5%',
    maxWidth: '32.5%',
    height: 130,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    padding: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
  },

  // Text styles
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  itemPrice: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 'auto',
  },

  // Quantity controls - Style unifié avec OrderMenusList
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Plus blanc pour plus de contraste
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB', // Border plus visible
    overflow: 'hidden',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 32,
    paddingHorizontal: 8,
  },
});