import { View } from "react-native";
import { Text } from "~/components/ui";
import type { currentUser } from '~/types/auth.types'

// interface PasswordPageProps {
//   user: currentUser;
// }

// { user }: PasswordPageProps

export default function PasswordPage () {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Mot de passe Page</Text>
    </View>
  );

}