// app/(server)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { logout } from '~/store';
import { useAppDispatch } from '~/store/hooks';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { Text } from '~/components/ui';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { Lock, LogOut, User as UserIcon } from 'lucide-react-native';
import { sessionService } from '~/services/SessionService';

function Header() {
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.session);

  const handleLogout = () => {
    dispatch(logout());
  };

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Utilisateur';

  const menuActions: ActionItem[] = [
    {
      label: userName,
      icon: <UserIcon size={16} color="#6B7280" />,
      onPress: () => {}, // No action, just display
    },
    {
      label: 'Verrouiller',
      icon: <Lock size={16} color="#6B7280" />,
      onPress: () => sessionService.clearSession(),
    },
    {
      label: 'Se déconnecter',
      icon: <LogOut size={16} color="#EF4444" />,
      onPress: handleLogout,
      type: 'destructive',
    }
  ];

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
      <Text className="text-xl font-bold text-gray-900">
        Komy
      </Text>
      <ActionMenu
        actions={menuActions}
        width={220}
      />
    </View>
  );
}

export default function ServerLayout() {
  return (
    <View className="flex-1 bg-background">
      <Header />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'none' : 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Commandes',
          }}
        />
      </Stack>
    </View>
  );
}