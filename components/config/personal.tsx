import { View } from "react-native";
import { Text } from "~/components/ui";
import type { currentUser } from '~/types/auth.types'

interface PersonalInfoPageProps {
  user: currentUser;
}

export default function PersonalInfoPage ({ user }: PersonalInfoPageProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Informations Personnels Page</Text>
    </View>
  );

}