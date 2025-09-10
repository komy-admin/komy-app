import React, { memo, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { MenuCategoryFormData } from './MenuEditor.types';
import { ItemType } from '~/types/item-type.types';
import { IconButton } from '~/components/ui/IconButton';

interface CategoryEditorProps {
  category: MenuCategoryFormData;
  categoryIndex: number;
  itemTypes: ItemType[];
  errors: Record<string, string>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateCategory: (index: number, field: keyof MenuCategoryFormData, value: any) => void;
  onRemoveCategory: (index: number) => void;
  children?: React.ReactNode;
}

export const CategoryEditor = memo<CategoryEditorProps>(({
  category,
  categoryIndex,
  itemTypes,
  errors,
  isExpanded,
  onToggleExpand,
  onUpdateCategory,
  onRemoveCategory,
  children
}) => {
  const itemType = itemTypes.find(type => type.id === category.itemTypeId);

  const handleToggleExpand = useCallback(() => {
    onToggleExpand();
  }, [onToggleExpand]);

  const handleRemoveCategory = useCallback(() => {
    onRemoveCategory(categoryIndex);
  }, [onRemoveCategory, categoryIndex]);

  const handleUpdateItemType = useCallback((itemTypeId: string) => {
    onUpdateCategory(categoryIndex, 'itemTypeId', itemTypeId);
  }, [onUpdateCategory, categoryIndex]);

  const handleUpdateMaxSelections = useCallback((text: string) => {
    onUpdateCategory(categoryIndex, 'maxSelections', text);
  }, [onUpdateCategory, categoryIndex]);

  const handleUpdatePriceModifier = useCallback((text: string) => {
    onUpdateCategory(categoryIndex, 'priceModifier', text);
  }, [onUpdateCategory, categoryIndex]);

  const handleToggleRequired = useCallback(() => {
    onUpdateCategory(categoryIndex, 'isRequired', !category.isRequired);
  }, [onUpdateCategory, categoryIndex, category.isRequired]);

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryHeaderLeft}>
          <View style={styles.categoryNumberBadge}>
            <Text style={styles.categoryNumberText}>{categoryIndex + 1}</Text>
          </View>
          <View style={styles.categoryHeaderInfo}>
            <Text style={styles.categoryHeaderTitle}>
              {itemType?.name || 'Configuration de catégorie'}
            </Text>
            <Text style={styles.categoryHeaderSubtitle}>
              {category.isRequired ? 'Obligatoire' : 'Optionnel'} •
              Max {category.maxSelections} sélection{parseInt(category.maxSelections) > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.categoryHeaderActions}>
          <IconButton
            iconName="pencil"
            variant="primary"
            isTransparent={true}
            onPress={handleToggleExpand}
            accessibilityRole="button"
            accessibilityLabel="Modifier la catégorie"
            accessibilityHint="Toucher pour éditer les paramètres de la catégorie"
          />
          <IconButton
            iconName="trash"
            variant="danger"
            isTransparent={false}
            onPress={handleRemoveCategory}
            accessibilityRole="button"
            accessibilityLabel="Supprimer la catégorie"
            accessibilityHint="Toucher pour supprimer cette catégorie"
          />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.categoryContent}>
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Type d'item *</Text>
            <View style={styles.categoryButtons}>
              {itemTypes.map((itemType) => (
                <Pressable
                  key={itemType.id}
                  style={[
                    styles.categoryButton,
                    category.itemTypeId === itemType.id && styles.categoryButtonActive
                  ]}
                  onPress={() => handleUpdateItemType(itemType.id)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category.itemTypeId === itemType.id && styles.categoryButtonTextActive
                  ]}>
                    {itemType.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors[`category_${categoryIndex}_type`] && (
              <Text style={styles.errorText}>{errors[`category_${categoryIndex}_type`]}</Text>
            )}
          </View>

          <View style={[styles.row, { marginBottom: 12 }]}>
            <View style={[styles.field, styles.fieldSmall]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Sélections max *</Text>
              <TextInput
                value={category.maxSelections}
                onChangeText={handleUpdateMaxSelections}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  errors[`category_${categoryIndex}_max`] && { borderColor: '#EF4444' }
                ]}
              />
              {errors[`category_${categoryIndex}_max`] && (
                <Text style={styles.errorText}>{errors[`category_${categoryIndex}_max`]}</Text>
              )}
            </View>

            <View style={[styles.field, styles.fieldSmall]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Modificateur prix (€)</Text>
              <TextInput
                value={category.priceModifier}
                onChangeText={handleUpdatePriceModifier}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  errors[`category_${categoryIndex}_price`] && { borderColor: '#EF4444' }
                ]}
              />
              {errors[`category_${categoryIndex}_price`] && (
                <Text style={styles.errorText}>{errors[`category_${categoryIndex}_price`]}</Text>
              )}
            </View>

            <View style={[styles.field, styles.fieldSmall, { marginLeft: 12 }]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Options</Text>
              <Pressable
                style={[styles.requiredToggle, category.isRequired && styles.requiredToggleActive]}
                onPress={handleToggleRequired}
              >
                <View style={[styles.requiredIndicator, category.isRequired && styles.requiredIndicatorActive]} />
                <Text style={[styles.requiredText, category.isRequired && styles.requiredTextActive]}>
                  {category.isRequired ? 'Obligatoire' : 'Optionnel'}
                </Text>
              </Pressable>
            </View>
          </View>

          {children}
        </View>
      )}
    </View>
  );
});

CategoryEditor.displayName = 'CategoryEditor';

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5F3FF',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  categoryButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    minHeight: 46,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    borderWidth: 1.5,
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2A2E33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  categoryHeaderInfo: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  categoryHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  categoryHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryContent: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  field: {
    flex: 1,
  },
  fieldSmall: {
    flex: 1,
  },
  requiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  requiredToggleActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  requiredIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
  },
  requiredIndicatorActive: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
  },
  requiredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  requiredTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});