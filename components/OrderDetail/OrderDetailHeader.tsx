import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { ArrowLeftToLine, Edit3 } from 'lucide-react-native';

// Constantes de style inspirées d'OrderLinesForm
const COMMON_STYLES = {
  colors: {
    primary: '#2A2E33',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    border: '#F3F4F6',
    accent: '#6366F1',
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

export interface OrderDetailHeaderProps {
  title: string;
  onBack: () => void;
  onEdit: () => void;
}

export const OrderDetailHeader = memo<OrderDetailHeaderProps>(({
  title,
  onBack,
  onEdit,
}) => {
  return (
    <View style={styles.header}>
      {/* Bouton retour */}
      <Pressable
        onPress={onBack}
        style={styles.backButton}
      >
        <ArrowLeftToLine size={20} color={COMMON_STYLES.colors.primary} />
      </Pressable>

      {/* Titre */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          {title}
        </Text>
      </View>

      {/* Bouton éditer */}
      <Pressable
        onPress={onEdit}
        style={styles.editButton}
      >
        <Edit3 size={18} color={COMMON_STYLES.colors.accent} strokeWidth={2} />
        <Text style={styles.editText}>Modifier</Text>
      </Pressable>
    </View>
  );
});

OrderDetailHeader.displayName = 'OrderDetailHeader';

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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: COMMON_STYLES.colors.border,
    height: '100%',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: COMMON_STYLES.colors.accent,
  },
});
