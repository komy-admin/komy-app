import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { ConfigSidebar } from '~/components/admin/ConfigSideBar';
import PersonalInfoPage from '~/components/config/personal';
import PasswordPage from '~/components/config/password';
import NotificationsPage from '~/components/config/notifications';
import DashboardPage from '~/components/config/dashboard';
import ConfigurationRestoPage from '@/components/config/configuration';

type ConfigSection = 'dashboard' | 'personal' | 'password' | 'notifications' | 'configuration';

export default function ConfigPage() {
  const [currentSection, setCurrentSection] = useState<ConfigSection>('dashboard');

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