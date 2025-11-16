import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { X, CheckSquare, Square, Edit3 } from 'lucide-react-native';

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
  isMultiSelectMode?: boolean;
  onToggleMultiSelectMode?: () => void;
}

export const OrderDetailHeader = memo<OrderDetailHeaderProps>(({
  title,
  onBack,
  onEdit,
  isMultiSelectMode = false,
  onToggleMultiSelectMode,
}) => {
  return (
    <View style={styles.header}>
      {/* Bouton retour */}
      <Pressable
        onPress={onBack}
        style={styles.backButton}
      >
        <X size={20} color={COMMON_STYLES.colors.primary} />
      </Pressable>

      {/* Titre */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>
          {title}
        </Text>
      </View>

      {/* Bouton sélection */}
      {onToggleMultiSelectMode && (
        <Pressable
          onPress={onToggleMultiSelectMode}
          style={[
            styles.selectionButton,
            isMultiSelectMode && styles.selectionButtonActive,
          ]}
        >
          {isMultiSelectMode ? (
            <CheckSquare size={18} color="#4F46E5" strokeWidth={2} />
          ) : (
            <Square size={18} color="#6B7280" strokeWidth={2} />
          )}
          <Text style={[
            styles.selectionText,
            isMultiSelectMode && styles.selectionTextActive,
          ]}>
            Sélection
          </Text>
        </Pressable>
      )}

      {/* Bouton modifier */}
      <Pressable
        onPress={onEdit}
        style={styles.editButton}
      >
        <Edit3 size={18} color="#FFFFFF" strokeWidth={2} />
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
    height: 50,
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
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderLeftWidth: 1,
    borderLeftColor: COMMON_STYLES.colors.border,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  selectionButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectionTextActive: {
    color: '#4F46E5',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6366F1',
    height: '100%',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    })
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
