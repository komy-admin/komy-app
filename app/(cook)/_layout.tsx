import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Topbar } from '~/components/TopBar';
import { colors } from '~/theme';

export default function CookLayout() {
  return (
    <View style={styles.container}>
      <Topbar enableConfigClick={false} />
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
  },
});