// components/admin/Sidebar.tsx
import { Href, Link } from 'expo-router';
import { usePathname } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Users, Grid3X3Icon, LayoutDashboard, ChefHat, NotebookText, List, GlassWater} from 'lucide-react-native';
import { Text } from '../ui';

const NAV_ITEMS = [
  { href: '/service', icon: Grid3X3Icon, label: 'Service' },
  { href: '/room_list', icon: LayoutDashboard, label: 'Salles' },
  { href: '/menu', icon: NotebookText, label: 'Menu' },
  { href: '/team', icon: Users, label: 'Équipe' },
  { href: '/kitchen', icon: ChefHat, label: 'Cuisine' },
  { href: '/barman', icon: GlassWater, label: 'Bar' }
];

export function AdminSidebar() {
 const pathname = usePathname();

 return (
   <View style={{ width: 100, backgroundColor: '#2A2E33', paddingTop: 8}}>
     {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
       const isActive = pathname.includes(href);
       
       return (
         <Link href={`/(admin)${href}` as Href} key={href} asChild>
           <Pressable
             className="py-2 items-center"
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
         </Link>
       );
     })}
   </View>
 );
}