// app/(server)/tables/_layout.tsx
import { router, Stack } from 'expo-router';
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
        })}
      />
      <Stack.Screen 
        name="[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  );
}