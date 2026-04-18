import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { LayoutDashboard, Plus } from 'lucide-react-native';

interface EmptyRoomsStateProps {
  onCreateFirstRoom: () => void;
}

/**
 * Composant mémoïsé pour afficher l'état vide (aucune salle configurée)
 */
export const EmptyRoomsState = memo<EmptyRoomsStateProps>(({ onCreateFirstRoom }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LayoutDashboard size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.title}>
        Aucune salle configurée
      </Text>
      <Text style={styles.description}>
        Pour commencer à utiliser le service, vous devez d'abord créer une salle avec des tables.
      </Text>
      <Pressable
        onPress={onCreateFirstRoom}
        style={styles.button}
      >
        <Plus size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>
          Créer ma première salle
        </Text>
      </Pressable>
    </View>
  );
});

EmptyRoomsState.displayName = 'EmptyRoomsState';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F4F5F7',
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
    color: '#2A2E33',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#2A2E33',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
