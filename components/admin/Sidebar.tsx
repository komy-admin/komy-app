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

const ServiceIcon = ({ size, color, style }: { size: number; color: string; style?: any }) => (
  <MaterialCommunityIcons name="room-service-outline" size={size} color={color} style={style} />
);

const NAV_ITEMS = [
  { href: '/service', icon: ServiceIcon, label: 'Service', configKey: null },
  { href: '/payments', icon: CreditCard, label: 'Paiements', configKey: null },
  { href: '/room/edition-mode', icon: LayoutDashboard, label: 'Salles', configKey: 'roomEnabled' as const },
  { href: '/menu', icon: NotebookText, label: 'Menu', configKey: null },
  { href: '/team', icon: Users, label: 'Équipe', configKey: 'teamEnabled' as const },
  { href: '/kitchen', icon: ChefHat, label: 'Cuisine', configKey: 'kitchenEnabled' as const },
  { href: '/barman', icon: GlassWater, label: 'Bar', configKey: 'barEnabled' as const },
  { href: '/reservation', icon: CalendarDays, label: 'Réservations', configKey: null }
];

export function AdminSidebar() {
 const pathname = usePathname();
 const accountConfig = useSelector((state: RootState) => state.session.accountConfig);

 // Filtrer les items selon la configuration
 const visibleNavItems = useMemo(() => {
   return NAV_ITEMS.filter(item => {
     // Si pas de clé de config, toujours visible
     if (!item.configKey) return true;

     // Sinon vérifier la config strictement
     if (!accountConfig) return false;
     return accountConfig[item.configKey] === true;
   });
 }, [accountConfig]);

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
           className="py-2 items-center"
           onPress={() => handleNavPress(href, isActive)}
         >
            <View className="flex items-center justify-center rounded-md w-[70px] h-[70px]" style={isActive ? {backgroundColor: '#54575B', opacity: 1} : {}}>
              <Icon
                size={30}
                color={isActive ? 'white' : 'gray'}
                strokeWidth= {1.5}
                style={{
                  marginBottom: 2,
                  opacity: isActive ? 1 : 0.8,
                }}
              />
              <Text
                className="text-xs mt-1 text-white"
                style={isActive ? {color: 'white'} : {color: 'gray'}}
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
    backgroundColor: '#2A2E33',
    paddingTop: 8,
    zIndex: 100,
  },
  scrollContent: {
    flexGrow: 1,
  },
});