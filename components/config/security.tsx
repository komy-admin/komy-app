import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Platform, Keyboard } from 'react-native';
import { KeyboardAwareScrollViewWrapper } from '~/components/Keyboard';
import { ShieldCheck, Smartphone, Mail, Monitor } from 'lucide-react-native';
import { authApiService } from '~/api/auth.api';
import { useToast } from '~/components/ToastProvider';
import type { ToastType } from '~/components/ui/toast';
import type { TrustedDevice } from '~/types/auth.types';
import { getDeviceId } from '~/lib/deviceId';
import { QRCode } from '~/components/ui/QRCode';
import PinInput from '~/components/ui/pin-input';
import * as Clipboard from 'expo-clipboard';
import { useAccountConfig } from '~/hooks/useAccountConfig';

type SecurityTab = '2fa-account' | 'devices';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<SecurityTab>('2fa-account');
  const [isCompactSidebar, setIsCompactSidebar] = useState(false);
  const { showToast } = useToast();

  const handleLayoutChange = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    setIsCompactSidebar(width < 700);
  }, []);

  return (
    <View style={styles.container} onLayout={handleLayoutChange}>
      <View style={styles.content}>
        {/* Sidebar Navigation */}
        <View style={[styles.sidebar, isCompactSidebar && styles.sidebarCompact]}>
          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === '2fa-account' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('2fa-account')}
            activeOpacity={1}
          >
            <ShieldCheck size={20} color={activeTab === '2fa-account' ? '#475569' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === '2fa-account' && styles.sidebarTabTextActive]}>
                2FA
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sidebarTab,
              isCompactSidebar && styles.sidebarTabCompact,
              activeTab === 'devices' && styles.sidebarTabActive
            ]}
            onPress={() => setActiveTab('devices')}
            activeOpacity={1}
          >
            <Monitor size={20} color={activeTab === 'devices' ? '#475569' : '#64748B'} strokeWidth={2} />
            {!isCompactSidebar && (
              <Text style={[styles.sidebarTabText, activeTab === 'devices' && styles.sidebarTabTextActive]}>
                Appareils
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {activeTab === '2fa-account' && (
            <TwoFactorTab showToast={showToast} />
          )}
          {activeTab === 'devices' && (
            <AccountDevicesTab showToast={showToast} />
          )}
        </View>
      </View>
    </View>
  );
}

// ====================================================================
// Two-Factor Authentication Tab (account-level)
// ====================================================================

interface TwoFactorTabProps {
  showToast: (message: string, type?: ToastType) => void;
}

type TwoFactorSetup = { method: 'totp' | 'email'; qrCodeUrl?: string; secret?: string } | null;
type DisablingMethod = 'totp' | 'email' | null;

