import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { getContrastColor } from '~/lib/utils';
import { shadows, colors } from '~/theme';

interface ColorPickerComponentProps {
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  placeholder?: string;
  containerStyle?: object;
  labelStyle?: object;
}

// Palette de couleurs organisée par colonnes (1 couleur = 1 colonne)
// 8 colonnes x 5 teintes
export const COLOR_COLUMNS = [
  // Noir/Blanc/Gris
  ['#FFFFFF', '#E5E7EB', '#9CA3AF', '#4B5563', '#000000'],
  // Rouge
  ['#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#991B1B'],
  // Orange
  ['#FED7AA', '#FB923C', '#F97316', '#EA580C', '#C2410C'],
  // Jaune
  ['#FDE68A', '#FCD34D', '#FBBF24', '#F59E0B', '#D97706'],
  // Vert
  ['#A7F3D0', '#6EE7B7', '#34D399', '#10B981', '#059669'],
  // Bleu
  ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#1D4ED8'],
  // Indigo
  ['#C7D2FE', '#A5B4FC', '#818CF8', '#6366F1', '#4338CA'],
  // Violet
  ['#DDD6FE', '#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED'],
];

export function ColorPicker({ value, onChange, label, placeholder = 'Sélectionner une couleur', containerStyle, labelStyle }: ColorPickerComponentProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempColor, setTempColor] = useState(value || colors.brand.dark);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value !== undefined) {
      setTempColor(value || colors.brand.dark);
    }
  }, [value]);

  const handleColorSelect = (color: string) => {
    setTempColor(color);
  };

  const handleConfirm = () => {
    onChange?.(tempColor);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempColor(value || colors.brand.dark);
    setShowModal(false);
  };

  const handleClear = () => {
    onChange?.('');
    setShowModal(false);
  };

  const ColorPickerContent = () => (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Choisir une couleur</Text>
        {Platform.OS !== 'web' && (
          <Pressable onPress={handleCancel} style={styles.closeButton}>
            <X size={20} color={colors.gray[500]} />
          </Pressable>
        )}
      </View>

      {/* Preview de la couleur actuelle */}
      <View style={[styles.preview, { backgroundColor: tempColor }]}>
        <Text style={[styles.previewText, { color: getContrastColor(tempColor) }]}>
          {tempColor.toUpperCase()}
        </Text>
      </View>

      {/* Palette de couleurs */}
      <View style={styles.paletteContainer}>
        <View style={styles.colorGridContainer}>
          {/* Créer 5 lignes (une pour chaque teinte) */}
          {[0, 1, 2, 3, 4].map((rowIndex) => (
            <View key={rowIndex} style={styles.colorRow}>
              {/* Pour chaque ligne, afficher les 8 colonnes */}
              {COLOR_COLUMNS.map((column, colIndex) => {
                const color = column[rowIndex];
                return (
                  <Pressable
                    key={`${rowIndex}-${colIndex}`}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      tempColor === color && styles.colorButtonSelected,
                      // Bordure spéciale pour le blanc
                      color === '#FFFFFF' && styles.whiteColorButton
                    ]}
                    onPress={() => handleColorSelect(color)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.pickerActions}>
        {value && (
          <Pressable style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Effacer</Text>
          </Pressable>
        )}
        <View style={styles.mainActions}>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </Pressable>
          <Pressable style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Appliquer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  // Version Web et Mobile unifiée avec Modal
  const renderModal = () => {
    if (!showModal) return null;

    return (
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancel}>
          <Pressable
            style={styles.modalContent}
            onPress={(e) => {
              // stopPropagation n'existe que sur web
              if (Platform.OS === 'web' && e.stopPropagation) {
                e.stopPropagation();
              }
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <ColorPickerContent />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

      <Pressable
        style={styles.triggerButton}
        onPress={() => {
          setShowModal(true);
          setTempColor(value || colors.brand.dark);
        }}
      >
        <View style={styles.triggerContent}>
          {value ? (
            <View style={[styles.colorPreviewLarge, { backgroundColor: value }]}>
              <Text style={[styles.colorCodeText, { color: getContrastColor(value) }]}>
                {value.toUpperCase()}
              </Text>
            </View>
          ) : (
            <View style={[styles.colorPreviewLarge, styles.colorPreviewEmpty]}>
              <Text style={styles.placeholderText}>{placeholder}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 8,
    letterSpacing: 0.5,
    ...(Platform.OS === 'web' && {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    })
  },

  // Bouton de déclenchement
  triggerButton: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 44,
    ...shadows.bottom,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }),
  },

  triggerContent: {
    flex: 1,
  },

  colorPreviewLarge: {
    flex: 1,
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  colorPreviewEmpty: {
    backgroundColor: colors.gray[50],
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.gray[300],
    paddingHorizontal: 6,

  },

  colorCodeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  placeholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[400],
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    maxHeight: 600,
    overflow: 'hidden',
  },

  scrollContent: {
    flexGrow: 1,
  },

  // Picker container
  pickerContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.dark,
  },

  closeButton: {
    padding: 4,
  },

  // Preview
  preview: {
    height: 40,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.bottom,
  },

  previewText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Palette container
  paletteContainer: {
    paddingVertical: 8,
  },

  colorGridContainer: {
    paddingVertical: 5,
  },

  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  colorButton: {
    width: '11.5%',
    aspectRatio: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.bottom,
  },

  colorButtonSelected: {
    borderColor: colors.brand.dark,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
    zIndex: 10,
  },

  whiteColorButton: {
    borderColor: colors.gray[200],
    borderWidth: 1,
  },

  // Actions
  pickerActions: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },

  mainActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },

  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    marginBottom: 12,
    alignItems: 'center',
  },

  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error.text,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[500],
  },

  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.bottom,
  },

  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});