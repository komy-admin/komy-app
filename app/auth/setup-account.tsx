import { Redirect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

/**
 * Redirect page to handle backend URL format
 * Backend sends: /auth/setup-account?token=XXX
 * We redirect to: /(auth)/setup-account?token=XXX
 */
export default function SetupAccountRedirect() {
  const { token } = useLocalSearchParams<{ token: string }>();

  // Redirect to the actual setup-account page with the token
  return <Redirect href={`/(auth)/setup-account?token=${token || ''}`} />;
}