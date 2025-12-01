import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Text as RNText, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { X, Trash2, Check } from 'lucide-react-native';
import { Table } from '~/types/table.types';
import { TextInput, NumberInput } from '~/components/ui';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';

interface TableEditorSidebarProps {
  table: Table | null;
  onSave: (updates: Partial<Table>) => Promise<void> | void;
  onDelete: () => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  seats: string;
}

/**
 * TableEditorSidebar - Sidebar fixe pour l'édition de tables
 * Contrairement au SlidePanel, ce composant :
 * - N'a PAS d'overlay (permet l'interaction avec la grille)
 * - Reste fixé à droite de l'écran
 * - Réduit l'espace disponible pour le RoomComponent
 * - Parfait pour un mode édition interactif
 */
export const TableEditorSidebar: React.FC<TableEditorSidebarProps> = ({
  table,
  onSave,
  onDelete,
  onClose,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    seats: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 📱 RESPONSIVE: 25% de la largeur disponible (max 850px pour admin)
  const { width: screenWidth } = useWindowDimensions();

  const computedWidth = useMemo(() => {
    // Largeur max admin est 850px, donc max sidebar = 850 * 0.25 = 212.5px
    // Mais on veut 25% de la largeur disponible réelle
    return screenWidth * 0.25;
  }, [screenWidth]);

  // 📱 Footer responsive: stack vertical si sidebar trop petite
  const isFooterStacked = useMemo(() => {
    // En dessous de 315px (1260px * 0.25), passer en column
    return computedWidth < 315;
  }, [computedWidth]);

  // Mémoïser les règles de validation
  const validationRules: ValidationRules = useMemo(() => ({
    name: {
      required: true,
      message: 'Le nom est requis'
    },
    seats: {
      required: true,
      custom: (value) => {
        const parsed = parseInt(value);
        return !isNaN(parsed) && parsed > 0;
      },
      message: 'Le nombre de couverts doit être supérieur à 0'
    }
  }), []);

  // Initialiser le formulaire quand la table change
  useEffect(() => {
    if (table) {
      setFormData({
        name: table.name || '',
        seats: table.seats?.toString() || ''
      });
      setErrors([]);
    }
  }, [table?.id]);

  // Validation en temps réel
  const isFormValid = useMemo(() => {
    if (!table) return false;
    const validationErrors = validateForm(formData, validationRules);
    return validationErrors.length === 0;
  }, [formData, validationRules, table]);

  const handleSave = useCallback(async () => {
    const validationErrors = validateForm(formData, validationRules);

    if (validationErrors.length > 0) {
      setErrors(validationErrors.map(e => e.message));
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      await onSave({
        name: formData.name.trim(),
        seats: parseInt(formData.seats)
      });
    } catch (error) {
      console.error('Error saving table:', error);
      setErrors(['Une erreur est survenue lors de la sauvegarde']);
    } finally {
      setIsSaving(false);
    }
  }, [formData, validationRules, onSave]);

  if (!table) return null;

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: computedWidth, // ✅ Largeur responsive
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <RNText style={styles.title}>Détails de la table</RNText>
          <RNText style={styles.subtitle}>
            Modifier les informations
          </RNText>
        </View>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeButton}
        >
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Formulaire d'édition */}
        <View style={styles.formGroup}>
          <RNText style={styles.formLabel}>Nom de la table *</RNText>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Ex: A01, Terrasse 1..."
            placeholderTextColor="#94A3B8"
            style={styles.formInput}
          />
        </View>

        <View style={styles.formGroup}>
          <RNText style={styles.formLabel}>Nombre de couverts *</RNText>
          <NumberInput
            value={parseInt(formData.seats)}
            onChangeText={(value) => setFormData(prev => ({ ...prev, seats: value?.toString() || '' }))}
            placeholder="Nombre de couverts"
            decimalPlaces={0}
            min={1}
            style={styles.formInput}
          />
        </View>

        {/* Affichage des erreurs */}
        {errors.length > 0 && (
          <View style={styles.errorContainer}>
            {errors.map((error, index) => (
              <RNText key={index} style={styles.errorText}>• {error}</RNText>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer avec boutons */}
      <View style={[
        styles.footer,
        isFooterStacked && styles.footerStacked
      ]}>
        {/* Bouton Supprimer */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            isFooterStacked && styles.deleteButtonStacked
          ]}
          onPress={onDelete}
        >
          <Trash2 size={20} color="#EF4444" strokeWidth={2} />
          <RNText style={styles.deleteButtonText}>Supprimer</RNText>
        </TouchableOpacity>

        {/* Bouton Enregistrer */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            isFooterStacked && styles.saveButtonStacked,
            (!isFormValid || isSaving) && styles.saveButtonDisabled
          ]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <RNText style={styles.saveButtonText}>
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    // width dynamique définie inline avec computedWidth
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
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
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  footerStacked: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'stretch',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  deleteButtonStacked: {
    width: '100%',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2A2E33',
  },
  saveButtonStacked: {
    width: '100%',
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
