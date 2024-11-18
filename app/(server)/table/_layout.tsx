// app/(server)/tables/_layout.tsx
import { router, Stack } from 'expo-router';
import { HeaderBackButton } from '@react-navigation/elements';
import { Platform, Pressable, View } from 'react-native';

type MenuScreenParams = {
  title: string;
}

export default function TablesLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      animation: 'slide_from_right',
      contentStyle: {
        backgroundColor: 'transparent',
      },
    }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="menu"
        options={({ route }) => ({
          title: (route.params as MenuScreenParams)?.title || 'Menu',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => router.back()}
              label={Platform.OS === 'ios' ? 'Retour' : undefined}
              style={{ marginLeft: Platform.OS === 'ios' ? -8 : 0 }}
            />
          ),
        })}
      />
      <Stack.Screen 
        name="[id]"
        options={{
          title: '',
          headerLeft: (props) => (
            <HeaderBackButton
              {...props}
              onPress={() => router.back()}
              label={Platform.OS === 'ios' ? 'Retour' : undefined}
              style={{ marginLeft: Platform.OS === 'ios' ? -8 : 0 }}
            />
          ),
        }}
      />
    </Stack>
  );
}