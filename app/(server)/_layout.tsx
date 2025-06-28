// app/(server)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppDispatch } from '~/store/hooks';
import { logout } from '~/store/auth.slice';
import { Button, Text } from '~/components/ui';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { MoreVertical, LogOut } from 'lucide-react-native';

function Header() {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const menuActions: ActionItem[] = [
    {
      label: 'Se déconnecter',
      icon: <LogOut size={16} color="#EF4444" />,
      onPress: handleLogout
    }
  ];

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
      <Text className="text-xl font-bold text-gray-900">
        Fork'it
      </Text>
      <ActionMenu
        actions={menuActions}
        width={200}
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
            title: 'Tables',
          }}
        />
        <Stack.Screen
          name="table"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </View>
  );
}