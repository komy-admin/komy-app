import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useReservation } from '~/hooks/useReservation';
import { ReservationActivation } from '~/components/reservation/ReservationActivation';
import { ReservationList } from '~/components/reservation/ReservationList';
import { colors } from '~/theme';
export default function ReservationPage() {
  const reservation = useReservation();

  if (reservation.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.dark} />
      </View>
    );
  }

  if (!reservation.isActivated) {
    return <ReservationActivation reservation={reservation} />;
  }

  return (
    <View style={styles.container}>
      <ReservationList reservation={reservation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});
