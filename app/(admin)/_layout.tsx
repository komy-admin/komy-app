import { Slot } from 'expo-router';
import { View } from 'react-native';
import { useAuth } from '~/src/contexts/AuthContext';
import { AdminSidebar } from '~/components/admin/Sidebar';
import { TopBar } from '~/components/admin/TopBar';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  // if (loading) {
  //   return null; // Ou un composant de loading
  // }
  if (!user) {
    return null;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <TopBar user={user} />
      <View style={{ flex: 1, flexDirection: 'row'}}>
        <AdminSidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}