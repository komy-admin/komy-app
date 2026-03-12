import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            flex: 1,
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
          name="device-verification"
          options={{
            title: 'Device Verification',
            animation: 'slide_from_right',
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
  );
}