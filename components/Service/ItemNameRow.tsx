import { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '~/theme';

interface ItemNameRowProps {
  itemName: string;
  index: number;
}

/**
 * Composant mémoïsé pour afficher un nom d'item dans une liste
 */
export const ItemNameRow = memo<ItemNameRowProps>(({ itemName, index }) => {
  // ✅ useMemo : Style dynamique selon l'index (alternance de couleurs)
  const containerStyle = useMemo(
    () => [
      styles.container,
      index % 2 === 0 ? styles.containerEven : styles.containerOdd
    ],
    [index]
  );

  return (
    <View style={containerStyle}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.itemName}>{itemName}</Text>
    </View>
  );
});

ItemNameRow.displayName = 'ItemNameRow';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  containerEven: {
    backgroundColor: colors.gray[50],
  },
  containerOdd: {
    backgroundColor: colors.white,
  },
  bullet: {
    fontSize: 14,
    color: colors.gray[500],
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    color: colors.gray[800],
    flex: 1,
    fontWeight: '700',
  },
});
