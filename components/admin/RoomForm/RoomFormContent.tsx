import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { X, Check, LayoutDashboard } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { KeyboardSafeFormView } from '~/components/Keyboard';
import { NumberInput } from '~/components/ui';

interface RoomFormContentProps {
  room: Room | null;
  onSave: (roomData: Partial<Room>) => void;
  onCancel: () => void;
}

export const RoomFormContent: React.FC<RoomFormContentProps> = ({
  room,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    width: 15,
    height: 15,
  });

  // Track touched fields for error display
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Mark field as touched
  const markFieldAsTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  // Field validation
  const getFieldError = (fieldName: string): string | null => {
    if (!touchedFields[fieldName]) return null;

    switch (fieldName) {
      case 'name':
        if (!formData.name.trim()) return 'Le nom de la salle est obligatoire';
        if (formData.name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
        if (formData.name.trim().length > 50) return 'Le nom ne peut pas dépasser 50 caractères';
        return null;

      case 'width':
        if (!formData.width) return 'La largeur est obligatoire';
        if (formData.width < 5) return 'La largeur minimum est de 5';
        if (formData.width > 50) return 'La largeur maximum est de 50';
        return null;

      case 'height':
        if (!formData.height) return 'La hauteur est obligatoire';
        if (formData.height < 5) return 'La hauteur minimum est de 5';
        if (formData.height > 50) return 'La hauteur maximum est de 50';
        return null;

      default:
        return null;
    }
  };

  // Load room data when editing
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        width: room.width || 15,
        height: room.height || 15,
      });
      setTouchedFields({});
    } else {
      setFormData({
        name: '',
        width: 15,
        height: 15,
      });
      setTouchedFields({});
    }
  }, [room]);

  // Form validation for button disable
  const isFormValid = (): boolean => {
    // Name required (min 2 characters)
    if (!formData.name.trim() || formData.name.trim().length < 2) return false;

    // Width required (5-50)
    if (!formData.width || formData.width < 5 || formData.width > 50) return false;

    // Height required (5-50)
    if (!formData.height || formData.height < 5 || formData.height > 50) return false;

    return true;
  };

  const handleSave = () => {
    // Mark all fields as touched to show errors
    setTouchedFields({
      name: true,
      width: true,
      height: true,
    });

    if (!isFormValid()) {
      return;
    }

    const roomData: Partial<Room> = {
      name: formData.name.trim(),
      width: formData.width,
      height: formData.height,
    };

    onSave(roomData);
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>
          {room ? `Modifier "${room.name}"` : 'Créer une nouvelle salle'}
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardSafeFormView - Pattern B (ADMIN) */}
      <KeyboardSafeFormView
        role="ADMIN"
        behavior="padding"
        keyboardVerticalOffset={150}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          overScrollMode="never"
          bounces={false}
          directionalLockEnabled={true}
        >
          {/* Room Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom de la salle *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              onBlur={() => markFieldAsTouched('name')}
              placeholder="Entrez le nom de la salle"
              placeholderTextColor="#A0A0A0"
              style={[
                styles.formInput,
                getFieldError('name') && styles.formInputError
              ]}
              autoComplete="off"
            />
            {getFieldError('name') && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{getFieldError('name')}</Text>
                <Text style={styles.exampleText}>Exemple : Salle principale, Terrasse, Étage 1</Text>
              </View>
            )}
          </View>

          {/* Width */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Largeur (en unités) *</Text>
            <Text style={styles.formHelpText}>
              Largeur de la salle pour la visualisation (5-50)
            </Text>
            <NumberInput
              value={formData.width}
              onChangeText={(value) => {
                markFieldAsTouched('width');
                setFormData(prev => ({ ...prev, width: value || 15 }));
              }}
              placeholder="Largeur (5-50)"
              decimalPlaces={0}
              min={5}
              max={50}
              style={[
                styles.formInput,
                getFieldError('width') && styles.formInputError
              ]}
            />
            {getFieldError('width') && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{getFieldError('width')}</Text>
                <Text style={styles.exampleText}>Valeur recommandée : 15-30 unités</Text>
              </View>
            )}
          </View>

          {/* Height */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Hauteur (en unités) *</Text>
            <Text style={styles.formHelpText}>
              Hauteur de la salle pour la visualisation (5-50)
            </Text>
            <NumberInput
              value={formData.height}
              onChangeText={(value) => {
                markFieldAsTouched('height');
                setFormData(prev => ({ ...prev, height: value || 15 }));
              }}
              placeholder="Hauteur (5-50)"
              decimalPlaces={0}
              min={5}
              max={50}
              style={[
                styles.formInput,
                getFieldError('height') && styles.formInputError
              ]}
            />
            {getFieldError('height') && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{getFieldError('height')}</Text>
                <Text style={styles.exampleText}>Valeur recommandée : 15-30 unités</Text>
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>À propos des dimensions</Text>
            <Text style={styles.infoCardText}>
              • Les dimensions définissent l'espace disponible pour placer les tables{'\n'}
              • Une unité = 1 carré dans le rendu visuel{'\n'}
              • Vous pourrez ajuster les tables en mode édition
            </Text>
          </View>
        </ScrollView>
      </KeyboardSafeFormView>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid()}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>
            {room ? 'Enregistrer' : 'Créer la salle'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  formInput: {
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
  },
  formInputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  exampleText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
    backgroundColor: '#3B82F6',
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
