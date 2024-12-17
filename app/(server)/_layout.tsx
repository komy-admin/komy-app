// app/(server)/_layout.tsx
import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppDispatch } from '~/store/hooks';
import { logout } from '~/store/auth.slice';
import { ThemeToggle } from '~/components/ThemeToggle';
import { Button, Text } from '~/components/ui';

function Header() {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-primary">
      <Text className="text-xl font-bold text-primary-foreground">
        Restaurant App
      </Text>
      <View className="flex-row items-center space-x-2">
        <ThemeToggle />
        <Button
          variant="outline" 
          className="bg-transparent border-primary-foreground"
          onPress={handleLogout}
        >
          <Text className="text-primary-foreground">Déconnexion</Text>
        </Button>
      </View>
    </View>
  );
}

export default function ServerLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          header: () => <Header />,
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