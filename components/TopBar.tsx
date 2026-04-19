import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Image, Text, Pressable, StyleSheet } from 'react-native'
import { Calendar, Lock, Landmark } from 'lucide-react-native'
import { Href, useRouter, usePathname } from 'expo-router'
import { useAppSelector } from '~/store/hooks';
import { sessionService } from '~/services/SessionService';
import { usePanelPortal } from '~/hooks/usePanelPortal';

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

interface TopBarProps {
  enableConfigClick?: boolean;
}

export function Topbar({ enableConfigClick = true }: TopBarProps) {
  const user = useAppSelector((state) => state.session.user);
  const accountName = useAppSelector((state) => state.session.accountConfig?.accountName);
  const router = useRouter();
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState('')
  const { setTopBarHeight } = usePanelPortal();

  // Les managers ont accès à l'interface admin mais pas à la config
  const isManager = user?.profil === 'manager'
  const shouldEnableConfigClick = enableConfigClick && !isManager

  useEffect(() => {
    const updateDate = () => {
      const today = new Date()
      const day = String(today.getDate()).padStart(2, '0')
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const year = today.getFullYear()
      setCurrentDate(`${day}/${month}/${year}`)
    }

    updateDate()
    const now = new Date()
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() - now.getTime()

    let interval: ReturnType<typeof setInterval> | null = null

    const timeout = setTimeout(() => {
      updateDate()
      interval = setInterval(updateDate, 24 * 60 * 60 * 1000)
    }, timeUntilMidnight)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [])

  const imageSource = useMemo(() => {
    if (user?.profileImage) {
      return { uri: user.profileImage };
    }
    return require('../assets/images/userprofiledefault.jpg');
  }, [user?.profileImage]);

  const displayName = useMemo(() =>
    `${capitalize(user?.firstName ?? '')} ${capitalize(user?.lastName ?? '')}`,
    [user?.firstName, user?.lastName]
  );

  const displayProfil = useMemo(() =>
    capitalize(user?.profil ?? ''),
    [user?.profil]
  );

  const handleLock = useCallback(() => {
    if (user?.skipPinRequired) {
      sessionService.clearSessionStandby();
      router.replace('/standby' as Href);
    } else {
      sessionService.clearSession();
      router.replace('/pin-verification' as Href);
    }
  }, [router, user?.skipPinRequired]);

  const handleLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    setTopBarHeight(event.nativeEvent.layout.height);
  }, [setTopBarHeight]);

  // Contenu profil partagé
  const profileContent = (
    <>
      <Image
        source={imageSource}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userProfil}>{displayProfil}</Text>
      </View>
    </>
  );

  return (
    <View onLayout={handleLayout} style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.containerLogo}>
          <Image
            source={require('../assets/images/logo_komy_png/Logo_Komy_noirSF.png')}
            style={styles.logo}
          />
        </View>
        {accountName ? (
          <View style={styles.badge}>
            <Landmark size={24} color="#2A2E33" strokeWidth={1} />
            <Text style={styles.badgeText}>{accountName}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rightSection}>
        <View style={styles.badgesRow}>
          <Pressable onPress={handleLock} style={styles.badge}>
            <Lock size={24} color="#2A2E33" strokeWidth={1} />
            <Text style={styles.badgeText}>Verrouiller</Text>
          </Pressable>
          <View style={styles.badge}>
            <Calendar size={24} color="#2A2E33" strokeWidth={1} />
            <Text style={styles.badgeText}>{currentDate}</Text>
          </View>
        </View>

        <View style={styles.profileContainer}>
          {shouldEnableConfigClick ? (
            <Pressable onPress={() => {
              if (!pathname.startsWith('/configs')) {
                router.push('/(admin)/configs' as Href);
              }
            }}>
              <View style={styles.profileRow}>
                {profileContent}
              </View>
            </Pressable>
          ) : (
            <View style={styles.profileRow}>
              {profileContent}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 90,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  containerLogo: {
    width: 100,
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderColor: '#F3F3F3',
    borderWidth: 1,
  },
  badgeText: {
    color: '#2A2E33',
    fontSize: 14,
    fontWeight: '300',
  },
  profileContainer: {
    position: 'relative',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderColor: '#54575B',
  },
  userName: {
    color: '#2A2E33',
    fontSize: 15,
    fontWeight: '300',
  },
  userProfil: {
    color: '#64666A',
    fontSize: 14,
    fontWeight: '200',
  },
});
