import { Slot } from 'expo-router';
import { View } from 'react-native';
import { AdminSidebar } from '~/components/admin/Sidebar';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <AdminSidebar />
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </View>
  );
}