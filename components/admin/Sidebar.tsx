// components/admin/Sidebar.tsx
import { Href, Link } from 'expo-router';
import { usePathname } from 'expo-router';
import { View, Pressable } from 'react-native';
import { BookOpen, Users, DoorClosed, Group } from 'lucide-react-native';
import { Text } from '../ui';

const NAV_ITEMS = [
  { href: '/service', icon: Group, label: 'Service' },
 { href: '/menu', icon: Group, label: 'Menu' },
 { href: '/team', icon: Group, label: 'Équipe' },
 { href: '/room', icon: Group, label: 'Salles' },
 { href: '/kitchen', icon: Group, label: 'Cuisine' },
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