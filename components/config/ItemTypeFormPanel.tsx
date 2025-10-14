import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { X, Check, ChefHat, Wine } from 'lucide-react-native';
import { ItemType } from '~/types/item-type.types';

interface ItemTypeFormPanelProps {
  itemType: ItemType | null;
  onSave: (itemTypeData: Partial<ItemType>) => void;
  onCancel: () => void;
}

export const ItemTypeFormPanel: React.FC<ItemTypeFormPanelProps> = ({ itemType, onSave, onCancel }) => {
  const [name, setName] = useState(itemType?.name || '');
  const [type, setType] = useState<'kitchen' | 'bar'>(itemType?.type === 'bar' ? 'bar' : 'kitchen');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type });
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{itemType ? 'Modifier le type' : 'Nouveau type'}</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.panelForm}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Nom du type */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Nom du type</Text>
          <TextInput
            style={styles.formInput}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Entrée, Plat, Boisson..."
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Département */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Département</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'kitchen' && styles.radioOptionActive,
                type === 'kitchen' && { borderColor: '#10B981', backgroundColor: '#F0FDF4' }
              ]}
              onPress={() => setType('kitchen')}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'kitchen' && <View style={[styles.radioInner, { backgroundColor: '#10B981' }]} />}
              </View>
              <ChefHat size={18} color={type === 'kitchen' ? '#10B981' : '#64748B'} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'kitchen' && styles.radioLabelActive]}>
                Cuisine
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioOption,
                type === 'bar' && styles.radioOptionActive,
                type === 'bar' && { borderColor: '#A855F7', backgroundColor: '#FAF5FF' }
              ]}
              onPress={() => setType('bar')}
              activeOpacity={1}
            >
              <View style={styles.radio}>
                {type === 'bar' && <View style={[styles.radioInner, { backgroundColor: '#A855F7' }]} />}
              </View>
              <Wine size={18} color={type === 'bar' ? '#A855F7' : '#64748B'} strokeWidth={2} />
              <Text style={[styles.radioLabel, type === 'bar' && styles.radioLabelActive]}>
                Bar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panelContent: {
    flex: 1,
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
  panelForm: {
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
    marginBottom: 12,
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
  radioGroup: {
    gap: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  radioOptionActive: {
    borderColor: '#A855F7',
    backgroundColor: '#F8F4FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A855F7',
  },
  radioLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  radioLabelActive: {
    color: '#1E293B',
    fontWeight: '500',
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
    backgroundColor: '#A855F7',
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
