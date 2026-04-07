import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform, type ViewStyle, type TextStyle } from 'react-native';
import Svg, { Rect, Defs, ClipPath } from 'react-native-svg';
import { X, ArrowLeft } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';

interface RoomFormContentProps {
  room: Room | null;
  onSave: (roomData: Partial<Room>) => Promise<void>;
  onCancel: () => void;
  onBack?: () => void;
}

const DEFAULT_ROOM_COLOR = '#6366F1';

const ROOM_COLORS = [
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Violet', hex: '#8B5CF6' },
  { label: 'Vert', hex: '#10B981' },
  { label: 'Orange', hex: '#F59E0B' },
  { label: 'Rose', hex: '#EC4899' },
  { label: 'Rouge', hex: '#EF4444' },
] as const;

const ROOM_SIZES = [
  { label: 'Normal', width: 15, height: 15 },
  { label: 'Grand', width: 20, height: 20 },
  { label: 'Portrait', width: 15, height: 20 },
  { label: 'Paysage', width: 20, height: 15 },
] as const;

const CONTAINER_SIZE = 70;
const MAX_DIM = 22;
const MIN_ROOM_DIM = 15;
const MAX_ROOM_DIM = 50;

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
let clipIdCounter = 0;

const RoomPreview: React.FC<{ roomW: number; roomH: number; selected: boolean }> = React.memo(
  ({ roomW, roomH, selected }) => {
    const [clipId] = useState(() => `roomClip-${++clipIdCounter}`);
    const maxDim = Math.max(roomW, roomH, MAX_DIM);
    const scale = (CONTAINER_SIZE - 10) / maxDim;
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
        <Defs>
          <ClipPath id={clipId}>
            <Rect x={offsetX} y={offsetY} width={svgW} height={svgH} rx={3} ry={3} />
          </ClipPath>
        </Defs>
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
            clipPath={`url(#${clipId})`}
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
  onBack,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    width: 15,
    height: 15,
    color: DEFAULT_ROOM_COLOR,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const formErrors = useFormErrors();

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        width: room.width || 15,
        height: room.height || 15,
        color: room.color ?? DEFAULT_ROOM_COLOR,
        isActive: room.isActive ?? true,
      });
    } else {
      setFormData({ name: '', width: 15, height: 15, color: DEFAULT_ROOM_COLOR, isActive: true });
    }
  }, [room]);

  const isCustomSize = !ROOM_SIZES.some(s => s.width === formData.width && s.height === formData.height);

  const handleManualChange = (field: 'width' | 'height', text: string) => {
    const num = parseInt(text, 10);
    if (text === '') {
      setFormData(prev => ({ ...prev, [field]: 0 }));
    } else if (!isNaN(num)) {
      setFormData(prev => ({ ...prev, [field]: Math.min(num, MAX_ROOM_DIM) }));
    }
  };

  const handleManualBlur = (field: 'width' | 'height') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] < MIN_ROOM_DIM ? MIN_ROOM_DIM : prev[field],
    }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    formErrors.clearAll();
    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        width: formData.width,
        height: formData.height,
        color: formData.color,
        isActive: formData.isActive,
      });
    } catch (error) {
      formErrors.handleError({ error, showToast, fallback: 'Erreur lors de la sauvegarde' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectSize = (size: typeof ROOM_SIZES[number]) => {
    setFormData(prev => ({ ...prev, width: size.width, height: size.height }));
  };

  const isSelectedSize = (size: typeof ROOM_SIZES[number]) =>
    formData.width === size.width && formData.height === size.height;

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        {onBack && (
          <>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ArrowLeft size={20} color="#1E293B" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerSeparator} />
          </>
        )}
        <Text style={styles.panelTitle}>
          {room ? room.name : 'Créer une nouvelle salle'}
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
        <Pressable style={styles.pressableContent} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Room Name */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom de la salle</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => { setFormData(prev => ({ ...prev, name: text })); formErrors.clearError('name'); }}
              placeholder="Entrez le nom de la salle"
              placeholderTextColor="#94A3B8"
              style={[styles.formInput, formErrors.hasError('name') && styles.formInputError]}
              autoComplete="off"
            />
            <FormFieldError message={formErrors.getError('name')} />
          </View>

          {/* Room Status */}
          <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Statut</Text>
              <Pressable
                style={[styles.statusToggle, formData.isActive && styles.statusToggleActive]}
                onPress={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
              >
                <View style={styles.statusIconContainer}>
                  <View style={[styles.statusPulse, formData.isActive && styles.statusPulseActive]} />
                  <View style={[styles.statusCore, formData.isActive && styles.statusCoreActive]} />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text
                    style={[
                      styles.statusLabel,
                      formData.isActive && styles.statusLabelActive,
                      Platform.OS === 'web' && {
                        fontSize: 13,
                        fontWeight: formData.isActive ? '700' : '600',
                        color: formData.isActive ? '#047857' : '#6B7280',
                        lineHeight: 18,
                      } as TextStyle,
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
                        lineHeight: 14,
                      } as TextStyle,
                    ]}
                  >
                    {formData.isActive ? 'Visible en service' : 'Masquée en service'}
                  </Text>
                </View>
              </Pressable>
          </View>

          {/* Room Color */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Couleur</Text>
            <View style={styles.colorsRow}>
              {ROOM_COLORS.map((c) => {
                const selected = formData.color === c.hex;
                return (
                  <View key={c.hex} style={[styles.colorSwatchWrapper, selected && styles.colorSwatchWrapperSelected]}>
                    <Pressable
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.hex },
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, color: c.hex }))}
                    />
                  </View>
                );
              })}
            </View>
          </View>

          {/* Room Size - Presets */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Templates</Text>
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
                    <View style={styles.sizeInfo}>
                      <Text style={[styles.sizeDescription, selected && styles.sizeDescriptionSelected]}>
                        {size.label}
                      </Text>
                      <Text style={[styles.sizeDimensions, selected && styles.sizeDimensionsSelected]}>
                        {size.width}x{size.height}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Room Size - Manual */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Dimensions {isCustomSize ? '(personnalisé)' : ''}
            </Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionField}>
                <Text style={styles.dimensionLabel}>Largeur</Text>
                <TextInput
                  value={formData.width ? String(formData.width) : ''}
                  onChangeText={(text) => handleManualChange('width', text)}
                  onBlur={() => handleManualBlur('width')}
                  keyboardType="number-pad"
                  placeholder={String(MIN_ROOM_DIM)}
                  placeholderTextColor="#94A3B8"
                  style={styles.dimensionInput}
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.dimensionSeparator}>x</Text>
              <View style={styles.dimensionField}>
                <Text style={styles.dimensionLabel}>Hauteur</Text>
                <TextInput
                  value={formData.height ? String(formData.height) : ''}
                  onChangeText={(text) => handleManualChange('height', text)}
                  onBlur={() => handleManualBlur('height')}
                  keyboardType="number-pad"
                  placeholder={String(MIN_ROOM_DIM)}
                  placeholderTextColor="#94A3B8"
                  style={styles.dimensionInput}
                  selectTextOnFocus
                />
              </View>
            </View>
            <Text style={styles.dimensionHint}>
              Min {MIN_ROOM_DIM} — Max {MAX_ROOM_DIM}
            </Text>
            {isCustomSize && formData.width >= MIN_ROOM_DIM && formData.height >= MIN_ROOM_DIM && (
              <View style={styles.customPreview}>
                <RoomPreview roomW={formData.width} roomH={formData.height} selected={true} />
                <View style={styles.customPreviewInfo}>
                  <Text style={styles.customPreviewLabel}>Aperçu personnalisé</Text>
                  <Text style={styles.customPreviewDim}>{formData.width} x {formData.height}</Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonSaving]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Enregistrement...' : (room ? 'Enregistrer' : 'Créer la salle')}
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
  pressableContent: {
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
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    alignSelf: 'stretch',
    marginVertical: -20,
    marginLeft: -20,
    marginRight: -12,
    paddingHorizontal: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSeparator: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: -20,
    backgroundColor: '#E2E8F0',
  },
  panelTitle: {
    flex: 1,
    paddingLeft: 8,
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
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    paddingHorizontal: 12,
    fontSize: 13,
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  // Status toggle
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  } as ViewStyle,
  statusToggleActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#34D399',
    shadowColor: '#10B981',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    ...Platform.select({
      ios: { elevation: 3 },
      android: { elevation: 0 },
      web: {
        elevation: 3,
        boxShadow: '0 0 0 3px rgba(52, 211, 153, 0.1), 0 4px 12px rgba(16, 185, 129, 0.15)',
      },
    }),
  } as ViewStyle,
  statusIconContainer: {
    width: 12,
    height: 12,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  statusPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  } as ViewStyle,
  statusPulseActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  } as ViewStyle,
  statusCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    zIndex: 1,
  } as ViewStyle,
  statusCoreActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0 },
      web: { elevation: 2 },
    }),
  } as ViewStyle,
  statusTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 2,
  } as ViewStyle,
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
    lineHeight: 16,
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    } : {}),
  } as TextStyle,
  statusLabelActive: {
    color: '#047857',
    fontWeight: '700',
  } as TextStyle,
  statusSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.1,
    marginTop: 1,
    lineHeight: 14,
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    } : {}),
  } as TextStyle,
  statusSubtextActive: {
    color: '#059669',
  } as TextStyle,

  // Color picker
  colorsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorSwatchWrapper: {
    flex: 1,
    flexBasis: 0,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
  },
  colorSwatchWrapperSelected: {
    borderColor: '#2A2E33',
  },
  colorSwatch: {
    height: 30,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Size presets
  sizesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#FAFAFA',
    gap: 8,
    width: '48%',
  },
  sizeCardSelected: {
    borderColor: '#2A2E33',
    borderWidth: 2,
    backgroundColor: '#FAFAFE',
  },
  sizeInfo: {
    justifyContent: 'center',
  },
  sizeDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sizeDescriptionSelected: {
    color: '#2A2E33',
  },
  sizeDimensions: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 1,
  },
  sizeDimensionsSelected: {
    color: '#64748B',
  },

  // Manual dimensions
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dimensionField: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  dimensionInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    color: '#1E293B',
    paddingHorizontal: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  dimensionSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    paddingBottom: 12,
  },
  dimensionHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  customPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 10,
    backgroundColor: '#FAFAFE',
    gap: 10,
  },
  customPreviewInfo: {
    justifyContent: 'center',
  },
  customPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  customPreviewDim: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
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
  saveButtonSaving: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
