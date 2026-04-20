import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform, ScrollView } from 'react-native';
import { X, Check, ChefHat, Wine, ArrowLeft, Plus } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemType } from '~/types/item-type.types';
import { useItemTypes } from '~/hooks/useItemTypes';
import { useToast } from '~/components/ToastProvider';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { IconSelector, AVAILABLE_ICONS } from '~/components/ui/IconSelector';
import { VatRateSelector } from '~/components/ui/vat-rate-selector';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { colors } from '~/theme';

// Filtres de catégories pré-calculés (constants - pas besoin de recalculer à chaque render)
const DRINKS_ICONS = AVAILABLE_ICONS.filter(i => i.category === 'drinks');
const FOOD_ICONS = AVAILABLE_ICONS.filter(i => i.category === 'food');
const DESSERTS_ICONS = AVAILABLE_ICONS.filter(i => i.category === 'desserts');

interface ItemTypeFormPanelProps {
  itemType: ItemType | null;
  onSave: (itemTypeData: Partial<ItemType>) => void | Promise<void>;
  onCancel: () => void;
}

export const ItemTypeFormPanel: React.FC<ItemTypeFormPanelProps> = ({ itemType, onSave, onCancel }) => {
  const { itemTypes } = useItemTypes();
  const { showToast } = useToast();
  const [name, setName] = useState(itemType?.name || '');
  const [type, setType] = useState<'kitchen' | 'bar'>(itemType?.type === 'bar' ? 'bar' : 'kitchen');
  const [icon, setIcon] = useState<string>(itemType?.icon || ''); // Vide par défaut en création
  // Convertir la string en nombre pour vatRate (l'API retourne "20.00")
  const initialVatRate = itemType?.vatRate
    ? (typeof itemType.vatRate === 'string' ? parseFloat(itemType.vatRate) : itemType.vatRate)
    : 20;
  const [vatRate, setVatRate] = useState<number>(initialVatRate);
  const [isSelectingIcon, setIsSelectingIcon] = useState(false); // Navigation vers vue sélection icône

  // États d'erreur et de traitement
  const formErrors = useFormErrors();
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les icônes déjà utilisées par d'autres itemTypes (pour éviter les doublons)
  const usedIcons = useMemo(() => {
    return itemTypes
      .filter(it => it.id !== itemType?.id) // Exclure l'item en cours d'édition
      .map(it => it.icon)
      .filter(Boolean) as string[]; // Enlever les undefined/null
  }, [itemTypes, itemType?.id]);

  // Calculer le prochain niveau disponible (basé sur les données réelles, pas la simulation)
  const nextNewLevel = useMemo(() => {
    if (itemTypes.length === 0) return 1;
    return Math.max(...itemTypes.map(it => it.priorityOrder)) + 1;
  }, [itemTypes]);

  const [priorityOrder, setPriorityOrder] = useState<number>(
    itemType?.priorityOrder || nextNewLevel  // Par défaut : nouveau niveau
  );

  // Simuler les niveaux avec l'item en cours déplacé à la position sélectionnée
  const priorityLevels = useMemo(() => {
    const levelMap = new Map<number, { name: string; isCurrent: boolean }[]>();
    itemTypes.forEach(it => {
      const isCurrent = it.id === itemType?.id;
      const effectivePriority = isCurrent ? priorityOrder : it.priorityOrder;
      const displayName = isCurrent ? (name.trim() || it.name) : it.name;
      if (!levelMap.has(effectivePriority)) levelMap.set(effectivePriority, []);
      levelMap.get(effectivePriority)!.push({ name: displayName, isCurrent });
    });
    // En création, ajouter l'item virtuel
    if (!itemType && name.trim()) {
      if (!levelMap.has(priorityOrder)) levelMap.set(priorityOrder, []);
      levelMap.get(priorityOrder)!.push({ name: name.trim(), isCurrent: true });
    }
    return Array.from(levelMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, items]) => ({
        level,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [itemTypes, itemType?.id, priorityOrder, name]);

  // Callback explicite pour la sélection d'icône (force le re-render)
  const handleIconSelect = useCallback((iconName: string) => {
    setIcon(iconName);
    formErrors.clearError('icon');
    setIsSelectingIcon(false); // Retour au formulaire après sélection
  }, [formErrors]);

  // Réinitialiser l'erreur du nom quand on tape
  const handleNameChange = useCallback((text: string) => {
    setName(text);
    formErrors.clearError('name');
  }, [formErrors]);

  const handleSave = useCallback(async () => {
    if (isProcessing) return;

    formErrors.clearAll();

    setIsProcessing(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        icon,
        priorityOrder,
        vatRate
      });
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsProcessing(false);
    }
  }, [onSave, name, type, icon, priorityOrder, vatRate, showToast, isProcessing, formErrors]);

  // Vue de sélection d'icône (full-screen dans le panel)
  if (isSelectingIcon) {
    return (
      <View style={styles.panelContent}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={() => setIsSelectingIcon(false)} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.neutral[500]} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel}>
            <X size={24} color={colors.neutral[500]} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.iconSelectionView}
          contentContainerStyle={styles.iconSelectionContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.iconSelectionTitle}>Choisir une icône</Text>
          <Text style={styles.iconSelectionSubtitle}>
            Sélectionnez l'icône qui représente le mieux ce type d'article
          </Text>

          {/* Catégorie Boissons */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>Boissons</Text>
              </View>
            </View>

            <IconSelector
              selectedIcon={icon}
              onSelectIcon={handleIconSelect}
              color={colors.purple.base}
              disabledIcons={usedIcons}
              iconsToShow={DRINKS_ICONS}
            />
          </View>

          {/* Catégorie Repas/Plats */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.success.base }]}>
                <Text style={styles.categoryBadgeText}>Repas / Plats</Text>
              </View>
            </View>

            <IconSelector
              selectedIcon={icon}
              onSelectIcon={handleIconSelect}
              color={colors.purple.base}
              disabledIcons={usedIcons}
              iconsToShow={FOOD_ICONS}
            />
          </View>

          {/* Catégorie Desserts */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.warning.base }]}>
                <Text style={styles.categoryBadgeText}>Desserts</Text>
              </View>
            </View>

            <IconSelector
              selectedIcon={icon}
              onSelectIcon={handleIconSelect}
              color={colors.purple.base}
              disabledIcons={usedIcons}
              iconsToShow={DESSERTS_ICONS}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Vue formulaire normale
  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{itemType ? 'Modifier le type' : 'Nouveau type'}</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardAwareScrollView - auto-scrolls to focused input */}
      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={20}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
        {/* Nom du type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nom du type & Icône</Text>
          <View style={styles.nameIconRow}>
            <TextInput
              style={[
                styles.formInput,
                styles.nameInput,
                formErrors.hasError('name') && styles.formInputError
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Ex: Entrée, Plat, Boisson..."
              placeholderTextColor={colors.neutral[400]}
            />

            {/* Bouton sélection icône */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                !icon && styles.iconButtonEmpty,
                icon && styles.iconButtonSelected,
                formErrors.hasError('icon') && styles.iconButtonError
              ]}
              onPress={() => setIsSelectingIcon(true)}
            >
              {icon ? (
                <MaterialCommunityIcons name={icon as any} size={24} color={colors.purple.base} />
              ) : (
                <Plus size={20} color={colors.neutral[400]} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
          <FormFieldError message={formErrors.getError('name') || formErrors.getError('icon')} />
        </View>

        {/* Département */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Département</Text>
          <View style={[styles.radioGroup, formErrors.hasError('type') && styles.selectorError]}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'kitchen' && styles.radioOptionActive,
                type === 'kitchen' && { borderColor: colors.success.base, backgroundColor: colors.success.bg }
              ]}
              onPress={() => { setType('kitchen'); formErrors.clearError('type'); }}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'kitchen' && <View style={[styles.radioInner, { backgroundColor: colors.success.base }]} />}
              </View>
              <ChefHat size={18} color={type === 'kitchen' ? colors.success.base : colors.neutral[500]} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'kitchen' && styles.radioLabelActive]}>
                Cuisine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'bar' && styles.radioOptionActive,
                type === 'bar' && { borderColor: colors.purple.base, backgroundColor: colors.neutral[50] }
              ]}
              onPress={() => { setType('bar'); formErrors.clearError('type'); }}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'bar' && <View style={[styles.radioInner, { backgroundColor: colors.purple.base }]} />}
              </View>
              <Wine size={18} color={type === 'bar' ? colors.purple.base : colors.neutral[500]} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'bar' && styles.radioLabelActive]}>
                Bar
              </Text>
            </TouchableOpacity>
          </View>
          <FormFieldError message={formErrors.getError('type')} />
        </View>

        {/* Taux de TVA */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Taux de TVA</Text>
          <Text style={styles.formHelpText}>
            Sélectionnez le taux de TVA par défaut pour ce type d'article
          </Text>
          <View style={{ marginTop: 12 }}>
            <VatRateSelector
              value={vatRate}
              onChange={(value) => setVatRate(value || 20)}
              showInheritOption={false}
              disabled={false}
            />
          </View>
        </View>

        {/* Ordre de priorité */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Groupe de service</Text>
          <Text style={styles.formHelpText}>
            Les catégories d'un même groupe sont réclamées ensemble en service
          </Text>
          <View style={styles.levelList}>
            {priorityLevels.map(({ level, items: levelItems }, index) => {
              const isSelected = priorityOrder === level;
              const displayIndex = index + 1;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.levelRow,
                    isSelected && styles.levelRowActive,
                  ]}
                  onPress={() => setPriorityOrder(level)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.levelBadge, isSelected && styles.levelBadgeActive]}>
                    <Text style={[styles.levelBadgeText, isSelected && styles.levelBadgeTextActive]}>{displayIndex}</Text>
                  </View>
                  <Text style={[styles.levelNames, isSelected && styles.levelNamesActive]} numberOfLines={1}>
                    {levelItems.map((it, i) => (
                      <Text key={i} style={it.isCurrent ? styles.levelNameCurrent : undefined}>
                        {i > 0 ? ', ' : ''}{it.name}
                      </Text>
                    ))}
                  </Text>
                  {isSelected && (
                    <Check size={14} color={colors.purple.base} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Bouton nouveau niveau */}
            <TouchableOpacity
              style={[
                styles.levelRow,
                styles.levelRowNew,
                priorityOrder === nextNewLevel && styles.levelRowActive,
              ]}
              onPress={() => setPriorityOrder(nextNewLevel)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={priorityOrder === nextNewLevel ? colors.purple.base : colors.neutral[400]} strokeWidth={2} />
              <Text style={[styles.levelNewText, priorityOrder === nextNewLevel && styles.levelNamesActive]}>
                Nouveau niveau
              </Text>
              {priorityOrder === nextNewLevel && (
                <Check size={14} color={colors.purple.base} strokeWidth={3} />
              )}
            </TouchableOpacity>
          </View>

          {/* Feedback card */}
          {priorityOrder && (() => {
            const matchedLevel = priorityLevels.find(l => l.level === priorityOrder);
            const otherNames = matchedLevel?.items.filter(it => !it.isCurrent).map(it => it.name) || [];
            return (
              <View style={styles.priorityFeedbackCard}>
                <View style={styles.priorityFeedbackContent}>
                  {otherNames.length > 0 ? (
                    <Text style={styles.priorityFeedbackUsage}>
                      <Text style={styles.priorityFeedbackUsageBold}>Même groupe que : </Text>
                      {otherNames.join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.priorityFeedbackUsage}>
                      <Text style={styles.priorityFeedbackUsageBold}>Groupe de service isolé</Text>
                    </Text>
                  )}
                </View>
              </View>
            );
          })()}
        </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isProcessing && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isProcessing}
        >
          <Text style={styles.saveButtonText}>{isProcessing ? 'Enregistrement...' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconSelectionView: {
    flex: 1,
    padding: 20,
  },
  iconSelectionContent: {
    paddingBottom: 40,
  },
  iconSelectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  iconSelectionSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 24,
    lineHeight: 20,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: colors.info.base,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 20,
  },
  nameIconRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  nameInput: {
    flex: 1,
  },
  iconButton: {
    width: 56,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonEmpty: {
    borderStyle: 'dashed',
  },
  iconButtonSelected: {
    borderColor: colors.purple.base,
    backgroundColor: colors.neutral[50],
  },
  iconButtonError: {
    borderColor: colors.error.base,
    borderStyle: 'solid',
    backgroundColor: colors.error.bg,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.neutral[800],
  },
  formInputError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },
  radioGroup: {
    gap: 8,
  },
  selectorError: {
    borderWidth: 1,
    borderColor: colors.error.base,
    borderRadius: 10,
    backgroundColor: colors.error.bg,
    padding: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    gap: 12,
  },
  radioOptionActive: {
    borderColor: colors.purple.base,
    backgroundColor: colors.neutral[50],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purple.base,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.neutral[500],
    flex: 1,
  },
  radioLabelActive: {
    color: colors.neutral[800],
    fontWeight: '500',
  },
  levelList: {
    gap: 6,
  },
  radioSubLabel: {
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: 2,
  },
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  levelRowActive: {
    borderColor: colors.purple.base,
    backgroundColor: colors.neutral[50],
  },
  levelRowNew: {
    borderStyle: 'dashed',
  },
  levelBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeActive: {
    backgroundColor: colors.purple.base,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.neutral[500],
  },
  levelBadgeTextActive: {
    color: colors.white,
  },
  levelNames: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[700],
  },
  levelNamesActive: {
    color: colors.purple.alt,
    fontWeight: '500',
  },
  levelNameCurrent: {
    fontWeight: '700',
    color: colors.purple.base,
  },
  levelNewText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  priorityFeedbackCard: {
    marginTop: 12,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    overflow: 'hidden',
  },
  priorityFeedbackContent: {
    padding: 12,
  },
  priorityFeedbackUsage: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  priorityFeedbackUsageBold: {
    fontWeight: '600',
    color: colors.neutral[800],
  },
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
});
