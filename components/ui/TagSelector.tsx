import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text } from './text';
import { Tag } from '~/types/tag.types';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTagIds,
  onTagToggle
}) => {
  if (tags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <Pressable
            key={tag.id}
            style={[styles.tagButton, isSelected && styles.tagButtonActive]}
            onPress={() => onTagToggle(tag.id)}
          >
            <View style={[styles.iconContainer, isSelected && styles.iconContainerActive]}>
              <View style={[styles.pulse, isSelected && styles.pulseActive]} />
              <View style={[styles.core, isSelected && styles.coreActive]} />
            </View>
            <Text style={[styles.tagLabel, isSelected && styles.tagLabelActive]}>
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
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    })
  },
  tagButtonActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 0 3px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)',
    })
  },
  iconContainer: {
    width: 12,
    height: 12,
    marginRight: 10,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {},
  pulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pulseActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    zIndex: 1,
  },
  coreActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: '600',
    })
  },
  tagLabelActive: {
    color: '#047857',
    fontWeight: '700',
    ...(Platform.OS === 'web' && {
      fontWeight: '700',
    })
  },
});
