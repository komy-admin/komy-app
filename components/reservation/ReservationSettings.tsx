import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch, ActivityIndicator, Platform, ScrollView, useWindowDimensions, Linking } from 'react-native';
import { Store, Settings, Bell, Mail, Info, Link2, Shield, ChevronDown, Copy, ExternalLink } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
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
    getStripeDashboardLink: () => Promise<{ url: string }>;
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
      'Créez votre compte Stripe pour encaisser les frais no-show depuis Komy.',
      'Une fois connecté, activez l\'empreinte bancaire dans le bloc "Garantie no-show".',
      'Depuis votre tableau de bord Stripe, vous pouvez suivre vos versements, modifier votre RIB et télécharger vos justificatifs fiscaux.',
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
  const isNarrow = width < 720;
  const isWide = width >= 1100;

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
      const apiError = error?.response?.data?.error;
      const message = typeof apiError === 'string' ? apiError : apiError?.message || 'Erreur lors de la sauvegarde';
      showToast(message, 'error');
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
      const apiError = error?.response?.data?.error;
      const message = typeof apiError === 'string' ? apiError : apiError?.message || 'Erreur de connexion Stripe';
      showToast(message, 'error');
      setIsStripeActionLoading(false);
    }
  };

  const handleStripeDashboard = async () => {
    setIsStripeActionLoading(true);
    try {
      const { url } = await reservation.getStripeDashboardLink();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(url);
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      const message = typeof apiError === 'string' ? apiError : apiError?.message || 'Impossible d\'ouvrir le tableau de bord Stripe';
      showToast(message, 'error');
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

  const slug = reservation.profile?.slug;
  const bookingUrl = slug ? `${process.env.EXPO_PUBLIC_RESERVATION_API_URL}/book/${slug}` : null;

  const handleCopyBookingUrl = async () => {
    if (!bookingUrl) return;
    try {
      await Clipboard.setStringAsync(bookingUrl);
      showToast('Lien copié', 'success');
    } catch {
      showToast('Impossible de copier le lien', 'error');
    }
  };

  const handleOpenBookingUrl = async () => {
    if (!bookingUrl) return;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(bookingUrl, '_blank', 'noopener,noreferrer');
      } else {
        await Linking.openURL(bookingUrl);
      }
    } catch {
      showToast('Impossible d\'ouvrir le lien', 'error');
    }
  };

  const stripe = reservation.stripeStatus;
  const isNotConnected = !stripe?.connected;
  const isOnboarding = !!stripe?.connected && !stripe?.onboardingComplete;
  const isFullyConnected = !!stripe?.connected && !!stripe?.onboardingComplete;

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.tabTitle}>Paramètres</Text>
          <Text style={styles.tabSubtitle}>Configurez le comportement de votre système de réservation</Text>
        </View>
        {hasChanges && (
          <Pressable
            style={[styles.createButton, { backgroundColor: '#2A2E33' }, isSaving && styles.createButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.createButtonText}>
              {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Établissement + Contraintes (côte-à-côte sur écran large) */}
        <View style={isWide ? styles.cardsRow : undefined}>
          {/* Établissement */}
          <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Store size={24} color="#3B82F6" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.viewCardTitle}>Établissement</Text>
                  <SettingsTooltip tooltipKey="etablissement" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.viewCardDescription}>Informations visibles par vos clients</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={[styles.inlineRow, isNarrow && styles.inlineRowStacked]}>
                <LabeledInput
                  label="Nom de l'établissement"
                  value={form.businessName}
                  onChange={(v) => updateField('businessName', v)}
                  placeholder="Nom affiché sur la page"
                />
                <LabeledInput
                  label="Email de contact"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  placeholder="Email affiché"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inlineRow, isNarrow && styles.inlineRowStacked]}>
                <LabeledInput
                  label="Téléphone"
                  value={form.phone}
                  onChange={(v) => updateField('phone', v)}
                  placeholder="N° de téléphone"
                  keyboardType="phone-pad"
                />
                <LabeledInput
                  label="Adresse"
                  value={form.address}
                  onChange={(v) => updateField('address', v)}
                  placeholder="Adresse"
                />
              </View>

              {bookingUrl && (
                <View>
                  <Text style={styles.fieldLabel}>Lien de votre page de réservation</Text>
                  <View style={styles.bookingUrlRow}>
                    <Text style={styles.bookingUrlText} numberOfLines={1} selectable>
                      {bookingUrl}
                    </Text>
                    <Pressable
                      style={styles.bookingUrlIconBtn}
                      onPress={handleCopyBookingUrl}
                      accessibilityLabel="Copier le lien"
                    >
                      <Copy size={16} color="#475569" />
                    </Pressable>
                    <Pressable
                      style={styles.bookingUrlIconBtn}
                      onPress={handleOpenBookingUrl}
                      accessibilityLabel="Ouvrir le lien"
                    >
                      <ExternalLink size={16} color="#475569" />
                    </Pressable>
                  </View>
                  <Text style={styles.helpText}>
                    Partagez ce lien avec vos clients pour qu'ils réservent en ligne.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Contraintes */}
          <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
                <Settings size={24} color="#64748B" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.viewCardTitle}>Contraintes de réservation</Text>
                  <SettingsTooltip tooltipKey="contraintes" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.viewCardDescription}>Limites et délais pour les réservations</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <View style={styles.constraintsGrid}>
                <ConstraintItem
                  label="Délai minimum"
                  value={form.minNoticeHours}
                  onChange={(v) => updateField('minNoticeHours', v)}
                  unit="heures"
                  isNarrow={isNarrow}
                />
                <ConstraintItem
                  label="Réservation max à l'avance"
                  value={form.maxAdvanceDays}
                  onChange={(v) => updateField('maxAdvanceDays', v)}
                  unit="jours"
                  isNarrow={isNarrow}
                />
                <ConstraintItem
                  label="Taille min du groupe"
                  value={form.minPartySize}
                  onChange={(v) => updateField('minPartySize', v)}
                  unit="pers."
                  isNarrow={isNarrow}
                />
                <ConstraintItem
                  label="Taille max du groupe"
                  value={form.maxPartySize}
                  onChange={(v) => updateField('maxPartySize', v)}
                  unit="pers."
                  isNarrow={isNarrow}
                />
                <ConstraintItem
                  label="Délai d'annulation"
                  value={form.cancellationDeadlineHours}
                  onChange={(v) => updateField('cancellationDeadlineHours', v)}
                  unit="h avant"
                  isNarrow={isNarrow}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Notifications + Emails (côte-à-côte sur écran large) */}
        <View style={isWide ? styles.cardsRow : undefined}>
          {/* Notifications & Rappels */}
          <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                <Bell size={24} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.viewCardTitle}>Notifications & Rappels</Text>
                  <SettingsTooltip tooltipKey="notifications" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.viewCardDescription}>Gérez vos alertes et rappels clients</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
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
                <View style={styles.constraintsGrid}>
                  <ConstraintItem
                    label="Envoyer le rappel"
                    value={form.reminderHoursBefore}
                    onChange={(v) => updateField('reminderHoursBefore', v)}
                    unit="h avant"
                    isNarrow={isNarrow}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Emails */}
          <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <Mail size={24} color="#A855F7" strokeWidth={2} />
              </View>
              <View style={styles.viewCardContent}>
                <View style={styles.titleRow}>
                  <Text style={styles.viewCardTitle}>Personnalisation des emails</Text>
                  <SettingsTooltip tooltipKey="emails" visible={visibleTooltip} onToggle={setVisibleTooltip} />
                </View>
                <Text style={styles.viewCardDescription}>Message ajouté dans les emails clients</Text>
              </View>
            </View>

            <View style={styles.viewModeSection}>
              <Text style={styles.helpText}>
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

        {/* Stripe + Garantie no-show (côte-à-côte sur écran large) */}
        <View style={isWide ? styles.cardsRow : undefined}>
        {/* Stripe */}
        <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
          <View style={styles.viewCardHeader}>
            <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Link2 size={24} color="#6366F1" strokeWidth={2} />
            </View>
            <View style={styles.viewCardContent}>
              <View style={styles.titleRow}>
                <Text style={styles.viewCardTitle}>Compte Stripe</Text>
                <SettingsTooltip tooltipKey="stripe" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.viewCardDescription}>Encaissez les frais no-show via Stripe</Text>
            </View>
          </View>

          <View style={styles.viewModeSection}>
            {isStripeActionLoading ? (
              <ActivityIndicator size="small" color="#6366F1" style={{ alignSelf: 'flex-start' }} />
            ) : (
              <>
                <View style={styles.stripeStatusRow}>
                  <View style={[
                    styles.stripeStatusBadge,
                    isFullyConnected && { backgroundColor: '#F0FDF4' },
                    isOnboarding && { backgroundColor: '#FFFBEB' },
                    isNotConnected && { backgroundColor: '#F1F5F9' },
                  ]}>
                    <View style={[
                      styles.stripeStatusDot,
                      isFullyConnected && { backgroundColor: '#10B981' },
                      isOnboarding && { backgroundColor: '#F59E0B' },
                      isNotConnected && { backgroundColor: '#94A3B8' },
                    ]} />
                    <Text style={[
                      styles.stripeStatusText,
                      isFullyConnected && { color: '#10B981' },
                      isOnboarding && { color: '#D97706' },
                      isNotConnected && { color: '#64748B' },
                    ]}>
                      {isFullyConnected ? 'Connecté' : isOnboarding ? 'Onboarding en cours' : 'Non connecté'}
                    </Text>
                  </View>
                </View>

                {isFullyConnected && stripe?.accountId && (
                  <Text style={styles.stripeAccountId}>ID : {stripe.accountId}</Text>
                )}

                {isOnboarding && stripe?.requirementsDue && stripe.requirementsDue.length > 0 && (
                  <View style={styles.stripeWarning}>
                    <Text style={styles.stripeWarningText}>
                      Stripe attend encore : {formatRequirements(stripe.requirementsDue)}
                    </Text>
                  </View>
                )}

                {isFullyConnected && (
                  <Pressable style={styles.stripeConnectButton} onPress={handleStripeDashboard}>
                    <Text style={styles.stripeConnectText}>Accéder à mon tableau de bord Stripe</Text>
                  </Pressable>
                )}

                {isOnboarding && (
                  <Pressable style={styles.stripeConnectButton} onPress={handleStripeConnect}>
                    <Text style={styles.stripeConnectText}>Compléter mon profil Stripe</Text>
                  </Pressable>
                )}

                {isNotConnected && (
                  <Pressable style={styles.stripeConnectButton} onPress={handleStripeConnect}>
                    <Text style={styles.stripeConnectText}>Créer mon compte Stripe</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </View>

        {/* Garantie no-show */}
        <View style={[styles.viewCard, isWide && styles.cardsRowItem]}>
          <View style={styles.viewCardHeader}>
            <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <Shield size={24} color="#F97316" strokeWidth={2} />
            </View>
            <View style={styles.viewCardContent}>
              <View style={styles.titleRow}>
                <Text style={styles.viewCardTitle}>Garantie no-show</Text>
                <SettingsTooltip tooltipKey="noshow" visible={visibleTooltip} onToggle={setVisibleTooltip} />
              </View>
              <Text style={styles.viewCardDescription}>Protégez-vous contre les absences</Text>
            </View>
            <Switch
              value={form.requireCardGuarantee}
              onValueChange={(v) => updateField('requireCardGuarantee', v)}
              trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              thumbColor={form.requireCardGuarantee ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          {form.requireCardGuarantee && (
            <View style={styles.viewModeSection}>
              <Text style={styles.helpText}>
                Demander une carte bancaire pour confirmer la réservation. En cas de no-show, vous pourrez débiter le montant configuré.
              </Text>

              {!isFullyConnected && (
                <View style={styles.stripeWarning}>
                  <Text style={styles.stripeWarningText}>
                    Reliez d'abord votre compte Stripe pour activer cette fonctionnalité.
                  </Text>
                </View>
              )}

              <View style={[styles.inlineRow, isNarrow && styles.inlineRowStacked]}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fieldLabel}>Montant en cas de no-show</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      value={form.noShowFeeAmountEur}
                      onChangeText={(v) => updateField('noShowFeeAmountEur', v.replace(',', '.'))}
                      placeholder="00.00"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputSuffix}>€</Text>
                  </View>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.fieldLabel}>Devise</Text>
                  <StyledSelect
                    value={form.noShowFeeCurrency}
                    onChange={(v) => updateField('noShowFeeCurrency', v)}
                    options={[{ label: 'EUR — Euro', value: 'eur' }]}
                    disabled
                  />
                </View>
              </View>
            </View>
          )}
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

// === Helpers ===

// Map des clés Stripe `requirements.currently_due` vers des libellés FR lisibles.
// Stripe renvoie des chemins comme `individual.verification.document`, `external_account`,
// `business_profile.url`, etc. Liste des clés standard : https://stripe.com/docs/connect/required-verification-information
const REQUIREMENT_LABELS: Record<string, string> = {
  'external_account': 'compte bancaire',
  'business_profile.url': 'site web ou page Instagram',
  'business_profile.mcc': 'type d\'activité',
  'business_profile.product_description': 'description de l\'activité',
  'individual.verification.document': 'pièce d\'identité',
  'individual.verification.additional_document': 'justificatif complémentaire',
  'individual.first_name': 'prénom',
  'individual.last_name': 'nom',
  'individual.dob.day': 'date de naissance',
  'individual.dob.month': 'date de naissance',
  'individual.dob.year': 'date de naissance',
  'individual.address.line1': 'adresse',
  'individual.address.city': 'ville',
  'individual.address.postal_code': 'code postal',
  'individual.email': 'email',
  'individual.phone': 'numéro de téléphone',
  'individual.id_number': 'numéro d\'identification',
  'tos_acceptance.date': 'acceptation des CGU',
  'tos_acceptance.ip': 'acceptation des CGU',
  'company.tax_id': 'numéro SIRET',
  'company.name': 'raison sociale',
  'company.address.line1': 'adresse de la société',
  'company.verification.document': 'justificatif de la société',
};

function formatRequirements(keys: string[]): string {
  const labels = keys.map((k) => REQUIREMENT_LABELS[k] ?? k.replace(/_/g, ' '));
  const unique = Array.from(new Set(labels));
  return unique.join(', ');
}

// === Sub-components ===

interface SelectOption { label: string; value: string; }

function StyledSelect({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: SelectOption[]; disabled?: boolean }) {
  if (Platform.OS === 'web') {
    if (disabled) {
      const label = options.find(o => o.value === value)?.label ?? value;
      return (
        <View style={{ height: 42, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC', paddingHorizontal: 12, justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, color: '#64748B' }}>{label}</Text>
        </View>
      );
    }
    return (
      <View style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          style={{ height: 42, width: '100%', paddingLeft: 12, paddingRight: 32, fontSize: 14, color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none', appearance: 'none', cursor: 'pointer' } as any}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <View style={{ position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' } as any}>
          <ChevronDown size={14} color="#64748B" />
        </View>
      </View>
    );
  }
  return (
    <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled} style={{ height: 42 }}>
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
        style={styles.textInputBlock}
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

function ConstraintItem({ label, value, onChange, unit, isNarrow }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  isNarrow?: boolean;
}) {
  return (
    <View style={[styles.constraintItem, isNarrow && styles.constraintItemFull]}>
      <Text style={styles.constraintLabel} numberOfLines={2}>{label}</Text>
      <View style={styles.constraintInputRow}>
        <TextInput
          style={styles.constraintInput}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.constraintUnit}>{unit}</Text>
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
        trackColor={{ false: '#D1D5DB', true: '#10B981' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  // ── Page wrapper (iso notifications.tsx) ──────────────────────────────
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },

  // ── Grid wrapper (cards côte-à-côte) ──────────────────────────────────
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
  },
  cardsRowItem: {
    flex: 1,
    minWidth: 0,
  },

  // ── viewCard (iso) ────────────────────────────────────────────────────
  viewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewCardContent: {
    flex: 1,
    minWidth: 0,
  },
  viewCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  viewCardDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    position: 'relative',
    zIndex: 9999,
  },

  // ── Body section under header ─────────────────────────────────────────
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 16,
  },

  // ── Help text / labels ────────────────────────────────────────────────
  helpText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },

  // ── Inline row ────────────────────────────────────────────────────────
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inlineRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },

  // ── Labeled input ─────────────────────────────────────────────────────
  labeledInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  textInputBlock: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },

  // ── Booking URL row ───────────────────────────────────────────────────
  bookingUrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  bookingUrlText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  bookingUrlIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },

  // ── Amount input wrapper ──────────────────────────────────────────────
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginLeft: 8,
  },

  // ── Constraints grid (cards) ──────────────────────────────────────────
  constraintsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  constraintItem: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minWidth: 180,
  },
  constraintItemFull: {
    flexBasis: '100%',
    minWidth: 0,
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
    gap: 8,
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
    flex: 1,
  },

  // ── Switch ────────────────────────────────────────────────────────────
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  switchInfo: { flex: 1, minWidth: 0 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  switchDescription: { fontSize: 12, color: '#94A3B8' },

  // ── Textarea ──────────────────────────────────────────────────────────
  textAreaInput: {
    backgroundColor: '#FFFFFF',
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
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right' },

  // ── Stripe ────────────────────────────────────────────────────────────
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
