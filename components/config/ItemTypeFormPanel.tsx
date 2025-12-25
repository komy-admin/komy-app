import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { X, Check, ChefHat, Wine } from 'lucide-react-native';
import { ItemType } from '~/types/item-type.types';
import { useItemTypes } from '~/hooks/useItemTypes';
import { KeyboardSafeFormView } from '~/components/Keyboard';

interface ItemTypeFormPanelProps {
  itemType: ItemType | null;
  onSave: (itemTypeData: Partial<ItemType>) => void;
  onCancel: () => void;
}

export const ItemTypeFormPanel: React.FC<ItemTypeFormPanelProps> = ({ itemType, onSave, onCancel }) => {
  const { itemTypes } = useItemTypes();
  const [name, setName] = useState(itemType?.name || '');
  const [type, setType] = useState<'kitchen' | 'bar'>(itemType?.type === 'bar' ? 'bar' : 'kitchen');

  // Calculer le nombre de positions disponibles
  // En création : N+1 (pour permettre d'insérer à la fin)
  // En édition : N (on peut réorganiser parmi les existants)
  const totalPositions = itemType
    ? itemTypes.length  // En édition : peut choisir parmi 1 à N
    : itemTypes.length + 1;  // En création : peut choisir parmi 1 à N+1

  const [priorityOrder, setPriorityOrder] = useState<number>(
    itemType?.priorityOrder || totalPositions  // Par défaut : dernière position
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      type,
      priorityOrder
    });
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{itemType ? 'Modifier le type' : 'Nouveau type'}</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardSafeFormView - Pattern B (ADMIN) avec optimisations GPU */}
      <KeyboardSafeFormView
        role="ADMIN"
        behavior="padding"
        keyboardVerticalOffset={150}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
          scrollEventThrottle={16}
          overScrollMode="never"
          bounces={false}
          directionalLockEnabled={true}
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

        {/* Ordre de priorité */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Ordre de priorité</Text>
          <Text style={styles.formHelpText}>
            {itemType
              ? "Changer la position réorganisera automatiquement les autres types"
              : "Les types suivants seront décalés automatiquement"}
          </Text>
          <View style={styles.priorityGrid}>
            {Array.from({ length: totalPositions }, (_, i) => i + 1).map((position) => {
              // Trouver quel type occupe actuellement cette position
              const typeAtPosition = itemTypes.find(it => it.priorityOrder === position);
              const isCurrentPosition = itemType?.priorityOrder === position;

              return (
                <TouchableOpacity
                  key={position}
                  style={[
                    styles.priorityButton,
                    priorityOrder === position && styles.priorityButtonActive,
                    isCurrentPosition && !priorityOrder && styles.priorityButtonCurrent
                  ]}
                  onPress={() => setPriorityOrder(position)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      priorityOrder === position && styles.priorityButtonTextActive
                    ]}
                  >
                    {position}
                  </Text>
                  {typeAtPosition && !itemType && (
                    <Text style={styles.priorityButtonLabel} numberOfLines={1}>
                      {typeAtPosition.name}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {priorityOrder && (
            <View style={styles.priorityFeedbackCard}>
              <View style={styles.priorityFeedbackHeader}>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityBadgeText}>
                    {priorityOrder === 1 && "1ère priorité"}
                    {priorityOrder === 2 && "2ème priorité"}
                    {priorityOrder === 3 && "3ème priorité"}
                    {priorityOrder > 3 && `${priorityOrder}ème priorité`}
                  </Text>
                </View>
              </View>
              <View style={styles.priorityFeedbackContent}>
                {/* <Text style={styles.priorityFeedbackTitle}>
                  {itemType ? "Réorganisation" : "Insertion"}
                </Text>
                <Text style={styles.priorityFeedbackDescription}>
                  {itemType
                    ? `Ce type prendra la position ${priorityOrder}. Les autres types seront automatiquement réorganisés pour maintenir l'ordre.`
                    : `Ce type sera inséré en position ${priorityOrder}. Les types suivants seront décalés vers le bas.`}
                </Text> */}
                {/* <View style={styles.priorityFeedbackDivider} /> */}
                <Text style={styles.priorityFeedbackUsage}>
                  <Text style={styles.priorityFeedbackUsageBold}>Affichage :</Text> Les types seront affichés dans cet ordre partout dans l'application.{'\n'}
                  <Text style={styles.priorityFeedbackUsageBold}>Autogestion :</Text> Détermine l'ordre de préparation en cuisine/bar.
                </Text>
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardSafeFormView>

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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  formHelpText: {
    fontSize: 12,
    color: '#64748B',
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
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    minWidth: 48,
    height: 48,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityButtonActive: {
    borderColor: '#A855F7',
    backgroundColor: '#F8F4FF',
  },
  priorityButtonCurrent: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  priorityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  priorityButtonTextActive: {
    color: '#A855F7',
  },
  priorityButtonLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    maxWidth: 60,
    textAlign: 'center',
  },
  priorityFeedbackCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    overflow: 'hidden',
  },
  priorityFeedbackHeader: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priorityFeedbackContent: {
    padding: 16,
  },
  priorityFeedbackTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  priorityFeedbackDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  priorityFeedbackDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  priorityFeedbackUsage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  priorityFeedbackUsageBold: {
    fontWeight: '600',
    color: '#1E293B',
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
