import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '~/theme';

// Liste des icônes disponibles pour les types d'articles
// Organisées par catégorie avec MaterialCommunityIcons
export interface AvailableIcon {
  name: string;
  label: string;
}

export interface AvailableIconWithCategory extends AvailableIcon {
  category: 'drinks' | 'food' | 'desserts';
}

export const AVAILABLE_ICONS: AvailableIconWithCategory[] = [
  // 🍷 BOISSONS
  { name: 'glass-wine', label: 'Verre de vin', category: 'drinks' },
  { name: 'glass-flute', label: 'Flûte à champagne', category: 'drinks' },
  { name: 'glass-tulip', label: 'Verre tulipe', category: 'drinks' },
  { name: 'glass-cocktail', label: 'Cocktail', category: 'drinks' },
  { name: 'bottle-wine', label: 'Bouteille de vin', category: 'drinks' },
  { name: 'bottle-wine-outline', label: 'Bouteille vin (contour)', category: 'drinks' },
  { name: 'bottle-soda', label: 'Bouteille soda', category: 'drinks' },
  { name: 'bottle-soda-outline', label: 'Bouteille soda (contour)', category: 'drinks' },
  { name: 'beer', label: 'Bière', category: 'drinks' },
  { name: 'beer-outline', label: 'Bière (contour)', category: 'drinks' },
  { name: 'glass-pint-outline', label: 'Pinte', category: 'drinks' },
  { name: 'glass-mug-variant', label: 'Chope de bière', category: 'drinks' },
  { name: 'glass-mug', label: 'Verre à spiritueux', category: 'drinks' },
  { name: 'coffee', label: 'Café', category: 'drinks' },
  { name: 'coffee-outline', label: 'Café (contour)', category: 'drinks' },
  { name: 'tea', label: 'Thé', category: 'drinks' },
  { name: 'tea-outline', label: 'Thé (contour)', category: 'drinks' },
  { name: 'cup', label: 'Tasse', category: 'drinks' },
  { name: 'cup-water', label: 'Verre d\'eau', category: 'drinks' },
  { name: 'cup-outline', label: 'Gobelet', category: 'drinks' },
  { name: 'blender', label: 'Blender/Smoothie', category: 'drinks' },

  // 🍕 REPAS/PLATS
  // Couverts & Service
  { name: 'silverware-fork-knife', label: 'Couverts', category: 'food' },
  { name: 'silverware-variant', label: 'Couverts variés', category: 'food' },
  { name: 'room-service', label: 'Cloche/Service', category: 'food' },
  { name: 'room-service-outline', label: 'Cloche (contour)', category: 'food' },

  // Plats cuisinés & Marmites
  { name: 'food', label: 'Plat général', category: 'food' },
  { name: 'food-variant', label: 'Plat varié', category: 'food' },
  { name: 'pot', label: 'Marmite', category: 'food' },
  { name: 'pot-outline', label: 'Marmite (contour)', category: 'food' },
  { name: 'pot-steam', label: 'Marmite fumante', category: 'food' },
  { name: 'pot-steam-outline', label: 'Marmite fumante (contour)', category: 'food' },
  { name: 'pot-mix', label: 'Casserole mélange', category: 'food' },
  { name: 'pot-mix-outline', label: 'Casserole (contour)', category: 'food' },
  { name: 'bowl', label: 'Bol', category: 'food' },
  { name: 'bowl-outline', label: 'Bol (contour)', category: 'food' },
  { name: 'bowl-mix', label: 'Bol mélange', category: 'food' },
  { name: 'bowl-mix-outline', label: 'Bol mélange (contour)', category: 'food' },

  // Fast-food & Snacks
  { name: 'pizza', label: 'Pizza', category: 'food' },
  { name: 'hamburger', label: 'Hamburger', category: 'food' },
  { name: 'french-fries', label: 'Frites', category: 'food' },
  { name: 'taco', label: 'Taco', category: 'food' },

  // Pâtes & Riz
  { name: 'noodles', label: 'Nouilles', category: 'food' },
  { name: 'pasta', label: 'Pâtes', category: 'food' },
  { name: 'rice', label: 'Riz', category: 'food' },

  // Viandes & Poissons
  { name: 'food-steak', label: 'Steak', category: 'food' },
  { name: 'food-drumstick', label: 'Poulet', category: 'food' },
  { name: 'food-drumstick-outline', label: 'Poulet (contour)', category: 'food' },
  { name: 'turkey', label: 'Dinde', category: 'food' },
  { name: 'fish', label: 'Poisson', category: 'food' },
  { name: 'egg', label: 'Œuf', category: 'food' },
  { name: 'egg-outline', label: 'Œuf (contour)', category: 'food' },
  { name: 'egg-fried', label: 'Œuf au plat', category: 'food' },

  // Pain & Boulangerie
  { name: 'baguette', label: 'Baguette', category: 'food' },
  { name: 'bread-slice', label: 'Pain tranché', category: 'food' },
  { name: 'bread-slice-outline', label: 'Pain (contour)', category: 'food' },
  { name: 'food-croissant', label: 'Croissant', category: 'food' },

  // Fruits & Légumes
  { name: 'carrot', label: 'Carotte', category: 'food' },
  { name: 'corn', label: 'Maïs', category: 'food' },
  { name: 'leaf', label: 'Feuille/Salade', category: 'food' },
  { name: 'sprout', label: 'Germe/Légume', category: 'food' },
  { name: 'sprout-outline', label: 'Germe (contour)', category: 'food' },

  // Produits laitiers
  { name: 'cheese', label: 'Fromage', category: 'food' },

  // Chef & Cuisine
  { name: 'chef-hat', label: 'Toque de chef', category: 'food' },
  { name: 'grill', label: 'Grill/BBQ', category: 'food' },
  { name: 'grill-outline', label: 'Grill (contour)', category: 'food' },
  { name: 'stove', label: 'Cuisinière', category: 'food' },

  // 🍰 DESSERTS
  // Gâteaux & Pâtisseries
  { name: 'cupcake', label: 'Cupcake', category: 'desserts' },
  { name: 'muffin', label: 'Muffin', category: 'desserts' },

  // Glaces & Sorbets
  { name: 'ice-cream', label: 'Glace', category: 'desserts' },
  { name: 'ice-pop', label: 'Glace à l\'eau', category: 'desserts' },

  // Biscuits & Cookies
  { name: 'cookie', label: 'Cookie', category: 'desserts' },
  { name: 'cookie-outline', label: 'Cookie (contour)', category: 'desserts' },

  // Chocolat & Cacao
  { name: 'coffee-maker', label: 'Chocolat chaud', category: 'desserts' },
  { name: 'coffee-maker-outline', label: 'Chocolat chaud (contour)', category: 'desserts' },

  // Fruits sucrés
  { name: 'fruit-cherries', label: 'Cerises', category: 'desserts' },
  { name: 'fruit-grapes', label: 'Raisins', category: 'desserts' },
  { name: 'fruit-pineapple', label: 'Ananas', category: 'desserts' },
  { name: 'fruit-watermelon', label: 'Pastèque', category: 'desserts' },
  { name: 'food-apple', label: 'Pomme', category: 'desserts' },
];

