import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { useToast } from '~/components/ToastProvider';
import type { ReservationSettings, ReservationProfessionalProfile, UpdateReservationSettingsDto } from '~/types/reservation.types';

interface ReservationSettingsPageProps {
  reservation: {
    profile: ReservationProfessionalProfile | null;
    loadProfile: () => Promise<ReservationProfessionalProfile>;
    updateProfile: (data: { businessName?: string; email?: string; phone?: string; address?: string }) => Promise<ReservationProfessionalProfile>;
    updateSettings: (data: UpdateReservationSettingsDto) => Promise<ReservationProfessionalProfile>;
  };
}

export function ReservationSettingsPage({ reservation }: ReservationSettingsPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    minNoticeHours: '2',
    maxAdvanceDays: '30',
    minPartySize: '1',
    maxPartySize: '20',
    autoConfirm: true,
    cancellationDeadlineHours: '24',
    reminderEnabled: false,
    reminderHoursBefore: '24',
    requireCardGuarantee: false,
  });

  useEffect(() => {
    reservation.loadProfile()
      .then((profile) => {
        if (profile) {
          const s = profile.settings;
          setForm({
            businessName: profile.businessName ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            address: profile.address ?? '',
            minNoticeHours: String(s.minNoticeHours ?? 2),
            maxAdvanceDays: String(s.maxAdvanceDays ?? 30),
            minPartySize: String(s.minPartySize ?? 1),
            maxPartySize: String(s.maxPartySize ?? 20),
            autoConfirm: s.autoConfirm ?? true,
            cancellationDeadlineHours: String(s.cancellationDeadlineHours ?? 24),
            reminderEnabled: s.reminderEnabled ?? false,
            reminderHoursBefore: String(s.reminderHoursBefore ?? 24),
            requireCardGuarantee: s.requireCardGuarantee ?? false,
          });
        }
      })
      .catch(() => showToast('Erreur chargement des paramètres', 'error'))
      .finally(() => setIsLoading(false));
  }, []);

  const updateField = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileUpdate: { businessName?: string; email?: string; phone?: string; address?: string } = {};
      if (form.businessName.trim()) profileUpdate.businessName = form.businessName.trim();
      if (form.email.trim()) profileUpdate.email = form.email.trim();
      if (form.phone.trim()) profileUpdate.phone = form.phone.trim();
      if (form.address.trim()) profileUpdate.address = form.address.trim();
      if (Object.keys(profileUpdate).length > 0) {
        await reservation.updateProfile(profileUpdate);
      }
      await reservation.updateSettings({
        minNoticeHours: parseInt(form.minNoticeHours) || 2,
        maxAdvanceDays: parseInt(form.maxAdvanceDays) || 30,
        minPartySize: parseInt(form.minPartySize) || 1,
        maxPartySize: parseInt(form.maxPartySize) || 20,
        autoConfirm: form.autoConfirm,
        cancellationDeadlineHours: parseInt(form.cancellationDeadlineHours) || 24,
        reminderEnabled: form.reminderEnabled,
        reminderHoursBefore: parseInt(form.reminderHoursBefore) || 24,
        requireCardGuarantee: form.requireCardGuarantee,
      });
      showToast('Paramètres sauvegardés', 'success');
      setHasChanges(false);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Paramètres de réservation</Text>
          <Text style={styles.pageSubtitle}>Configurez le comportement de votre système de réservation</Text>
        </View>
        {hasChanges && (
          <Pressable
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Business name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Établissement</Text>
        <View style={styles.settingField}>
          <Text style={styles.fieldLabel}>Nom de l'établissement</Text>
          <TextInput
            style={[styles.textInput, styles.textInputFull]}
            value={form.businessName}
            onChangeText={(v) => updateField('businessName', v)}
            placeholder="Nom affiché sur la page de réservation"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.settingField}>
          <Text style={styles.fieldLabel}>Email de contact</Text>
          <TextInput
            style={[styles.textInput, styles.textInputFull]}
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            placeholder="Email affiché sur la page de réservation"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.settingField}>
          <Text style={styles.fieldLabel}>Téléphone</Text>
          <TextInput
            style={[styles.textInput, styles.textInputFull]}
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            placeholder="Numéro de téléphone"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.settingField}>
          <Text style={styles.fieldLabel}>Adresse</Text>
          <TextInput
            style={[styles.textInput, styles.textInputFull]}
            value={form.address}
            onChangeText={(v) => updateField('address', v)}
            placeholder="Adresse de l'établissement"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Booking constraints */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contraintes de réservation</Text>

        <View style={styles.fieldsGrid}>
          <SettingField
            label="Délai minimum avant réservation"
            suffix="heures"
            value={form.minNoticeHours}
            onChange={(v) => updateField('minNoticeHours', v)}
          />
          <SettingField
            label="Réservation max à l'avance"
            suffix="jours"
            value={form.maxAdvanceDays}
            onChange={(v) => updateField('maxAdvanceDays', v)}
          />
          <SettingField
            label="Taille min du groupe"
            suffix="personnes"
            value={form.minPartySize}
            onChange={(v) => updateField('minPartySize', v)}
          />
          <SettingField
            label="Taille max du groupe"
            suffix="personnes"
            value={form.maxPartySize}
            onChange={(v) => updateField('maxPartySize', v)}
          />
        </View>
      </View>

      {/* Confirmation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confirmation & Annulation</Text>

        <SettingSwitch
          label="Confirmation automatique"
          description="Les réservations sont automatiquement confirmées"
          value={form.autoConfirm}
          onChange={(v) => updateField('autoConfirm', v)}
        />

        <SettingField
          label="Délai d'annulation"
          suffix="heures avant le créneau"
          value={form.cancellationDeadlineHours}
          onChange={(v) => updateField('cancellationDeadlineHours', v)}
        />
      </View>

      {/* Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rappels</Text>

        <SettingSwitch
          label="Rappels email activés"
          description="Envoyer un email de rappel avant la réservation"
          value={form.reminderEnabled}
          onChange={(v) => updateField('reminderEnabled', v)}
        />

        {form.reminderEnabled && (
          <SettingField
            label="Rappel avant"
            suffix="heures"
            value={form.reminderHoursBefore}
            onChange={(v) => updateField('reminderHoursBefore', v)}
          />
        )}
      </View>

      {/* Card guarantee */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paiement</Text>

        <SettingSwitch
          label="Empreinte CB requise"
          description="Demander une empreinte de carte bancaire pour confirmer"
          value={form.requireCardGuarantee}
          onChange={(v) => updateField('requireCardGuarantee', v)}
        />
      </View>
    </View>
  );
}

// === Sub-components ===

function SettingField({ label, suffix, value, onChange }: {
  label: string;
  suffix: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.settingField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWithSuffix}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.suffixText}>{suffix}</Text>
      </View>
    </View>
  );
}

function SettingSwitch({ label, description, value, onChange }: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchField}>
      <View style={styles.switchInfo}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
        thumbColor={value ? '#10B981' : '#9CA3AF'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },
  saveButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  section: {
    marginBottom: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  fieldsGrid: { gap: 16 },
  settingField: { marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
    width: 100,
    textAlign: 'center',
  },
  textInputFull: {
    width: '100%',
    textAlign: 'left',
  },
  suffixText: { fontSize: 13, color: '#64748B' },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  switchDescription: { fontSize: 13, color: '#64748B' },
});
