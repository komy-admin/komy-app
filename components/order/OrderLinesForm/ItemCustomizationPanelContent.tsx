import React, { useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Keyboard,
  Switch,
  Platform,
  Text as RNText,
  TextInput,
} from 'react-native';
import { NumberInput } from '~/components/ui';
import { Item } from '~/types/item.types';
import { Tag } from '~/types/tag.types';
import { SelectedTag } from '~/types/order-line.types';
import { X, Check, Circle, CheckSquare, ToggleLeft, Type, Hash, ArrowLeftToLine } from 'lucide-react-native';
import { formatPrice, getTagFieldTypeConfig } from '~/lib/utils';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';

// Type pour les valeurs des tags (union de tous les types possibles)
type TagValue = string | number | boolean | string[] | null | undefined;

// Type pour le record de valeurs de tags
type TagValuesRecord = Record<string, TagValue>;

interface ItemCustomizationPanelContentProps {
  item: Item;
  availableTags: Tag[];
  initialData?: { note?: string; tags?: SelectedTag[] };
  onConfirm: (data: { note?: string; tags: SelectedTag[] }) => void;
  onCancel: () => void;
  /** Titre custom du header (ex: "Catégorie 1 - Boissons") */
  headerTitle?: string;
  /** Sous-titre custom du header */
  headerSubtitle?: string;
  /** Si fourni, affiche une flèche retour au lieu du X */
  onBack?: () => void;
}

// ========================================
// HELPERS - Extraits hors du composant pour performance
// ========================================

// Helper: Récupère l'icône selon le type de champ
const getFieldTypeIcon = (fieldType: string) => {
  switch (fieldType) {
    case 'select':
      return Circle;
    case 'multi-select':
      return CheckSquare;
    case 'toggle':
      return ToggleLeft;
    case 'number':
      return Hash;
    case 'text':
      return Type;
    default:
      return Circle;
  }
};

// Helper: Récupère le label selon le type de champ
const getFieldTypeLabel = (fieldType: string): string => {
  switch (fieldType) {
    case 'select':
      return 'Choix unique';
    case 'multi-select':
      return 'Multi-choix';
    case 'toggle':
      return 'Oui/Non';
    case 'number':
      return 'Nombre';
    case 'text':
      return 'Texte';
    default:
      return 'Champ';
  }
};

// Helper: Récupère la couleur de l'icône selon le type de champ
const getFieldTypeIconColor = (fieldType: string): string => {
  switch (fieldType) {
    case 'select':
      return '#3B82F6';
    case 'multi-select':
      return '#8B5CF6';
    case 'toggle':
      return '#10B981';
    case 'number':
      return '#F59E0B';
    case 'text':
      return '#EC4899';
    default:
      return '#64748B';
  }
};

// Helper: Récupère la couleur de fond légère selon le type de champ (pour les cards)
const getFieldTypeLightBgColor = (fieldType: string): string => {
  switch (fieldType) {
    case 'select':
      return '#EFF6FF';
    case 'multi-select':
      return '#F5F3FF';
    case 'toggle':
      return '#ECFDF5';
    case 'number':
      return '#FEF3C7';
    case 'text':
      return '#FCE7F3';
    default:
      return '#F1F5F9';
  }
};

