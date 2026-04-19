import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useReservation } from '~/hooks/useReservation';
import { ReservationActivation } from '~/components/reservation/ReservationActivation';
import { ReservationList } from '~/components/reservation/ReservationList';

export default function ReservationPage() {
  const reservation = useReservation();

  if (reservation.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