const TwoFactorTab: React.FC<TwoFactorTabProps> = ({ showToast }) => {
  const { config, loadConfig } = useAccountConfig();

  // Derive totp/email status from accountConfig.twoFactorMethod in Redux
  const twoFactorMethod = config?.twoFactorMethod ?? null;
  const status = {
    enabled: config?.twoFactorEnabled ?? false,
    totp: twoFactorMethod === 'totp' || twoFactorMethod === 'both',
    email: twoFactorMethod === 'email' || twoFactorMethod === 'both',
  };

  const [isLoading, setIsLoading] = useState(false);
  const [setup, setSetup] = useState<TwoFactorSetup>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablingMethod, setDisablingMethod] = useState<DisablingMethod>(null);
  const [disableVia, setDisableVia] = useState<'totp' | 'email'>('totp');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSetup = async (method: 'totp' | 'email') => {
    setIsLoading(true);
    try {
      const res = await authApiService.setupTwoFactor(method);
      if (method === 'totp') {
        setSetup({ method: 'totp', qrCodeUrl: res.qrCodeUrl, secret: res.secret });
      } else {
        setSetup({ method: 'email' });
        setEmailCooldown(30);
        showToast('Code envoyé par email', 'success');
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Erreur lors de la configuration', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!setup || verifyCode.length !== 6) return;
    setIsLoading(true);
    try {
      await authApiService.verifyAndEnableTwoFactor(setup.method, verifyCode);
      await loadConfig();
      setSetup(null);
      setVerifyCode('');
      showToast(`${setup.method === 'totp' ? 'TOTP' : 'Email'} activé pour la 2FA`, 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Code invalide', 'error');
      setVerifyCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!disablingMethod || disableCode.length !== 6) return;
    setIsDisabling(true);
    try {
      await authApiService.disableTwoFactor(disablingMethod, disableCode, disableVia);
      setDisableCode('');
      setDisablingMethod(null);
      await loadConfig();
      showToast(`${disablingMethod === 'totp' ? 'TOTP' : 'Email'} désactivé pour la 2FA`, 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Code invalide', 'error');
      setDisableCode('');
    } finally {
      setIsDisabling(false);
    }
  };

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setTimeout(() => setEmailCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  const handleSendEmailCode = async () => {
    setIsSendingEmail(true);
    try {
      await authApiService.sendTwoFactorEmailCode();
      setEmailCooldown(30);
      showToast('Code envoyé par email', 'success');
    } catch {
      showToast('Erreur lors de l\'envoi', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopySecret = async (secret: string) => {
    await Clipboard.setStringAsync(secret);
    showToast('Clé copiée', 'success');
    // Auto-clear clipboard after 30s for security
    setTimeout(() => {
      Clipboard.setStringAsync('');
    }, 30000);
  };

  // Setup flow
  if (setup) {
    return (
      <KeyboardAwareScrollViewWrapper style={styles.tabContent} contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false} bottomOffset={40} keyboardShouldPersistTaps="handled">
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          <View style={styles.tabHeader}>
            <View>
              <Text style={styles.tabTitle}>
                {setup.method === 'totp' ? 'Configurer TOTP' : 'Configurer Email'}
              </Text>
              <Text style={styles.tabSubtitle}>
                {setup.method === 'totp'
                  ? 'Scannez le QR code avec votre application'
                  : 'Un code a été envoyé à votre email'}
              </Text>
            </View>
          </View>
          <View style={styles.viewCard}>
            <View style={[styles.viewModeSection, { alignItems: 'center', borderTopWidth: 0, marginTop: 0 }]}>
              {setup.method === 'totp' && (
                <>
                  {setup.qrCodeUrl ? <QRCode value={setup.qrCodeUrl} size={180} /> : null}
                  {setup.secret ? (
                    <TouchableOpacity style={twoFaStyles.secretBadge} onPress={() => handleCopySecret(setup.secret!)} activeOpacity={0.7}>
                      <Text style={twoFaStyles.secretText}>Clé : {setup.secret}</Text>
                      <Text style={twoFaStyles.secretCopyHint}>Copier</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
              <Text style={twoFaStyles.verifyLabel}>
                {setup.method === 'totp'
                  ? 'Entrez le code pour vérifier :'
                  : 'Entrez le code reçu par email :'}
              </Text>
              <View style={twoFaStyles.pinWrapper}>
                <PinInput
                  length={6}
                  value={verifyCode}
                  onChange={setVerifyCode}
                  secure={false}
                  disabled={isLoading}
                  autoFocus={false}
                />
              </View>
              {setup.method === 'email' && (
                <TouchableOpacity
                  style={twoFaStyles.sendEmailLink}
                  onPress={handleSendEmailCode}
                  disabled={emailCooldown > 0 || isSendingEmail}
                >
                  <Text style={[twoFaStyles.sendEmailLinkText, (emailCooldown > 0 || isSendingEmail) && { opacity: 0.5 }]}>
                    {isSendingEmail ? 'Envoi...' : emailCooldown > 0 ? `Renvoyer le code (${emailCooldown}s)` : 'Renvoyer le code par email'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[twoFaStyles.verifyButton, (verifyCode.length !== 6 || isLoading) && twoFaStyles.verifyButtonDisabled]}
                onPress={handleVerify}
                disabled={verifyCode.length !== 6 || isLoading}
              >
                <Text style={twoFaStyles.verifyButtonText}>
                  {isLoading ? 'Vérification...' : 'Vérifier et activer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={twoFaStyles.backLink}
                onPress={() => { setSetup(null); setVerifyCode(''); setEmailCooldown(0); }}
              >
                <Text style={twoFaStyles.backLinkText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>
    );
  }

  // Disable flow
  if (disablingMethod) {
    const otherMethodActive = disablingMethod === 'totp' ? status.email : status.totp;
    const isViaEmail = disableVia === 'email';
    return (
      <KeyboardAwareScrollViewWrapper style={styles.tabContent} contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false} bottomOffset={40} keyboardShouldPersistTaps="handled">
        <Pressable style={{ flex: 1 }} onPress={() => { if (Platform.OS !== 'web') Keyboard.dismiss(); }}>
          <View style={styles.tabHeader}>
            <View>
              <Text style={styles.tabTitle}>Désactiver {disablingMethod === 'totp' ? 'TOTP' : 'Email'}</Text>
              <Text style={styles.tabSubtitle}>
                {isViaEmail ? 'Vérification par email' : 'Vérification par application'}
              </Text>
            </View>
          </View>
          <View style={styles.viewCard}>
            <View style={[styles.viewModeSection, { alignItems: 'center', borderTopWidth: 0, marginTop: 0 }]}>
              <Text style={twoFaStyles.verifyLabel}>
                {isViaEmail
                  ? 'Entrez le code reçu par email :'
                  : 'Entrez le code de votre application :'}
              </Text>
              <View style={twoFaStyles.pinWrapper}>
                <PinInput
                  length={6}
                  value={disableCode}
                  onChange={setDisableCode}
                  secure={false}
                  disabled={isDisabling}
                  autoFocus={false}
                />
              </View>
              {isViaEmail && (
                <TouchableOpacity
                  style={twoFaStyles.sendEmailLink}
                  onPress={handleSendEmailCode}
                  disabled={emailCooldown > 0 || isSendingEmail}
                >
                  <Text style={[twoFaStyles.sendEmailLinkText, (emailCooldown > 0 || isSendingEmail) && { opacity: 0.5 }]}>
                    {isSendingEmail ? 'Envoi...' : emailCooldown > 0 ? `Renvoyer le code (${emailCooldown}s)` : 'Renvoyer le code par email'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[twoFaStyles.disableButton, (disableCode.length !== 6 || isDisabling) && twoFaStyles.disableButtonDisabled]}
                onPress={handleDisable}
                disabled={disableCode.length !== 6 || isDisabling}
              >
                <Text style={twoFaStyles.disableButtonText}>
                  {isDisabling ? 'Désactivation...' : 'Désactiver'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={twoFaStyles.backLink}
                onPress={() => { setDisablingMethod(null); setDisableCode(''); setEmailCooldown(0); }}
              >
                <Text style={twoFaStyles.backLinkText}>Annuler</Text>
              </TouchableOpacity>
              {otherMethodActive && (
                <TouchableOpacity
                  style={twoFaStyles.switchMethodLink}
                  onPress={() => {
                    setDisableVia(isViaEmail ? 'totp' : 'email');
                    setDisableCode('');
                    setEmailCooldown(0);
                    if (!isViaEmail) handleSendEmailCode();
                  }}
                >
                  <Text style={twoFaStyles.switchMethodLinkText}>
                    {isViaEmail ? 'Problème ? Utiliser l\'application TOTP' : 'Problème ? Utiliser la vérification par email'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </KeyboardAwareScrollViewWrapper>
    );
  }

  // Main view
  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Protection appareils</Text>
          <Text style={styles.tabSubtitle}>Chaque connexion depuis un nouvel appareil nécessitera une vérification</Text>
        </View>
      </View>

      <ScrollView style={styles.viewsScrollContainer} contentContainerStyle={styles.viewsContainer} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.viewsCardsWrapper}>
          {/* TOTP Card */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(71, 85, 105, 0.08)' }]}>
                <Smartphone size={24} color="#475569" strokeWidth={2} />
              </View>
              <View style={[styles.viewCardContent, { flex: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.viewCardTitle}>Application (TOTP)</Text>
                  {status.totp ? (
                    <View style={twoFaStyles.activeBadge}>
                      <View style={twoFaStyles.activeDot} />
                      <Text style={twoFaStyles.activeBadgeText}>Actif</Text>
                    </View>
                  ) : (
                    <View style={twoFaStyles.inactiveBadge}>
                      <View style={twoFaStyles.inactiveDot} />
                      <Text style={twoFaStyles.inactiveBadgeText}>Inactif</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.viewCardDescription}>
                  Google Authenticator, Authy ou similaire
                </Text>
              </View>
            </View>
            <View style={styles.viewModeSection}>
              {status.totp ? (
                <TouchableOpacity
                  style={[twoFaStyles.disableButton, { marginTop: 0 }]}
                  onPress={() => { setDisablingMethod('totp'); setDisableVia('totp'); setDisableCode(''); setEmailCooldown(0); }}
                >
                  <Text style={twoFaStyles.disableButtonText}>Désactiver TOTP</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={twoFaStyles.enableButton}
                  onPress={() => handleSetup('totp')}
                  disabled={isLoading}
                >
                  <Text style={twoFaStyles.enableButtonText}>
                    {isLoading ? 'Chargement...' : 'Activer TOTP'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Email Card */}
          <View style={styles.viewCard}>
            <View style={styles.viewCardHeader}>
              <View style={[styles.viewIconWrapper, { backgroundColor: 'rgba(71, 85, 105, 0.08)' }]}>
                <Mail size={24} color="#475569" strokeWidth={2} />
              </View>
              <View style={[styles.viewCardContent, { flex: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.viewCardTitle}>Email</Text>
                  {status.email ? (
                    <View style={twoFaStyles.activeBadge}>
                      <View style={twoFaStyles.activeDot} />
                      <Text style={twoFaStyles.activeBadgeText}>Actif</Text>
                    </View>
                  ) : (
                    <View style={twoFaStyles.inactiveBadge}>
                      <View style={twoFaStyles.inactiveDot} />
                      <Text style={twoFaStyles.inactiveBadgeText}>Inactif</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.viewCardDescription}>
                  Code envoyé par email à l'administrateur
                </Text>
              </View>
            </View>
            <View style={styles.viewModeSection}>
              {status.email ? (
                <TouchableOpacity
                  style={[twoFaStyles.disableButton, { marginTop: 0 }]}
                  onPress={() => { setDisablingMethod('email'); setDisableVia('email'); setDisableCode(''); setEmailCooldown(0); handleSendEmailCode(); }}
                >
                  <Text style={twoFaStyles.disableButtonText}>Désactiver Email</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={twoFaStyles.enableButton}
                  onPress={() => handleSetup('email')}
                  disabled={isLoading}
                >
                  <Text style={twoFaStyles.enableButtonText}>
                    {isLoading ? 'Chargement...' : 'Activer Email'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
};

// ====================================================================
// Account Devices Tab
// ====================================================================

interface AccountDevicesTabProps {
  showToast: (message: string, type?: ToastType) => void;
}

const AccountDevicesTab: React.FC<AccountDevicesTabProps> = ({ showToast }) => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localDeviceId, setLocalDeviceId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
    getDeviceId().then(setLocalDeviceId);
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await authApiService.getDevices();
      setDevices(data);
    } catch {
      showToast('Impossible de charger les appareils', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      await authApiService.revokeDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      showToast('Appareil supprimé', 'success');
    } catch {
      showToast('Impossible de déconnecter l\'appareil', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const getPlatformIcon = (platform: string | null) => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone size={20} color="#475569" strokeWidth={2} />;
      default:
        return <Monitor size={20} color="#475569" strokeWidth={2} />;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const formatUserLabel = (device: TrustedDevice) => {
    if (!device.user) return null;
    const profilLabel = device.user.profil
      ? device.user.profil.charAt(0).toUpperCase() + device.user.profil.slice(1)
      : '';
    const name = [device.user.firstName, device.user.lastName].filter(Boolean).join(' ');
    if (name && profilLabel) return `${profilLabel} — ${name}`;
    return profilLabel || name || null;
  };

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>Appareils connectés</Text>
          <Text style={styles.tabSubtitle}>Tous les appareils de confiance du restaurant</Text>
        </View>
      </View>

      <ScrollView
        style={styles.viewsScrollContainer}
        contentContainerStyle={[styles.viewsContainer, devices.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.viewsCardsWrapper, devices.length === 0 && { flex: 1 }]}>
          {isLoading ? (
            <View style={devicesStyles.emptyState}>
              <Text style={devicesStyles.emptyText}>Chargement...</Text>
            </View>
          ) : devices.length === 0 ? (
            <View style={devicesStyles.emptyState}>
              <Monitor size={40} color="#CBD5E1" strokeWidth={1.5} />
              <Text style={devicesStyles.emptyText}>Aucun appareil de confiance enregistré</Text>
              <Text style={devicesStyles.emptySubtext}>
                Les appareils seront ajoutés automatiquement{'\n'}après <Text style={devicesStyles.emptyBold}>vérification 2FA</Text>
              </Text>
            </View>
          ) : (
            devices.map(device => {
              const isCurrentDevice = device.deviceFingerprint === localDeviceId;
              const userLabel = formatUserLabel(device);
              return (
                <View key={device.id} style={[devicesStyles.deviceCard, isCurrentDevice && devicesStyles.deviceCardCurrent]}>
                  <View style={devicesStyles.deviceRow}>
                    <View style={[devicesStyles.deviceIconWrapper, isCurrentDevice && devicesStyles.deviceIconWrapperCurrent]}>
                      {getPlatformIcon(device.devicePlatform)}
                    </View>
                    <View style={devicesStyles.deviceInfo}>
                      <Text style={devicesStyles.deviceName}>
                        {device.deviceName || 'Appareil inconnu'}
                      </Text>
                      {userLabel && (
                        <Text style={devicesStyles.deviceUser}>{userLabel}</Text>
                      )}
                      <Text style={devicesStyles.deviceMeta}>
                        {device.lastIp ? `IP: ${device.lastIp} · ` : ''}
                        {formatDate(device.lastUsedAt)}
                      </Text>
                    </View>
                    {isCurrentDevice ? (
                      <View style={devicesStyles.currentTag}>
                        <Text style={devicesStyles.currentTagText}>Cet appareil</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[devicesStyles.revokeButton, revokingId === device.id && devicesStyles.revokeButtonDisabled]}
                        onPress={() => handleRevoke(device.id)}
                        disabled={revokingId === device.id}
                      >
                        <Text style={devicesStyles.revokeButtonText}>
                          {revokingId === device.id ? '...' : 'Supprimer'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ====================================================================
// Styles
// ====================================================================

const twoFaStyles = StyleSheet.create({
  secretBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secretText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontWeight: '600',
  },
  secretCopyHint: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    backgroundColor: '#475569',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  verifyLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
  },
  pinWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  backLink: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
  },
  backLinkText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  inactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inactiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  inactiveBadgeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  enableButton: {
    backgroundColor: '#475569',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
  },
  enableButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#475569',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    marginTop: 16,
  },
  verifyButtonDisabled: {
    opacity: 0.4,
  },
  verifyButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disableButton: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    marginTop: 16,
  },
  disableButtonDisabled: {
    opacity: 0.4,
  },
  disableButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sendEmailLink: {
    marginTop: 16,
    padding: 4,
  },
  sendEmailLinkText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  switchMethodLink: {
    marginTop: 10,
    padding: 4,
    alignSelf: 'flex-end',
  },
  switchMethodLinkText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

const devicesStyles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBold: {
    fontWeight: '700',
    color: '#94A3B8',
  },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deviceCardCurrent: {
    borderColor: '#475569',
    backgroundColor: '#F3F4F6',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceIconWrapperCurrent: {
    backgroundColor: '#FFFFFF',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  deviceUser: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  currentTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 8,
    borderRadius: 8,
    width: 100,
    alignItems: 'center' as const,
  },
  currentTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  deviceMeta: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  revokeButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 8,
    width: 100,
    alignItems: 'center' as const,
  },
  revokeButtonDisabled: {
    opacity: 0.5,
  },
  revokeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: '#F1F5F9',
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sidebarTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 24,
  },
  tabScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  viewsScrollContainer: {
    flex: 1,
  },
  viewsContainer: {
    paddingBottom: 24,
  },
  viewsCardsWrapper: {
    gap: 16,
  },
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
  viewModeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 4,
  },
});
