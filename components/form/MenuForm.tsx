import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Pressable, Switch } from 'react-native';
import { Text, Button, TextInput, NumberInput, SelectButton } from '~/components/ui';
import { ColorPicker } from '~/components/ui/color-picker';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { FileText } from 'lucide-react-native';
import { centsToEuros, eurosToCents } from '~/lib/utils';

interface MenuFormProps {
  item: Item | null;
  itemTypes: ItemType[];
  onSave?: (item: Item) => void; // Optionnel car maintenant géré par AdminFormView
  onCancel?: () => void;
  activeTab: string;
}

export const MenuForm = forwardRef<AdminFormRef<Item>, MenuFormProps>(({
  item,
  itemTypes,
  onSave,
  onCancel,
  activeTab
}, ref) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    // 💰 Convertir centimes -> euros pour l'affichage dans le formulaire
    price: item?.price ? centsToEuros(typeof item.price === 'string' ? parseFloat(item.price) : item.price) : null,
    itemTypeId: item?.itemType?.id || (activeTab !== 'ALL' ? activeTab : ''),
    color: item?.color || '',
    isActive: item?.isActive ?? true
  });

  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string>(
    item?.itemType?.id || (activeTab !== 'ALL' ? activeTab : '')
  );

  const { showToast } = useToast();

  // Optimisation: callback stable
  const handleCategorySelect = React.useCallback((itemTypeId: string) => {
    setSelectedItemTypeId(itemTypeId);
  }, []);

  // Optimisation: règles de validation mémorisées
  const validationRules = React.useMemo<ValidationRules>(() => ({
    itemTypeId: {
      required: true,
      message: 'La catégorie est requise'
    },
    name: {
      required: true,
      message: 'Le nom de l\'article est requis'
    },
    price: {
      required: true,
      custom: (value) => value !== '' && value > 0,
      message: 'Le prix doit être supérieur à 0'
    }
  }), []);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        // 💰 Convertir centimes -> euros pour l'affichage
        price: centsToEuros(typeof item.price === 'string' ? parseFloat(item.price) : item.price),
        itemTypeId: item.itemType?.id || '',
        color: item.color || '',
        isActive: item.isActive ?? true
      });
      setSelectedItemTypeId(item.itemType?.id || '');
    } else {
      setFormData({
        name: '',
        price: null,
        itemTypeId: activeTab !== 'ALL' ? activeTab : '',
        color: '',
        isActive: true
      });
      setSelectedItemTypeId(activeTab !== 'ALL' ? activeTab : '');
    }
  }, [item, activeTab]);

  // Expose l'interface AdminFormRef
  useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<Item> => {
      const dataToValidate = {
        ...formData,
        itemTypeId: selectedItemTypeId
      };

      const errors = validateForm(dataToValidate, validationRules);
      const formErrors: Record<string, string> = {};

      if (errors.length > 0) {
        errors.forEach(error => {
          formErrors[error.field || 'general'] = error.message;
        });
      }

      if (!selectedItemTypeId) {
        formErrors.itemTypeId = 'La catégorie est requise';
      }

      const selectedItemType = itemTypes.find(type => type.id === selectedItemTypeId);
      if (selectedItemTypeId && !selectedItemType) {
        formErrors.itemTypeId = 'Catégorie invalide';
      }

      const isValid = Object.keys(formErrors).length === 0;
      let itemData: Item | null = null;

      if (isValid) {
        // 💰 Convertir euros -> centimes pour l'envoi API
        const priceInCents = eurosToCents(formData.price!);

        itemData = {
          id: item?.id || '',
          name: formData.name,
          price: priceInCents,
          color: formData.color,
          itemTypeId: selectedItemTypeId,
          itemType: selectedItemType!,
          isActive: formData.isActive
        };
      }

      return {
        data: itemData!,
        isValid,
        errors: formErrors
      };
    },

    resetForm: () => {
      setFormData({
        name: '',
        price: null,
        itemTypeId: activeTab !== 'ALL' ? activeTab : '',
        color: '',
        isActive: true
      });
      setSelectedItemTypeId(activeTab !== 'ALL' ? activeTab : '');
    },

    validateForm: () => {
      const result = (ref as any).current?.getFormData();
      if (!result.isValid && Object.keys(result.errors).length > 0) {
        showToast(Object.values(result.errors)[0] as string, 'error');
      }
      return result.isValid;
    }
  }), [formData, selectedItemTypeId, validationRules, itemTypes, item?.id, activeTab, showToast]);

  return (
    <View style={styles.container}>
      {/* Formulaire en grille compacte */}
      <View style={styles.formGrid}>
        {/* Section principale - Informations générales */}
        <View style={styles.section}>
          <SectionHeader
            icon={FileText}
            title="1. Informations générales"
            subtitle="Définissez le nom, prix et catégorie de l'article"
          />

          {/* Ligne 1: Nom + Prix + Statut */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Nom de l'article *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Nom de l'article"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />
            </View>

            <View style={[styles.field, styles.fieldSmall]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Prix (€) *</Text>
              <NumberInput
                style={styles.input}
                value={formData.price ?? null}
                onChangeText={(value) => setFormData(prev => ({
                  ...prev,
                  price: value
                }))}
                decimalPlaces={2}
                min={0}
                max={1000}
                currency="€"
                placeholder="0.00"
              />
            </View>

            <View style={[styles.field, styles.fieldSmall, { marginLeft: 12, justifyContent: 'center' }]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Statut</Text>
              <Pressable
                style={[styles.statusToggleV2, formData.isActive && styles.statusToggleV2Active]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                <View style={[styles.statusIconContainer, formData.isActive && styles.statusIconContainerActive]}>
                  <View style={[styles.statusPulse, formData.isActive && styles.statusPulseActive]} />
                  <View style={[styles.statusCore, formData.isActive && styles.statusCoreActive]} />
                </View>
                <View style={[styles.statusTextContainer, Platform.OS === 'web' && { paddingVertical: 0, gap: 2 }]}>
                  <Text
                    style={[
                      styles.statusLabelV2,
                      formData.isActive && styles.statusLabelV2Active,
                      Platform.OS === 'web' && {
                        fontSize: 13,
                        fontWeight: formData.isActive ? '700' : '600',
                        color: formData.isActive ? '#047857' : '#6B7280',
                        lineHeight: 18,
                        marginBottom: 0,
                      }
                    ]}
                  >
                    {formData.isActive ? 'Actif' : 'Inactif'}
                  </Text>
                  <Text
                    style={[
                      styles.statusSubtext,
                      formData.isActive && styles.statusSubtextActive,
                      Platform.OS === 'web' && {
                        fontSize: 11,
                        fontWeight: '500',
                        color: formData.isActive ? '#059669' : '#9CA3AF',
                        marginTop: 0,
                        lineHeight: 14,
                      }
                    ]}
                  >
                    {formData.isActive ? 'Visible' : 'Masqué'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Ligne 2: Catégories (s'adapte dynamiquement) */}
          <View style={[styles.row, { marginBottom: 24 }]}>
            <View style={styles.categorySection}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Catégorie *</Text>
              <View style={styles.categoryButtons}>
                {itemTypes.map((itemType) => (
                  <SelectButton
                    key={itemType.id}
                    label={itemType.name}
                    isActive={selectedItemTypeId === itemType.id}
                    onPress={() => handleCategorySelect(itemType.id)}
                    variant="sub"
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Ligne 2: Couleur */}
          <View style={[styles.row, { marginBottom: 0 }]}>
            <View style={styles.field}>
              <ColorPicker
                label="Couleur de l'article"
                value={formData.color}
                onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                placeholder="Sélectionner une couleur"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Structure en grille
  formGrid: {
    flex: 1,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Système de lignes et colonnes
  row: {
    flexDirection: 'row',
    marginBottom: 24,
    ...(Platform.OS === 'web' ? {
      // Sur web, on évite gap qui peut causer des problèmes de positionnement
    } : {
      gap: 16,
    })
  },

  field: {
    // Base pour tous les champs
    ...(Platform.OS === 'web' && {
      marginRight: 16,
    })
  },

  fieldSmall: {
    flex: 1, // 1/3 de la largeur
    ...(Platform.OS === 'web' && {
      marginRight: 16,
    })
  },

  fieldMedium: {
    flex: 1.5, // 1/2 de la largeur équilibré
    ...(Platform.OS === 'web' && {
      marginRight: 16,
    })
  },

  fieldLarge: {
    flex: 2, // 2/3 de la largeur
    ...(Platform.OS === 'web' && {
      marginRight: 16,
    })
  },

  // Éléments de form
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'text',
      transition: 'all 0.2s ease',
      ':focus': {
        borderColor: '#2A2E33',
        shadowOpacity: 0.1,
      }
    }),
  },

  // Section catégories (occupe toute la largeur)
  categorySection: {
    flex: 1,
    width: '100%',
  },

  // Boutons de catégorie - inspirés des boutons ACTIF/INACTIF
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },


  // Version 2: Toggle premium avec animation pulsante et sous-texte
  statusToggleV2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44, // Même hauteur exacte que les inputs
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

  statusToggleV2Active: {
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

  statusIconContainer: {
    width: 12,
    height: 12,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusIconContainerActive: {
    // Container reste le même mais gère les animations
  },

  statusPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  statusPulseActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },

  statusCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    zIndex: 1,
  },

  statusCoreActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },

  statusTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },

  statusLabelV2: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    lineHeight: 16,
    textAlign: 'left',
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 600,
    } : {})
  },

  statusLabelV2Active: {
    color: '#047857',
    fontWeight: '700',
    ...(Platform.OS === 'web' ? {
      fontWeight: 700,
    } : {})
  },

  statusSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    marginTop: 1,
    lineHeight: 14,
    textAlign: 'left',
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontWeight: 500,
    } : {})
  },

  statusSubtextActive: {
    color: '#059669',
    ...(Platform.OS === 'web' ? {
      color: '#059669',
    } : {})
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 32,
  },

  submitButton: {
    flex: 2,
    backgroundColor: '#2A2E33',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: '#1A1E23',
        transform: 'translateY(-2px)',
        shadowOpacity: 0.3,
      }
    })
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        transform: 'translateY(-1px)',
      }
    })
  },

  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});