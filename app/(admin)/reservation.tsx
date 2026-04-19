import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useReservation } from '~/hooks/useReservation';
import { ReservationSidebar } from '~/components/reservation/ReservationSidebar';
import { ReservationActivation } from '~/components/reservation/ReservationActivation';
import { ReservationConfiguration } from '~/components/reservation/ReservationConfiguration';
import { ReservationSettingsPage } from '~/components/reservation/ReservationSettings';
import { ReservationList } from '~/components/reservation/ReservationList';
import { ReservationGuide } from '~/components/reservation/ReservationGuide';
import { View as LoadingView, ActivityIndicator } from 'react-native';
import { colors } from '~/theme';

export type ReservationSection = 'reservations' | 'configuration' | 'settings' | 'guide';

export default function ReservationPage() {
  const { stripe_connected } = useLocalSearchParams<{ stripe_connected?: string }>();
  const [currentSection, setCurrentSection] = useState<ReservationSection>(
    stripe_connected === 'true' ? 'settings' : 'reservations'
  );
  const reservation = useReservation();

  // Loading state
  if (reservation.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.dark} />
      </View>
    );
  }

  // Not activated → show activation page
  if (!reservation.isActivated) {
    return <ReservationActivation reservation={reservation} />;
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'configuration':
        return <ReservationConfiguration reservation={reservation} />;
      case 'settings':
        return <ReservationSettingsPage reservation={reservation} />;
      case 'guide':
        return <ReservationGuide />;
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
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 24,
  },
});
