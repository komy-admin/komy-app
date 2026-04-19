import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from './text';
import { Tag } from '~/types/tag.types';
import { colors } from '~/theme';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
}

// Styles dynamiques pour le bouton selon l'état
const getButtonStyle = (isSelected: boolean) => ({
  backgroundColor: isSelected ? colors.success.bg : colors.gray[50],
  borderColor: isSelected ? colors.success.border : colors.gray[200],
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
                borderColor: isSelected ? colors.success.base : colors.gray[300],
              }]} />
              <View style={[styles.core, {
                backgroundColor: isSelected ? colors.success.base : colors.gray[400],
              }]} />
            </View>
            <Text style={[styles.label, {
              fontSize: 13,
              fontWeight: isSelected ? '700' : '600',
              color: isSelected ? colors.success.text : colors.gray[500],
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
