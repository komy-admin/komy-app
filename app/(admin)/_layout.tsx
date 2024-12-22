import { Slot } from 'expo-router';
import { View } from 'react-native';
import { AdminSidebar } from '~/components/admin/Sidebar';
import { AdminTopbar } from '~/components/admin/TopBar';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <AdminTopbar />
      <View style={{ flex: 1, flexDirection: 'row'}}>
        <AdminSidebar />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </View>
  );
}