import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Pressable, Keyboard, Platform } from 'react-native';
import { X, Check, Users } from 'lucide-react-native';
import { UserProfile } from '~/types/user.types';
import { getUserProfileText } from '~/lib/utils';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { SelectButton } from '~/components/ui';

// Profils affichables (exclure superadmin et admin)
const DISPLAYABLE_PROFILES = Object.values(UserProfile).filter(
  profile => !['superadmin', 'admin'].includes(profile)
);

interface QuickTeamFormPanelContentProps {
  onSave: (profil: UserProfile, displayName: string) => void;
  onCancel: () => void;
  activeTab?: UserProfile | 'all';
}

export const QuickTeamFormPanelContent: React.FC<QuickTeamFormPanelContentProps> = ({
  onSave,
  onCancel,
  activeTab = 'all',
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // Only pre-fill if user hasn't made a selection yet
    if (activeTab !== 'all' && !selectedProfileId) {
      setSelectedProfileId(activeTab);
    }
  }, [activeTab, selectedProfileId]);

  const handleProfileSelect = (profile: UserProfile) => {
    setSelectedProfileId(profile);
  };

  const handleSave = () => {
    if (!selectedProfileId) {
      alert('Veuillez sélectionner un rôle');
      return;
    }
    onSave(selectedProfileId as UserProfile, displayName.trim() || '');
  };

  return (
    <View style={styles.panelContent}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>Création rapide</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#64748B" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* KeyboardAwareScrollView - auto-scrolls to focused input */}
      <KeyboardAwareScrollViewWrapper
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bottomOffset={40}
        scrollEventThrottle={16}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          {/* Info Badge */}
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>
              Le mot de passe sera généré automatiquement et pourra être modifié ultérieurement.
            </Text>
          </View>

          {/* Section Rôle */}
          <View style={styles.formGroup}>
            <View style={styles.sectionHeader}>
              <Users size={18} color="#2A2E33" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Rôle *</Text>
            </View>
            <View style={styles.profileButtons}>
              {DISPLAYABLE_PROFILES.map((profile) => (
                <SelectButton
                  key={profile}
                  label={getUserProfileText(profile)}
                  isActive={selectedProfileId === profile}
                  onPress={() => handleProfileSelect(profile)}
                  variant="sub"
                />
              ))}
            </View>
          </View>

          {/* Nom d'affichage */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Nom d'affichage (optionnel)</Text>
            <Text style={styles.formHelpText}>
              Si non renseigné, un nom sera généré automatiquement
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ex: Jean Dupont, Chef Principal, etc."
              placeholderTextColor="#A0A0A0"
              style={styles.formInput}
              autoComplete="off"
            />
          </View>

          {/* Info complémentaire */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Informations complémentaires</Text>
            <Text style={styles.infoCardText}>
              • Un identifiant unique sera généré automatiquement{'\n'}
              • Un mot de passe temporaire sera créé{'\n'}
              • Vous pourrez compléter les informations plus tard
            </Text>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>

      <View style={styles.panelFooter}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !selectedProfileId && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!selectedProfileId}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.saveButtonText}>Créer rapidement</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2E33',
    marginBottom: 6,
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
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  infoBadgeText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
