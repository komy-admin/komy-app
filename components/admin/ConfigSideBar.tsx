import { useEffect, useState, useMemo, memo } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Platform, Dimensions, ImageSourcePropType } from 'react-native';
import { User, Bell, LogOut, PenTool, Database, Settings, ShieldCheck } from 'lucide-react-native';
import { sessionService } from '~/services/SessionService';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useProfileImageUpload } from '~/hooks/useProfileImageUpload';
import { shadows, colors } from '~/theme';

type ConfigSection = 'dashboard' | 'profile' | 'notifications' | 'configuration' | 'security';

// Composant Avatar mémorisé pour éviter les reloads d'image sur resize
const ProfileAvatar = memo(({
  source,
  size
}: {
  source: ImageSourcePropType;
  size: number;
}) => (
  <Image
    source={source}
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.gray[100],
    }}
    resizeMode="cover"
    onError={(error) => {
      console.error('Erreur chargement image:', error);
    }}
  />
));

const CONFIG_ITEMS = [
  { id: 'dashboard', Icon: Database, label: 'Dashboard', color: colors.info.base },
  { id: 'profile', Icon: User, label: 'Mon compte', color: colors.success.base },
  { id: 'notifications', Icon: Bell, label: 'Notifications', color: colors.error.base },
  { id: 'security', Icon: ShieldCheck, label: 'Sécurité', color: colors.neutral[600] },
  { id: 'configuration', Icon: Settings, label: 'Configuration', color: colors.purple.base },
];

// Configuration des breakpoints de hauteur - Extraite pour performance
const HEIGHT_BREAKPOINTS = {
  xs: { // < 500px hauteur - Mode ultra-compact (tablette paysage)
    avatarSize: 50,
    containerPaddingVertical: 16,
    profileMarginBottom: 12,
    userNameSize: 13,
    userRoleSize: 11,
    menuItemPaddingVertical: 8,
    menuItemMinHeight: 36,
    iconSize: 16,
    editIconSize: 10,
    gap: 2,
  },
  sm: { // 500-650px hauteur - Mode compact
    avatarSize: 70,
    containerPaddingVertical: 20,
    profileMarginBottom: 16,
    userNameSize: 14,
    userRoleSize: 12,
    menuItemPaddingVertical: 10,
    menuItemMinHeight: 40,
    iconSize: 17,
    editIconSize: 12,
    gap: 3,
  },
  md: { // 650-800px hauteur - Mode moyen
    avatarSize: 100,
    containerPaddingVertical: 28,
    profileMarginBottom: 24,
    userNameSize: 16,
    userRoleSize: 13,
    menuItemPaddingVertical: 11,
    menuItemMinHeight: 42,
    iconSize: 18,
    editIconSize: 14,
    gap: 4,
  },
  lg: { // > 800px hauteur - Mode large
    avatarSize: 140,
    containerPaddingVertical: 35,
    profileMarginBottom: 40,
    userNameSize: 18,
    userRoleSize: 14,
    menuItemPaddingVertical: 12,
    menuItemMinHeight: 44,
    iconSize: 18,
    editIconSize: 16,
    gap: 4,
  },
} as const;

// Configuration des breakpoints de largeur - Extraite pour performance
const WIDTH_BREAKPOINTS = {
  sm: {
    containerPaddingHorizontal: 12,
    menuTextSize: 12,
    logoutTextSize: 12,
  },
  md: {
    containerPaddingHorizontal: 16,
    menuTextSize: 13,
    logoutTextSize: 13,
  },
  lg: {
    containerPaddingHorizontal: 24,
    menuTextSize: 14,
    logoutTextSize: 14,
  },
} as const;

type ConfigSidebarProps = {
  currentSection: ConfigSection;
  onSectionChange: (section: ConfigSection) => void;
};

