import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { X, Check } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';

interface RoomFormContentProps {
  room: Room | null;
  onSave: (roomData: Partial<Room>) => void;
  onCancel: () => void;
}

const ROOM_SIZES = [
  { label: 'Normal', width: 15, height: 15 },
  { label: 'Grand', width: 20, height: 20 },
  { label: 'Portrait', width: 15, height: 20 },
  { label: 'Paysage', width: 20, height: 15 },
] as const;

const CONTAINER_SIZE = 130;
const MAX_DIM = 28;

const T = 1.8;    // taille table carrée
const G = 1.56;   // gap uniforme (marges + inter-tables)
const S = T + G;  // step (table + gap)
const FIXED_TABLES: { gx: number; gy: number; gw: number; gh: number }[] = [
  // Ligne 1 : 4 tables carrées
  { gx: G, gy: G, gw: T, gh: T },
  { gx: G + S, gy: G, gw: T, gh: T },
  { gx: G + 2 * S, gy: G, gw: T, gh: T },
  { gx: G + 3 * S, gy: G, gw: T, gh: T },
  // Ligne 2 : 2 tables carrées + 1 longue
  { gx: G, gy: G + S, gw: T, gh: T },
  { gx: G + S, gy: G + S, gw: T, gh: T },
  { gx: G + 2 * S, gy: G + S, gw: 2 * T + G, gh: T },
  // Ligne 3 : 2 longues tables
  { gx: G, gy: G + 2 * S, gw: 2 * T + G, gh: T },
  { gx: G + 2 * S, gy: G + 2 * S, gw: 2 * T + G, gh: T },
  // Ligne 4 : 4 tables carrées
  { gx: G, gy: G + 3 * S, gw: T, gh: T },
  { gx: G + S, gy: G + 3 * S, gw: T, gh: T },
  { gx: G + 2 * S, gy: G + 3 * S, gw: T, gh: T },
  { gx: G + 3 * S, gy: G + 3 * S, gw: T, gh: T },
];

/** Aperçu SVG : room proportionnelle, mêmes tables partout */
const RoomPreview: React.FC<{ roomW: number; roomH: number; selected: boolean }> = React.memo(
  ({ roomW, roomH, selected }) => {
    const scale = (CONTAINER_SIZE - 20) / MAX_DIM;
    const svgW = roomW * scale;
    const svgH = roomH * scale;
    const offsetX = (CONTAINER_SIZE - svgW) / 2;
    const offsetY = (CONTAINER_SIZE - svgH) / 2;
    const roomBorder = selected ? '#2A2E33' : '#CBD5E1';
    const roomBg = selected ? '#EEEDF5' : '#F9FAFB';
    const tableFill = selected ? '#64748B' : '#B0B8C4';
    const tableStroke = selected ? '#475569' : '#9CA3AF';

    return (
      <Svg width={CONTAINER_SIZE} height={CONTAINER_SIZE}>
        <Rect x={0} y={0} width={CONTAINER_SIZE} height={CONTAINER_SIZE} fill="transparent" />
        <Rect
          x={offsetX} y={offsetY} width={svgW} height={svgH}
          rx={3} ry={3}
          fill={roomBg} stroke={roomBorder} strokeWidth={1.5}
        />
        {FIXED_TABLES.map((t, i) => (
          <Rect
            key={i}
            x={offsetX + t.gx * scale}
            y={offsetY + t.gy * scale}
            width={t.gw * scale}
            height={t.gh * scale}
            rx={2} ry={2}
            fill={tableFill} stroke={tableStroke} strokeWidth={0.6}
          />
        ))}
      </Svg>
    );
  }
);

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

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markFieldAsTouched = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const getFieldError = (fieldName: string): string | null => {
    if (!touchedFields[fieldName]) return null;
    if (fieldName === 'name') {
      if (!formData.name.trim()) return 'Le nom de la salle est obligatoire';
      if (formData.name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères';
      if (formData.name.trim().length > 50) return 'Le nom ne peut pas dépasser 50 caractères';
    }
    return null;
  };

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        width: room.width || 15,
        height: room.height || 15,
      });
    } else {
      setFormData({ name: '', width: 15, height: 15 });
    }
    setTouchedFields({});
  }, [room]);

  const isFormValid = (): boolean => {
    if (!formData.name.trim() || formData.name.trim().length < 2) return false;
    if (!formData.width || !formData.height) return false;
    return ROOM_SIZES.some(s => s.width === formData.width && s.height === formData.height);
  };

  const handleSave = () => {
    setTouchedFields({ name: true });
    if (!isFormValid()) return;

    onSave({
      name: formData.name.trim(),
      width: formData.width,
      height: formData.height,
    });
  };

  const handleSelectSize = (size: typeof ROOM_SIZES[number]) => {
    setFormData(prev => ({ ...prev, width: size.width, height: size.height }));
  };

  const isSelectedSize = (size: typeof ROOM_SIZES[number]) =>
    formData.width === size.width && formData.height === size.height;

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

      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Room Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom de la salle *</Text>
            {(() => {
              const nameError = getFieldError('name');
              return (
                <>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    onBlur={() => markFieldAsTouched('name')}
                    placeholder="Entrez le nom de la salle"
                    placeholderTextColor="#A0A0A0"
                    style={[styles.formInput, nameError && styles.formInputError]}
                    autoComplete="off"
                  />
                  {nameError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{nameError}</Text>
                      <Text style={styles.exampleText}>Exemple : Salle principale, Terrasse, Étage 1</Text>
                    </View>
                  )}
                </>
              );
            })()}
          </View>

          {/* Room Size Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Taille de la salle *</Text>
            <View style={styles.sizesGrid}>
              {ROOM_SIZES.map((size) => {
                const selected = isSelectedSize(size);
                return (
                  <Pressable
                    key={size.label}
                    style={[styles.sizeCard, selected && styles.sizeCardSelected]}
                    onPress={() => handleSelectSize(size)}
                  >
                    <RoomPreview roomW={size.width} roomH={size.height} selected={selected} />
                    <Text style={[styles.sizeDescription, selected && styles.sizeDescriptionSelected]}>
                      {size.label}
                    </Text>
                    <Text style={[styles.sizeDimensions, selected && styles.sizeDimensionsSelected]}>
                      {size.width} x {size.height}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

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
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 12,
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

  // Size selector
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeCard: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  sizeCardSelected: {
    borderColor: '#2A2E33',
    borderWidth: 2,
    backgroundColor: '#FAFAFE',
  },
  sizeDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
  },
  sizeDescriptionSelected: {
    color: '#2A2E33',
  },
  sizeDimensions: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  sizeDimensionsSelected: {
    color: '#64748B',
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
