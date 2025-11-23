import { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, ScrollView, LayoutChangeEvent, Dimensions } from 'react-native';
import { Text } from '~/components/ui';
import { Plus } from 'lucide-react-native';
import { Menu } from '~/types/menu.types';
import { formatPrice } from '~/lib/utils';
import { getMenuPrice } from '~/lib/color-utils';
import { calculateOptimalCardWidth } from '~/lib/card-layout-utils';

/**
 * Props pour le composant OrderMenusCardView
 */
export interface OrderMenusCardViewProps {
  activeMenus: Menu[];
  handleMenuAdd: (menu: Menu) => void;
}

/**
 * Composant pour afficher un menu individuel avec contrôles
 */
interface OrderMenuRowProps {
  menu: Menu;
  onMenuAdd: (menu: Menu) => void;
  cardWidth: number;
}

const OrderMenuRow = memo<OrderMenuRowProps>(({
  menu,
  onMenuAdd,
  cardWidth,
}) => {
  const handleAdd = useCallback(() => {
    onMenuAdd(menu);
  }, [menu, onMenuAdd]);

  // Mémoiser le style dynamique pour éviter la création d'un nouvel objet à chaque render
  const dynamicStyle = useMemo(() => ({
    width: cardWidth,
    minWidth: cardWidth,
    maxWidth: cardWidth,
    flexShrink: 0,
    flexGrow: 0,
    borderColor: '#6366F1'
  }), [cardWidth]);

  return (
    <Pressable
      style={[styles.menuCard, dynamicStyle]}
      onPress={handleAdd}
    >
      {/* Header avec nom et description */}
      <View style={[styles.menuHeader, MENU_COLORS.headerBg]}>
        <Text
          style={[styles.itemName, MENU_COLORS.text]}
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
          À partir de {formatPrice(getMenuPrice(menu))}
        </Text>
      </View>

      {/* Bouton Ajouter */}
      <View style={styles.addButtonContainer}>
        <View style={[styles.addButton, MENU_COLORS.button]}>
          <Plus size={22} color="#FFFFFF" strokeWidth={3} />
        </View>
      </View>
    </Pressable>
  );
});

OrderMenuRow.displayName = 'OrderMenuRow';

/**
 * Composant de vue cartes des menus pour OrderLinesForm
 * Affiche tous les menus actifs avec leurs contrôles d'ajout
 *
 * @param props - Props du composant
 * @returns Composant de vue cartes de menus mémorisé
 */
export const OrderMenusCardView = memo<OrderMenusCardViewProps>(({
  activeMenus,
  handleMenuAdd
}) => {
  // État pour stocker la largeur réelle du container
  // Initialisation avec la largeur de la fenêtre pour éviter le flash visuel
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    return Dimensions.get('window').width;
  });

  // État pour gérer le fade-in après le premier layout
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // Ref pour gérer le requestAnimationFrame et éviter les race conditions
  const layoutTimeoutRef = useRef<number | null>(null);

  // Réinitialiser isLayoutReady quand les menus changent
  useEffect(() => {
    setIsLayoutReady(false);
    // Nettoyer tout requestAnimationFrame en attente
    if (layoutTimeoutRef.current !== null) {
      cancelAnimationFrame(layoutTimeoutRef.current);
      layoutTimeoutRef.current = null;
    }
  }, [activeMenus.length]);

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

  // Menus filtrés - seulement les actifs
  const filteredMenus = useMemo(() => {
    return activeMenus.filter(menu => menu.isActive);
  }, [activeMenus]);

  // Calcul de la largeur optimale des cartes
  // containerWidth mesure contentContainer (qui a paddingHorizontal: 16)
  const cardWidth = useMemo(() => {
    return calculateOptimalCardWidth({
      containerWidth,
      padding: 16 * 2, // contentContainer a paddingHorizontal: 16
      gap: 12,
      minCardWidth: 180,
      maxCardWidth: 240,
    });
  }, [containerWidth]);

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
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      bounces={false}
    >
      <View
        style={[
          styles.contentContainer,
          { opacity: isLayoutReady ? 1 : 0 }
        ]}
        onLayout={handleLayout}
      >
        {filteredMenus.map((menu) => (
          <OrderMenuRow
            key={menu.id}
            menu={menu}
            onMenuAdd={handleMenuAdd}
            cardWidth={cardWidth}
          />
        ))}
      </View>
    </ScrollView>
  );
});

OrderMenusCardView.displayName = 'OrderMenusCardView';

// Couleurs constantes pour les menus (hors du composant pour éviter les re-créations)
const MENU_COLORS = {
  headerBg: { backgroundColor: 'rgba(99, 102, 241, 0.08)' },
  text: { color: '#6366F1' },
  button: { backgroundColor: '#6366F1' },
};

const COLORS = {
  background: '#FFFFFF',
  textSecondary: '#6B7280',
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 180,
  },

  // Header styles
  menuHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 90, // Hauteur fixe pour aligner toutes les cartes
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
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
    height: 50, // Hauteur fixe pour gérer les prix à 2 ou 3 chiffres
    justifyContent: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 18,
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