export function ConfigSidebar({ currentSection, onSectionChange }: ConfigSidebarProps) {
  const { user } = useSelector((state: RootState) => state.session);
  const router = useRouter();
  const { pickImage, isUploading } = useProfileImageUpload();

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
  const getWidthBreakpoint = () => {
    const screenWidth = dimensions.width;
    const calculatedSidebarWidth = screenWidth * 0.25; // 25% de l'écran

    if (calculatedSidebarWidth < 220) return 'sm';
    if (calculatedSidebarWidth < 280) return 'md';
    return 'lg';
  };

  // Calculer les breakpoints basés sur la hauteur disponible
  const getHeightBreakpoint = () => {
    const screenHeight = dimensions.height;

    if (screenHeight < 500) return 'xs';
    if (screenHeight < 650) return 'sm';
    if (screenHeight < 800) return 'md';
    return 'lg';
  };

  const widthBreakpoint = getWidthBreakpoint();
  const heightBreakpoint = getHeightBreakpoint();

  // Taille de l'avatar mémorisée séparément pour éviter les reloads
  const avatarSize = useMemo(() => {
    return HEIGHT_BREAKPOINTS[heightBreakpoint].avatarSize;
  }, [heightBreakpoint]);

  // Styles dynamiques optimisés avec useMemo
  const dynamicStyles = useMemo(() => {
    const hConfig = HEIGHT_BREAKPOINTS[heightBreakpoint];
    const wConfig = WIDTH_BREAKPOINTS[widthBreakpoint];

    return {
      container: {
        ...styles.container,
        paddingVertical: hConfig.containerPaddingVertical,
        paddingHorizontal: wConfig.containerPaddingHorizontal,
      },
      avatarContainer: {
        ...styles.avatarContainer,
        width: hConfig.avatarSize,
        height: hConfig.avatarSize,
        borderRadius: hConfig.avatarSize / 2,
        marginBottom: heightBreakpoint === 'xs' ? 8 : 16,
      },
      userName: {
        ...styles.userName,
        fontSize: hConfig.userNameSize,
        marginBottom: heightBreakpoint === 'xs' ? 2 : 4,
      },
      userRole: {
        ...styles.userRole,
        fontSize: hConfig.userRoleSize,
      },
      profileSection: {
        ...styles.profileSection,
        marginBottom: hConfig.profileMarginBottom,
      },
      menuSection: {
        ...styles.menuSection,
        gap: hConfig.gap,
      },
      menuItem: {
        paddingVertical: hConfig.menuItemPaddingVertical,
        minHeight: hConfig.menuItemMinHeight,
      },
      menuText: {
        ...styles.menuText,
        fontSize: wConfig.menuTextSize,
      },
      textContainer: styles.textContainer,
      iconContainer: styles.iconContainer,
      iconSize: hConfig.iconSize,
      editIconSize: hConfig.editIconSize,
      logoutText: {
        ...styles.logoutText,
        fontSize: wConfig.logoutTextSize,
      },
      logoutButton: {
        paddingVertical: hConfig.menuItemPaddingVertical,
        minHeight: hConfig.menuItemMinHeight,
      },
    };
  }, [heightBreakpoint, widthBreakpoint]);


  const handleLogout = async () => {
    try {
      // Use SessionService to properly clear authToken and sessionToken
      await sessionService.logout();
      // Navigate to login page
      router.replace('/login');
    } catch (error) {
      // Even if logout fails, navigate to login
      router.replace('/login');
    }
  };

  // Source de l'image mémorisée pour éviter les re-renders
  const imageSource = useMemo(() => {
    if (user?.profileImage) {
      return { uri: user.profileImage };
    }
    return require('~/assets/images/userprofiledefault.jpg');
  }, [user?.profileImage]);


  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.profileSection}>
        <View style={dynamicStyles.avatarContainer}>
          <ProfileAvatar source={imageSource} size={avatarSize} />
          <Pressable
            onPress={pickImage}
            disabled={isUploading}
          >
            <View style={styles.editIconContainer}>
              <PenTool size={dynamicStyles.editIconSize} color={colors.brand.dark} />
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

      <View style={dynamicStyles.menuSection}>
        {CONFIG_ITEMS.map(({ id, Icon, label, color }) => {
          const isActive = currentSection === id;
          return (
            <Pressable
              key={id}
              onPress={() => onSectionChange(id as ConfigSection)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.gray[50] : 'transparent',
                  borderRadius: 8,
                }
              ]}
              android_ripple={{ color: colors.gray[50] }}
            >
              <View style={[
                styles.menuItem,
                dynamicStyles.menuItem,
                {
                  backgroundColor: isActive ? colors.neutral[100] : 'transparent',
                }
              ]}>
                <View style={dynamicStyles.iconContainer}>
                  <Icon
                    size={dynamicStyles.iconSize}
                    color={isActive ? color : colors.neutral[500]}
                  />
                </View>
                <View style={dynamicStyles.textContainer}>
                  <Text
                    style={[
                      dynamicStyles.menuText,
                      {
                        color: isActive ? colors.neutral[800] : colors.neutral[500],
                        fontWeight: isActive ? '600' : '400',
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
            backgroundColor: pressed ? colors.error.bg : 'transparent',
            borderRadius: 8,
          }
        ]}
        onPress={handleLogout}
      >
        <View style={[styles.logoutButton, dynamicStyles.logoutButton]}>
          <View style={dynamicStyles.iconContainer}>
            <LogOut size={dynamicStyles.iconSize} color={colors.error.text} />
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
    backgroundColor: colors.gray[50],
    height: '100%',
    paddingVertical: 35,
    paddingHorizontal: 24,
    zIndex: 1,
    ...shadows.right,
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
  },
  editIconContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 5,
    borderWidth: 2,
    borderColor: colors.gray[100],
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  userName: {
    fontSize: 18,
    color: colors.brand.dark,
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
    color: colors.error.text,
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