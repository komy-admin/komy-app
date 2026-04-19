import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Topbar } from '~/components/TopBar';
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
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
});