import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConfigSidebar } from '~/components/admin/ConfigSideBar';
import ProfilePage from '~/components/config/profile';
import NotificationsPage from '~/components/config/notifications';
import DashboardPage from '~/components/config/dashboard';
import ConfigurationRestoPage from '@/components/config/configuration';
import SecurityPage from '~/components/config/security';
import { PinConfirmationModal } from '~/components/ui/PinConfirmationModal';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useRouter } from 'expo-router';

type ConfigSection = 'dashboard' | 'profile' | 'notifications' | 'configuration' | 'security';

export default function ConfigPage() {
  const [currentSection, setCurrentSection] = useState<ConfigSection>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const { user } = useSelector((state: RootState) => state.session);
  const router = useRouter();

  // Bloquer l'accès aux managers
  useEffect(() => {
    if (user?.profil === 'manager') {
      router.replace('/(admin)');
    }
  }, [user, router]);

  // Si c'est un manager, on affiche un message d'erreur temporaire
  if (user?.profil === 'manager') {
    return (
      <View style={styles.blockedContainer}>
        <Text style={styles.blockedText}>
          Accès non autorisé - Redirection en cours...
        </Text>
      </View>
    );
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'profile':
        return <ProfilePage/>;
      case 'notifications':
        return <NotificationsPage/>;
      case 'dashboard':
        return <DashboardPage/>;
      case 'security':
        return <SecurityPage/>;
      case 'configuration':
        return <ConfigurationRestoPage/>;
      default:
        return <DashboardPage/>;
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' }}>
      <ConfigSidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
      <View style={{ flex: 1, height: '100%' }}>
        {renderSection()}
      </View>

      <PinConfirmationModal
        isVisible={!isUnlocked}
        onClose={() => router.back()}
        onConfirm={() => setIsUnlocked(true)}
        title="Accès configuration"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  blockedText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});