import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform, Pressable, Switch } from 'react-native';
import { Text, Button, TextInput, NumberInput } from '~/components/ui';
import { Item } from '~/types/item.types';
import { ItemType } from '~/types/item-type.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';

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
    price: item?.price ? (typeof item.price === 'string' ? parseFloat(item.price) : item.price) : null,
    itemTypeId: item?.itemType?.id || (activeTab !== 'ALL' ? activeTab : ''),
    isActive: item?.isActive ?? true
  });

  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string>(
    item?.itemType?.id || (activeTab !== 'ALL' ? activeTab : '')
  );
  const { showToast } = useToast();

  // Optimisation: callback stable
  const handleCategorySelect = React.useCallback((itemTypeId: string) => {
    setSelectedItemTypeId(itemTypeId);
    setFormData(prev => ({ ...prev, itemTypeId }));
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

  // Référence pour éviter les mises à jour pendant la fermeture
  const isClosingRef = React.useRef(false);

  // Réinitialiser la référence quand le formulaire s'ouvre
  useEffect(() => {
    isClosingRef.current = false;
  }, [item?.id]); // Se déclenche quand un nouvel item est passé ou quand on crée

  useEffect(() => {
    // Éviter la mise à jour si le formulaire est en train de se fermer
    if (isClosingRef.current) return;

    if (item) {
      setFormData({
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        itemTypeId: item.itemType?.id || '',
        isActive: item.isActive ?? true
      });
      
      if (item.itemType) {
        setSelectedItemTypeId(item.itemType.id);
      }
    } else {
      setFormData({
        name: '',
        price: null,
        itemTypeId: activeTab !== 'ALL' ? activeTab : '',
        isActive: true
      });
      
      if (activeTab !== 'ALL') {
        setSelectedItemTypeId(activeTab);
      } else {
        setSelectedItemTypeId('');
      }
    }
  }, [item, activeTab, itemTypes]);

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
        // Arrondir à 2 décimales pour éviter les problèmes de précision flottante  
        const numericPrice = Math.round(formData.price! * 100) / 100;

        itemData = {
          id: item?.id || '',
          name: formData.name,
          price: numericPrice,
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

  // Fonction de soumission héritée (pour compatibilité si nécessaire)
  const handleSubmit = React.useCallback(() => {
    const formDataResult = (ref as any).current?.getFormData();
    if (formDataResult && formDataResult.isValid && onSave) {
      isClosingRef.current = true;
      onSave(formDataResult.data);
    }
  }, [onSave]);

  return (
    <View style={styles.container}>
      {/* Formulaire en grille compacte */}
      <View style={styles.formGrid}>
        {/* Section principale - Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Informations de base</Text>
          
          {/* Ligne 1: Nom + Prix + Statut */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Nom de l'article *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text: string) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Nom de l'article"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
              />
            </View>
            
            <View style={[styles.field, styles.fieldSmall]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Prix (€) *</Text>
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

            <View style={[styles.field, styles.fieldSmall, {marginLeft: 12, justifyContent: 'center'}]}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Statut</Text>
              <Pressable
                style={[styles.statusToggleV2, formData.isActive && styles.statusToggleV2Active]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                <View style={[styles.statusIconContainer, formData.isActive && styles.statusIconContainerActive]}>
                  <View style={[styles.statusPulse, formData.isActive && styles.statusPulseActive]} />
                  <View style={[styles.statusCore, formData.isActive && styles.statusCoreActive]} />
                </View>
                <View style={styles.statusTextContainer}>
                  {Platform.OS === 'web' ? (
                    <>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: formData.isActive ? '#047857' : '#374151',
                        letterSpacing: '0.2px',
                        lineHeight: '16px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}>
                        {formData.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: formData.isActive ? '#059669' : '#9CA3AF',
                        letterSpacing: '0.1px',
                        lineHeight: '14px',
                        marginTop: '1px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}>
                        {formData.isActive ? 'Visible' : 'Masqué'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.statusLabelV2, formData.isActive && styles.statusLabelV2Active]}>
                        {formData.isActive ? 'Actif' : 'Inactif'}
                      </Text>
                      <Text style={[styles.statusSubtext, formData.isActive && styles.statusSubtextActive]}>
                        {formData.isActive ? 'Visible' : 'Masqué'}
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          </View>
          
          {/* Ligne 2: Catégories (s'adapte dynamiquement) */}
          <View style={[styles.row, {marginBottom: 0}]}>
            <View style={styles.categorySection}>
              <Text style={[styles.label, {fontSize: 13, color: '#6B7280'}]}>Catégorie *</Text>
              <View style={styles.categoryButtons}>
                {itemTypes.map((itemType) => (
                  Platform.OS === 'web' ? (
                    <div
                      key={itemType.id}
                      style={{
                        ...styles.categoryButton,
                        ...(selectedItemTypeId === itemType.id && {
                          backgroundColor: '#2A2E33',
                          borderColor: '#2A2E33',
                          opacity: 1
                        }),
                        cursor: 'pointer',
                        // Ajouter les propriétés de centrage CSS pour web
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleCategorySelect(itemType.id)}
                    >
                      <span style={{
                        ...styles.categoryButtonText,
                        ...(selectedItemTypeId === itemType.id && {
                          color: '#FFFFFF'
                        })
                      }}>
                        {itemType.name}
                      </span>
                    </div>
                  ) : (
                    <Pressable
                      key={itemType.id}
                      style={[
                        styles.categoryButton,
                        selectedItemTypeId === itemType.id && styles.categoryButtonActive
                      ]}
                      onPress={() => handleCategorySelect(itemType.id)}
                    >
                      <Text style={[
                        styles.categoryButtonText,
                        selectedItemTypeId === itemType.id && styles.categoryButtonTextActive
                      ]}>
                        {itemType.name}
                      </Text>
                    </Pressable>
                  )
                ))}
              </View>
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
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2E33',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
    letterSpacing: 0.5,
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
      outline: 'none',
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
  
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    minHeight: 44,
    flexShrink: 0, // Empêche la compression
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#D1D5DB',
        shadowOpacity: 0.08,
        transform: 'translateY(-1px)',
      }
    }),
  },
  
  categoryButtonActive: {
    backgroundColor: '#2A2E33',
    borderColor: '#2A2E33',
    shadowColor: '#2A2E33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Version 2: Toggle premium avec animation pulsante et sous-texte
  statusToggleV2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Réduit de 10 à 8 pour parfait alignement
    paddingHorizontal: 14,
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
      ':hover': {
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        transform: 'translateY(-1px)',
        shadowOpacity: 0.08,
      }
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
    ...(Platform.OS === 'web' && {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    })
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
    justifyContent: 'center',
  },
  
  statusLabelV2: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.2,
    lineHeight: 16,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },
  
  statusLabelV2Active: {
    color: '#047857',
    fontWeight: '700',
  },
  
  statusSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    marginTop: 1,
    lineHeight: 14,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },
  
  statusSubtextActive: {
    color: '#059669',
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