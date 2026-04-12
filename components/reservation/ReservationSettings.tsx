import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator, Platform, ScrollView, useWindowDimensions, Linking } from 'react-native';
import { Store, Settings, Bell, Mail, Info, Link2, Shield, ChevronDown } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '~/components/ToastProvider';
import type { ReservationProfessionalProfile, UpdateReservationSettingsDto, StripeConnectStatus } from '~/types/reservation.types';

interface ReservationSettingsPageProps {
  reservation: {
    profile: ReservationProfessionalProfile | null;
    stripeStatus: StripeConnectStatus | null;
    loadProfile: () => Promise<ReservationProfessionalProfile>;
    updateProfile: (data: { businessName?: string; email?: string; phone?: string; address?: string }) => Promise<ReservationProfessionalProfile>;
    updateSettings: (data: UpdateReservationSettingsDto) => Promise<ReservationProfessionalProfile>;
    loadStripeStatus: () => Promise<StripeConnectStatus>;
    getStripeConnectLink: (returnUrl: string) => Promise<{ url: string }>;
    disconnectStripe: () => Promise<void>;
  };
}

const SETTINGS_TOOLTIPS: Record<string, { title: string; items: string[] }> = {
  etablissement: {
    title: 'Informations publiques',
    items: [
      'Ces informations sont affichées sur votre page de réservation en ligne.',
      'L\'email sert aussi à recevoir les notifications de réservation.',
      'L\'adresse permet aux clients de localiser votre établissement.',
    ],
  },
  contraintes: {
    title: 'Règles de réservation',
    items: [
      'Délai minimum : temps minimum avant lequel un client peut réserver (ex: 2h = pas de réservation dans les 2 prochaines heures).',
      'Réservation max à l\'avance : jusqu\'à combien de jours un client peut réserver à l\'avance.',
      'Taille du groupe : nombre de convives min/max acceptés par réservation.',
      'Délai d\'annulation : temps avant la réservation où le client ne peut plus annuler.',
    ],
  },
  notifications: {
    title: 'Alertes & rappels',
    items: [
      'Notifications restaurateur : recevez un email pour chaque nouvelle réservation, confirmation ou annulation.',
      'Rappels clients : un email est envoyé automatiquement au client avant sa réservation pour réduire les no-shows.',
    ],
  },
  emails: {
    title: 'Personnalisation',
    items: [
      'Le message personnalisé est inclus dans tous les emails envoyés aux clients (confirmation, rappel, annulation).',
    ],
  },
  stripe: {
    title: 'Compte Stripe',
    items: [
      'Connectez votre compte Stripe pour encaisser les frais no-show depuis Komy.',
      'Une fois connecté, activez l\'empreinte bancaire dans le bloc "Garantie no-show".',
      'Les paiements sont traités par Stripe de façon sécurisée.',
    ],
  },
  noshow: {
    title: 'Garantie no-show',
    items: [
      'Si activée, le client doit fournir une carte bancaire pour confirmer sa réservation.',
      'En cas de no-show, vous pouvez débiter le montant configuré depuis la page des réservations.',
      'Nécessite un compte Stripe connecté.',
    ],
  },
};

