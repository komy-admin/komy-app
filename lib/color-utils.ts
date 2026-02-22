import { Menu } from '~/types/menu.types';

/**
 * Convertir une couleur hex en rgba avec opacité
 * @param hexColor - Couleur au format #RRGGBB
 * @param opacity - Opacité entre 0 et 1
 * @returns Couleur au format rgba(r, g, b, opacity)
 */
export const getColorWithOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Récupérer le prix minimum d'un menu (basePrice + supplements obligatoires)
 * Inclut le priceModifier des catégories obligatoires et le supplement minimum
 * des items obligatoires (si la catégorie n'a qu'un seul article disponible)
 * @param menu - Menu dont on veut récupérer le prix
 * @returns Prix minimum du menu en centimes
 */
export const getMenuPrice = (menu: Menu): number => {
  const base = (menu as any).price || menu.basePrice || 0;
  if (!menu.categories) return base;

  let requiredModifiers = 0;
  menu.categories.forEach((cat) => {
    if (!cat.isRequired) return;
    requiredModifiers += cat.priceModifier || 0;
  });

  return base + requiredModifiers;
};
