import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useReservation } from '~/hooks/useReservation';
import { ReservationSidebar } from '~/components/reservation/ReservationSidebar';
import { ReservationActivation } from '~/components/reservation/ReservationActivation';
import { ReservationServices } from '~/components/reservation/ReservationServices';
import { ReservationSchedules } from '~/components/reservation/ReservationSchedules';
import { ReservationOverrides } from '~/components/reservation/ReservationOverrides';
import { ReservationSettingsPage } from '~/components/reservation/ReservationSettings';
import { ReservationList } from '~/components/reservation/ReservationList';
import { View as LoadingView, ActivityIndicator } from 'react-native';

export type ReservationSection = 'services' | 'schedules' | 'overrides' | 'settings' | 'reservations';

export default function ReservationPage() {
  const [currentSection, setCurrentSection] = useState<ReservationSection>('reservations');
  const reservation = useReservation();

  // Loading state
  if (reservation.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A2E33" />
      </View>
    );
  }

  // Not activated → show activation page
  if (!reservation.isActivated) {
    return <ReservationActivation reservation={reservation} />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'services':
        return <ReservationServices reservation={reservation} />;
      case 'schedules':
        return <ReservationSchedules reservation={reservation} />;
      case 'overrides':
        return <ReservationOverrides reservation={reservation} />;
      case 'settings':
        return <ReservationSettingsPage reservation={reservation} />;
      case 'reservations':
        return <ReservationList reservation={reservation} />;
      default:
        return <ReservationList reservation={reservation} />;
    }
  };

  return (
    <View style={styles.container}>
      <ReservationSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        slug={reservation.slug}
      />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderSection()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
  },
});
