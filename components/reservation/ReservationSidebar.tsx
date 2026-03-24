import { View, Text, Pressable, StyleSheet, Platform, Linking } from 'react-native';
import { CalendarDays, Clock, CalendarOff, Settings, List, ExternalLink } from 'lucide-react-native';
import type { ReservationSection } from '~/app/(admin)/reservation';

const RESERVATION_NAV_ITEMS = [
  { id: 'reservations' as const, Icon: List, label: 'Réservations', color: '#3B82F6' },
  { id: 'services' as const, Icon: CalendarDays, label: 'Services', color: '#10B981' },
  { id: 'schedules' as const, Icon: Clock, label: 'Horaires', color: '#F59E0B' },
  { id: 'overrides' as const, Icon: CalendarOff, label: 'Fermetures', color: '#EF4444' },
  { id: 'settings' as const, Icon: Settings, label: 'Paramètres', color: '#A855F7' },
];

interface ReservationSidebarProps {
  currentSection: ReservationSection;
  onSectionChange: (section: ReservationSection) => void;
  slug?: string | null;
}

export function ReservationSidebar({ currentSection, onSectionChange, slug }: ReservationSidebarProps) {
  const bookingUrl = slug ? `${process.env.EXPO_PUBLIC_RESERVATION_API_URL}/book/${slug}` : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Réservations</Text>
        {bookingUrl && (
          <Pressable
            style={styles.linkButton}
            onPress={() => Linking.openURL(bookingUrl)}
          >
            <ExternalLink size={14} color="#3B82F6" />
            <Text style={styles.linkText}>Page publique</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.menuSection}>
        {RESERVATION_NAV_ITEMS.map(({ id, Icon, label, color }) => {
          const isActive = currentSection === id;
          return (
            <Pressable
              key={id}
              onPress={() => onSectionChange(id)}
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? '#F9FAFB' : 'transparent',
                  borderRadius: 8,
                }
              ]}
            >
              <View style={[
                styles.menuItem,
                { backgroundColor: isActive ? '#F1F5F9' : 'transparent' }
              ]}>
                <View style={styles.iconContainer}>
                  <Icon size={18} color={isActive ? color : '#64748B'} />
                </View>
                <Text
                  style={[
                    styles.menuText,
                    {
                      color: isActive ? '#1E293B' : '#64748B',
                      fontWeight: isActive ? '600' : '400',
                    }
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    backgroundColor: '#F8F9FA',
    height: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  linkText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  menuSection: {
    flex: 1,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  iconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
