import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LayoutDashboard } from 'lucide-react-native';
import { colors } from '~/theme';

interface EmptyRoomsStateProps {
  onCreateFirstRoom: () => void;
  description?: string;
  buttonLabel?: string;
}

/**
 * Composant mémoïsé pour afficher l'état vide (aucune salle configurée)
 */
export const EmptyRoomsState = memo<EmptyRoomsStateProps>(({
  onCreateFirstRoom,
  description = 'Pour commencer à utiliser le service, vous devez d\'abord créer une salle avec des tables.',
  buttonLabel = 'Créer ma première salle',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LayoutDashboard size={48} color={colors.gray[300]} />
      </View>
      <Text style={styles.title}>
        Aucune salle configurée
      </Text>
      <Text style={styles.description}>
        {description}
      </Text>
      <Pressable
        onPress={onCreateFirstRoom}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
});

EmptyRoomsState.displayName = 'EmptyRoomsState';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[100],
    padding: 48,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.brand.dark,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  button: {
    backgroundColor: colors.brand.dark,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