interface IconSelectorProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  color?: string;
  disabledIcons?: string[]; // Icônes déjà utilisées par d'autres itemTypes
  iconsToShow?: AvailableIconWithCategory[]; // Filtre pour afficher certaines icônes uniquement
}

/**
 * Composant de sélection d'icônes
 *
 * Affiche une grille d'icônes sélectionnables organisées par catégories (Boissons, Salé, Sucré).
 * Utilisé principalement pour les types d'articles mais peut être réutilisé ailleurs.
 *
 * @param selectedIcon - Nom de l'icône actuellement sélectionnée
 * @param onSelectIcon - Callback appelé lors de la sélection d'une icône
 * @param color - Couleur de l'icône sélectionnée (défaut: violet #A855F7)
 */
export const IconSelector: React.FC<IconSelectorProps> = React.memo(({
  selectedIcon,
  onSelectIcon,
  color = colors.purple.base,
  disabledIcons = [],
  iconsToShow
}) => {
  // Utiliser iconsToShow si fourni, sinon toutes les icônes
  const iconsToDisplay = iconsToShow || AVAILABLE_ICONS;

  return (
    <View>
      {/* Grille d'icônes */}
      <View style={styles.iconGrid}>
        {iconsToDisplay.map((iconItem) => {
          const isSelected = selectedIcon === iconItem.name;
          const isDisabled = disabledIcons.includes(iconItem.name);
          const iconColor = isDisabled ? colors.neutral[300] : (isSelected ? color : colors.neutral[500]);

          return (
            <TouchableOpacity
              key={iconItem.name}
              style={[
                styles.iconButton,
                isSelected && styles.iconButtonSelected,
                isSelected && { borderColor: color },
                isDisabled && styles.iconButtonDisabled
              ]}
              onPress={() => {
                if (!isDisabled) {
                  onSelectIcon(iconItem.name);
                }
              }}
              activeOpacity={isDisabled ? 1 : 0.7}
              disabled={isDisabled}
            >
              <MaterialCommunityIcons
                name={iconItem.name as any}
                size={24}
                color={iconColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

IconSelector.displayName = 'IconSelector';

const styles = StyleSheet.create({
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSelected: {
    backgroundColor: colors.neutral[50],
  },
  iconButtonDisabled: {
    opacity: 0.3,
    backgroundColor: colors.neutral[50],
  },
});
