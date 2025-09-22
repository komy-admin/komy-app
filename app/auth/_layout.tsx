import { Stack } from 'expo-router';

/**
 * Layout for auth routes without parentheses
 * Used for handling backend URL compatibility
 */
export default function AuthRedirectLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup-account" />
    </Stack>
  );
}