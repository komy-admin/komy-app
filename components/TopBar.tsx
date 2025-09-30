import React, { useEffect, useState } from 'react'
import { View, Image, Text, Pressable, TouchableWithoutFeedback } from 'react-native'
import { FileText, Calendar, LogOut } from 'lucide-react-native'
import { Href, Link, useRouter } from 'expo-router'
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { sessionService } from '~/services/SessionService';

interface TopBarProps {
  showAdditions?: boolean;
  enableConfigClick?: boolean;
}

export function Topbar({ showAdditions = true, enableConfigClick = true }: TopBarProps) {
  const { user } = useSelector((state: RootState) => state.session);
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Les managers ont accès à l'interface admin mais pas à la config
  const isManager = user?.profil === 'manager'
  const shouldEnableConfigClick = enableConfigClick && !isManager

  // Fonction pour formater la date
  const updateDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    setCurrentDate(`${day}/${month}/${year}`)
  }

  useEffect(() => {
    updateDate()
    const now = new Date()
    const timeUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() - now.getTime()

    const timeout = setTimeout(() => {
      updateDate()
      const interval = setInterval(updateDate, 24 * 60 * 60 * 1000)
      return () => clearInterval(interval)
    }, timeUntilMidnight)

    return () => clearTimeout(timeout)
  }, [])

  const getImageSource = () => {
    if (user?.profileImage) {
      return { uri: user.profileImage };
    }
    return require('../assets/images/userprofiledefault.jpg');
  };

  const handleLogout = async () => {
    try {
      setShowProfileMenu(false);
      // Use SessionService to properly clear authToken and sessionToken
      await sessionService.logout();
      // Navigate to login page
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login
      router.replace('/login');
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const configUser = '/configs'

  return (
    <>
      {/* Overlay invisible pour fermer le menu */}
      {showProfileMenu && (
        <TouchableWithoutFeedback onPress={() => setShowProfileMenu(false)}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }} />
        </TouchableWithoutFeedback>
      )}

      <View
        style={{
          width: '100%',
          height: 90,
          backgroundColor: '#EAEAEB',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingRight: 20,
          zIndex: showProfileMenu ? 1001 : 1,
        }}
      >
        <View>
          <Image
            source={require('../assets/images/logo_komy_png/logo_name_v1.png')}
            style={{ width: 100, height: 100, resizeMode: 'contain' }}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {showAdditions && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor: "#F3F3F3", borderWidth: 1 }}>
                <FileText size={24} color="#2A2E33" strokeWidth={1} />
                <Text style={{ color: '#2A2E33', fontSize: 14, fontWeight: '300' }}>Additions</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12, borderColor: "#F3F3F3", borderWidth: 1 }}>
              <Calendar size={24} color="#2A2E33" strokeWidth={1} />
              <Text style={{ color: '#2A2E33', fontSize: 14, fontWeight: '300' }}>{currentDate}</Text>
            </View>
          </View>

          <View style={{ position: 'relative' }}>
            {shouldEnableConfigClick ? (
              <Link href={`/(admin)${configUser}` as Href} key={configUser} asChild>
                <Pressable onPress={() => setShowProfileMenu(false)}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Image
                      source={getImageSource()}
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 30,
                        borderColor: '#54575B',
                      }}
                      resizeMode="cover"
                    />
                    <View>
                      <Text
                        style={{
                          color: '#2A2E33',
                          fontSize: 15,
                          fontWeight: '300'
                        }}
                      >
                        {`${(user?.firstName ?? '').charAt(0).toUpperCase() + (user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase() + (user?.lastName ?? '').slice(1)}`}
                      </Text>
                      <Text style={{ color: '#64666A', fontSize: 14, fontWeight: '200' }}>
                        {(user?.profil ?? '').charAt(0).toUpperCase() + (user?.profil ?? '').slice(1)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ) : (
              <Pressable onPress={toggleProfileMenu}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    backgroundColor: showProfileMenu ? 'rgba(0,0,0,0.05)' : 'transparent',
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <Image
                    source={getImageSource()}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 30,
                      borderColor: '#54575B',
                    }}
                    resizeMode="cover"
                  />
                  <View>
                    <Text
                      style={{
                        color: '#2A2E33',
                        fontSize: 15,
                        fontWeight: '300'
                      }}
                    >
                      {`${(user?.firstName ?? '').charAt(0).toUpperCase() + (user?.firstName ?? '').slice(1)} ${(user?.lastName ?? '').charAt(0).toUpperCase() + (user?.lastName ?? '').slice(1)}`}
                    </Text>
                    <Text style={{ color: '#64666A', fontSize: 14, fontWeight: '200' }}>
                      {(user?.profil ?? '').charAt(0).toUpperCase() + (user?.profil ?? '').slice(1)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}

            {/* Menu dropdown */}
            {showProfileMenu && !shouldEnableConfigClick && (
              <View style={{
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
              }}>
                {/* Petite flèche vers le haut */}
                <View style={{
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
                }} />

                <View style={{ padding: 8 }}>
                  <Pressable
                    onPress={handleLogout}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: 'transparent',
                    }}
                    android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                  >
                    <LogOut size={18} color="#EF4444" strokeWidth={2} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: '#EF4444',
                    }}>
                      Se déconnecter
                    </Text>
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