/** Convertir la couleur hex en rgba avec opacité */
const getColorWithOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export const ItemCustomizationPanelContent: React.FC<ItemCustomizationPanelContentProps> = ({
  item,
  availableTags,
  initialData,
  onConfirm,
  onCancel,
  headerTitle,
  headerSubtitle,
  onBack,
}) => {
  const { showToast } = useToast();
  const [note, setNote] = useState(initialData?.note || '');
  const [tagValues, setTagValues] = useState<TagValuesRecord>({});

  // Couleurs de l'article
  const itemColor = item.color || '#3B82F6';
  const itemBgColor = getColorWithOpacity(itemColor, 0.12);

  // Initialiser les valeurs des tags depuis initialData
  useEffect(() => {
    if (initialData?.tags) {
      const values: TagValuesRecord = {};
      initialData.tags.forEach((t) => {
        const tagId = t.tagId || t.tagSnapshot?.id;
        if (tagId) {
          values[tagId] = t.value;
        }
      });
      setTagValues(values);
      setNote(initialData.note || '');
    } else {
      setTagValues({});
      setNote('');
    }
  }, [initialData, availableTags]);

  const handleTagValueChange = useCallback((tagId: string, value: TagValue) => {
    setTagValues(prev => ({
      ...prev,
      [tagId]: value
    }));
    setShowErrors(false);
  }, []);

  // Calculer les SelectedTag à partir des valeurs actuelles
  const selectedTags = useMemo((): SelectedTag[] => {
    const tags: SelectedTag[] = [];

    Object.entries(tagValues).forEach(([tagId, value]) => {
      const tag = availableTags.find(t => t.id === tagId);
      if (!tag || value === undefined || value === null || value === '' || value === false) return;
      if (Array.isArray(value) && value.length === 0) return;

      let priceModifier = 0;

      // Calculer le priceModifier selon le type
      if (tag.fieldType === 'select' && typeof value === 'string') {
        const option = tag.options?.find(o => o.value === value);
        priceModifier = option?.priceModifier || 0;
      } else if (tag.fieldType === 'multi-select' && Array.isArray(value)) {
        value.forEach(v => {
          const option = tag.options?.find(o => o.value === v);
          priceModifier += option?.priceModifier || 0;
        });
      } else if (tag.fieldType === 'toggle' && value === true) {
        const defaultOption = tag.options?.find(o => o.isDefault);
        priceModifier = defaultOption?.priceModifier || 0;
      }

      tags.push({
        tagId: tag.id,
        tagSnapshot: {
          id: tag.id,
          name: tag.name,
          label: tag.label,
          fieldType: tag.fieldType,
          isRequired: tag.isRequired,
          snapshotAt: new Date().toISOString()
        },
        value,
        priceModifier
      });
    });

    return tags;
  }, [tagValues, availableTags]);

  const [showErrors, setShowErrors] = useState(false);

  // Vérifie si un tag requis n'a pas de valeur
  const isTagMissing = useCallback((tag: Tag): boolean => {
    if (!tag.isRequired) return false;
    const value = tagValues[tag.id];
    if (value === undefined || value === null || value === '' || value === false) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    return false;
  }, [tagValues]);

  const handleConfirm = useCallback(() => {
    const hasMissingRequired = availableTags.some(isTagMissing);
    if (hasMissingRequired) {
      setShowErrors(true);
      showToast('Veuillez remplir les options requises', 'error');
      return;
    }
    onConfirm({
      note: note.trim() || undefined,
      tags: selectedTags
    });
  }, [note, selectedTags, onConfirm, availableTags, isTagMissing, showToast]);

  return (
    <View style={styles.panelContent}>
      {/* Header - FIXED at top */}
      {onBack ? (
        <View style={styles.panelHeaderBack}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <ArrowLeftToLine size={20} color="#2A2E33" />
          </Pressable>
          <View style={styles.backTitleContainer}>
            <RNText style={styles.backTitle} numberOfLines={1}>
              {headerTitle || 'Retour'}
            </RNText>
            {headerSubtitle && (
              <RNText style={styles.backSubtitle} numberOfLines={1}>{headerSubtitle}</RNText>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.panelHeader}>
          <View style={{ flex: 1 }}>
            <RNText style={styles.panelTitle}>
              {headerTitle || (initialData ? 'Modifier l\'article' : 'Personnaliser l\'article')}
            </RNText>
            <RNText style={styles.panelSubtitle}>
              {headerSubtitle || 'Ajoutez vos préférences et options'}
            </RNText>
          </View>
          <Pressable onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={24} color="#64748B" strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {/* KeyboardAwareScrollView - auto-scrolls to focused input */}
      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
        {/* Banner Article sélectionné - Compact */}
        <View style={[
          styles.selectedItemBanner,
          {
            backgroundColor: itemBgColor,
            borderColor: itemColor
          }
        ]}>
          <View style={styles.selectedItemInfo}>
            <RNText style={[styles.selectedItemLabel, { color: itemColor }]}>
              Article sélectionné
            </RNText>
            <RNText style={styles.selectedItemName}>{item.name}</RNText>
            <RNText style={styles.selectedItemPrice}>
              Prix de base : {formatPrice(item.price)}
            </RNText>
          </View>
        </View>

        {/* Section Notes - visible uniquement si hasNote activé */}
        {item.hasNote && (
          <>
            <View style={styles.divider} />

            <View style={styles.formGroup}>
              <RNText style={styles.formLabel}>Notes & Instructions</RNText>
              <RNText style={styles.formHint}>
                Ajoutez des instructions spéciales pour la cuisine
              </RNText>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Ex: Sans oignons, bien cuit, sauce à part..."
                placeholderTextColor="#94A3B8"
                style={styles.noteInput}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        {/* Divider si tags présents */}
        {availableTags.length > 0 && <View style={styles.divider} />}

        {/* Section Options/Tags */}
        {availableTags.length > 0 && (
          <View style={styles.formGroup}>
            <RNText style={styles.formLabel}>Options & Personnalisation</RNText>
            {availableTags.map(tag => (
              <TagField
                key={tag.id}
                tag={tag}
                value={tagValues[tag.id]}
                onChange={(value) => handleTagValueChange(tag.id, value)}
                hasError={showErrors && isTagMissing(tag)}
              />
            ))}
          </View>
        )}
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      {/* Footer - FIXED at bottom */}
      <View style={styles.panelFooter}>
        {/* Boutons */}
        <View style={styles.footerActions}>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <RNText style={styles.cancelButtonText}>Annuler</RNText>
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={handleConfirm}
          >
            <RNText style={styles.saveButtonText}>
              {initialData ? 'Modifier' : 'Ajouter'}
            </RNText>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// ========================================
// TAG CARD COMPONENTS
// Composants internes pour l'affichage des tags
// Note: Ces composants sont spécifiques à ce panel et ne sont pas extraits
// dans un fichier séparé car ils ne sont pas réutilisés ailleurs.
// ========================================

interface TagFieldProps {
  tag: Tag;
  value: TagValue;
  onChange: (value: TagValue) => void;
  hasError?: boolean;
}

/**
 * TagCardHeader - Header de la card avec nom du tag et badges
 */
const TagCardHeader: React.FC<{ tag: Tag }> = ({ tag }) => {
  const Icon = getFieldTypeIcon(tag.fieldType);
  const colorConfig = getTagFieldTypeConfig(tag.fieldType);
  const label = getFieldTypeLabel(tag.fieldType);

  return (
    <View style={styles.tagCardHeader}>
      {/* Ligne unique : Nom + badges inline */}
      <View style={styles.tagHeaderRow}>
        <RNText style={styles.tagCardTitle}>
          {tag.label}
        </RNText>
        <View style={styles.tagHeaderBadges}>
          <View style={[styles.fieldTypeBadge, { backgroundColor: colorConfig.bgColor }]}>
            <Icon size={10} color={colorConfig.textColor} strokeWidth={2.5} />
            <RNText style={[styles.fieldTypeBadgeText, { color: colorConfig.textColor }]}>
              {label}
            </RNText>
          </View>
          {tag.isRequired && (
            <View style={styles.requiredBadge}>
              <RNText style={styles.requiredBadgeText}>
                Requis
              </RNText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

/**
 * TagCard - Wrapper de card avec fond coloré selon le type de tag
 */
const TagCard: React.FC<{ tag: Tag; children: ReactNode; hasError?: boolean }> = ({ tag, children, hasError }) => {
  const bgColor = getFieldTypeLightBgColor(tag.fieldType);
  const borderColor = getFieldTypeIconColor(tag.fieldType);

  return (
    <View style={[
      styles.tagCard,
      {
        backgroundColor: hasError ? '#FEF2F2' : bgColor,
        borderColor: hasError ? '#EF4444' : borderColor,
      }
    ]}>
      <View style={styles.tagCardContent}>
        <TagCardHeader tag={tag} />
        <View style={styles.tagCardBody}>
          {children}
        </View>
        {hasError && (
          <RNText style={styles.tagErrorText}>Ce champ est requis</RNText>
        )}
      </View>
    </View>
  );
};

/**
 * TagField - Routeur vers le bon composant selon le type de tag
 */
const TagField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  switch (tag.fieldType) {
    case 'select':
      return <SelectField tag={tag} value={value} onChange={onChange} hasError={hasError} />;
    case 'multi-select':
      return <MultiSelectField tag={tag} value={value || []} onChange={onChange} hasError={hasError} />;
    case 'number':
      return <NumberField tag={tag} value={value} onChange={onChange} hasError={hasError} />;
    case 'text':
      return <TextField tag={tag} value={value} onChange={onChange} hasError={hasError} />;
    case 'toggle':
      return <ToggleField tag={tag} value={value} onChange={onChange} hasError={hasError} />;
    default:
      return null;
  }
};

/**
 * SelectField - Champ de sélection unique (radio buttons)
 */
const SelectField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  const options = tag.options || [];

  return (
    <TagCard tag={tag} hasError={hasError}>
      <View style={styles.radioGroup}>
        {options.map(option => {
          const isSelected = value === option.value;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.radioOption,
                isSelected && styles.radioOptionActive
              ]}
              onPress={() => onChange(isSelected ? undefined : option.value)}

            >
              <View style={styles.radio}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioContent}>
                <RNText style={[
                  styles.radioLabel,
                  isSelected && styles.radioLabelActive,
                  isSelected && { fontWeight: '500' }
                ]}>
                  {option.label}
                </RNText>
                {option.priceModifier != null && option.priceModifier !== 0 && (
                  <RNText style={[
                    styles.radioPriceText,
                    isSelected && styles.radioPriceTextActive,
                    { fontWeight: isSelected ? '700' : '600' }
                  ]}>
                    {option.priceModifier > 0 ? '+' : ''}{formatPrice(option.priceModifier)}
                  </RNText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </TagCard>
  );
};

/**
 * MultiSelectField - Champ de sélection multiple (checkboxes)
 */
const MultiSelectField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  const options = tag.options || [];
  const selectedValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(v => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <TagCard tag={tag} hasError={hasError}>
      <View style={styles.radioGroup}>
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <Pressable
              key={option.id}
              style={[
                styles.radioOption,
                isSelected && styles.radioOptionActive
              ]}
              onPress={() => toggleOption(option.value)}

            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={2.5} />}
              </View>
              <View style={styles.radioContent}>
                <RNText style={[
                  styles.radioLabel,
                  isSelected && styles.radioLabelActive,
                  isSelected && { fontWeight: '500' }
                ]}>
                  {option.label}
                </RNText>
                {option.priceModifier != null && option.priceModifier !== 0 && (
                  <RNText style={[
                    styles.radioPriceText,
                    isSelected && styles.radioPriceTextActive,
                    { fontWeight: isSelected ? '700' : '600' }
                  ]}>
                    {option.priceModifier > 0 ? '+' : ''}{formatPrice(option.priceModifier)}
                  </RNText>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </TagCard>
  );
};

/**
 * NumberField - Champ numérique avec validation (0-100)
 */
const NumberField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  // Convertir TagValue vers number pour NumberInput
  const numValue = typeof value === 'number' ? value : null;

  return (
    <TagCard tag={tag} hasError={hasError}>
      <NumberInput
        value={numValue}
        onChangeText={onChange}
        min={0}
        max={100}
        placeholder="0"
        placeholderTextColor="#94A3B8"
        decimalPlaces={0}
        style={styles.numberInput}
      />
    </TagCard>
  );
};

/**
 * TextField - Champ de texte libre
 */
const TextField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  // Convertir TagValue vers string pour TextInput
  const textValue = typeof value === 'string' ? value : '';

  return (
    <TagCard tag={tag} hasError={hasError}>
      <TextInput
        value={textValue}
        onChangeText={onChange}
        placeholder={`Entrez ${tag.label.toLowerCase()}`}
        placeholderTextColor="#94A3B8"
        style={styles.textInput}
      />
    </TagCard>
  );
};

/**
 * ToggleField - Champ booléen avec switch (Oui/Non)
 */
const ToggleField: React.FC<TagFieldProps> = ({ tag, value, onChange, hasError }) => {
  const defaultOption = tag.options?.find(o => o.isDefault);
  const priceModifier = defaultOption?.priceModifier || 0;

  // Convertir TagValue vers boolean pour Switch
  const boolValue = Boolean(value);

  return (
    <TagCard tag={tag} hasError={hasError}>
      <Pressable
        style={[
          styles.toggleOption,
          boolValue && styles.toggleOptionActive
        ]}
        onPress={() => onChange(!boolValue)}
      >
        <View style={styles.toggleContent}>
          <RNText style={[
            styles.toggleStatusText,
            boolValue && styles.toggleStatusTextActive,
            { fontWeight: boolValue ? '600' : '500' }
          ]}>
            {boolValue ? 'Activé' : 'Désactivé'}
          </RNText>
          {priceModifier !== 0 && (
            <RNText style={[
              styles.togglePriceText,
              boolValue && styles.togglePriceTextActive,
              { fontWeight: boolValue ? '700' : '600' }
            ]}>
              {priceModifier > 0 ? '+' : ''}{formatPrice(priceModifier)}
            </RNText>
          )}
        </View>
        <Switch
          value={boolValue}
          onValueChange={onChange}
          trackColor={{ false: '#E2E8F0', true: '#BFDBFE' }}
          thumbColor={boolValue ? '#3B82F6' : '#CBD5E1'}
          ios_backgroundColor="#E2E8F0"
        />
      </Pressable>
    </TagCard>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    marginBottom: 10,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  // Header avec bouton retour (iso DraftReviewPanelContent)
  panelHeaderBack: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    height: 89,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    height: '100%',
  },
  backTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    letterSpacing: 0.3,
  },
  backSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  // Banner article sélectionné - Compact (style ItemSelectionPanel)
  selectedItemBanner: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  selectedItemPrice: {
    fontSize: 13,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  formGroup: {
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    minHeight: 44,
    textAlignVertical: 'top',
  },
  formHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  // ========================================
  // TAG CARD STYLES - Compact & Pro avec fond coloré
  // ========================================
  tagCard: {
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  tagCardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tagCardHeader: {
    marginBottom: 10,
  },
  tagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tagCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  tagHeaderBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fieldTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  fieldTypeBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  tagCardBody: {
    // Le contenu du champ
  },
  tagErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 8,
  },
  // Radio group - Plus compact
  radioGroup: {
    gap: 6,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  radioOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#3B82F6',
  },
  radioContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  radioLabelActive: {
    color: '#1E293B',
  },
  radioPriceText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
  },
  radioPriceTextActive: {
    color: '#3B82F6',
  },
  // Checkbox pour multi-select - Plus compact
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  textInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  numberInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  // Toggle option - Iso avec les inputs
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    height: 44,
  },
  toggleOptionActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  toggleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleStatusText: {
    fontSize: 12,
    color: '#64748B',
  },
  toggleStatusTextActive: {
    color: '#1E293B',
  },
  togglePriceText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
  },
  togglePriceTextActive: {
    color: '#3B82F6',
  },
  panelFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  // Actions (boutons) dans le footer
  footerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#2A2E33',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
