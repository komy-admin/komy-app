import { useState } from 'react';
import { View, StyleSheet, Text as RNText, Pressable, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { AuthBackground } from '~/components/auth/AuthBackground';
import { AuthScreenLayout } from '~/components/auth/AuthScreenLayout';
import { shadows, colors } from '~/theme';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { sessionService } from '~/services/SessionService';
import { useRouter } from 'expo-router';
import { useToast } from '~/components/ToastProvider';

const BREAKPOINT = 768;

export default function StandbyScreen() {
  const user = useSelector((state: RootState) => state.session.user);
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { width } = useWindowDimensions();

  const isWide = width >= BREAKPOINT;

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || 'Utilisateur';
  const displayRole = user?.profil ? user.profil.charAt(0).toUpperCase() + user.profil.slice(1) : '';

  const handleUnlock = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const success = await sessionService.unlockStandby();
      if (!success) {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await sessionService.logout();
    } finally {
      router.replace('/login');
    }
  };

  return (
    <View style={styles.root}>
      <AuthBackground />

      <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
        <AuthScreenLayout style={{ backgroundColor: 'transparent' }} centered noCard>
          <Image
            source={require('../../assets/images/logo_komy_png/Logo_Komy_blancSF.webp')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.card}>
            <View style={styles.statusBox}>
              <RNText style={styles.statusBoxTitle}>SESSION VERROUILLÉE</RNText>
              {displayRole ? (
                <RNText style={styles.userRole}>{displayRole}</RNText>
              ) : null}
            </View>

            <Pressable
              style={[styles.unlockButton, isLoading && styles.buttonDisabled]}
              onPress={handleUnlock}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <RNText style={styles.unlockButtonText}>Déverrouiller</RNText>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <RNText style={styles.dividerText}>ou</RNText>
              <View style={styles.dividerLine} />
            </View>

            <Pressable onPress={handleLogout} style={styles.logoutButton} disabled={isLoading}>
              <RNText style={styles.logoutButtonText}>Se déconnecter</RNText>
            </Pressable>
          </View>
        </AuthScreenLayout>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.neutral[200],
  },
  formPanel: {
    flex: 1,
  },
  formPanelWide: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '43%',
    transform: [{ translateX: '-50%' }],
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
    ...shadows.bottom,
  },
  statusBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.surface.muted,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
    marginBottom: 20,
  },
  statusBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand.dark,
    letterSpacing: 1,
  },
  userRole: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[400],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unlockButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.brand.dark,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray[400],
  },
  logoutButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 10,
    backgroundColor: colors.surface.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
