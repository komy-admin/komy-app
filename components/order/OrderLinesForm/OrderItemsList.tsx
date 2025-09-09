import React, { memo, useCallback, useMemo } from 'react';
import { View, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
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

const OrderItemRow = memo<OrderItemRowProps>(({
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

  const dynamicButtonStyles = {
    ...styles.compactQuantityButton,
    width: dynamicButtonSize,
    height: dynamicButtonSize,
  };

  const canRemove = draftQuantity > 0;

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price.toFixed(2)}€</Text>
      </View>
      
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
          {totalQuantity}
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

OrderItemRow.displayName = 'OrderItemRow';

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
      {filteredItems.map(item => (
        <OrderItemRow
          key={item.id}
          item={item}
          totalQuantity={getTotalItemQuantity(item.id)}
          draftQuantity={getDraftItemQuantity(item.id)}
          onUpdateQuantity={updateItemQuantity}
          isTablet={isTablet}
          dynamicButtonSize={dynamicButtonSize}
        />
      ))}
    </View>
  );
});

OrderItemsList.displayName = 'OrderItemsList';

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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
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