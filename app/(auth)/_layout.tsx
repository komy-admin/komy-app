import { Stack } from "expo-router";
import { View } from "react-native";

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen
          name="pin-verification"
          options={{
            title: 'PIN Verification',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="setup-account"
          options={{
            title: 'Setup Account',
          }}
        />
        <Stack.Screen
          name="forgot-credentials"
          options={{
            title: 'Forgot Credentials',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Forgot Password',
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: 'Reset Password',
          }}
        />
        <Stack.Screen
          name="reset-pin"
          options={{
            title: 'Reset PIN',
          }}
        />
      </Stack>
    </View>
  );
}