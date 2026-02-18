import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform, ScrollView } from 'react-native';
import { X, Check, ChefHat, Wine, ArrowLeft, Plus } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ItemType } from '~/types/item-type.types';
import { useItemTypes } from '~/hooks/useItemTypes';
import { useToast } from '~/components/ToastProvider';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { IconSelector, AVAILABLE_ICONS } from '~/components/ui/IconSelector';

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
  const [vatRate, setVatRate] = useState<number>(itemType?.vatRate || 20); // TVA par défaut à 20%
  const [isSelectingIcon, setIsSelectingIcon] = useState(false); // Navigation vers vue sélection icône

  // États d'erreur et de traitement
  const [nameError, setNameError] = useState(false);
  const [iconError, setIconError] = useState(false);
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
    setIconError(false); // Réinitialiser l'erreur quand on sélectionne une icône
    setIsSelectingIcon(false); // Retour au formulaire après sélection
  }, []);

  // Réinitialiser l'erreur du nom quand on tape
  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (text.trim().length > 0) {
      setNameError(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (isProcessing) return;

    // Réinitialiser les erreurs
    setNameError(false);
    setIconError(false);

    // Valider les champs
    const trimmedName = name.trim();
    const hasNameError = trimmedName.length === 0;
    const hasIconError = icon.length === 0;

    // Si erreurs, afficher le toast et marquer les champs
    if (hasNameError || hasIconError) {
      if (hasNameError && hasIconError) {
        showToast('Nom du type et icône manquants', 'error');
        setNameError(true);
        setIconError(true);
      } else if (hasNameError) {
        showToast('Nom du type manquant', 'error');
        setNameError(true);
      } else if (hasIconError) {
        showToast('Icône manquante', 'error');
        setIconError(true);
      }
      return;
    }

    // Si tout est valide, sauvegarder
    setIsProcessing(true);
    try {
      await onSave({
        name: trimmedName,
        type,
        icon,
        priorityOrder
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onSave, name, type, icon, priorityOrder, showToast, isProcessing]);

  // Vue de sélection d'icône (full-screen dans le panel)
  if (isSelectingIcon) {
    return (
      <View style={styles.panelContent}>
        <View style={styles.panelHeader}>
          <TouchableOpacity onPress={() => setIsSelectingIcon(false)} style={styles.backButton}>
            <ArrowLeft size={24} color="#64748B" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel}>
            <X size={24} color="#64748B" strokeWidth={2} />
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
              color="#A855F7"
              disabledIcons={usedIcons}
              iconsToShow={DRINKS_ICONS}
            />
          </View>

          {/* Catégorie Repas/Plats */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.categoryBadgeText}>Repas / Plats</Text>
              </View>
            </View>

            <IconSelector
              selectedIcon={icon}
              onSelectIcon={handleIconSelect}
              color="#A855F7"
              disabledIcons={usedIcons}
              iconsToShow={FOOD_ICONS}
            />
          </View>

          {/* Catégorie Desserts */}
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.categoryBadgeText}>Desserts</Text>
              </View>
            </View>

            <IconSelector
              selectedIcon={icon}
              onSelectIcon={handleIconSelect}
              color="#A855F7"
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
          <X size={24} color="#64748B" strokeWidth={2} />
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
                nameError && styles.formInputError
              ]}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Ex: Entrée, Plat, Boisson..."
              placeholderTextColor="#94A3B8"
            />

            {/* Bouton sélection icône */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                !icon && styles.iconButtonEmpty,
                icon && styles.iconButtonSelected,
                iconError && styles.iconButtonError
              ]}
              onPress={() => setIsSelectingIcon(true)}
            >
              {icon ? (
                <MaterialCommunityIcons name={icon as any} size={24} color="#A855F7" />
              ) : (
                <Plus size={20} color="#94A3B8" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Département */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Département</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'kitchen' && styles.radioOptionActive,
                type === 'kitchen' && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }
              ]}
              onPress={() => setType('kitchen')}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'kitchen' && <View style={[styles.radioInner, { backgroundColor: '#10B981' }]} />}
              </View>
              <ChefHat size={18} color={type === 'kitchen' ? '#10B981' : '#64748B'} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'kitchen' && styles.radioLabelActive]}>
                Cuisine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'bar' && styles.radioOptionActive,
                type === 'bar' && { borderColor: '#A855F7', backgroundColor: '#FAF5FF' }
              ]}
              onPress={() => setType('bar')}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'bar' && <View style={[styles.radioInner, { backgroundColor: '#A855F7' }]} />}
              </View>
              <Wine size={18} color={type === 'bar' ? '#A855F7' : '#64748B'} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'bar' && styles.radioLabelActive]}>
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Taux de TVA */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Taux de TVA</Text>
          <Text style={styles.formHelpText}>
            Sélectionnez le taux de TVA par défaut pour ce type d'article
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                vatRate === 20 && styles.radioOptionActive,
                vatRate === 20 && { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' }
              ]}
              onPress={() => setVatRate(20)}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {vatRate === 20 && <View style={[styles.radioInner, { backgroundColor: '#3B82F6' }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, vatRate === 20 && styles.radioLabelActive]}>
                  20% - Taux normal
                </Text>
                <Text style={styles.radioSubLabel}>
                  Boissons alcoolisées, services
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                vatRate === 10 && styles.radioOptionActive,
                vatRate === 10 && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }
              ]}
              onPress={() => setVatRate(10)}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {vatRate === 10 && <View style={[styles.radioInner, { backgroundColor: '#10B981' }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, vatRate === 10 && styles.radioLabelActive]}>
                  10% - Restauration
                </Text>
                <Text style={styles.radioSubLabel}>
                  Repas consommés sur place
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                vatRate === 5.5 && styles.radioOptionActive,
                vatRate === 5.5 && { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }
              ]}
              onPress={() => setVatRate(5.5)}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {vatRate === 5.5 && <View style={[styles.radioInner, { backgroundColor: '#F59E0B' }]} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.radioLabel, vatRate === 5.5 && styles.radioLabelActive]}>
                  5.5% - Produits alimentaires
                </Text>
                <Text style={styles.radioSubLabel}>
                  Boissons sans alcool, produits à emporter
                </Text>
              </View>
            </TouchableOpacity>
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
                    <Check size={14} color="#A855F7" strokeWidth={3} />
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
              <Plus size={16} color={priorityOrder === nextNewLevel ? '#A855F7' : '#94A3B8'} strokeWidth={2} />
              <Text style={[styles.levelNewText, priorityOrder === nextNewLevel && styles.levelNamesActive]}>
                Nouveau niveau
              </Text>
              {priorityOrder === nextNewLevel && (
                <Check size={14} color="#A855F7" strokeWidth={3} />
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
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E2E8F0',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
    color: '#1E293B',
    marginBottom: 8,
  },
  iconSelectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonEmpty: {
    borderStyle: 'dashed',
  },
  iconButtonSelected: {
    borderColor: '#A855F7',
    backgroundColor: '#F8F4FF',
  },
  iconButtonError: {
    borderColor: '#EF4444',
    borderStyle: 'solid',
    backgroundColor: '#FEF2F2',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  radioOptionActive: {
    borderColor: '#A855F7',
    backgroundColor: '#F8F4FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A855F7',
  },
  radioLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  radioLabelActive: {
    color: '#1E293B',
    fontWeight: '500',
  },
  levelList: {
    gap: 6,
  },
  radioSubLabel: {
    fontSize: 12,
    color: '#94A3B8',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },
  levelRowActive: {
    borderColor: '#A855F7',
    backgroundColor: '#FAF5FF',
  },
  levelRowNew: {
    borderStyle: 'dashed',
  },
  levelBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeActive: {
    backgroundColor: '#A855F7',
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  levelBadgeTextActive: {
    color: '#FFFFFF',
  },
  levelNames: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  levelNamesActive: {
    color: '#6B21A8',
    fontWeight: '500',
  },
  levelNameCurrent: {
    fontWeight: '700',
    color: '#A855F7',
  },
  levelNewText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  priorityFeedbackCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  priorityFeedbackContent: {
    padding: 12,
  },
  priorityFeedbackUsage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  priorityFeedbackUsageBold: {
    fontWeight: '600',
    color: '#1E293B',
  },
  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#A855F7',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
