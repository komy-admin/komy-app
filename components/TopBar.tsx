import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Image, Text, Pressable, Platform, StyleSheet } from 'react-native'
import { Calendar, LogOut, Lock } from 'lucide-react-native'
import { Href, Link, useRouter } from 'expo-router'
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
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
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
    setShowProfileMenu(false);
    sessionService.clearSession();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      setShowProfileMenu(false);
      await sessionService.logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  }, [router]);

  const closeMenu = useCallback(() => setShowProfileMenu(false), []);
  const toggleProfileMenu = useCallback(() => setShowProfileMenu(prev => !prev), []);

  const handleLayout = useCallback((event: { nativeEvent: { layout: { height: number } } }) => {
    setTopBarHeight(event.nativeEvent.layout.height);
  }, [setTopBarHeight]);

  const containerZStyle = useMemo(() => ({
    ...styles.container,
    zIndex: showProfileMenu ? 1001 : 25,
    ...Platform.select({
      android: {
        elevation: showProfileMenu ? 1001 : 25,
        shadowColor: 'transparent',
      },
    }),
  }), [showProfileMenu]);

  const profileMenuBgStyle = useMemo(() => ([
    styles.profileRow,
    showProfileMenu && styles.profileRowActive,
  ]), [showProfileMenu]);

  // Contenu profil partagé (admin link & manager pressable)
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
    <>
      {/* Overlay invisible pour fermer le menu */}
      {showProfileMenu && (
        <Pressable onPress={closeMenu} style={styles.overlay} />
      )}

      <View onLayout={handleLayout} style={containerZStyle}>
        <View style={styles.containerLogo}>
          <Image
            source={require('../assets/images/logo_komy_png/Logo_Komy_noirSF.png')}
            style={styles.logo}
          />
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
              <Link href={'/(admin)/configs' as Href} asChild>
                <Pressable onPress={closeMenu}>
                  <View style={styles.profileRow}>
                    {profileContent}
                  </View>
                </Pressable>
              </Link>
            ) : (
              <Pressable onPress={toggleProfileMenu}>
                <View style={profileMenuBgStyle}>
                  {profileContent}
                </View>
              </Pressable>
            )}

            {/* Menu dropdown */}
            {showProfileMenu && !shouldEnableConfigClick && (
              <View style={styles.dropdown}>
                <View style={styles.dropdownArrow} />
                <View style={styles.dropdownContent}>
                  <Pressable
                    onPress={handleLogout}
                    style={styles.logoutButton}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                  >
                    <LogOut size={18} color="#EF4444" strokeWidth={2} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  container: {
    width: '100%',
    height: 90,
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 20,
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
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
  },
  profileRowActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: -20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    minWidth: 180,
    zIndex: 1000,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -6,
    right: 20,
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    transform: [{ rotate: '45deg' }],
  },
  dropdownContent: {
    padding: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
});
