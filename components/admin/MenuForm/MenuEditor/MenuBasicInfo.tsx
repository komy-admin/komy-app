import { memo, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Platform } from 'react-native';
import { FileText } from 'lucide-react-native';
import { Text } from '~/components/ui';
import { SectionHeader } from '~/components/admin/SectionHeader';
import { MenuFormData } from '~/components/admin/MenuForm/MenuEditor/MenuEditor.types';

interface MenuBasicInfoProps {
  formData: MenuFormData;
  errors: Record<string, string>;
  onUpdateField: (field: keyof MenuFormData, value: any) => void;
}

export const MenuBasicInfo = memo<MenuBasicInfoProps>(({
  formData,
  errors,
  onUpdateField
}) => {
  // State pour la hauteur auto-resizable du champ description
  const [descriptionHeight, setDescriptionHeight] = useState(44);
  return (
    <View style={styles.section}>
      <SectionHeader
        icon={FileText}
        title="1. Informations générales"
        subtitle="Définissez le nom, prix et description de votre menu"
      />

      <View style={styles.row}>
        <View style={[styles.field, styles.fieldLarge]}>
          <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Nom du menu *</Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => onUpdateField('name', text)}
            placeholder="Ex: Menu Déjeuner"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, errors.name && { borderColor: '#EF4444' }]}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        <View style={[styles.field, styles.fieldSmall]}>
          <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Prix de base (€) *</Text>
          <TextInput
            value={formData.basePrice}
            onChangeText={(text) => onUpdateField('basePrice', text)}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#A0A0A0"
            style={[styles.input, errors.basePrice && { borderColor: '#EF4444' }]}
          />
          {errors.basePrice && (
            <Text style={styles.errorText}>{errors.basePrice}</Text>
          )}
        </View>

        <View style={[styles.field, styles.fieldSmall, { marginLeft: 12 }]}>
          <Text style={[styles.label, { fontSize: 13, color: '#6B7280', marginBottom: 8 }]}>Statut</Text>
          <Pressable
            style={[styles.statusToggleV2, formData.isActive && styles.statusToggleV2Active]}
            onPress={() => onUpdateField('isActive', !formData.isActive)}
          >
            <View style={[styles.statusIconContainer, formData.isActive && styles.statusIconContainerActive]}>
              <View style={[styles.statusPulse, formData.isActive && styles.statusPulseActive]} />
              <View style={[styles.statusCore, formData.isActive && styles.statusCoreActive]} />
            </View>
            <View style={styles.statusTextContainer}>
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

      <View style={[styles.row, { marginBottom: 0 }]}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { fontSize: 13, color: '#6B7280' }]}>Description</Text>
          <TextInput
            value={formData.description}
            onChangeText={(text) => onUpdateField('description', text)}
            placeholder="Ex: Un menu complet avec entrée, plat et dessert..."
            placeholderTextColor="#A0A0A0"
            multiline
            scrollEnabled={false}
            onContentSizeChange={(event) => {
              // Ajuster la hauteur selon le contenu, minimum 44px
              setDescriptionHeight(Math.max(44, event.nativeEvent.contentSize.height));
            }}
            style={[
              styles.input,
              styles.textArea,
              { height: descriptionHeight }
            ]}
          />
        </View>
      </View>
    </View>
  );
});

MenuBasicInfo.displayName = 'MenuBasicInfo';

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    marginBottom: 15,
    ...(Platform.OS === 'web' ? {} : { gap: 16 }),
  },
  field: {
    ...(Platform.OS === 'web' && { marginRight: 16 }),
  },
  fieldLarge: {
    flex: 2,
    ...(Platform.OS === 'web' && { marginRight: 16 }),
  },
  fieldSmall: {
    flex: 1,
    ...(Platform.OS === 'web' && { marginRight: 16 }),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    color: '#2A2E33',
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...Platform.select({
      ios: {
        paddingVertical: 12,
        minHeight: 44,
        elevation: 1,
      },
      android: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
        elevation: 0,
      },
      web: {
        height: 44,
        paddingTop: 11,
        paddingBottom: 11,
        elevation: 1,
      } as any,
    }),
  },
  textArea: {
    textAlignVertical: 'top',
    ...Platform.select({
      ios: {
        paddingTop: 12,
        minHeight: 44,
      },
      android: {
        minHeight: 44,
        paddingTop: 12,
      },
      web: {
        minHeight: 44,
        paddingTop: 12,
        resize: 'vertical' as any,
      },
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  statusToggleV2: {
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
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    })
  },
  statusToggleV2Active: {
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
  },
  statusIconContainer: {
    width: 12,
    height: 12,
    marginRight: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconContainerActive: {},
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
    ...Platform.select({
      ios: { elevation: 2 },
      android: { elevation: 0 },
      web: { elevation: 2 },
    }),
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
});