import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform, type ViewStyle, type TextStyle } from 'react-native';
import Svg, { Rect, Defs, ClipPath } from 'react-native-svg';
import { X, ArrowLeft } from 'lucide-react-native';
import { Room } from '~/types/room.types';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { useToast } from '~/components/ToastProvider';
import { useFormErrors } from '~/hooks/useFormErrors';
import { FormFieldError } from '~/components/ui/FormFieldError';
import { getColorWithOpacity } from '~/lib/color-utils';
import { shadows, colors } from '~/theme';

interface RoomFormContentProps {
  room: Room | null;
  onSave: (roomData: Partial<Room>) => Promise<void>;
  onCancel: () => void;
  onBack?: () => void;
}

const DEFAULT_ROOM_COLOR = colors.brand.accent;

const ROOM_COLORS = [
  { label: 'Indigo', hex: colors.brand.accent },
  { label: 'Violet', hex: colors.purple.alt },
  { label: 'Vert', hex: colors.success.base },
  { label: 'Orange', hex: colors.warning.base },
  { label: 'Rose', hex: colors.pink },
  { label: 'Rouge', hex: colors.error.base },
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
    const roomBorder = selected ? colors.brand.dark : colors.neutral[300];
    const roomBg = selected ? colors.neutral[100] : colors.gray[50];
    const tableFill = selected ? colors.neutral[500] : colors.neutral[400];
    const tableStroke = selected ? colors.neutral[600] : colors.gray[400];

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
              <ArrowLeft size={20} color={colors.neutral[800]} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.headerSeparator} />
          </>
        )}
        <Text style={styles.panelTitle}>
          {room ? room.name : 'Créer une nouvelle salle'}
        </Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color={colors.neutral[500]} strokeWidth={2} />
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
              placeholderTextColor={colors.neutral[400]}
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
                        color: formData.isActive ? colors.success.text : colors.gray[500],
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
                        color: formData.isActive ? colors.success.dark : colors.gray[400],
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
                  placeholderTextColor={colors.neutral[400]}
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
                  placeholderTextColor={colors.neutral[400]}
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
    backgroundColor: colors.white,
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
    borderBottomColor: colors.neutral[200],
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
    backgroundColor: colors.neutral[200],
  },
  panelTitle: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.dark,
    marginBottom: 12,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
    color: colors.neutral[800],
    paddingHorizontal: 12,
    fontSize: 13,
  },
  formInputError: {
    borderColor: colors.error.base,
    backgroundColor: colors.error.bg,
  },

  // Status toggle
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    height: 44,
    ...shadows.bottom,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  } as ViewStyle,
  statusToggleActive: {
    backgroundColor: colors.success.bg,
    borderColor: colors.success.border,
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
    borderColor: colors.gray[300],
  } as ViewStyle,
  statusPulseActive: {
    borderColor: colors.success.base,
    backgroundColor: getColorWithOpacity(colors.success.base, 0.1),
  } as ViewStyle,
  statusCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[400],
    zIndex: 1,
  } as ViewStyle,
  statusCoreActive: {
    backgroundColor: colors.success.base,
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
    color: colors.gray[500],
    letterSpacing: 0.2,
    lineHeight: 16,
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    } : {}),
  } as TextStyle,
  statusLabelActive: {
    color: colors.success.text,
    fontWeight: '700',
  } as TextStyle,
  statusSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
    letterSpacing: 0.1,
    marginTop: 1,
    lineHeight: 14,
    ...(Platform.OS === 'web' ? {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    } : {}),
  } as TextStyle,
  statusSubtextActive: {
    color: colors.success.dark,
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
    borderColor: colors.brand.dark,
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
    borderColor: colors.gray[200],
    borderRadius: 10,
    padding: 8,
    backgroundColor: colors.gray[50],
    gap: 8,
    width: '48%',
  },
  sizeCardSelected: {
    borderColor: colors.brand.dark,
    borderWidth: 2,
    backgroundColor: colors.gray[50],
  },
  sizeInfo: {
    justifyContent: 'center',
  },
  sizeDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  sizeDescriptionSelected: {
    color: colors.brand.dark,
  },
  sizeDimensions: {
    fontSize: 10,
    color: colors.neutral[400],
    fontWeight: '500',
    marginTop: 1,
  },
  sizeDimensionsSelected: {
    color: colors.neutral[500],
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
    color: colors.neutral[500],
    marginBottom: 6,
  },
  dimensionInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 8,
    backgroundColor: colors.neutral[50],
    color: colors.neutral[800],
    paddingHorizontal: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  dimensionSeparator: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[400],
    paddingBottom: 12,
  },
  dimensionHint: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 6,
  },
  customPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: colors.brand.accent,
    borderRadius: 10,
    backgroundColor: colors.gray[50],
    gap: 10,
  },
  customPreviewInfo: {
    justifyContent: 'center',
  },
  customPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand.accent,
  },
  customPreviewDim: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.neutral[500],
    marginTop: 1,
  },

  panelFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[500],
  },
  saveButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.brand.dark,
  },
  saveButtonSaving: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
});
