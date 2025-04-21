import { Slot } from 'expo-router';
import { View } from 'react-native';
import { AdminSidebar } from '~/components/admin/Sidebar';
import { AdminTopbar } from '~/components/admin/TopBar';
import { ToastProvider } from '~/components/ToastProvider';

export default function AdminLayout() {
  return (
    <ToastProvider>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <AdminTopbar />
        <View style={{ flex: 1, flexDirection: 'row'}}>
          <AdminSidebar />
          <View style={{ flex: 1 }}>
            <Slot />
          </View>
        </View>
      </View>
    </ToastProvider>
  );
}