export function ReservationSettingsPage({ reservation }: ReservationSettingsPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [visibleTooltip, setVisibleTooltip] = useState<string | null>(null);
  const [isStripeActionLoading, setIsStripeActionLoading] = useState(false);
  const { showToast } = useToast();
  const { width } = useWindowDimensions();
  const isCompact = width < 1100;

  const [form, setForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    minNoticeHours: '2',
    maxAdvanceDays: '30',
    minPartySize: '1',
    maxPartySize: '20',
    cancellationDeadlineHours: '24',
    reminderEnabled: false,
    reminderHoursBefore: '24',
    customEmailMessage: '',
    notifyProfessionalOnNewReservation: true,
    notifyProfessionalOnCancellation: true,
    requireCardGuarantee: false,
    noShowFeeAmountEur: '',
    noShowFeeCurrency: 'eur',
  });

  useEffect(() => {
    Promise.all([
      reservation.loadProfile(),
      reservation.loadStripeStatus(),
    ])
      .then(([profile]) => {
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
            cancellationDeadlineHours: String(s.cancellationDeadlineHours ?? 24),
            reminderEnabled: s.reminderEnabled ?? false,
            reminderHoursBefore: String(s.reminderHoursBefore ?? 24),
            customEmailMessage: s.customEmailMessage ?? '',
            notifyProfessionalOnNewReservation: s.notifyProfessionalOnNewReservation ?? true,
            notifyProfessionalOnCancellation: s.notifyProfessionalOnCancellation ?? true,
            requireCardGuarantee: s.requireCardGuarantee ?? false,
            noShowFeeAmountEur: s.noShowFeeAmount ? String(s.noShowFeeAmount / 100) : '',
            noShowFeeCurrency: s.noShowFeeCurrency || 'eur',
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
      const feeAmount = form.requireCardGuarantee && form.noShowFeeAmountEur
        ? Math.round(parseFloat(form.noShowFeeAmountEur) * 100) || null
        : null;
      await reservation.updateSettings({
        minNoticeHours: parseInt(form.minNoticeHours) || 2,
        maxAdvanceDays: parseInt(form.maxAdvanceDays) || 30,
        minPartySize: parseInt(form.minPartySize) || 1,
        maxPartySize: parseInt(form.maxPartySize) || 20,
        cancellationDeadlineHours: parseInt(form.cancellationDeadlineHours) || 24,
        reminderEnabled: form.reminderEnabled,
        reminderHoursBefore: parseInt(form.reminderHoursBefore) || 24,
        customEmailMessage: form.customEmailMessage.trim() || null,
        notifyProfessionalOnNewReservation: form.notifyProfessionalOnNewReservation,
        notifyProfessionalOnCancellation: form.notifyProfessionalOnCancellation,
        requireCardGuarantee: form.requireCardGuarantee,
        noShowFeeAmount: feeAmount,
        noShowFeeCurrency: form.noShowFeeCurrency,
      });
      showToast('Paramètres sauvegardés', 'success');
      setHasChanges(false);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    setIsStripeActionLoading(true);
    try {
      const returnUrl = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : '';
      const { url } = await reservation.getStripeConnectLink(returnUrl);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        await Linking.openURL(url);
        setIsStripeActionLoading(false);
      }
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur de connexion Stripe', 'error');
      setIsStripeActionLoading(false);
    }
  };

  const handleStripeDisconnect = async () => {
    setIsStripeActionLoading(true);
    try {
      await reservation.disconnectStripe();
      showToast('Compte Stripe déconnecté', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'Erreur lors de la déconnexion', 'error');
    } finally {
      setIsStripeActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  const stripe = reservation.stripeStatus;
  const isStripeConnected = stripe?.connected ?? false;
  const isStripeProfileIncomplete = isStripeConnected && (!stripe?.chargesEnabled || !stripe?.payoutsEnabled);
  const isStripeFullyConnected = isStripeConnected && !!stripe?.chargesEnabled && !!stripe?.payoutsEnabled;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
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

      {/* Row 1: Etablissement + Contraintes */}
      <View style={[styles.row, isCompact && styles.rowCompact]}>
        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Store size={18} color="#3B82F6" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Établissement</Text>
                <SettingsTooltip tooltipKey="etablissement" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Informations visibles par vos clients</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.inlineRow}>
              <View style={styles.inlineFieldHalf}>
                <LabeledInput
                  label="Nom de l'établissement"
                  value={form.businessName}
                  onChange={(v) => updateField('businessName', v)}
                  placeholder="Nom affiché sur la page de réservation"
                />
              </View>
              <View style={styles.inlineFieldHalf}>
                <LabeledInput
                  label="Email de contact"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  placeholder="Email affiché sur la page"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={styles.inlineRow}>
              <View style={styles.inlineFieldHalf}>
                <LabeledInput
                  label="Téléphone"
                  value={form.phone}
                  onChange={(v) => updateField('phone', v)}
                  placeholder="N° de téléphone"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inlineFieldHalf}>
                <LabeledInput
                  label="Adresse"
                  value={form.address}
                  onChange={(v) => updateField('address', v)}
                  placeholder="Adresse"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Settings size={18} color="#64748B" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Contraintes de réservation</Text>
                <SettingsTooltip tooltipKey="contraintes" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Limites et délais pour les réservations</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.constraintsGrid}>
              <View style={styles.constraintItem}>
                <Text style={styles.constraintLabel}>Délai minimum</Text>
                <View style={styles.constraintInputRow}>
                  <TextInput
                    style={styles.constraintInput}
                    value={form.minNoticeHours}
                    onChangeText={(v) => updateField('minNoticeHours', v)}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.constraintUnit}>heures</Text>
                </View>
              </View>

              <View style={styles.constraintItem}>
                <Text style={styles.constraintLabel}>Réservation max à l'avance</Text>
                <View style={styles.constraintInputRow}>
                  <TextInput
                    style={styles.constraintInput}
                    value={form.maxAdvanceDays}
                    onChangeText={(v) => updateField('maxAdvanceDays', v)}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.constraintUnit}>jours</Text>
                </View>
              </View>

              <View style={styles.constraintItem}>
                <Text style={styles.constraintLabel}>Taille min du groupe</Text>
                <View style={styles.constraintInputRow}>
                  <TextInput
                    style={styles.constraintInput}
                    value={form.minPartySize}
                    onChangeText={(v) => updateField('minPartySize', v)}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.constraintUnit}>pers.</Text>
                </View>
              </View>

              <View style={styles.constraintItem}>
                <Text style={styles.constraintLabel}>Taille max du groupe</Text>
                <View style={styles.constraintInputRow}>
                  <TextInput
                    style={styles.constraintInput}
                    value={form.maxPartySize}
                    onChangeText={(v) => updateField('maxPartySize', v)}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.constraintUnit}>pers.</Text>
                </View>
              </View>
            </View>

            <View style={styles.inlineRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.constraintLabel}>Délai d'annulation</Text>
              </View>
              <View style={styles.constraintInputRow}>
                <TextInput
                  style={styles.constraintInput}
                  value={form.cancellationDeadlineHours}
                  onChangeText={(v) => updateField('cancellationDeadlineHours', v)}
                  keyboardType="number-pad"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.constraintUnit}>h avant</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Row 2: Notifications + Email */}
      <View style={[styles.row, isCompact && styles.rowCompact]}>
        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Bell size={18} color="#F59E0B" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Notifications & Rappels</Text>
                <SettingsTooltip tooltipKey="notifications" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Gérez vos alertes et rappels clients</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.groupLabel}>Notifications restaurateur</Text>
            <SettingSwitch
              label="Nouvelle réservation"
              description="Recevoir un email à chaque nouvelle réservation"
              value={form.notifyProfessionalOnNewReservation}
              onChange={(v) => updateField('notifyProfessionalOnNewReservation', v)}
            />
            <SettingSwitch
              label="Annulation"
              description="Recevoir un email quand un client annule"
              value={form.notifyProfessionalOnCancellation}
              onChange={(v) => updateField('notifyProfessionalOnCancellation', v)}
            />

            <View style={styles.divider} />

            <Text style={styles.groupLabel}>Rappels clients</Text>
            <SettingSwitch
              label="Rappels par email"
              description="Envoyer un email de rappel avant la réservation"
              value={form.reminderEnabled}
              onChange={(v) => updateField('reminderEnabled', v)}
            />

            {form.reminderEnabled && (
              <View style={styles.inlineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.constraintLabel}>Envoyer le rappel</Text>
                </View>
                <View style={styles.constraintInputRow}>
                  <TextInput
                    style={styles.constraintInput}
                    value={form.reminderHoursBefore}
                    onChangeText={(v) => updateField('reminderHoursBefore', v)}
                    keyboardType="number-pad"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.constraintUnit}>h avant</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconWrap}>
              <Mail size={18} color="#A855F7" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Personnalisation des emails</Text>
                <SettingsTooltip tooltipKey="emails" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Message ajouté dans les emails clients</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldHint}>
              Ce message sera inclus dans tous les emails envoyés aux clients (confirmation, rappel, annulation).
            </Text>
            <TextInput
              style={styles.textAreaInput}
              value={form.customEmailMessage}
              onChangeText={(v) => updateField('customEmailMessage', v.slice(0, 2000))}
              placeholder="Ex : Merci d'avoir réservé chez nous ! N'hésitez pas à nous contacter pour toute demande spéciale."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              maxLength={2000}
            />
            <Text style={styles.charCount}>{form.customEmailMessage.length} / 2000</Text>
          </View>
        </View>
      </View>

      {/* Row 3: Stripe Connect + Garantie no-show */}
      <View style={[styles.row, isCompact && styles.rowCompact]}>

        {/* Compte Stripe */}
        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#F0F0FF' }]}>
              <Link2 size={18} color="#6366F1" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Compte Stripe</Text>
                <SettingsTooltip tooltipKey="stripe" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Encaissez les frais no-show via Stripe</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            {isStripeActionLoading ? (
              <ActivityIndicator size="small" color="#6366F1" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <View style={styles.stripeStatusRow}>
                  <View style={[
                    styles.stripeStatusBadge,
                    isStripeFullyConnected && { backgroundColor: '#F0FDF4' },
                    isStripeProfileIncomplete && { backgroundColor: '#FFFBEB' },
                    !isStripeConnected && { backgroundColor: '#F1F5F9' },
                  ]}>
                    <View style={[
                      styles.stripeStatusDot,
                      isStripeFullyConnected && { backgroundColor: '#10B981' },
                      isStripeProfileIncomplete && { backgroundColor: '#F59E0B' },
                      !isStripeConnected && { backgroundColor: '#94A3B8' },
                    ]} />
                    <Text style={[
                      styles.stripeStatusText,
                      isStripeFullyConnected && { color: '#10B981' },
                      isStripeProfileIncomplete && { color: '#D97706' },
                      !isStripeConnected && { color: '#64748B' },
                    ]}>
                      {isStripeFullyConnected ? 'Connecté' : isStripeProfileIncomplete ? 'Profil incomplet' : 'Non connecté'}
                    </Text>
                  </View>
                </View>

                {isStripeConnected && stripe?.accountId && (
                  <Text style={styles.stripeAccountId}>ID : {stripe.accountId}</Text>
                )}

                {isStripeFullyConnected && (
                  <Pressable style={styles.stripeDisconnectButton} onPress={handleStripeDisconnect}>
                    <Text style={styles.stripeDisconnectText}>Déconnecter</Text>
                  </Pressable>
                )}

                {isStripeProfileIncomplete && (
                  <Pressable style={styles.stripeConnectButton} onPress={handleStripeConnect}>
                    <Text style={styles.stripeConnectText}>Compléter mon profil Stripe</Text>
                  </Pressable>
                )}

                {!isStripeConnected && (
                  <Pressable style={styles.stripeConnectButton} onPress={handleStripeConnect}>
                    <Text style={styles.stripeConnectText}>Relier mon compte Stripe</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        {/* Garantie no-show */}
        <View style={[styles.section, !isCompact && styles.sectionHalf]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Shield size={18} color="#F97316" />
            </View>
            <View>
              <View style={tooltipStyles.titleRow}>
                <Text style={styles.sectionTitle}>Garantie no-show</Text>
                <SettingsTooltip tooltipKey="noshow" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.sectionSubtitle}>Protégez-vous contre les absences</Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <SettingSwitch
              label="Empreinte CB requise"
              description="Demander une carte bancaire pour confirmer la réservation"
              value={form.requireCardGuarantee}
              onChange={(v) => updateField('requireCardGuarantee', v)}
            />

            {form.requireCardGuarantee && !isStripeConnected && (
              <View style={styles.stripeWarning}>
                <Text style={styles.stripeWarningText}>
                  Reliez d'abord votre compte Stripe pour activer cette fonctionnalité.
                </Text>
              </View>
            )}

            {form.requireCardGuarantee && (
              <>
                <View style={styles.divider} />
                <View style={styles.inlineRow}>
                  <View style={styles.inlineFieldHalf}>
                    <Text style={styles.fieldLabel}>Montant en cas de no-show</Text>
                    <View style={styles.amountInputRow}>
                      <TextInput
                        style={[styles.textInput, { flex: 1 }]}
                        value={form.noShowFeeAmountEur}
                        onChangeText={(v) => updateField('noShowFeeAmountEur', v.replace(',', '.'))}
                        placeholder="00.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="decimal-pad"
                      />
                      <Text style={styles.constraintUnit}>€</Text>
                    </View>
                  </View>
                  <View style={styles.inlineFieldHalf}>
                    <Text style={styles.fieldLabel}>Devise</Text>
                    <StyledSelect
                      value={form.noShowFeeCurrency}
                      onChange={(v) => updateField('noShowFeeCurrency', v)}
                      options={[{ label: 'EUR — Euro', value: 'eur' }]}
                      disabled
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

// === Sub-components ===

interface SelectOption { label: string; value: string; }

function StyledSelect({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: SelectOption[]; disabled?: boolean }) {
  if (Platform.OS === 'web') {
    if (disabled) {
      const label = options.find(o => o.value === value)?.label ?? value;
      return (
        <View style={{ height: 38, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 10, justifyContent: 'center' }}>
          <Text style={{ fontSize: 13, color: '#64748B' }}>{label}</Text>
        </View>
      );
    }
    return (
      <View style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{ height: 38, width: '100%', paddingLeft: 10, paddingRight: 32, fontSize: 13, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', appearance: 'none', cursor: 'pointer' } as any}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={{ position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' } as any}>
          <ChevronDown size={14} color="#64748B" />
        </View>
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC', overflow: 'hidden' }}>
      <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled} style={{ height: 40 }}>
        {options.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>
    </View>
  );
}

function LabeledInput({ label, value, onChange, placeholder, keyboardType, autoCapitalize }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.labeledInputContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
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
  contentContainer: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: '#64748B' },
  saveButton: {
    backgroundColor: '#2A2E33',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      overflow: 'visible',
    }),
  },
  rowCompact: {
    flexDirection: 'column',
  },
  sectionHalf: {
    flex: 1,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    zIndex: 10,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Field groups
  fieldGroup: {
    gap: 12,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },

  // Labeled input
  labeledInputContainer: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  inlineFieldHalf: {
    flex: 1,
  },

  // Constraints grid (2x2)
  constraintsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  constraintItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  constraintLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  constraintInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  constraintInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    width: 64,
    textAlign: 'center',
  },
  constraintUnit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Switch
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchInfo: { flex: 1, marginRight: 16 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  switchDescription: { fontSize: 12, color: '#94A3B8' },

  // Text area
  fieldHint: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },
  textAreaInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 130,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 4 },

  // Stripe Connect
  stripeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stripeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stripeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stripeStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stripeAccountId: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  stripeConnectButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  stripeConnectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stripeDisconnectButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  stripeDisconnectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  stripeWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stripeWarningText: {
    fontSize: 13,
    color: '#D97706',
  },

  // No-show fee
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: 8,
      fontSize: 13,
      borderWidth: 0,
    }),
  },
});

