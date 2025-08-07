import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { ConfigSidebar } from '~/components/admin/ConfigSideBar';
import PersonalInfoPage from '~/components/config/personal';
import PasswordPage from '~/components/config/password';
import NotificationsPage from '~/components/config/notifications';
import DashboardPage from '~/components/config/dashboard';
import ConfigurationRestoPage from '@/components/config/configuration';
import { useSelector } from 'react-redux';
import { RootState } from '~/store';
import { useRouter } from 'expo-router';

type ConfigSection = 'dashboard' | 'personal' | 'password' | 'notifications' | 'configuration';

export default function ConfigPage() {
  const [currentSection, setCurrentSection] = useState<ConfigSection>('dashboard');
  const { currentUser } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  
  // Bloquer l'accès aux managers
  useEffect(() => {
    if (currentUser?.profil === 'manager') {
      router.replace('/(admin)');
    }
  }, [currentUser, router]);

  // Si c'est un manager, on affiche un message d'erreur temporaire
  if (currentUser?.profil === 'manager') {
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
      case 'personal':
        return <PersonalInfoPage/>;
      case 'password':
        return <PasswordPage/>;
      case 'notifications':
        return <NotificationsPage/>;
      case 'dashboard':
        return <DashboardPage/>;
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
      <ScrollView style={{ flex: 1 , height: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, minHeight: '100%'}}>
          {renderSection()}
        </View>
      </ScrollView>
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