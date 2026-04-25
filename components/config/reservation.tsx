import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Sliders, Settings, BookOpen } from 'lucide-react-native';
import { useReservation } from '~/hooks/useReservation';
import { ReservationConfiguration } from '~/components/reservation/ReservationConfiguration';
import { ReservationSettingsPage } from '~/components/reservation/ReservationSettings';
import { ReservationGuide } from '~/components/reservation/ReservationGuide';
import { colors } from '~/theme';

type ReservationConfigTab = 'configuration' | 'settings' | 'guide';

const SUB_NAV_ITEMS: Array<{ id: ReservationConfigTab; Icon: typeof Sliders; label: string }> = [
  { id: 'configuration', Icon: Settings, label: 'Configuration' },
  { id: 'settings', Icon: Sliders, label: 'Paramètres' },
  { id: 'guide', Icon: BookOpen, label: 'Guide' },
];

interface Props {
  isCompactSidebar?: boolean | null;
}

export default function ReservationConfigPage({ isCompactSidebar }: Props) {
  const reservation = useReservation();
  const [activeTab, setActiveTab] = useState<ReservationConfigTab>('configuration');

  if (reservation.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.dark} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Sub-nav vertical (left) */}
        <View style={[styles.sidebar, isCompactSidebar !== false && styles.sidebarCompact]}>
          {SUB_NAV_ITEMS.map(({ id, Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.sidebarTab,
                  isCompactSidebar !== false && styles.sidebarTabCompact,
                  isActive && styles.sidebarTabActive,
                ]}
                onPress={() => setActiveTab(id)}
                activeOpacity={1}
              >
                <Icon size={20} color={isActive ? colors.brand.dark : colors.neutral[500]} strokeWidth={2} />
                {isCompactSidebar === false && (
                  <Text style={[styles.sidebarTabText, isActive && styles.sidebarTabTextActive]}>
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          {activeTab === 'configuration' && <ReservationConfiguration reservation={reservation} />}
          {activeTab === 'settings' && <ReservationSettingsPage reservation={reservation} />}
          {activeTab === 'guide' && <ReservationGuide />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 240,
    backgroundColor: colors.white,
    borderLeftWidth: 1,
    borderLeftColor: colors.neutral[200],
    borderRightWidth: 1,
    borderRightColor: colors.neutral[200],
    padding: 16,
    gap: 8,
  },
  sidebarCompact: {
    width: 72,
    padding: 8,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  sidebarTabCompact: {
    justifyContent: 'center',
    padding: 14,
    gap: 0,
  },
  sidebarTabActive: {
    backgroundColor: colors.neutral[100],
  },
  sidebarTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[500],
  },
  sidebarTabTextActive: {
    color: colors.neutral[800],
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
});
