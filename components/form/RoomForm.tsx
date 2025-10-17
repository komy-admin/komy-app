import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, TextInput, NumberInput } from '~/components/ui';
import { Room } from '~/types/room.types';
import { validateForm, ValidationRules } from '~/components/lib/formValidation';
import { useToast } from '~/components/ToastProvider';
import { AdminFormRef, AdminFormData } from '~/components/admin/AdminFormView';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { LayoutDashboard } from 'lucide-react-native';

interface RoomFormProps {
  room: Room | null;
  onSave?: (room: Room) => void; // Optionnel car maintenant géré par AdminFormView
}

export const RoomForm = forwardRef<AdminFormRef<Room>, RoomFormProps>(({
  room,
  onSave
}, ref) => {
  const [formData, setFormData] = useState({
    name: '',
    width: 15,
    height: 15
  });

  const { showToast } = useToast();

  const validationRules: ValidationRules = {
    name: {
      required: true,
      message: 'Le nom est requis'
    },
    width: {
      required: true,
      custom: (value) => value >= 5 && value <= 30,
      message: 'La largeur doit être comprise entre 5 et 30'
    },
    height: {
      required: true,
      custom: (value) => value >= 5 && value <= 30,
      message: 'La hauteur doit être comprise entre 5 et 30'
    }
  };

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        width: room.width || 15,
        height: room.height || 15
      });
    } else {
      setFormData({
        name: '',
        width: 15,
        height: 15
      });
    }
  }, [room]);

  // Expose l'interface AdminFormRef
  useImperativeHandle(ref, () => ({
    getFormData: (): AdminFormData<Room> => {
      const errors = validateForm(formData, validationRules);
      const formErrors: Record<string, string> = {};

      if (errors.length > 0) {
        errors.forEach(error => {
          formErrors[error.field || 'general'] = error.message;
        });
      }

      const isValid = Object.keys(formErrors).length === 0;
      let roomData: Room | null = null;

      if (isValid) {
        roomData = {
          id: room?.id || '', // Utiliser l'id existant ou string vide pour nouvelle salle
          name: formData.name,
          width: formData.width,
          height: formData.height,
          tables: room?.tables || [],
          account: room?.account || '',
          createdAt: room?.createdAt || '',
          updatedAt: room?.updatedAt || ''
        };
      }

      return {
        data: roomData!,
        isValid,
        errors: formErrors
      };
    },

    resetForm: () => {
      setFormData({
        name: '',
        width: 15,
        height: 15
      });
    },

    validateForm: () => {
      const result = (ref as any).current?.getFormData();
      if (!result.isValid && Object.keys(result.errors).length > 0) {
        showToast(Object.values(result.errors)[0] as string, 'error');
      }
      return result.isValid;
    }
  }), [formData, validationRules, room, showToast]);

  return (
    <View style={styles.container}>
      {/* Formulaire en grille compacte */}
      <View style={styles.formGrid}>
        {/* Section principale - Informations générales */}
        <View style={styles.section}>
          <SectionHeader
            icon={LayoutDashboard}
            title="1. Informations générales"
            subtitle="Définissez le nom et les dimensions de la salle"
          />

          {/* Ligne 1: Nom */}
          <View style={styles.row}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Nom de la salle *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Entrez le nom de la salle"
                placeholderTextColor="#A0A0A0"
                style={styles.input}
                autoComplete="off"
              />
            </View>
          </View>

          {/* Ligne 2: Dimensions */}
          <View style={[styles.row, { marginBottom: 0 }]}>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Largeur *</Text>
              <NumberInput
                value={formData.width}
                onChangeText={(value) => setFormData(prev => ({ ...prev, width: value || 15 }))}
                placeholder="Largeur (5-50)"
                decimalPlaces={0}
                min={5}
                max={50}
                style={styles.input}
              />
            </View>
            <View style={[styles.field, styles.fieldLarge]}>
              <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Hauteur *</Text>
              <NumberInput
                value={formData.height}
                onChangeText={(value) => setFormData(prev => ({ ...prev, height: value || 15 }))}
                placeholder="Hauteur (5-50)"
                decimalPlaces={0}
                min={5}
                max={50}
                style={styles.input}
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0.5 },
      web: { elevation: 2 },
    }),
  },

  // Système de lignes et colonnes
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    ...(Platform.OS === 'web' ? {} : { gap: 16 })
  },

  field: {
    ...(Platform.OS === 'web' && { marginRight: 16 })
  },

  fieldLarge: {
    flex: 2,
    ...(Platform.OS === 'web' && { marginRight: 16 })
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
});