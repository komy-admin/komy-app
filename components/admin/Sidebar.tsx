// components/admin/Sidebar.tsx
import { Href, Link } from 'expo-router';
import { usePathname } from 'expo-router';
import { View, Pressable } from 'react-native';
import { BookOpen, Users, DoorClosed } from 'lucide-react-native';
import { Text } from '../ui';

const NAV_ITEMS = [
  { href: '/room', icon: DoorClosed, label: 'Salles' },
 { href: '/menu', icon: BookOpen, label: 'Carte' },
 { href: '/team', icon: Users, label: 'Équipe' },
];

export function AdminSidebar() {
 const pathname = usePathname();

 return (
   <View style={{ width: 80, backgroundColor: '#2A2E33' }}>
     {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
       const isActive = pathname.includes(href);
       
       return (
         <Link href={`/(admin)${href}` as Href} key={href} asChild>
           <Pressable
             className="py-2 items-center"
           >
            <View className="flex items-center rounded-md w-[50px] h-[50px] pt-1" style={isActive ? {backgroundColor: '#54575B'} : {}}>
              <Icon 
                size={24} 
                color={'white'} 
              />
              <Text 
                className="text-xs mt-1 text-white"
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