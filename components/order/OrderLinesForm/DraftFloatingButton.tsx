import React from 'react';
import { Pressable, StyleSheet, View, Platform, Animated } from 'react-native';
import { Text } from '~/components/ui';
import { ShoppingCart } from 'lucide-react-native';

interface DraftFloatingButtonProps {
  count: number;
  onPress: () => void;
}

export const DraftFloatingButton: React.FC<DraftFloatingButtonProps> = ({
  count,
  onPress
}) => {
  if (count === 0) return null;

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.button}>
        <ShoppingCart size={24} color="#FFFFFF" strokeWidth={2} />
      </View>

      {/* Badge avec count */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A2E33',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
