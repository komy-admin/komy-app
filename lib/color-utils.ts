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
 * Récupérer le prix d'un menu (gère les différentes propriétés possibles)
 * @param menu - Menu dont on veut récupérer le prix
 * @returns Prix du menu
 */
export const getMenuPrice = (menu: Menu): number => {
  // Certains menus ont un 'price' direct, d'autres ont 'basePrice'
  return (menu as any).price || menu.basePrice || 0;
};
