// components/admin/Sidebar.tsx
import { Href, router, usePathname } from 'expo-router';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Users, LayoutDashboard, ChefHat, NotebookText, GlassWater, CreditCard, CalendarDays } from 'lucide-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from '../ui';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useMemo, useCallback } from 'react';
import { navigationEvents } from '~/lib/navigation-events';
import { colors } from '~/theme';

const ServiceIcon = ({ size, color, style }: { size: number; color: string; style?: any }) => (
  <MaterialCommunityIcons name="room-service-outline" size={size} color={color} style={style} />
);

const NAV_ITEMS = [
  { href: '/service', icon: ServiceIcon, label: 'Service', configKey: null, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/reservation', icon: CalendarDays, label: 'Réservations', configKey: 'reservationEnabled' as const, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/payments', icon: CreditCard, label: 'Paiements', configKey: null, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/room/edition-mode', icon: LayoutDashboard, label: 'Salles', configKey: 'roomEnabled' as const, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/menu', icon: NotebookText, label: 'Menu', configKey: null, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/team', icon: Users, label: 'Équipe', configKey: 'teamEnabled' as const, roles: ['superadmin', 'admin', 'manager'] },
  { href: '/kitchen', icon: ChefHat, label: 'Cuisine', configKey: 'kitchenEnabled' as const, roles: ['superadmin', 'admin'] },
  { href: '/barman', icon: GlassWater, label: 'Bar', configKey: 'barEnabled' as const, roles: ['superadmin', 'admin'] },
];

export function AdminSidebar() {
 const pathname = usePathname();
 const accountConfig = useSelector((state: RootState) => state.session.accountConfig);
 const userProfil = useSelector((state: RootState) => state.session.user?.profil);

 // Filtrer les items selon la configuration et le rôle
 const visibleNavItems = useMemo(() => {
   return NAV_ITEMS.filter(item => {
     // Vérifier que le rôle de l'utilisateur est autorisé
     if (!userProfil || !item.roles.includes(userProfil)) return false;

     // Si pas de clé de config, toujours visible
     if (!item.configKey) return true;

     // Sinon vérifier la config strictement
     if (!accountConfig) return false;
     return accountConfig[item.configKey] === true;
   });
 }, [accountConfig, userProfil]);

 const handleNavPress = useCallback((href: string, isActive: boolean) => {
   if (isActive) {
     navigationEvents.emit(href);
   } else {
     router.push(`/(admin)${href}` as Href);
   }
 }, []);

 return (
   <View style={styles.container}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
     {visibleNavItems.map(({ href, icon: Icon, label }) => {
       const isActive = pathname.includes(href);

       return (
         <Pressable
           key={href}
           className="py-0.5 items-center"
           onPress={() => handleNavPress(href, isActive)}
         >
            <View className="flex items-center justify-center rounded-md w-[78px] h-[72px] overflow-hidden">
              {isActive && <View style={styles.activeOverlay} />}
              <Icon
                size={26}
                color={isActive ? 'white' : 'gray'}
                strokeWidth={1.5}
                style={{
                  opacity: isActive ? 1 : 0.8,
                }}
              />
              <Text
                className="text-white"
                style={[{ fontSize: 10 }, isActive ? {color: 'white'} : {color: 'gray'}]}
              >
                {label}
              </Text>
            </View>
         </Pressable>
       );
     })}
    </ScrollView>
   </View>
 );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    backgroundColor: colors.brand.dark,
    paddingTop: 8,
    zIndex: 100,
  },
  scrollContent: {
    flexGrow: 1,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gray[500],
    opacity: 0.5,
  },
});