import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { ArrowLeftToLine } from 'lucide-react-native';

// Constantes de style inspirées d'AdminFormView
const COMMON_STYLES = {
  colors: {
    primary: '#2A2E33',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#F3F4F6',
  },
  typography: {
    title: {
      fontSize: 18,
      fontWeight: '800' as const,
      color: '#2A2E33',
      letterSpacing: 0.5,
    },
  },
  spacing: {
    xs: 4,
    md: 16,
    lg: 24,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

/**
 * Props pour le composant OrderLinesHeader
 */
export interface OrderLinesHeaderProps {
  title: string;
  onClose: () => void;
  isVisible?: boolean;
}

/**
 * Composant header pour OrderLinesForm
 * Affiche le titre et le bouton de retour avec le style AdminFormView
 *
 * @param props - Props du composant
 * @returns Composant header mémorisé
 */
export const OrderLinesHeader = memo<OrderLinesHeaderProps>(({
  title,
  onClose,
  isVisible = true
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.header}>
      {/* Section Bouton retour */}
      <Pressable
        onPress={onClose}
        style={styles.backButton}
      >
        <ArrowLeftToLine size={20} color={COMMON_STYLES.colors.primary} />
      </Pressable>

      {/* Section Titre */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          {title}
        </Text>
      </View>
    </View>
  );
});

OrderLinesHeader.displayName = 'OrderLinesHeader';

const styles = StyleSheet.create({
  header: {
    backgroundColor: COMMON_STYLES.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: COMMON_STYLES.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: COMMON_STYLES.spacing.xs,
    ...COMMON_STYLES.shadow,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(8px)',
    })
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: COMMON_STYLES.spacing.lg,
    paddingVertical: COMMON_STYLES.spacing.md,
    borderRightWidth: 1,
    borderRightColor: COMMON_STYLES.colors.border,
    height: '100%',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: COMMON_STYLES.colors.backgroundSecondary,
      }
    })
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: COMMON_STYLES.spacing.lg,
    paddingRight: COMMON_STYLES.spacing.lg,
  },
  titleText: {
    ...COMMON_STYLES.typography.title,
    textAlign: 'left',
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },
});