// === Tooltip ===

function SettingsTooltip({ tooltipKey, visible, onToggle }: { tooltipKey: string; visible: string | null; onToggle: (key: string | null) => void }) {
  const isVisible = visible === tooltipKey;
  const tooltip = SETTINGS_TOOLTIPS[tooltipKey];
  if (!tooltip) return null;
  return (
    <View style={{ position: 'relative', zIndex: 9999 }}>
      <Pressable onPress={() => onToggle(isVisible ? null : tooltipKey)} style={tooltipStyles.tooltipBtn}>
        <Info size={15} color={isVisible ? '#3B82F6' : '#94A3B8'} />
      </Pressable>
      {isVisible && (
        <>
          <Pressable style={tooltipStyles.overlay} onPress={() => onToggle(null)} />
          <View style={tooltipStyles.tooltipBubble}>
            <Text style={tooltipStyles.tooltipTitle}>{tooltip.title}</Text>
            {tooltip.items.map((item, i) => (
              <View key={i} style={tooltipStyles.tooltipItem}>
                <Text style={tooltipStyles.tooltipBullet}>•</Text>
                <Text style={tooltipStyles.tooltipText}>{item}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const tooltipStyles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    zIndex: 9999,
  },
  overlay: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  tooltipBtn: {
    padding: 2,
    borderRadius: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  tooltipBubble: {
    position: 'absolute',
    top: 28,
    left: -8,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: 320,
    gap: 6,
    zIndex: 9999,
    elevation: 20,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      overflow: 'visible',
    } as any),
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tooltipItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  tooltipBullet: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginTop: 1,
  },
  tooltipText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    flex: 1,
  },
});
