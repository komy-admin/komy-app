import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Topbar } from '~/components/TopBar';
import { ToastProvider } from '~/components/ToastProvider';

export default function BarmanLayout() {
  return (
    <ToastProvider>
      <View style={styles.container}>
        <Topbar showAdditions={false} enableConfigClick={false} />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </ToastProvider>
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