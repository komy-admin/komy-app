import { View } from "react-native";
import { Text } from "~/components/ui";
import type { currentUser } from '~/types/auth.types'

// interface PersonalInfoPageProps {
//   user: currentUser;
// }
// { user }: PersonalInfoPageProps

export default function PersonalInfoPage () {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Informations Personnels Page</Text>
    </View>
  );

}