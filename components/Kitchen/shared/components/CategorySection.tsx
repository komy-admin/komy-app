import { View, StyleSheet } from 'react-native';
import { KitchenItem } from '../types/kitchen-card.types';
import { ItemRow } from './ItemRow';
import { SectionDivider } from '~/components/ui';

interface CategorySectionProps {
  category: string;
  items: KitchenItem[];
  isLastSection: boolean;
  showStatusBadges?: boolean;
  showItemBackgroundColors?: boolean;
}

/**
 * Composant qui affiche une section de catégorie avec ses items
 *
 * Affiche le header de catégorie (ex: "ENTRÉE") suivi de la liste des items.
 */
export function CategorySection({
  category,
  items,
  isLastSection,
  showStatusBadges = false,
  showItemBackgroundColors = false,
}: CategorySectionProps) {
  return (
    <View style={[styles.container, isLastSection && styles.containerLast]}>
      <SectionDivider title={category} style={{ paddingLeft: 12 }} />

      {items.map((item, index) => (
        <ItemRow
          key={item.id}
          item={item}
          isLastItem={index === items.length - 1}
          showStatusBadge={showStatusBadges}
          showBackgroundColors={showItemBackgroundColors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  containerLast: {
    marginBottom: 0,
  },
});
