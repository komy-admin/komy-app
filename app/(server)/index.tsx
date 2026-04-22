import { View, StyleSheet, Text as RNText } from 'react-native';
import { Construction } from 'lucide-react-native';
import { colors } from '~/theme';

export default function ServerHomePage() {
  return (
    <View style={styles.container}>
      <Construction size={64} color={colors.neutral[300]} strokeWidth={1.5} />
      <RNText style={styles.title}>En construction</RNText>
      <RNText style={styles.subtitle}>Cette interface sera disponible prochainement</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as any,
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
