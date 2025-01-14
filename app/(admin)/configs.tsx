import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useAuth } from '~/src/contexts/AuthContext';
import { ConfigSidebar } from '~/components/admin/ConfigSideBar';
import PersonalInfoPage from '~/components/config/personal';
import PasswordPage from '~/components/config/password';
import NotificationsPage from '~/components/config/notifications';
import DashboardPage from '~/components/config/dashboard';

type ConfigSection = 'dashboard' | 'personal' | 'password' | 'notifications';

export default function ConfigPage() {
  const [currentSection, setCurrentSection] = useState<ConfigSection>('dashboard');
  const { user } = useAuth();

  if (!user) {
    return null; // Ou un composant de loading/error
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'personal':
        return <PersonalInfoPage user={user} />;
      case 'password':
        return <PasswordPage user={user} />;
      case 'notifications':
        return <NotificationsPage/>;
      case 'dashboard':
        return <DashboardPage/>;
      default:
        return <DashboardPage/>;
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#FFFFFF' }}>
      <ConfigSidebar 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection}
        user={user}
      />
      <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ padding: 32 }}>
          {renderSection()}
        </View>
      </ScrollView>
    </View>
  );
}