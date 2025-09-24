import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import { User, ShieldCheck, Bell, LogOut, PenTool, Database, Settings } from 'lucide-react-native';
import { sessionService } from '~/services/SessionService';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import * as ImagePicker from 'expo-image-picker';

type ConfigSection = 'dashboard' | 'personal' | 'password' | 'notifications' | 'configuration';

const CONFIG_ITEMS = [
  { id: 'dashboard', Icon: Database, label: 'Dashboard' },
  { id: 'personal', Icon: User, label: 'Informations personnels' },
  { id: 'password', Icon: ShieldCheck, label: 'Sécurité' },
  { id: 'notifications', Icon: Bell, label: 'Notifications' },
  { id: 'configuration', Icon: Settings, label: 'Paramètre du restaurant' },
];

type ConfigSidebarProps = {
  currentSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
};

export function ConfigSidebar({ currentSection, onSectionChange }: ConfigSidebarProps) {
  const { user, isLoading, error } = useSelector((state: RootState) => state.session);
  const router = useRouter();

  // État pour gérer les dimensions et les breakpoints
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  // Écouter les changements de dimensions
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Calculer les breakpoints basés sur la largeur de la sidebar
  const getBreakpoint = () => {
    const screenWidth = dimensions.width;
    const calculatedSidebarWidth = screenWidth * 0.25; // 25% de l'écran

    if (calculatedSidebarWidth < 220) return 'sm'; // Petit - textes tronqués
    if (calculatedSidebarWidth < 280) return 'md'; // Moyen - textes complets mais avatar réduit
    return 'lg'; // Large - tout affiché normalement
  };

  const breakpoint = getBreakpoint();

  // Gestion des erreurs
  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error);
      // TODO: Handle error clearing with new store
    }
  }, [error]);

  const handleLogout = async () => {
    try {
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

  // Validation de taille d'image côté front
  const validateImageSize = (fileSize: number): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSize > maxSize) {
      Alert.alert('Erreur', 'L\'image est trop volumineuse (max 5MB)');
      return false;
    }
    return true;
  };

  const validateImageType = (mimeType: string): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      Alert.alert('Erreur', 'Format d\'image non supporté (JPG, PNG, WEBP uniquement)');
      return false;
    }
    return true;
  };

  // Sélecteur d'image optimisé avec validation front
  const handleImagePicker = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
        input.style.display = 'none';

        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            if (!validateImageType(file.type) || !validateImageSize(file.size)) {
              return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
              const imageUri = e.target?.result as string;

              try {
                // TODO: Implement updateProfileImage with new store
                // await dispatch(updateProfileImage({ 
                //   userId: user.id, 
                //   imageUri 
                // })).unwrap();
                Alert.alert('Succès', 'Photo de profil mise à jour !');
              } catch (error) {
                console.error('Erreur upload:', error);
              }
            };
            reader.readAsDataURL(file);
          }
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);

      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert('Permission requise', 'Vous devez autoriser l\'accès à la galerie pour changer votre photo de profil.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          base64: false,
        });

        if (!result.canceled && result.assets[0]) {
          const imageUri = result.assets[0].uri;

          try {
            // TODO: Implement updateProfileImage with new store
            // await dispatch(updateProfileImage({ 
            //   userId: user.id, 
            //   imageUri 
            // })).unwrap();
            Alert.alert('Succès', 'Photo de profil mise à jour !');
          } catch (error) {
            console.error('Erreur upload:', error);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sélection de l\'image.');
    }
  };

  // Fonction pour obtenir la source de l'image
  const getImageSource = () => {
    if (user?.profileImage) {
      console.log('Image utilisateur:', user.profileImage);
      return { uri: user.profileImage };
    }
    return require('~/assets/images/userprofiledefault.jpg');
  };

  // Fonction pour tronquer le texte
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Styles dynamiques basés sur le breakpoint
  const getDynamicStyles = () => {
    switch (breakpoint) {
      case 'sm':
        return {
          container: { ...styles.container, paddingHorizontal: 12 },
          avatarContainer: { ...styles.avatarContainer, width: 80, height: 80, borderRadius: 40 },
          avatar: { ...styles.avatar, borderRadius: 40 },
          userName: { ...styles.userName, fontSize: 14 },
          userRole: { ...styles.userRole, fontSize: 12 },
          profileSection: { ...styles.profileSection, marginBottom: 24 },
          menuText: { ...styles.menuText, fontSize: 12 },
          textContainer: styles.textContainer,
          iconContainer: styles.iconContainer,
          logoutText: { ...styles.logoutText, fontSize: 12 },
        };
      case 'md':
        return {
          container: { ...styles.container, paddingHorizontal: 16 },
          avatarContainer: { ...styles.avatarContainer, width: 100, height: 100, borderRadius: 50 },
          avatar: { ...styles.avatar, borderRadius: 50 },
          userName: { ...styles.userName, fontSize: 16 },
          userRole: { ...styles.userRole, fontSize: 13 },
          profileSection: { ...styles.profileSection, marginBottom: 32 },
          menuText: { ...styles.menuText, fontSize: 13 },
          textContainer: styles.textContainer,
          iconContainer: styles.iconContainer,
          logoutText: { ...styles.logoutText, fontSize: 13 },
        };
      default: // lg
        return {
          container: styles.container,
          avatarContainer: styles.avatarContainer,
          avatar: styles.avatar,
          userName: styles.userName,
          userRole: styles.userRole,
          profileSection: styles.profileSection,
          menuText: styles.menuText,
          textContainer: styles.textContainer,
          iconContainer: styles.iconContainer,
          logoutText: styles.logoutText,
        };
    }
  };

  const dynamicStyles = getDynamicStyles();

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.profileSection}>
        <View style={dynamicStyles.avatarContainer}>
          <Image
            source={getImageSource()}
            style={dynamicStyles.avatar}
            resizeMode="cover"
            onError={(error) => {
              console.error('Erreur chargement image:', error);
            }}
          />
          <Pressable
            onPress={handleImagePicker}
            disabled={isLoading}
          >
            <View style={styles.editIconContainer}>
              <PenTool size={breakpoint === 'sm' ? 12 : 16} color="#2A2E33" />
            </View>
          </Pressable>
        </View>

        <Text style={dynamicStyles.userName} numberOfLines={1} ellipsizeMode="tail">
          {user?.firstName && user?.lastName
            ? `${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)} ${user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)}`
            : 'Utilisateur'
          }
        </Text>
        <Text style={dynamicStyles.userRole} numberOfLines={1} ellipsizeMode="tail">
          {user?.profil
            ? user.profil.charAt(0).toUpperCase() + user.profil.slice(1)
            : 'Utilisateur'
          }
        </Text>
      </View>

      <View style={styles.menuSection}>
        {CONFIG_ITEMS.map(({ id, Icon, label }) => {
          const isActive = currentSection === id;
          return (
            <Pressable
              key={id}
              onPress={() => onSectionChange(id as ConfigSection)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? '#F9FAFB' : 'transparent',
                  borderRadius: 8,
                }
              ]}
            >
              <View style={[
                styles.menuItem,
                {
                  backgroundColor: isActive ? '#F3F4F6' : 'transparent',
                }
              ]}>
                <View style={dynamicStyles.iconContainer}>
                  <Icon
                    size={18}
                    color={isActive ? '#2A2E33' : '#64666A'}
                  />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text
                    style={[
                      dynamicStyles.menuText,
                      {
                        color: isActive ? '#2A2E33' : '#64666A',
                        fontWeight: isActive ? '500' : '400',
                      }
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {label}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={({ pressed }) => [
          {
            backgroundColor: pressed ? '#FEF2F2' : 'transparent',
            borderRadius: 8,
          }
        ]}
        onPress={handleLogout}
      >
        <View style={styles.logoutButton}>
          <View style={dynamicStyles.iconContainer}>
            <LogOut size={18} color="#DC2626" />
          </View>
          <View style={dynamicStyles.textContainer}>
            <Text
              style={dynamicStyles.logoutText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Déconnexion
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '25%',
    minWidth: 180, // Largeur minimum pour éviter l'écrasement
    maxWidth: 350, // Largeur maximum pour les très grands écrans
    backgroundColor: '#F8F9FA',
    height: '100%',
    paddingVertical: 35,
    paddingHorizontal: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    backgroundColor: '#F3F4F6',
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 5,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  userName: {
    fontSize: 18,
    color: '#2A2E33',
    marginBottom: 4,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '100%',
  },
  userRole: {
    fontSize: 14,
    color: '#64666A',
    fontWeight: '400',
    textAlign: 'center',
  },
  menuSection: {
    flex: 1,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    height: 30,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuText: {
    fontSize: 14,
    lineHeight: 20,
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  logoutText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 20,
    ...Platform.select({
      android: {
        textAlignVertical: 'center',
        includeFontPadding: false,
      },
    }),
  },
});