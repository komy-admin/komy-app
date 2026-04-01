import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from './text';
import { Tag } from '~/types/tag.types';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
}

// Styles dynamiques pour le bouton selon l'état
const getButtonStyle = (isSelected: boolean) => ({
  backgroundColor: isSelected ? '#ECFDF5' : '#FAFAFA',
  borderColor: isSelected ? '#34D399' : '#E5E7EB',
  ...Platform.select({
    ios: {
      shadowColor: isSelected ? '#10B981' : '#000',
      shadowOffset: { width: 0, height: isSelected ? 4 : 1 },
      shadowOpacity: isSelected ? 0.15 : 0.04,
      shadowRadius: isSelected ? 8 : 3,
    },
    android: { elevation: 0 }, // Pas de shadow border sur Android
    web: {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isSelected
        ? '0 0 0 3px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)'
        : '0 1px 3px rgba(0, 0, 0, 0.04)',
    } as any,
  }),
});

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTagIds,
  onTagToggle
}) => {
  if (tags.length === 0) return null;

  return (
    <View style={styles.container}>
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            style={[styles.button, getButtonStyle(isSelected)]}
            onPress={() => onTagToggle(tag.id)}
          >
            <View style={styles.iconContainer}>
              <View style={[styles.pulse, {
                backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                borderColor: isSelected ? '#10B981' : '#D1D5DB',
              }]} />
              <View style={[styles.core, {
                backgroundColor: isSelected ? '#10B981' : '#9CA3AF',
              }]} />
            </View>
            <Text style={[styles.label, {
              fontSize: 13,
              fontWeight: isSelected ? '700' : '600',
              color: isSelected ? '#047857' : '#6B7280',
              ...(Platform.OS === 'web' && {
                fontSize: 13,
                fontWeight: isSelected ? 700 : 600,
              }),
            }]}>
              {tag.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  iconContainer: {
    width: 12,
    height: 12,
    marginRight: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    letterSpacing: 0.2,
    ...Platform.select({
      web: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
      } as any,
    }),
  },
});
